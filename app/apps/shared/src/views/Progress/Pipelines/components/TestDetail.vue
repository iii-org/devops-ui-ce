<template>
  <el-dialog
    :class="isMobile ? 'mobile' : ''"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :visible.sync="dialogVisible"
    append-to-body
    top="3vh"
    width="95%"
    @close="handleClose"
  >
    <template slot="title">
      <span class="text-title mr-4">
        {{ $t('ProgressPipelines.TestDetail') }}
      </span>
      <span class="mr-3">
        {{ pipelineInfos.commitMessage }}
      </span>
    </template>
    <el-tabs
      v-if="stages.length > 0"
      v-model="activeStage"
      tab-position="left"
      @tab-click="userClick"
    >
      <el-tab-pane
        v-for="(stage, index) in stages"
        :key="index"
        :disabled="!stage.status"
        :name="stage.name"
      >
        <div slot="label" class="flex justify-between items-center tab-name">
          <span class="text-right name">
            {{ index + 1 }} {{ stage.name }}
          </span>
          <el-tag
            v-if="stage.status"
            :type="stage.status"
            class="el-tag ml-2"
            effect="dark"
            size="mini"
          >
            {{ stage.status.charAt(0).toUpperCase() + stage.status.slice(1) }}
          </el-tag>
        </div>
        <el-card
          :body-style="{
            color: '#000',
            background: '#ececef',
            lineHeight: 2
          }"
        >
          <div class="text-title mb-1 flex justify-between">
            <span>
              <em class="el-icon-tickets mr-2"></em>
              <span class="mr-3">
                {{ stage.name }}
              </span>
              <em
                v-if="stage.isLoading"
                class="el-icon-loading font-bold text-warning"
              ></em>
              <em v-else class="el-icon-check font-bold text-success"></em>
            </span>
            <el-radio-group v-model="isWordWrap" class="flex" size="mini">
              <el-tooltip :content="$t('Log.WordWrap')" placement="bottom">
                <el-radio-button :label="true">
                  <em class="ri-text-wrap text-sm"></em>
                </el-radio-button>
              </el-tooltip>
              <el-tooltip :content="$t('Log.NoWrap')" placement="bottom">
                <el-radio-button :label="false">
                  <em class="ri-list-unordered text-sm"></em>
                </el-radio-button>
              </el-tooltip>
            </el-radio-group>
          </div>
          <el-card
            :id="'preWindow' + index"
            :body-style="{ padding: 0 }"
            shadow="never"
          >
            <div
              :style="{
                color: '#fff',
                background: '#222',
                lineHeight: 1,
                fontSize: '13px',
                height: isMobile ? '90vh' : '65vh',
                overflow: 'auto',
                'scroll-behavior': 'smooth'
              }"
              @scroll="onscroll"
            >
              <pre>
                <div
                  v-for="(msg, idx) in stage.message"
                  :key="idx"
                  style="display: flex;"
                >
                  <div class="number">{{ idx + 1 }}</div>
                  <div
                    :style="`white-space: ${isWordWrap ? 'pre-wrap' : 'pre'};`"
                    v-html="msg"
                  >
                </div>
              </div>
              </pre>
              <div v-if="stage.isLoading" class="loader-animation pt-2 pl-4">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
              <em
                v-if="!isScrollBottom"
                class="el-icon-bottom scroll-down-button"
                @click="scrollToBottom(index)"
              ></em>
            </div>
          </el-card>
        </el-card>
      </el-tab-pane>
    </el-tabs>
    <el-empty v-else :description="$t('general.NoData')" :image-size="150" />
    <span slot="footer">
      <el-button @click="handleClose">
        {{ $t('general.Close') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getPipelinesJobsStatus } from '@/api_v3/gitlab'
import AnsiUp from 'ansi_up'
import { io } from 'socket.io-client'
import { mapGetters } from 'vuex'

const ansiUp = new AnsiUp()
const NOLOGS = ansiUp.ansi_to_html(`\u001b[1mNo logs available\u001b[0m`)

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
      // socket: io(import.meta.env.VITE_APP_WS_API + '/pipeline/websocket/logs', {
      //   reconnectionAttempts: 5,
      //   transports: ['websocket']
      // }),
      socket: io(`/job_log`, {
        // production socket
        reconnectionAttempts: 5,
        forceNew: true
      }),
      lockReconnect: false,
      reconnectTimeoutObj: null,
      isScrollBottom: true,
      isWordWrap: true
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device']),
    selectedRepositoryId() {
      return this.selectedProject.repository_id
    },
    isMobile() {
      return this.device === 'mobile'
    },
    runningStageIndex() {
      return this.stages.findIndex((item) => {
        return ['pending', 'running', 'created'].includes(item.status)
      })
    },
    isPipelinesFinished() {
      return this.stages.every((item) => {
        return ['success', 'failed', 'skipped', 'manual', 'canceled'].includes(
          item.status
        )
      })
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
      this.checkIsScrollBottom(index)
      this.emitStages.push(index)
      const stage = this.stages[index]
      if (!stage?.isLoading) return
      const emitObj = {
        project_id: this.selectedRepositoryId,
        job_id: stage.id
      }
      this.socket.emit('get', emitObj)
    },
    setLogMessageListener() {
      this.socket.on('data', (sioEvt) => {
        const { message, job_id } = sioEvt
        const stageIndex = this.stages.findIndex((stage) => stage.id === job_id)
        const activeTabsIndex = this.stages.findIndex(
          (stage) => stage.name === this.activeStage
        )
        if (
          ['success', 'failed', 'skipped', 'manual', 'canceled'].includes(
            this.stages[activeTabsIndex]?.status
          )
        ) {
          this.stages[activeTabsIndex].isLoading = false
          if (this.stages[activeTabsIndex].message.length === 0) {
            this.stages[activeTabsIndex].message = [NOLOGS]
          }
          if (
            stageIndex + 1 < this.stages.length &&
            this.isScrollBottom &&
            !this.isPipelinesFinished
          ) {
            this.moveToRunningStage(stageIndex + 1)
          }
        }
        this.setLogMessage(stageIndex, message)
        if (this.isScrollBottom) this.scrollToBottom(stageIndex)
      })
      this.socket.on('reach_max_time', (boolean) => {
        if (boolean) this.reconnect()
      })
    },
    moveToRunningStage(index) {
      if (this.runningStageIndex < 0) {
        this.changeFocusTab(0)
      } else {
        this.changeFocusTab(index || this.runningStageIndex, 1500)
      }
    },
    changeFocusTab(index, timeout = 0) {
      setTimeout(() => {
        this.activeStage = this.stages[index].name
        this.emitPipeLog({ index })
      }, timeout)
    },
    setLogMessage(index, data) {
      if (data === undefined || data === '') return
      let logs = data.split(/[\r\n]+/)
      for (const msg of logs) {
        if (msg === '') continue
        logs[logs.indexOf(msg)] = ansiUp.ansi_to_html(
          msg.replaceAll('&gt;', '>')
        )
      }
      if (logs[logs.length - 1] === '') logs.pop()
      logs = logs.filter((a) => !a.match(/section_end|section_start/g))
      this.stages[index].message = logs
    },
    async fetchStages() {
      this.socket.connect()
      try {
        const res = await getPipelinesJobsStatus(this.selectedRepositoryId, {
          pipeline_id: this.pipelineInfos.id
        })
        this.stages = res.data.map((stage) => {
          stage.message = []
          stage.isLoading = true
          if (stage.status === 'skipped' || stage.status === 'manual') {
            stage.message = [NOLOGS]
            stage.isLoading = false
          }
          return stage
        })
        this.dialogVisible = true
        if (this.stages.length > 0) {
          this.moveToRunningStage()
          this.setTimer()
        }
      } catch (error) {
        console.error(error)
      } finally {
        // this.$emit('loaded')
      }
    },
    async updateStagesState() {
      if (!this.pipelineInfos?.id) return
      await getPipelinesJobsStatus(this.selectedRepositoryId, {
        pipeline_id: this.pipelineInfos.id
      })
        .then((res) => {
          if (res.data.length === 0) return
          res.data.forEach((stage, index) => {
            this.stages[index].status = stage.status
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
      this.activeStage = ''
      this.$nextTick(() => {
        this.dialogVisible = false
        // this.$emit('fetch-data')
      })
    },
    setTimer() {
      const isActive = this.stages.some((item) => {
        return ['pending', 'running', 'created'].includes(item.status)
      })
      if (isActive) {
        this.timer = setTimeout(() => this.updateStagesState(), 1000)
      }
    },
    clearTimer() {
      clearTimeout(this.timer)
      this.timer = null
    },
    // getRunningStageIndex() {
    //   return this.stages.findIndex((item) => {
    //     return (
    //       item.status === 'Pending' ||
    //       item.status === 'Running' ||
    //       item.status === 'Created'
    //     )
    //   })
    // },
    scrollToBottom(index) {
      this.$nextTick(() => {
        if (
          this.$el &&
          this.$el.querySelector(`#preWindow${index}`) &&
          this.$el.querySelector(`#preWindow${index}`).childNodes
        ) {
          const target = this.$el.querySelector(`#preWindow${index}`)
            .childNodes[1].childNodes[0]
          target.scrollTop = target.scrollHeight + 1000
        }
      })
    },
    checkIsScrollBottom(index) {
      this.$nextTick(() => {
        if (
          this.$el &&
          this.$el.querySelector(`#preWindow${index}`) &&
          this.$el.querySelector(`#preWindow${index}`).childNodes
        ) {
          const { scrollTop, clientHeight, scrollHeight } =
            this.$el.querySelector(`#preWindow${index}`).childNodes[1]
              .childNodes[0]
          if (scrollTop + clientHeight < scrollHeight) {
            this.isScrollBottom = false
          } else {
            this.isScrollBottom = true
          }
        }
      })
    },
    onscroll(event) {
      const { scrollTop, clientHeight, scrollHeight } = event.target
      if (scrollTop + clientHeight < scrollHeight) {
        this.isScrollBottom = false
      } else {
        this.isScrollBottom = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap');
@import 'src/styles/theme/variables.module.scss';
@import 'src/styles/theme/mixin.scss';

.mobile {
  ::v-deep .el-tabs--left,
  ::v-deep .el-tabs__header.is-left {
    float: none;
  }

  ::v-deep .el-card {
    margin: 0;
  }

  ::v-deep .el-card__body {
    padding: 10px;
  }

  ::v-deep .el-dialog__header,
  ::v-deep .el-dialog__body {
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

::v-deep {
  .el-dialog {
    margin: 0 auto;

    .el-dialog__body {
      padding: 10px 20px 0;
    }
  }

  .el-tabs {
    height: 75vh;
    overflow: auto;

    .el-tabs__header {
      height: 100% !important;
    }
  }

  .el-radio-button__inner {
    padding: 2px 6px;
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
      animation-delay: 0.33s;
    }

    &:nth-child(3) {
      animation-delay: 0.66s;
    }
  }
}

pre {
  margin: 0;
  counter-reset: line;
  font-family: 'JetBrains Mono', monospace;

  div {
    min-height: 1.25rem;
    line-height: 1.6;
  }

  .number {
    padding: 0 0.5em;
    margin-right: 0.5em;
    color: #888;
    min-width: 50px;
    text-align: right;
    user-select: none;
  }
}

.scroll-down-button {
  position: absolute;
  bottom: 10%;
  right: 50%;
  padding: 0.5rem;
  border-radius: 2rem;
  background-color: #fff;
  color: #000;
  cursor: pointer;
}

$tag-light-options: (
  created: $created,
  pending: $pending,
  manual: $manual,
  scheduled: $scheduled,
  skipped: $skipped,
  unknown: $unknown,
  notfound: $unknown
);
$tag-dark-options: (
  running: $running,
  finished: $success,
  passed: $passed,
  failed: $failed,
  canceled: $canceled
);
@each $key, $value in $tag-light-options {
  .el-tag--#{$key} {
    @include tag-light($value);
  }
}

@each $key, $value in $tag-dark-options {
  .el-tag--#{$key} {
    @include tag-dark($value);
  }
}
</style>
