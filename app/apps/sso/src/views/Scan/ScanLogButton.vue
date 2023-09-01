<template>
  <span class="ml-2">
    <el-button
      v-if="pod.has_pod"
      class="buttonPrimary"
      icon="ri-computer-line"
      :size="isMobile ? 'small' : 'medium'"
      :disabled="selectedProjectId === -1"
      :style="isMobile ? 'padding: 8px 12px; margin-right: 8px;' : ''"
      @click="handleLogClick"
    >
      <span v-if="!isMobile">{{ $t('SonarQube.ScanLogs') }}</span>
    </el-button>
    <PodLog
      ref="podLogDialog"
      :pod-name="pod.pod_name"
      :container-name="pod.container_name"
    />
  </span>
</template>

<script>
import { mapGetters } from 'vuex'
import { getPluginPod } from '@/api_v2/scans'
import PodLog from '@/views/SystemResource/PluginResource/components/PodsList/components/PodLog'

export default {
  name: 'ScanLogButton',
  components: {
    PodLog
  },
  data() {
    return {
      pod: {}
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  mounted() {
    this.getPluginPod(this.getPluginName())
  },
  methods: {
    async getPluginPod(plugin_name) {
      await getPluginPod(this.selectedProjectId, plugin_name)
        .then((res) => {
          this.pod = res.data
        })
    },
    getPluginName() {
      switch (this.$route.name) {
        case 'Sonarqube':
          return 'sonarqube'
        case 'Checkmarx':
          return 'checkmarx'
        case 'Sbom':
          return 'anchore'
        case 'Zap':
          return 'test-zap'
        case 'Cmas':
          return 'cmas'
        case 'Webinspect':
          return 'test-webinspect'
        case 'Postman':
          return 'newman'
        case 'Sideex':
          return 'text-sideex'
        default:
          return null
      }
    },
    async handleLogClick() {
      await this.getPluginPod(this.getPluginName())
        .then(() => {
          this.$nextTick(() => {
            this.$refs.podLogDialog.fetchData(this.pod.pod_name, this.pod.container_name)
            this.$refs.podLogDialog.dialogVisible = true
          })
        })
    }
  }
}
</script>
