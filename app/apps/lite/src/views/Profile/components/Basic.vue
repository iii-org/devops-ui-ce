<template>
  <div v-loading="isLoading" class="tab-inner">
    <h3>{{ $t('Profile.ProfileBasicSetting') }}</h3>
    <el-avatar :size="100" :src="userAvatar" />
    <div class="text-sm mb-2">
      <div class="flex">
        <span class="mr-1">{{ $t('User.GravatarLink') }}</span>
        <el-link href="https://gravatar.com/" target="_blank" type="primary">
          Gravatar.com
        </el-link>
      </div>
      <div class="notification-warning">
        {{ $t('User.GravatarNotification') }}
      </div>
    </div>
    <el-form
      ref="userProfileForm"
      :label-position="labelPosition"
      :model="userProfileForm"
      :rules="userProfileRules"
      label-width="100px"
    >
      <el-row :gutter="30">
        <el-col v-if="'fromAd' in $data" :md="8" :sm="12" :xs="24">
          <el-form-item :label="$t('User.Source')" class="form-input">
            <el-input v-model="source" :disabled="true" />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <el-form-item :label="$t('User.FirstName')" prop="firstName">
            <el-input
              v-model="userProfileForm.firstName"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <el-form-item :label="$t('User.LastName')" prop="lastName">
            <el-input
              v-model="userProfileForm.lastName"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <el-form-item :label="$t('Profile.Department')">
            <el-input
              v-model="userProfileForm.department"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <el-form-item :label="$t('Profile.Title')">
            <el-input
              v-model="userProfileForm.title"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <el-form-item label="E-mail" prop="userEmail">
            <el-input
              v-model="userProfileForm.userEmail"
              :disabled="disableEdit"
              class="form-input"
            />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12" :xs="24">
          <el-form-item :label="$t('Profile.Phone')" prop="userPhone">
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
          type="primary"
          @click="submitUpdateUserProfile('userProfileForm')"
        >{{ $t('Profile.Save') }}
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { updateCurrentUser } from '@/api_v3/user'
import { mapActions, mapGetters } from 'vuex'

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
        firstName: [
          {
            required: true,
            message:
              this.$t('RuleMsg.PleaseInput') + this.$t('RuleMsg.UserName'),
            trigger: 'blur'
          }
        ],
        lastName: [
          {
            required: true,
            message:
              this.$t('RuleMsg.PleaseInput') + this.$t('RuleMsg.UserName'),
            trigger: 'blur'
          }
        ],
        userEmail: [
          {
            required: true,
            message: this.$t('RuleMsg.PleaseInput') + this.$t('RuleMsg.Email'),
            trigger: 'blur'
          },
          {
            type: 'email',
            message: this.$t('RuleMsg.Invalid') + this.$t('RuleMsg.Email'),
            trigger: ['blur', 'change']
          }
        ]
      },
      originalData: {},
      isLoading: false
    }
  },
  computed: {
    ...mapGetters(['userId', 'userAvatar']),
    source() {
      return this.fromAd ? this.$t('User.AD') : this.$t('User.SYSTEM')
    }
  },
  mounted() {
    this.setOriginalData()
  },
  methods: {
    ...mapActions('user', ['setUserName']),
    submitUpdateUserProfile(formName) {
      if (!this.disableEdit) {
        this.$refs[formName].validate(async (valid) => {
          if (valid) {
            this.isLoading = true
            const data = this.getSendData()
            await updateCurrentUser(data)
              .then(() => {
                this.setUserName(
                  `${this.userProfileForm.firstName} ${this.userProfileForm.lastName}`
                )
                this.setOriginalData()
                this.$message({
                  title: this.$t('general.Success'),
                  message: this.$t('Notify.Updated'),
                  type: 'success'
                })
              })
              .finally(() => {
                this.isLoading = false
              })
          } else {
            return false
          }
        })
      }
    },
    getSendData() {
      const data = {
        first_name: this.userProfileForm.firstName,
        last_name: this.userProfileForm.lastName,
        department: this.userProfileForm.department,
        title: this.userProfileForm.title,
        email: this.userProfileForm.userEmail,
        phone: this.userProfileForm.userPhone
      }
      const mapping = {
        first_name: 'firstName',
        last_name: 'lastName',
        department: 'department',
        title: 'title',
        email: 'userEmail',
        phone: 'userPhone'
      }
      Object.keys(data).forEach((key) => {
        const mappingKey = mapping[key]
        if (data[key] === this.originalData[mappingKey]) {
          delete data[key]
        } else if (['phone', 'department'].includes(key) && data[key] === '') {
          data[key] = null
        }
      })
      return data
    },
    setOriginalData() {
      this.originalData = { ...this.userProfileForm }
    }
  }
}
</script>

<style lang="scss" scoped>
.tab-inner {
  padding: 0 25px;
}
</style>
