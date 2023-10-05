<template>
  <div>
    <div
      v-if="showUpdater"
      class="flex justify-between notification-warning py-3 px-4 mb-5"
    >
      <div class="flex items-center">
        <span class="dot relative" />
        <span class="dot absolute animate-ping" />
        <span class="text-title ml-3">
          {{ notifyTitle }}（{{ updateVersionName }}）
        </span>
        <el-link
          type="primary"
          :underline="false"
          @click="dialogVisible = true"
        >
          {{ $t("general.MoreInfo") }}
          <em class="ri-more-line" />
        </el-link>
      </div>
      <el-button
        size="mini"
        class="button-secondary-reverse block"
        plain
        @click="updateVersion"
      >
        {{ $t("SystemVersion.UpdateNow") }}
      </el-button>
    </div>
    <el-dialog
      :visible.sync="dialogVisible"
      :width="isMobile ? '95%' : '50%'"
      :close-on-click-modal="false"
    >
      <span slot="title" class="text-title">
        {{ updateVersionName }}
        <el-button
          class="button-primary ml-1"
          size="small"
          round
          @click="updateVersion"
        >
          {{ $t("SystemVersion.UpdateNow") }}
        </el-button>
        <el-divider class="mb-0" />
      </span>
      <div style="max-height: 40vh;">
        <el-empty
          v-if="!updateReleaseNote"
          :description="$t('general.NoData')"
        />
        <Viewer
          v-else
          class="overflow-y-auto"
          :initial-value="updateReleaseNote"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { updateDevopsVersion } from '@/api/devopsVersion'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import '@toast-ui/editor/dist/i18n/zh-tw'
import { Viewer } from '@toast-ui/vue-editor'
import { Loading } from 'element-ui'

export default {
  name: 'VersionUpdater',
  components: { Viewer },
  data() {
    return {
      dialogVisible: false,
      loadingInstance: null
    }
  },
  computed: {
    ...mapGetters([
      'device',
      'userRole',
      'hasSystemUpdate',
      'updateVersionName',
      'updateReleaseNote'
    ]),
    isMobile() {
      return this.device === 'mobile'
    },
    showUpdater() {
      return (
        this.userRole === 'Administrator' &&
        (this.updateVersionName === 'develop' || this.hasSystemUpdate)
      )
    },
    notifyTitle() {
      return this.updateVersionName === 'develop'
        ? this.$t('SystemVersion.Develop')
        : this.$t('SystemVersion.NewVersion')
    }
  },
  methods: {
    updateVersion() {
      if (this.dialogVisible) this.dialogVisible = false
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

::v-deep .toastui-editor-contents {
  @apply text-lg;
}

::v-deep .el-dialog__header {
  padding-bottom: 0;
}

::v-deep .el-dialog__body {
  padding: 0 2rem 1.5rem;
}
</style>
