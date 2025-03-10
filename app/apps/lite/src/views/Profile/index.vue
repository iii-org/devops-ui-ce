<template>
  <div class="app-container">
    <el-card :class="isMobile ? 'mobile' : ''" class="border-none">
      <el-tabs
        v-model="tabActive"
        :class="isMobile ? '' : 'h-full'"
        :stretch="isMobile"
        :tab-position="isMobile ? 'bottom' : 'left'"
        :type="isMobile ? 'border-card' : ''"
      >
        <el-tab-pane name="basic">
          <span slot="label">
            <em v-if="isMobile" class="ri-user-line text-xl align-middle"></em>
            <span v-else>{{ $t('Profile.Basic') }}</span>
          </span>
          <Basic
            :disable-edit="disableEdit"
            :from-ad="fromAd"
            :label-position="labelPosition"
            :user-profile-form="userProfileForm"
          />
        </el-tab-pane>
        <el-tab-pane name="security">
          <span slot="label">
            <em
              v-if="isMobile"
              class="ri-shield-user-line text-xl align-middle"
            ></em>
            <span v-else>{{ $t('Profile.Security') }}</span>
          </span>
          <Security
            :disable-edit="disableEdit"
            :label-position="labelPosition"
            :user-data="userData"
            :user-pwd-form="userPwdForm"
          />
        </el-tab-pane>
        <el-tab-pane v-if="isAiEnabled" name="aiSettings">
          <span slot="label">
            <em
              v-if="isMobile"
              class="ri-ai-generate-2 text-xl align-middle"
            ></em>
            <span v-else>{{ $t('AISettings.AITokenSettings') }}</span>
          </span>
          <AITokenSettings :back-to-overview="backToOverview" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { getServerPasswordInfo, getUserMessageInfo } from '@/api_v2/user'
import { getCurrentUser } from '@/api_v3/user'
import { mapGetters } from 'vuex'

export default {
  name: 'Profile',
  components: {
    Basic: () => import('./components/Basic'),
    Security: () => import('./components/Security'),
    AITokenSettings: () =>
      import('@shared/views/Profile/components/AITokenSettings')
  },
  data() {
    return {
      labelPosition: 'top',
      tabActive: 'basic',
      fromAd: false,
      userData: {},
      userProfileForm: {
        firstName: '',
        lastName: '',
        title: '',
        department: '',
        userEmail: '',
        userPhone: 0
      },
      userPwdForm: {
        userNewPwd: '',
        userRepeatNewPwd: '',
        old_password: ''
      },
      userMessageForm: {
        notification: false,
        mail: false
      },
      serverPasswordForm: [],
      backToOverview: false
    }
  },
  computed: {
    ...mapGetters(['userId', 'device', 'services']),
    disableEdit() {
      return this.fromAd
    },
    isMobile() {
      return this.device === 'mobile'
    },
    isAiEnabled() {
      return this.services['ai-dockerfile']
    }
  },
  beforeMount() {
    if (this.$route.params.tab) {
      this.tabActive = this.$route.params.tab
      this.backToOverview = true
    }
  },
  mounted() {
    this.fetchUserInfo()
    // this.fetchUserMessageInfo()
    // this.fetchServerPasswordInfo()
  },
  methods: {
    async fetchUserInfo() {
      await getCurrentUser(this.userId)
        .then((userProfile) => {
          this.userData = userProfile
          this.fromAd = !userProfile.can_modify
          this.userProfileForm.firstName = userProfile.first_name
          this.userProfileForm.lastName = userProfile.last_name
          this.userProfileForm.userEmail = userProfile.email
          this.userProfileForm.userPhone = userProfile.phone
          this.userProfileForm.department = userProfile.department
          this.userProfileForm.title = userProfile.title
        })
        .catch((error) => console.error(error))
    },
    async fetchUserMessageInfo() {
      await getUserMessageInfo(this.userId)
        .then((userMessageInfo) => {
          this.userMessageForm.notification = userMessageInfo.data.notification
          this.userMessageForm.mail = userMessageInfo.data.mail
        })
        .catch((error) => console.error(error))
    },
    async fetchServerPasswordInfo() {
      await getServerPasswordInfo(this.userId)
        .then((serverPasswordInfo) => {
          this.serverPasswordForm = serverPasswordInfo.data.map((item) => {
            if (item.status === 0) item.visible = false
            return item
          })
        })
        .catch((error) => console.error(error))
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
@import 'src/styles/theme/mixin.scss';

::v-deep {
  .el-card {
    height: 100%;

    .el-card__body {
      height: 100%;
    }
  }
}

/* To make el-tab content fill space, or table will not expand */
::v-deep .el-tabs__content {
  height: 100%;
  overflow-y: auto;
}

::v-deep .el-tabs__nav-wrap::after {
  background-color: none;
}

::v-deep .el-tabs__item {
  &:hover {
    color: $linkTextColor;
  }

  &.is-active {
    background-color: $linkTextColor;
    color: #fff !important;
    border-radius: 4px;
  }

  &.is-left {
    margin-right: 10px;
    text-align: left;
  }
}

::v-deep .el-tabs__active-bar {
  background-color: $linkTextColor;
}

::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
  @include background-border-color($linkTextColor, $linkTextColor);
}

::v-deep .el-radio.is-bordered.is-checked {
  border-color: $linkTextColor;
}

::v-deep .el-radio__input.is-checked .el-radio__inner {
  @include background-border-color($linkTextColor, $linkTextColor);
}

::v-deep .el-radio__input.is-checked + .el-radio__label {
  color: $linkTextColor;
}

::v-deep .el-radio__inner:hover {
  border-color: $linkTextColor;
}

.mobile {
  height: auto;

  ::v-deep .el-card__body {
    padding: 0;
  }

  ::v-deep .tab-inner {
    padding: 0;
  }

  ::v-deep .form-input {
    width: -webkit-fill-available;
  }

  ::v-deep .el-tabs__content {
    height: auto;
    padding-bottom: 60px;
  }

  ::v-deep .el-tab-pane {
    height: auto;
  }

  ::v-deep .el-tabs__header {
    position: fixed;
    bottom: 0px;
    left: 0px;
    z-index: 1000;
    width: 100%;
    padding: 0;
  }

  ::v-deep .el-tabs__item {
    padding: 0 12px !important;
    height: 50px;
  }

  ::v-deep .el-tabs--border-card {
    border: none;
  }
}
</style>
