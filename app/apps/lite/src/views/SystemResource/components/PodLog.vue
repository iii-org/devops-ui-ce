<template>
  <el-dialog :visible="dialogVisible" width="90%" top="3vh" :close-on-click-modal="false" @close="handleClose">
    <span slot="title">
      <span class="text-title">{{ containerName }}</span>
    </span>
    <el-card
      id="podLogSection"
      shadow="never"
      :body-style="{
        color: '#fff',
        background: '#222',
        height: 'calc(100vh - 250px)',
        overflow: 'auto',
        'scroll-behavior': 'smooth'
      }"
    >
      <pre>{{ logData }}</pre>
    </el-card>
    <span slot="footer">
      <el-button
        class="button-secondary-reverse"
        @click="scrollTo('top')"
      >
        <em v-if="isMobile" class="ri-skip-up-fill"></em>
        <span v-else>{{ $t('general.ScrollToTop') }}</span>
      </el-button>
      <el-button
        class="button-secondary-reverse"
        @click="scrollTo('bottom')"
      >
        <em v-if="isMobile" class="ri-skip-down-fill"></em>
        <span v-else>{{ $t('general.ScrollToBottom') }}</span>
      </el-button>
      <el-button class="button-primary" @click="dialogVisible = false">{{ $t('general.Close') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getPodLog } from '@/api/kubernetes'
import { mapGetters } from 'vuex'
import { CancelRequest } from '@/mixins'

export default {
  name: 'PodLog',
  mixins: [CancelRequest],
  props: {
    podName: {
      type: String,
      default: ''
    },
    containerName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      dialogVisible: false,
      isUpdating: false,
      logData: 'Loading...',
      timer: null
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    async fetchData(podName, containerName) {
      if (this.isUpdating) this.cancelRequest()
      this.isUpdating = true
      try {
        const res = await getPodLog(this.selectedProjectId, podName, { container_name: containerName }, { cancelToken: this.cancelToken })
        if (res.data !== this.logData) {
          this.logData = res.data
          this.scrollTo('bottom')
        }
        this.isUpdating = false
        this.setTimer(podName, containerName)
      } catch (error) {
        console.error(error)
      }
    },
    handleClose() {
      this.logData = 'Loading...'
      this.isUpdating = false
      this.dialogVisible = false
      this.clearTimer()
    },
    setTimer(podName, containerName) {
      this.timer = setTimeout(() => this.fetchData(podName, containerName), 5000)
    },
    clearTimer() {
      clearTimeout(this.timer)
      this.timer = null
    },
    scrollTo(target) {
      this.$nextTick(() => {
        const node = this.$el.querySelector('#podLogSection').childNodes[1]
        const anchor = target === 'bottom' ? node.scrollHeight : 0
        node.scrollTop = anchor
      })
    }
  }
}
</script>
