<template>
  <div v-loading="isLoading" class="tab-inner">
    <h3>{{ $t('Profile.ProfileBasicSetting') }}</h3>
    <el-avatar :src="userAvatar" :size="70" />
    <div class="text-sm mb-2">
      <div class="flex">
        <span class="mr-1">{{ $t('User.GravatarLink') }}</span>
        <el-link href="https://gravatar.com/" target="_blank" type="primary">Gravatar.com</el-link>
      </div>
      <div class="notification-warning">{{ $t('User.GravatarNotification') }}</div>
    </div>
    <el-form
      ref="userProfileForm"
      :model="userProfileForm"
      :rules="userProfileRules"
      label-width="100px"
      :label-position="labelPosition"
    >
      <el-row :gutter="10">
        <el-col v-if="'fromAd' in $data" :xs="24" :sm="12" :md="8">
          <el-form-item
            :label="$t('User.Source')"
            class="form-input"
          >
            <el-input
              v-model="source"
              :disabled="true"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item
            :label="$t('general.Name')"
            prop="userName"
          >
            <el-input
              v-model="userProfileForm.userName"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item :label="$t('Profile.Department')">
            <el-input
              v-model="userProfileForm.department"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item :label="$t('Profile.Title')">
            <el-input
              v-model="userProfileForm.title"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item
            label="Email"
            prop="userEmail"
          >
            <el-input
              v-model="userProfileForm.userEmail"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item
            :label="$t('Profile.Phone')"
            prop="userPhone"
          >
            <el-input
              v-model="userProfileForm.userPhone"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-row class="mt-4">
      <el-col :span="8">
        <el-button
          v-if="!disableEdit"
          class="button-primary"
          @click="submitUpdateUserProfile('userProfileForm')"
        >{{
          $t('Profile.Save')
        }}</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { updateUser } from '@/api/user'

export default {
  name: 'Basic',
  props: {
    fromAd: {
      type: Boolean,
      default: false
    },
    labelPosition: {
      type: String,
      default: ''
    },
    disableEdit: {
      type: Boolean,
      default: false
    },
    userProfileForm: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      userProfileRules: {
        userName: [
          { required: true, message: this.$t('RuleMsg.PleaseInput') + this.$t('RuleMsg.UserName'), trigger: 'blur' }
        ],
        userEmail: [
          { required: true, message: this.$t('RuleMsg.PleaseInput') + this.$t('RuleMsg.Email'), trigger: 'blur' },
          { type: 'email', message: this.$t('RuleMsg.Invalid') + this.$t('RuleMsg.Email'), trigger: ['blur', 'change'] }
        ]
      },
      isLoading: false
    }
  },
  computed: {
    ...mapGetters(['userId', 'userAvatar']),
    source() {
      return this.fromAd ? this.$t('User.AD') : this.$t('User.SYSTEM')
    }
  },
  methods: {
    ...mapActions('user', ['setUserName']),
    submitUpdateUserProfile(formName) {
      if (!this.disableEdit) {
        this.$refs[formName].validate(async (valid) => {
          if (valid) {
            this.isLoading = true
            const data = {
              name: this.userProfileForm.userName,
              department: this.userProfileForm.department,
              title: this.userProfileForm.title,
              email: this.userProfileForm.userEmail,
              phone: this.userProfileForm.userPhone
            }
            await updateUser(this.userId, data)
              .then(() => {
                this.setUserName(this.userProfileForm.userName)
                this.$message({
                  title: this.$t('general.Success'),
                  message: this.$t('Notify.Updated'),
                  type: 'success'
                })
              })
            this.isLoading = false
          } else {
            return false
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
</style>
