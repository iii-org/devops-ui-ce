<template>
  <el-dialog
    :close-on-click-modal="false"
    :title="$t(`User.${userDialogOptions.title}`)"
    :visible="userDialogOptions.isDialogVisible"
    :width="width"
    append-to-body
    class="scroll-dialog"
    @close="handleClose('userForm')"
  >
    <el-form
      ref="userForm"
      v-loading="dialogLoading"
      :label-width="isMobile ? 'auto' : '30%'"
      :model="userForm"
      :rules="userFormRules"
      label-position="top"
    >
      <el-row :gutter="20">
        <el-col v-if="'can_modify' in userForm" :md="24" :span="24">
          <el-form-item
            v-if="'can_modify' in userForm"
            :label="$t('User.Source')"
            prop="username"
          >
            <el-input v-model="source" disabled />
          </el-form-item>
        </el-col>
        <el-col :md="24" :span="24">
          <el-form-item :label="$t('User.Account')" prop="username">
            <el-input
              v-model="userForm.username"
              :disabled="disableAccount"
              maxlength="60"
              show-word-limit
            />
            <div
              v-if="userDialogOptions.title === 'AddUser'"
              style="word-break: keep-all; margin-top: 5px"
            >
              {{ $t('User.AccountRule') }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="$t('User.FirstName')" prop="first_name">
            <el-input v-model="userForm.first_name" :disabled="disableEdit" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="$t('User.LastName')" prop="last_name">
            <el-input v-model="userForm.last_name" :disabled="disableEdit" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="E-mail" prop="email">
            <el-input v-model="userForm.email" :disabled="disableEdit" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="$t('User.Role')" prop="default_role">
            <el-select v-model="userForm.default_role" style="width: 100%">
              <el-option
                v-for="item in roleDataList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item
            v-if="!disableEdit"
            :label="$t('User.Password')"
            prop="password"
          >
            <el-input
              v-model="userForm.password"
              maxlength="20"
              show-password
              type="password"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item
            v-if="!disableEdit"
            :label="$t('User.RepeatPassword')"
            prop="repeatPassword"
          >
            <el-input
              v-model="userForm.repeatPassword"
              maxlength="20"
              show-password
              type="password"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="userRole === 'sysadmin'" :md="12" :span="24">
          <el-form-item
            :label="$t('Organization.Organization')"
            :rules="[
              {
                required: true,
                message: $t('Organization.PleaseSelectOrganization'),
                trigger: 'blur'
              }
            ]"
            prop="organization_id"
          >
            <el-select
              v-model="userForm.organization_id"
              :disabled="userDialogOptions.isDisableOrg"
              class="w-full"
            >
              <el-option
                v-for="item in organizationList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="$t('User.Department')">
            <el-input v-model="userForm.department" :disabled="disableEdit" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="$t('User.Title')">
            <el-input v-model="userForm.title" :disabled="disableEdit" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="$t('User.Phone')" prop="phone">
            <el-input v-model="userForm.phone" :disabled="disableEdit" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="$t('User.IsEnable')" prop="is_active">
            <el-switch
              v-model="userForm.is_active"
              :active-text="$t('general.Enable')"
              :active-value="true"
              :inactive-text="$t('general.Disable')"
              :inactive-value="false"
              class="mt-2"
              inactive-color="gray"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item
            v-if="!isLite && !disableEdit"
            :label="$t('User.ResetPassword')"
          >
            <el-switch
              v-model="userForm.temporary"
              :active-text="$t('general.Enable')"
              :active-value="true"
              :inactive-text="$t('general.Disable')"
              :inactive-value="false"
              class="mt-2"
              inactive-color="gray"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">{{ $t('general.Cancel') }}</el-button>
      <el-button type="primary" @click="submitForm">{{
        $t('general.Confirm')
      }}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import { createUser, preCheckPassword, updateUser } from '@/api_v3/user'
import { mapGetters } from 'vuex'

export default {
  name: 'UserDialog',
  props: {
    userDialogOptions: {
      type: Object,
      default: () => ({
        isDialogVisible: false,
        isDisableOrg: false,
        title: '',
        userId: 0,
        userData: {}
      })
    },
    width: {
      type: String,
      default: '50%'
    },
    organizationList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      userForm: {
        username: '',
        name: '',
        password: '',
        repeatPassword: '',
        email: '',
        phone: '',
        default_role: '',
        is_active: true,
        temporary: false,
        organization_id: ''
      },
      userFormRules: {
        username: [
          {
            required: true,
            pattern: /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,58}[a-zA-Z0-9]$/,
            message: this.$t('User.AccountRule'),
            trigger: 'blur'
          },
          {
            required: true,
            message: this.$t('User.InputAccount'),
            trigger: 'blur'
          },
          {
            validator: () =>
              this.$refs[this.formName].validateField('password'),
            trigger: 'blur'
          }
        ],
        password: [
          {
            validator: this.validatePassword,
            message: this.$t('RuleMsg.PasswordLimit')
          }
        ],
        repeatPassword: [
          {
            required: true,
            message: this.$t('User.InputPassword'),
            trigger: 'blur'
          }
        ],
        first_name: [
          {
            required: true,
            message: this.$t('User.InputFirstName'),
            trigger: 'blur'
          },
          {
            validator: () =>
              this.$refs[this.formName].validateField('password'),
            trigger: 'blur'
          }
        ],
        last_name: [
          {
            required: true,
            message: this.$t('User.InputLastName'),
            trigger: 'blur'
          },
          {
            validator: () =>
              this.$refs[this.formName].validateField('password'),
            trigger: 'blur'
          }
        ],
        email: [
          {
            required: true,
            message: this.$t('User.InputEmail'),
            trigger: 'blur'
          },
          {
            type: 'email',
            message: this.$t('User.EmailRule'),
            trigger: ['blur', 'change']
          },
          {
            validator: () =>
              this.$refs[this.formName].validateField('password'),
            trigger: 'blur'
          }
        ],
        default_role: [
          {
            required: true,
            message: this.$t('User.InputRole'),
            trigger: 'blur'
          }
        ]
      },
      dialogLoading: false,
      disableAccount: false,
      formName: 'userForm'
    }
  },
  computed: {
    ...mapGetters(['roleList', 'device', 'userRole']),
    roleDataList() {
      return this.userRole === 'sysadmin'
        ? this.roleList
        : this.roleList.filter((role) => role.name !== 'sysadmin')
    },
    source() {
      return !Object.keys(this.userForm).includes('can_modify') ||
        this.userForm.can_modify
        ? this.$t('User.SYSTEM')
        : this.$t('User.AD')
    },
    disableEdit() {
      return !(
        !Object.keys(this.userForm).includes('can_modify') ||
        this.userForm.can_modify
      )
    },
    isMobile() {
      return this.device === 'mobile'
    },
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    }
  },
  watch: {
    'userDialogOptions.userData': {
      handler(data) {
        this.userForm = data
        if (!data.default_role) {
          // get role id from role object
          const default_role = data.role ? data.role.id : data.default_role_id
          this.$set(this.userForm, 'default_role', default_role)
          this.handleUpdateForm()
        }
      },
      immediate: true
    }
  },
  updated() {
    this.handleUpdateForm()
  },
  methods: {
    handleUpdateForm() {
      const basePasswordRules = [
        {
          required: true,
          message: this.$t('User.InputPassword'),
          trigger: 'blur'
        },
        {
          required: true,
          pattern:
            /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])^[\w!@#$%^&*()+|{}\[\]`~\-'";:/?.\\>,<]{8,20}$/,
          message: this.$t('User.PasswordRule'),
          trigger: 'blur'
        },
        { validator: this.validatePassword, trigger: 'blur' }
      ]

      const baseRepeatPasswordRules = [
        {
          required: true,
          message: this.$t('RuleMsg.InputRepeatPwd'),
          trigger: 'blur'
        },
        { validator: this.checkRepeatPwd, trigger: 'blur' }
      ]

      if (this.userDialogOptions.userId === 0) {
        this.disableAccount = false
        this.userFormRules.password = [...basePasswordRules]
        this.userFormRules.repeatPassword = [...baseRepeatPasswordRules]
      } else {
        this.disableAccount = true
        this.listLoading = true

        const passwordRulesWithValidation = [
          ...basePasswordRules,
          { validator: this.checkRepeatPwd, trigger: 'blur' }
        ]

        const defaultPasswordRules = [
          { required: false },
          { validator: this.checkRepeatPwd, trigger: 'blur' },
          { validator: this.validatePassword, trigger: 'blur' }
        ]

        this.userFormRules.password =
          this.userForm.password && this.userForm.password.length !== 0
            ? passwordRulesWithValidation
            : defaultPasswordRules

        this.userFormRules.repeatPassword =
          this.userForm.password && this.userForm.password.length !== 0
            ? [
                { required: true },
                { validator: this.checkRepeatPwd, trigger: 'blur' },
                { validator: this.validatePassword, trigger: 'blur' }
              ]
            : defaultPasswordRules
      }
    },
    checkRepeatPwd(rule, value, callback) {
      if (
        value !== this.userForm.password &&
        this.userForm.password !== '' &&
        this.userForm.repeatPassword !== ''
      ) {
        callback(new Error(this.$t('User.PasswordNotTheSameRule')))
      } else {
        callback()
      }
    },
    async validatePassword(rule, value, callback) {
      if (value === undefined) {
        callback()
      } else if (value.length > 0 && this.userForm.password !== '') {
        const data = {
          password: value,
          username: this.userForm.username,
          first_name: this.userForm.first_name,
          last_name: this.userForm.last_name,
          email: this.userForm.email
        }
        await preCheckPassword(data).then((res) => {
          if (res.data.status !== 'pass') {
            callback(new Error(res.data.reason.join(' ')))
          } else {
            callback()
          }
        })
      } else {
        callback()
      }
    },
    handleClose() {
      this.$refs[this.formName].resetFields()
      this.$emit('onCloseDialog', false)
    },
    async validateForm() {
      let valid = true
      for (const key in this.userForm) {
        await this.$refs[this.formName].validateField(key, (error) => {
          if (error) {
            valid = false
          }
        })
      }
      return valid
    },
    async submitForm() {
      const valid = await this.validateForm()
      if (valid) {
        this.dialogLoading = true
        const data = {
          username: this.userForm.username,
          password: this.userForm.password,
          first_name: this.userForm.first_name,
          last_name: this.userForm.last_name,
          department: this.userForm.department,
          title: this.userForm.title,
          name: this.userForm.name,
          email: this.userForm.email,
          phone: this.userForm.phone,
          role_id: this.userForm.default_role,
          is_active: this.userForm.is_active,
          temporary: this.userForm.temporary,
          organization_id: this.userForm.organization_id
        }

        // remove useless field
        Object.keys(data).forEach((item) => {
          if (data[item] === '' && item === 'password') {
            delete data[item]
          }
        })
        if (this.userDialogOptions.userId === 0) {
          this.addUser(data)
        } else {
          delete data['username']
          if (data.phone === '') {
            delete data['phone']
          }
          this.updateUser(data)
        }
      } else {
        return false
      }
    },
    async addUser(data) {
      await createUser(data)
        .then(() => {
          this.$refs[this.formName].resetFields()
          this.$emit('onCloseDialog', false, 'refresh')
          this.showSuccessMessage(this.$t('Notify.Added'))
        })
        .finally(() => {
          this.dialogLoading = false
        })
    },
    async updateUser(data) {
      await updateUser(this.userDialogOptions.userId, data)
        .then(() => {
          this.$refs[this.formName].resetFields()
          this.$emit('onCloseDialog', false, 'refresh', true)
          this.showSuccessMessage(this.$t('Notify.Updated'))
        })
        .finally(() => {
          this.dialogLoading = false
        })
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-dialog {
  display: flex;
  flex-direction: column;
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

::v-deep .el-dialog .el-dialog__body {
  flex: 1;
  overflow: auto;
  max-height: 75vh;
}

::v-deep .el-form-item {
  margin-bottom: 25px;
}

::v-deep .el-form-item__label {
  padding: 0;
}
</style>
