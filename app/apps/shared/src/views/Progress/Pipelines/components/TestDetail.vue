<template>
  <el-dialog
    :visible.sync="dialogVisible"
    width="95%"
    top="3vh"
    destroy-on-close
    :class="isMobile ? 'mobile' : ''"
    @close="handleClose"
  >
    <template slot="title">
      <span class="text-title mr-4"> {{ $t('ProgressPipelines.TestDetail') }}</span>
      <span class="mr-3"> {{ pipelineInfos.commitMessage }} </span>
    </template>
    <el-tabs v-model="activeStage" tab-position="left" @tab-click="userClick">
      <el-tab-pane
        v-for="(stage, index) in stages"
        :key="index"
        :name="stage.name"
        :disabled="!stage.state"
      >
        <div slot="label" class="flex justify-between items-center tab-name">
          <span class="text-right name">{{ index + 1 }} {{ stage.name }}</span>
          <el-tag
            v-if="stage.state"
            class="el-tag ml-2"
            size="mini"
            :type="mapStateType(stage.state)"
            :effect="mapStateEffect(stage.state)"
            :color="stage.state === 'Running' ? runningStateColor : ''"
          >
            {{ stage.state }}
          </el-tag>
        </div>
        <el-card
          :body-style="{
            color: '#000',
            background: '#ececef',
            lineHeight: 2
          }"
        >
          <div class="text-title mb-3">
            <em class="el-icon-tickets mr-2" />
            <span class="mr-3">{{ stage.name }}</span>
            <em v-if="stage.isLoading" class="el-icon-loading font-bold text-warning" />
            <em v-else class="el-icon-check font-bold text-success" />
          </div>
          <el-card
            :id="'preWindow' + index"
            class="mb-2"
            :body-style="{
              color: '#fff',
              background: '#222',
              lineHeight: 1,
              fontSize: '13px',
              height: isMobile ? '90vh' : '50vh',
              overflow: 'auto',
              'scroll-behavior': 'smooth'
            }"
            shadow="never"
          >
            <pre>
              <div v-for="(msg, idx) in stage.message" :key="idx" v-html="msg" />
            </pre>
            <div v-if="stage.isLoading" class="loader-animation pt-2 pl-2">
              <div class="dot" />
              <div class="dot" />
              <div class="dot" />
            </div>
          </el-card>
        </el-card>
      </el-tab-pane>
    </el-tabs>
    <span slot="footer">
      <el-button
        class="buttonSecondaryReverse"
        @click="handleClose"
      >
        {{ $t('general.Close') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { io } from 'socket.io-client'
import AnsiUp from 'ansi_up'
import { mapGetters } from 'vuex'
import { getPipelinesConfig } from '@/api/cicd'
import colorVariables from '@/styles/theme/variables.scss'

export default {
  name: 'TestDetailSocket',
  props: {
    pipelineInfos: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      dialogVisible: false,
      stages: [],
      activeStage: '',
      emitStages: [],
      timer: null,
      socket: io(process.env.VUE_APP_WS_API + '/pipeline/websocket/logs', {
        reconnectionAttempts: 5,
        transports: ['websocket']
      }),
      lockReconnect: false,
      reconnectTimeoutObj: null
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device']),
    selectedRepositoryId() {
      return this.selectedProject.repository_ids[0]
    },
    isMobile() {
      return this.device === 'mobile'
    },
    runningStateColor() {
      return colorVariables.menuActiveText
    }
  },
  mounted() {
    if (this.selectedProject.id === -1) return
    this.setLogMessageListener()
  },
  beforeDestroy() {
    this.handleClose()
  },
  methods: {
    async reconnect() {
      this.socket.close()
      this.clearTimer()
      await this.fetchStages()
      this.setLogMessageListener()
    },
    userClick(tab) {
      this.emitPipeLog(tab)
    },
    emitPipeLog(tab) {
      const index = Number(tab.index)
      this.emitStages.push(index)
      const stage = this.stages[index]
      if (!stage?.isLoading) return
      const emitObj = {
        repository_id: this.selectedRepositoryId,
        stage_id: stage.stage_id
      }
      this.socket.emit('get_pipe_log', emitObj)
    },
    setLogMessageListener() {
      this.socket.on('pipeline_log', (sioEvt) => {
        const { repo_id, data, final } = sioEvt
        const stageIndex = this.stages.findIndex((stage) => stage.stage_id === repo_id)
        if (final) {
          this.stages[stageIndex].isLoading = false
          if (stageIndex + 1 < this.stages.length) {
            this.moveToRunningStage(stageIndex + 1)
          }
        }
        this.setLogMessage(stageIndex, data)
        this.scrollToBottom(stageIndex)
      })
      this.socket.on('reach_max_time', (boolean) => {
        if (boolean) this.reconnect()
      })
    },
    moveToRunningStage(index) {
      const runningStageIndex = this.getRunningStageIndex()
      if (runningStageIndex < 0) {
        this.changeFocusTab(0)
      } else {
        this.changeFocusTab(index || runningStageIndex, 1500)
      }
    },
    setLogMessage(index, data) {
      if (data === undefined || data === '') return
      const ansiUp = new AnsiUp()
      let logs = data.split(/[\r\n]+/)
      for (const msg of logs) {
        if (msg === '') continue
        logs[logs.indexOf(msg)] = ansiUp.ansi_to_html(msg.replaceAll('&gt;', '>'))
      }
      if (logs[logs.length - 1] === '') logs.pop()
      logs = logs.filter(a => !a.match(/section_end|section_start/g))
      const target = this.stages[index].message
      const isHistoryMessage = target.length === logs.length || target[0] === 'Loading...'
      if (isHistoryMessage) {
        this.stages[index].message = logs
      } else {
        if (logs.every(r => target.includes(r))) return
        this.stages[index].message = [...this.stages[index].message, ...logs]
      }
    },
    changeFocusTab(index, timeout = 0) {
      setTimeout(() => {
        this.activeStage = this.stages[index].name
        this.emitPipeLog({ index })
      }, timeout)
    },
    async fetchStages() {
      this.socket.connect()
      try {
        const res = await getPipelinesConfig(this.selectedRepositoryId, { pipelines_exec_run: this.pipelineInfos.id })
        this.stages = res.data.map((stage) => {
          stage.message = ['Loading...']
          stage.isLoading = true
          return stage
        })
        this.dialogVisible = true
        this.moveToRunningStage()
        this.setTimer()
      } catch (error) {
        console.error(error)
      } finally {
        this.$emit('loaded')
      }
    },
    async updateStagesState() {
      if (!this.pipelineInfos?.id) return
      await getPipelinesConfig(this.selectedRepositoryId, { pipelines_exec_run: this.pipelineInfos.id })
        .then((res) => {
          if (res.data.length === 0) return
          res.data.forEach((stage, index) => {
            this.stages[index].state = stage.state
          })
          this.setTimer()
        })
        .catch(() => ({}))
    },
    handleClose() {
      this.socket.close()
      this.clearTimer()
      this.stages = []
      this.emitStages = []
      this.dialogVisible = false
      this.activeStage = ''
    },
    setTimer() {
      const isActive = this.stages.some((item) => {
        return item.state === 'Pending' ||
          item.state === 'Running' ||
          item.state === 'Created'
      })
      if (isActive) this.timer = setTimeout(() => this.updateStagesState(), 1000)
    },
    clearTimer() {
      clearTimeout(this.timer)
      this.timer = null
    },
    getRunningStageIndex() {
      return this.stages.findIndex((item) => {
        return item.state === 'Pending' ||
        item.state === 'Running' ||
        item.state === 'Created'
      })
    },
    mapStateType(state) {
      const mapping = {
        Created: 'warning',
        Running: '',
        Success: 'success',
        Failed: 'danger',
        Canceled: 'warning',
        Manual: 'warning',
        Scheduled: 'warning'
      }
      return mapping[state]
    },
    mapStateEffect(status) {
      const mapping = {
        Created: 'light',
        Running: 'light',
        Manual: 'light',
        Scheduled: 'light'
      }
      return mapping[status] || 'dark'
    },
    scrollToBottom(index) {
      this.$nextTick(() => {
        if (
          this.$el &&
          this.$el.querySelector(`#preWindow${index}`) &&
          this.$el.querySelector(`#preWindow${index}`).childNodes
        ) {
          const target = this.$el.querySelector(`#preWindow${index}`).childNodes[1]
          target.scrollTop = target.scrollHeight
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap');
.mobile {
  ::v-deep .el-tabs--left, ::v-deep .el-tabs__header.is-left {
    float: none;
  }
  ::v-deep .el-card {
    margin: 0;
  }
  ::v-deep .el-card__body {
    padding: 10px;
  }
  ::v-deep .el-dialog__header, ::v-deep .el-dialog__body {
    padding: 10px;
  }
  ::v-deep .el-tabs__item {
    padding: 0 5px;
  }
  ::v-deep .el-tabs__nav-wrap::after {
      background: none;
  }
  .tab-name {
    text-align-last: left;
    .name {
      width: 50%;
    }
  }
}
.loader-animation {
  position: relative;
  white-space: initial;
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin: auto auto 12px;
    border-radius: 50%;
    animation: blinking-dot 1s linear infinite;
    background: #fff;
    &:nth-child(2) {
      animation-delay: 0.33s
    }
    &:nth-child(3) {
      animation-delay: 0.66s
    }
  }
}
pre {
  margin: 0;
  counter-reset: line;
  font-family: 'JetBrains Mono', monospace;
  div {
    min-height: 1.25rem;
  }
  div:before {
    counter-increment: line;
    content: counter(line);
    display: inline-block;
    padding: 0 .5em;
    margin-right: .5em;
    color: #888;
    min-width: 40px;
  }
}
</style>
