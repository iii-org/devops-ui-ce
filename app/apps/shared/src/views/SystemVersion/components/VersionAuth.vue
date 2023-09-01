<template>
  <el-card v-if="isShowAuth" class="my-3">
    <el-row>
      <el-col
        :xs="24"
        :md="activeStatus ? 12 : 24"
        :span="activeStatus ? 12 : 24"
      >
        <el-result
          :icon="activeStatus ? 'success' : 'error'"
          :title="$t(`SystemVersion.${activeStatus ? 'Activating' : 'Inactive'}`)"
          :sub-title="$t(`SystemVersion.${activeStatus ? 'VerificationCompleted' : 'ActivateBeforeUsing'}`)"
        >
          <template slot="extra">
            <el-button
              v-if="isAdministrator"
              type="primary"
              size="medium"
              @click="dialogVisible = true"
            >
              {{ $t(`SystemVersion.${activeStatus ? 'Override' : 'Activate'}`) }}
            </el-button>
          </template>
        </el-result>
      </el-col>
      <el-col
        v-if="activeStatus"
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
            {{ value }}
            <el-button
              v-if="name === 'uuid'"
              class="ml-2"
              round
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
        ref="form"
        v-loading="isLoading"
        :model="form"
      >
        <el-form-item
          prop="secretKey"
          :rules="[
            { required: true, message: $t('Notify.NoEmpty')}
          ]"
        >
          <el-input
            v-model="form.secretKey"
            :placeholder="$t('RuleMsg.PleaseInput') + $t('SystemVersion.VerificationCode')"
            type="textarea"
            :rows="5"
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
          type="primary"
          :disabled="isLoading"
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
      activeStatus: false,
      versionAuthInfo: {},
      form: {
        secretKey: ''
      }
    }
  },
  computed: {
    ...mapGetters(['userRole']),
    isAdministrator() {
      return this.userRole === 'Administrator'
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      getVersionAuthInfo().then((res) => {
        const { disabled, value } = res.data
        this.activeStatus = !disabled
        this.versionAuthInfo = value
        delete this.versionAuthInfo.key
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
