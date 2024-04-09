<template>
  <el-card v-if="isShowAuth" class="my-3">
    <el-row :type="isMobile ? '' : 'flex'" align="middle">
      <el-col
        :xs="24"
        :md="isInitial ? 24 : 12"
        :span="isInitial ? 24 : 12"
      >
        <el-result
          :icon="whichResult"
          :title="whichTitle"
          :sub-title="whichSubTitle"
        >
          <template slot="extra">
            <el-button
              v-if="isAdministrator"
              type="primary"
              size="medium"
              @click="dialogVisible = true"
            >
              {{ whichButton }}
            </el-button>
          </template>
        </el-result>
      </el-col>
      <el-col
        v-if="!isInitial"
        :xs="24"
        :md="12"
        :span="12"
      >
        <el-descriptions
          :title="$t('SystemVersion.ActivationInformation')"
          :column="1"
          class="p-5"
          style="width: auto;"
          label-class-name="text-center font-bold text-base"
          content-class-name="text-base"
          border
        >
          <el-descriptions-item
            v-for="(value, name, index) in versionAuthInfo"
            :key="index"
            :label="name"
          >
            <span :class="{ 'text-danger': name === 'expired'&& isExpiredOrWarning }">
              {{ value }}
            </span>
            <el-button
              v-if="name === 'uuid'"
              class="ml-2"
              circle
              plain
              type="primary"
              icon="el-icon-copy-document"
              @click="copyUrl(versionAuthInfo.uuid)"
            />
          </el-descriptions-item>
        </el-descriptions>
      </el-col>
    </el-row>
    <el-dialog
      :visible.sync="dialogVisible"
      :close-on-click-modal="false"
      :title="$t('SystemVersion.VerificationCode')"
      width="30vw"
      @close="$refs.form.resetFields();"
    >
      <el-form
        v-loading="isLoading"
        ref="form"
        :model="form"
      >
        <el-form-item
          :rules="[
            { required: true, message: $t('Notify.NoEmpty')}
          ]"
          prop="secretKey"
        >
          <el-input
            v-model="form.secretKey"
            :placeholder="$t('RuleMsg.PleaseInput') + $t('SystemVersion.VerificationCode')"
            :rows="5"
            type="textarea"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button
          :disabled="isLoading"
          @click="dialogVisible = false"
        >
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button
          :disabled="isLoading"
          type="primary"
          @click="confirm"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  getVersionAuthInfo,
  updateVersionAuthInfo
} from '@/api_v2/systemParameter'

export default {
  name: 'VersionAuth',
  data() {
    return {
      isShowAuth: false,
      isLoading: false,
      dialogVisible: false,
      versionStatus: 'Initial',
      versionAuthInfo: {},
      remainDays: 0,
      form: {
        secretKey: ''
      }
    }
  },
  computed: {
    ...mapGetters(['userRole', 'device']),
    isAdministrator() {
      return this.userRole === 'Administrator'
    },
    isInitial() {
      return this.versionStatus === 'Initial'
    },
    isExpiredOrWarning() {
      return this.versionStatus === 'Expired' || this.versionStatus === 'Warning'
    },
    whichResult() {
      switch (this.versionStatus) {
        case 'Initial':
          return 'error'
        case 'Enabled':
          return 'success'
        case 'Warning':
          return 'warning'
        case 'Expired':
          return 'error'
        default:
          return 'error'
      }
    },
    whichTitle() {
      switch (this.versionStatus) {
        case 'Initial':
          return this.$t('SystemVersion.Inactive')
        case 'Enabled':
          return this.$t('SystemVersion.Activating')
        case 'Warning':
          return this.$t('SystemVersion.NearExpiration')
        case 'Expired':
          return this.$t('SystemVersion.Expired')
        default:
          return this.$t('SystemVersion.Inactive')
      }
    },
    whichSubTitle() {
      switch (this.versionStatus) {
        case 'Initial':
          return this.$t('SystemVersion.ActivateBeforeUsing')
        case 'Enabled':
          return this.$t('SystemVersion.VerificationCompleted')
        case 'Warning':
          return this.$t('SystemVersion.RemainingDays', [this.remainDays])
        case 'Expired':
          return this.$t('SystemVersion.ExpiredAndReactivate')
        default:
          return this.$t('SystemVersion.ActivateBeforeUsing')
      }
    },
    whichButton() {
      switch (this.versionStatus) {
        case 'Initial':
          return this.$t('SystemVersion.Activate')
        case 'Enabled':
          return this.$t('SystemVersion.Override')
        case 'Warning':
          return this.$t('SystemVersion.Override')
        case 'Expired':
          return this.$t('SystemVersion.Reactivate')
        default:
          return this.$t('SystemVersion.Activate')
      }
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      getVersionAuthInfo().then((res) => {
        const { status, value } = res.data
        this.versionStatus = status
        this.versionAuthInfo = value
        this.remainDays = this.versionAuthInfo.remain_days
        delete this.versionAuthInfo.remain_days
      }).catch(() => {})
        .finally(() => {
          this.isShowAuth = true
        })
    },
    confirm() {
      this.$refs.form.validate((valid) => {
        if (!valid) return
        else {
          this.isLoading = true
          updateVersionAuthInfo({
            sercret_key: this.form.secretKey
          }).then(() => {
            this.fetchData()
          }).catch(() => {})
            .finally(() => {
              this.isLoading = false
              this.dialogVisible = false
            })
        }
      })
    },
    copyUrl(text) {
      this.$copyText(text).then(
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Copied'),
          type: 'success'
        })
      )
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-dialog__body {
  padding: 0 20px;
}

::v-deep .el-dialog__footer {
  padding-top: 0;
}
</style>
