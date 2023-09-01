<template>
  <div class="app-container">
    <el-card :class="isMobile ? 'mobile' : ''">
      <el-tabs
        v-model="tabActive"
        :tab-position="isMobile ? 'bottom' : 'left'"
        :class="isMobile ? '' : 'h-full'"
        :type="isMobile ? 'border-card' : ''"
        :stretch="isMobile"
      >
        <el-tab-pane name="basic">
          <span slot="label">
            <em v-if="isMobile" class="ri-user-line text-xl align-middle" />
            <span v-else>{{ $t('Profile.Basic') }}</span>
          </span>
          <Basic
            :from-ad="fromAd"
            :label-position="labelPosition"
            :disable-edit="disableEdit"
            :user-profile-form="userProfileForm"
          />
        </el-tab-pane>
        <el-tab-pane name="security">
          <span slot="label">
            <em v-if="isMobile" class="ri-shield-user-line text-xl align-middle" />
            <span v-else>{{ $t('Profile.Security') }}</span>
          </span>
          <Security
            :user-pwd-form="userPwdForm"
            :label-position="labelPosition"
            :disable-edit="disableEdit"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getUserInfo } from '@/api/user'
import {
  getUserMessageInfo,
  getServerPasswordInfo
} from '@/api_v2/user'

export default {
  name: 'Profile',
  components: {
    Basic: () => import('./components/Basic'),
    Security: () => import('./components/Security')
  },
  data() {
    return {
      labelPosition: 'top',
      tabActive: 'basic',
      fromAd: false,
      userProfileForm: {
        userName: '',
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
      serverPasswordForm: []
    }
  },
  computed: {
    ...mapGetters(['userId', 'device']),
    disableEdit() {
      return this.fromAd
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  mounted() {
    this.fetchUserInfo()
    this.fetchUserMessageInfo()
    this.fetchServerPasswordInfo()
  },
  methods: {
    async fetchUserInfo() {
      await getUserInfo(this.userId)
        .then((userProfile) => {
          this.fromAd = userProfile.from_ad
          this.userProfileForm.userName = userProfile.name
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
@import 'src/styles/theme/variables.scss';
/* To make el-tab content fill space, or table will not expand */
::v-deep .el-tabs__content {
  height: 100%;
}

::v-deep .el-tab-pane {
  height: 100%;
}
::v-deep .el-tabs__nav-wrap::after {
  background-color: none;
}
::v-deep .el-tabs__item {
  &:hover {
    color: $linkTextColor;
  }
  &.is-active{
    color: $linkTextColor !important;
  }
}

::v-deep .el-tabs__active-bar {
  background-color: $linkTextColor;
}

::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: $linkTextColor;
  border-color: $linkTextColor;
}

::v-deep .el-radio.is-bordered.is-checked {
  border-color: $linkTextColor;
}

::v-deep .el-radio__input.is-checked .el-radio__inner {
  background-color: $linkTextColor;
  border-color: $linkTextColor;
}

::v-deep .el-radio__input.is-checked+.el-radio__label {
  color: $linkTextColor;
}

::v-deep .el-radio__inner:hover {
  border-color: $linkTextColor;
}
.mobile {
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
  ::v-deep .el-tabs__item{
    padding: 0 12px !important;
    height: 50px;
  }
}

</style>
