<template>
  <el-card v-if="isShowAuth" class="my-3">
    <el-row :type="isMobile ? '' : 'flex'" align="middle">
      <el-col :md="isInitial ? 24 : 12" :span="isInitial ? 24 : 12" :xs="24">
        <el-result
          :icon="whichResult"
          :sub-title="whichSubTitle"
          :title="whichTitle"
        >
          <template slot="extra">
            <el-button
              v-if="isAdministrator"
              size="medium"
              type="primary"
              @click="dialogVisible = true"
            >
              {{ whichButton }}
            </el-button>
          </template>
        </el-result>
      </el-col>
      <el-col v-if="!isInitial" :md="12" :span="12" :xs="24">
        <el-descriptions
          :column="1"
          :title="$t('SystemVersion.ActivationInformation')"
          border
          class="p-5"
          content-class-name="text-base"
          label-class-name="text-center font-bold text-base"
          style="width: auto"
        >
          <el-descriptions-item
            v-for="(value, name, index) in versionAuthInfo"
            :key="index"
            :label="name"
          >
            <span
              :class="{
                'text-danger': name === 'expired' && isExpiredOrWarning
              }"
            >
              {{ value }}
            </span>
            <el-button
              v-if="name === 'uuid'"
              circle
              class="ml-2"
              icon="el-icon-copy-document"
              plain
              type="primary"
              @click="copyUrl(versionAuthInfo.uuid)"
            />
          </el-descriptions-item>
        </el-descriptions>
      </el-col>
    </el-row>
    <el-dialog
      :close-on-click-modal="false"
      :title="$t('SystemVersion.VerificationCode')"
      :visible.sync="dialogVisible"
      width="30vw"
      @close="$refs.form.resetFields()"
    >
      <el-form ref="form" v-loading="isLoading" :model="form">
        <el-form-item
          :rules="[{ required: true, message: $t('Notify.NoEmpty') }]"
          prop="secretKey"
        >
          <el-input
            v-model="form.secretKey"
            :placeholder="
              $t('RuleMsg.PleaseInput') + $t('SystemVersion.VerificationCode')
            "
            :rows="5"
            type="textarea"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button :disabled="isLoading" @click="dialogVisible = false">
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button :disabled="isLoading" type="primary" @click="confirm">
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
      return this.userRole === 'sysadmin'
    },
    isInitial() {
      return this.versionStatus === 'Initial'
    },
    isExpiredOrWarning() {
      return (
        this.versionStatus === 'Expired' || this.versionStatus === 'Warning'
      )
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
      getVersionAuthInfo()
        .then((res) => {
          const { status, value } = res.data
          this.versionStatus = status
          this.versionAuthInfo = value
          this.remainDays = this.versionAuthInfo.remain_days
          delete this.versionAuthInfo.remain_days
        })
        .catch(() => {})
        .finally(() => {
          this.isShowAuth = true
        })
    },
    confirm() {
      this.$refs.form.validate((valid) => {
        if (!valid) {
          return false
        } else {
          this.isLoading = true
          updateVersionAuthInfo({
            sercret_key: this.form.secretKey
          })
            .then(() => {
              this.fetchData()
            })
            .catch(() => {})
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
