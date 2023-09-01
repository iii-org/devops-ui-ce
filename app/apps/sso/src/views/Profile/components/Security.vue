<template>
  <div class="tab-inner">
    <h3>
      {{ $t('Profile.ProfileSecuritySetting') }}
    </h3>
    <el-form
      ref="userPwdForm"
      :model="userPwdForm"
      :rules="userPwdFormRules"
      label-width="100px"
      class="demo-ruleForm"
      :label-position="labelPosition"
    >
      <el-divider content-position="left">
        {{ $t('Profile.DeviceVerification') }}
      </el-divider>
      <el-button
        class="buttonSecondary my-2"
        @click="deviceVerify"
      >
        {{ $t('Profile.EnableDeviceVerification') }}
      </el-button>
      <div class="notification">
        <span class="text-sm">
          {{ $t('Profile.DeviceVerificationDescription') }}
        </span>
      </div>
      <el-divider content-position="left">
        {{ $t('Profile.ResetPassword') }}
      </el-divider>
      <el-form-item
        :label="$t('Profile.Password')"
        prop="old_password"
      >
        <el-input
          v-model="userPwdForm.old_password"
          :disabled="disableEdit"
          type="password"
          class="form-input"
        />
      </el-form-item>
      <el-form-item
        :label="$t('Profile.NewPassword')"
        prop="userNewPwd"
      >
        <el-input
          v-model="userPwdForm.userNewPwd"
          :disabled="disableEdit"
          type="password"
          class="form-input"
        />
        <div style="word-break: keep-all; margin-top: 5px">
          {{ $t('Profile.PasswordRule') }}
        </div>
      </el-form-item>
      <el-form-item
        :label="$t('Profile.RepeatNewPassword')"
        prop="userRepeatNewPwd"
      >
        <el-input
          v-model="userPwdForm.userRepeatNewPwd"
          :disabled="disableEdit"
          type="password"
          class="form-input"
        />
      </el-form-item>
    </el-form>
    <el-row class="mt-4">
      <el-col :span="8">
        <el-button
          :disabled="disableEdit"
          class="buttonPrimary"
          @click="handleUpdateUserPwd('userPwdForm')"
        >{{
          $t('Profile.Save')
        }}</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Keycloak from 'keycloak-js'
import { mapGetters } from 'vuex'
import { updateUser } from '@/api/user'

export default {
  name: 'Security',
  props: {
    userPwdForm: {
      type: Object,
      default: () => ({})
    },
    labelPosition: {
      type: String,
      default: ''
    },
    disableEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const validatePassword = (rule, value, callback) => {
      if (value.length > 0 && value.length < 8) {
        callback(new Error(this.$t('RuleMsg.PasswordLimit')))
      } else if (this.userPwdForm.old_password === value) {
        callback(new Error(this.$t('RuleMsg.DifferentNewPassword')))
      } else {
        callback()
      }
    }
    const checkRepeatPwd = (rule, value, callback) => {
      if (value !== this.userPwdForm.userNewPwd) {
        callback(new Error(this.$t('RuleMsg.PasswordNotSame')))
      } else {
        callback()
      }
    }
    return {
      userPwdFormRules: {
        userNewPwd: [
          {
            required: true,
            pattern: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])^[\w!@#$%^&*()+|{}\[\]`~\-'";:/?.\\>,<]{8,20}$/,
            message: this.$t('RuleMsg.Invalid') + this.$t('RuleMsg.Password'),
            trigger: 'blur'
          },
          { validator: validatePassword, trigger: 'blur' },
          { required: true, message: this.$t('RuleMsg.InputNewPwd'), trigger: 'blur' }
        ],
        userRepeatNewPwd: [
          { required: true, message: this.$t('RuleMsg.InputRepeatPwd'), trigger: 'blur' },
          { validator: checkRepeatPwd, trigger: 'blur' }
        ],
        old_password: [
          { required: true, message: this.$t('RuleMsg.PleaseInput') + this.$t('RuleMsg.Password'), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['userId'])
  },
  methods: {
    deviceVerify() {
      const keycloak_url = process.env.VUE_APP_KC_URL
      const keycloak = new Keycloak({
        url: keycloak_url,
        realm: 'IIIdevops',
        clientId: 'IIIDevOpsAccount'
      })
      keycloak.init()
      keycloak.login({ action: 'webauthn-register-passwordless' })
    },
    async handleUpdateUserPwd(formName) {
      if (!this.disableEdit) {
        this.$refs[formName].validate(async (valid) => {
          if (valid) {
            await updateUser(this.userId, {
              password: this.userPwdForm.userNewPwd,
              old_password: this.userPwdForm.old_password
            })
            this.$message({
              title: this.$t('general.Success'),
              message: this.$t('Notify.Updated'),
              type: 'success'
            })
          }
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.tab-inner {
  padding: 0 25px;
}
.form-input {
  width: 250px;
}
</style>
