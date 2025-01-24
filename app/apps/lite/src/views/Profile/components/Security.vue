<template>
  <div class="tab-inner">
    <h3>{{ $t('Profile.ProfileSecuritySetting') }}</h3>
    <el-form
      ref="userPwdForm"
      :label-position="labelPosition"
      :model="userPwdForm"
      :rules="userPwdFormRules"
      class="demo-ruleForm"
      label-width="100px"
    >
      <el-form-item :label="$t('Profile.Password')" prop="old_password">
        <el-input
          v-model="userPwdForm.old_password"
          :disabled="disableEdit"
          class="form-input"
          show-password
          type="password"
        />
      </el-form-item>
      <el-form-item :label="$t('Profile.NewPassword')" prop="userNewPwd">
        <el-input
          v-model="userPwdForm.userNewPwd"
          :disabled="disableEdit"
          class="form-input"
          show-password
          type="password"
        />
      </el-form-item>
      <el-form-item
        :label="$t('Profile.RepeatNewPassword')"
        prop="userRepeatNewPwd"
      >
        <el-input
          v-model="userPwdForm.userRepeatNewPwd"
          :disabled="disableEdit"
          class="form-input"
          show-password
          type="password"
        />
      </el-form-item>
    </el-form>
    <el-row class="mt-4">
      <el-col :span="8">
        <el-button
          :disabled="disableEdit"
          type="primary"
          @click="handleUpdateUserPwd('userPwdForm')"
          >{{ $t('Profile.Save') }}
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { preCheckPassword, updateCurrentUserPassword } from '@/api_v3/user'
import { mapGetters } from 'vuex'

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
    },
    userData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    const validatePassword = async (rule, value, callback) => {
      if (value === undefined) {
        callback()
      } else if (value.length > 0 && this.userPwdForm.userNewPwd !== '') {
        const data = {
          password: value,
          username: this.userData.username,
          first_name: this.userData.first_name,
          last_name: this.userData.last_name,
          email: this.userData.email
        }
        await preCheckPassword(data).then((res) => {
          if (res.data.status !== 'pass') {
            callback(new Error(res.data.reason.join(' ')))
          } else {
            callback()
          }
        })
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
            message: this.$t('RuleMsg.InputNewPwd'),
            trigger: 'blur'
          },
          {
            required: true,
            pattern:
              /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])^[\w!@#$%^&*()+|{}\[\]`~\-'";:/?.\\>,<]{8,20}$/,
            message: this.$t('User.PasswordRule'),
            trigger: 'blur'
          },
          { validator: validatePassword, trigger: 'blur' }
        ],
        userRepeatNewPwd: [
          {
            required: true,
            message: this.$t('RuleMsg.InputRepeatPwd'),
            trigger: 'blur'
          },
          { validator: checkRepeatPwd, trigger: 'blur' }
        ],
        old_password: [
          {
            required: true,
            message:
              this.$t('RuleMsg.PleaseInput') + this.$t('RuleMsg.Password'),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['userId'])
  },
  methods: {
    async handleUpdateUserPwd(formName) {
      if (!this.disableEdit) {
        this.$refs[formName].validate(async (valid) => {
          if (valid) {
            await updateCurrentUserPassword({
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
