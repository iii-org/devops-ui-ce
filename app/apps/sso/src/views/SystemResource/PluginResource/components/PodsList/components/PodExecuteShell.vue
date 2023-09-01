<template>
  <div class="app-container">
    <div class="flex justify-between mb-2">
      <div>
        <el-button
          type="text"
          size="medium"
          icon="el-icon-arrow-left"
          class="mr-3"
          @click="handleBack"
        >
          {{ $t('general.Back') }}
        </el-button>
        <span class="text-title"><em class="ri-terminal-line mr-3" />{{ podName }}</span>
        <el-popover placement="top" width="160" trigger="hover">
          <div>{{ $t('PodsList.ExecuteShellNotify') }}</div>
          <div>ls, ls -al, whoami, hostname, pwd, cd</div>
          <em slot="reference" class="ri-information-line ml-3" />
        </el-popover>
      </div>
      <div class="flex items-center">
        <span class="dot relative" :class="connectStatus" />
        <span class="dot absolute animate-ping" :class="connectStatus" />
        <span class="text-title ml-3">{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
      </div>
    </div>
    <div class="p-3 bg-black">
      <div ref="terminal" />
    </div>
  </div>
</template>

<script>
import 'xterm/css/xterm.css'
import { io } from 'socket.io-client'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { mapGetters } from 'vuex'
import { getKubernetesToken } from '@/api_v2/kubernetes'

const envKeys = [
  'ArrowLeft',
  'ArrowRight',
  // 'Tab',
  'Escape',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12'
]
// const combinedKeys = [
//   '\x03', // CTRL + C
//   '\x16', // CTRL + V
//   '\x01', // CTRL + A
//   '\x18' // CTRL + X
// ]
const fitAddon = new FitAddon()

export default {
  name: 'PodExecuteShell',
  data() {
    return {
      socket: null,
      term: null,
      projectName: '',
      podName: '',
      containerName: '',
      command: '',
      isConnected: false,
      arrowUpQueue: [],
      arrowDownQueue: [],
      copyText: '',
      host: '',
      token: '',
      timer: '',
      cTime: 5,
      reqTokenAttemp: 0
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'sidebar']),
    connectStatus() {
      return this.isConnected ? 'bg-success' : 'bg-danger'
    }
  },
  watch: {
    'sidebar.opened'(val) {
      fitAddon.fit()
    }
  },
  mounted() {
    this.initSocket()
    this.containerName = this.$route.query.containerName
    this.podName = this.$route.query.podName
  },
  beforeDestroy() {
    if (this.isConnected) this.disconnectSocket()
    window.clearTimeout(this.timer)
  },
  methods: {
    initSocket() {
      this.socket = io(process.env.VUE_APP_WS_API + '/k8s/websocket/pod_exec', {
        reconnectionAttempts: 5,
        transports: ['websocket']
      })
      this.isConnected = true
      this.getKubernetesToken()
      this.setConnectStatusListener()
      this.setCmdResponseListener()
      this.initTerm()
    },
    disconnectSocket() {
      this.socket.close()
      this.term.dispose()
      this.isConnected = false
    },
    setConnectStatusListener() {
      this.socket.on('disconnect', (message) => {
        this.isConnected = false
        this.$notify({
          title: this.$t('general.Info'),
          message,
          type: 'warning'
        })
      })
    },
    setCmdResponseListener() {
      this.socket.on('get_cmd_response', async (sioEvt) => {
        // console.log('get_cmd_response ===>', sioEvt)
        if (sioEvt?.code > 200) {
          if (sioEvt?.code === 3001) {
            this.reqTokenAttemp++
            this.reconnectTime()
            if (this.reqTokenAttemp < 3 && this.cTime !== 0) {
              this.$notify({
                title: this.$t('general.Warning'),
                message: sioEvt.message,
                type: 'warning'
              })
              await this.getKubernetesToken()
            } else {
              this.$notify({
                title: 'Connection Failed',
                message: 'Failed to connect to Kubernetes pod, please contact your administrator',
                type: 'warning'
              })
              this.cTime = 5
              this.reqTokenAttemp = 0
              window.clearTimeout(this.timer)
              return
            }
            this.command = this.arrowUpQueue.at(-1)
            this.onEnter()
          }
          return
        }
        if (sioEvt?.code === 200) {
          const { output, type } = sioEvt
          if (type === 'enter') {
            let str = output || sioEvt
            str = str.replace(/\n/g, '\r\n')
            this.term.writeln('\r\n' + str)
            // this.term.write('\r\n# ')
            this.term.write('# ')
          } else if (type === 'tab') {
            console.log('tab ===>', output)
          }
        }
      })
    },
    async initTerm() {
      this.term = new Terminal({
        rendererType: 'canvas',
        fontSize: 13,
        fontFamily: '"Fira Code", courier-new, courier, monospace, "Powerline Extra Symbols"',
        rows: Math.floor((window.innerHeight - 120) / 15),
        cursorBlink: true
      })
      this.term.open(this.$refs.terminal)
      await this.setResizeListener()
      this.term.write('\r\n# ')
      this.term.focus()
      this.setTermKeyListener()
    },
    setResizeListener() {
      return new Promise((resolve) => {
        this.term.loadAddon(fitAddon)
        fitAddon.fit()
        window.onresize = () => {
          try {
            fitAddon.fit()
          } catch (error) {
            console.error(error)
          }
        }
        resolve()
      })
    },
    setTermKeyListener() {
      this.term.onKey((data) => {
        const { key, keyCode } = data.domEvent
        if (envKeys.includes(key)) return
        if (keyCode === 13) {
          this.arrowUpQueue.push(this.command)
          this.onEnter()
        } else if (keyCode === 8) {
          this.onBackspace()
        } else if (key === 'ArrowUp') {
          this.onArrowUp()
        } else if (key === 'ArrowDown') {
          this.onArrowDown()
        } else {
          this.term.write(key)
          this.command += key
        }
      })
    },
    onArrowUp() {
      if (this.arrowUpQueue.length > 0) {
        const tempCommand = this.arrowUpQueue.pop()
        this.command = tempCommand
        this.arrowDownQueue.push(tempCommand)
        this.term.write('\x1b[2K\r')
        this.term.write('# ' + this.command)
      }
    },
    onArrowDown() {
      if (this.arrowDownQueue.length > 0) {
        const tempCommand = this.arrowDownQueue.pop()
        this.command = tempCommand
        this.arrowUpQueue.push(tempCommand)
        this.term.write('\x1b[2K\r')
        this.term.write('# ' + this.command)
      }
    },
    onEnter() {
      if (this.command === 'clear') {
        this.term.clear()
        this.term.write('\r\n# ')
      } else if (this.command === '') {
        this.term.write('\r\n# ')
      } else if (this.command.includes('cd')) {
        this.term.write('\r\n# ')
        this.emitCommand(this.command)
      } else {
        // this.term.write('\r\n')
        this.emitCommand(this.command)
      }
      this.command = ''
    },
    onBackspace() {
      this.command = this.command.slice(0, this.command.length - 1)
      this.term.write('\x1b[2K\r')
      this.term.write('# ' + this.command)
    },
    emitCommand(command, tab) {
      console.log(command, tab)
      const { podName, selectedProject } = this
      const emitObj = {
        project_name: selectedProject.name,
        pod_name: podName,
        host: this.host,
        token: this.token,
        command
      }
      if (tab) {
        this.socket.emit('pod_tab_cmd', emitObj)
      } else this.socket.emit('pod_exec_cmd', emitObj)
    },
    async getKubernetesToken() {
      await getKubernetesToken()
        .then((res) => {
          const { host, token } = res.data
          this.host = host
          this.token = token
        })
        .catch((err) => {
          console.error(err)
        })
    },
    handleBack() {
      this.$router.push({ name: 'DevEnvironment' })
    },
    reconnectTime() {
      if (this.cTime === 0) {
        window.clearTimeout(this.timer)
      } else {
        this.cTime--
        this.timer = window.setTimeout(this.reconnectTime, 1000)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dot {
  @apply rounded-full w-2 h-2;
}
::v-deep {
  .xterm-viewport {
    overflow-y: auto;
  }
}
</style>
