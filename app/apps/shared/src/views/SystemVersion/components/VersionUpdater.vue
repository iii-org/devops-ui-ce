<template>
  <div
    v-if="showUpdater"
    class="flex justify-between items-center bg-gray-600 text-white py-3 px-4 rounded mb-5"
  >
    <div class="flex items-center">
      <span class="dot relative" />
      <span class="dot absolute animate-ping" />
      <span class="text-title ml-3">{{ `${notifyTitle}（${updateVersionName}）` }}</span>
    </div>
    <el-button
      size="mini"
      class="button-secondary-reverse"
      plain
      @click="updateVersion"
    >
      {{ $t('SystemVersion.UpdateNow') }}
    </el-button>
  </div>
</template>

<script>
import { updateDevopsVersion } from '@/api/devopsVersion'
import { mapActions, mapGetters } from 'vuex'
import { Loading } from 'element-ui'

export default {
  name: 'VersionUpdater',
  data() {
    return {
      loadingInstance: null
    }
  },
  computed: {
    ...mapGetters(['userRole', 'hasSystemUpdate', 'updateVersionName']),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    showUpdater() {
      return this.userRole === 'Administrator' && (this.updateVersionName === 'develop' || this.hasSystemUpdate)
    },
    notifyTitle() {
      return this.updateVersionName === 'develop'
        ? this.$t('SystemVersion.Develop')
        : this.$t('SystemVersion.NewVersion')
    }
  },
  mounted() {
    if (!this.isLite && this.userRole === 'Administrator') this.checkApiVersion()
  },
  methods: {
    ...mapActions('settings', ['checkApiVersion']),
    updateVersion() {
      this.showLoading()
      updateDevopsVersion()
        .then(() => {
          this.$message({
            message: this.$t('SystemVersion.UpdatedNotify'),
            type: 'success',
            duration: 12000
          })
        })
        .catch(err => {
          console.error(err)
        })
        .finally(() => {
          this.loadingInstance.close()
        })
    },
    showLoading() {
      this.loadingInstance = Loading.service({
        lock: true,
        text: this.$t('Updating'),
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
    },
    clearTimer(timer) {
      this.$once('hook:beforeDestroy', () => {
        clearTimeout(timer)
        timer = null
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dot {
  @apply rounded-full w-2 h-2 bg-success;
}
</style>
