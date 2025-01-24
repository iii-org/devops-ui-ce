<template>
  <div class="limiter">
    <div class="container-login">
      <div class="wrap-login">
        <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          auto-complete="on"
          class="login-form"
          label-position="left"
        >
          <div class="login-form-title">
            <img :src="logo" alt="" class="sidebar-logo" />
            <span :class="isLite ? 'lite' : ''" class="align-middle">{{ defaultSettings.title }}</span>
          </div>
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :name="$t('general.Account')"
              :placeholder="$t('general.Account')"
              auto-complete="on"
              prefix-icon="el-icon-user"
              tabindex="1"
              type="text"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              :placeholder="$t('general.Password')"
              auto-complete="on"
              name="password"
              prefix-icon="el-icon-lock"
              show-password
              tabindex="2"
              @keyup.enter.native="handleLogin"
            />
          </el-form-item>
          <el-button :loading="loading" class="w-full login-btn my-3" @click.native.prevent="handleLogin">
            {{ $t('general.Login') }}
          </el-button>
        </el-form>
        <div class="login-more"></div>
      </div>
    </div>
  </div>
</template>

<script>
import defaultSettings from '@/settings'
import logoDark from '@/assets/logo.png'

export default {
  name: 'Login',
  data() {
    const validatePassword = (rule, value, callback) => {
      if (value.length < 8) {
        callback(new Error(this.$t('RuleMsg.PasswordLimit')))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [
          {
            required: true,
            trigger: 'blur',
            message: this.$t('general.PleaseInput') + ' ' + this.$t('general.Account')
          }
        ],
        password: [
          {
            required: true,
            trigger: 'blur',
            validator: validatePassword
          }
        ]
      },
      loading: false,
      redirect: undefined,
      defaultSettings
    }
  },
  computed: {
    isLite() {
      return this.defaultSettings.type === 'LITE'
    },
    logo() {
      const externalLogo = import.meta.env.VITE_APP_LOGO_DARK
      return externalLogo && String(externalLogo) !== '' ? externalLogo : logoDark
    }
  },
  watch: {
    $route: {
      handler: function (route) {
        this.redirect = route?.query?.redirect
      },
      immediate: true
    }
  },
  mounted() {
    const bgImage = import.meta.env.VITE_APP_LOGIN_BG
    if (bgImage && String(bgImage) !== '') {
      document.querySelector('.login-more').style.backgroundImage = `url(${bgImage})`
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (!valid) return
        this.loading = true
        this.$store
          .dispatch('user/login', this.loginForm)
          .then(async () => {
            await this.$store.dispatch('user/getInfo')
            this.$router.push({ path: this.redirect || '/' })
          })
          .catch((e) => {
            console.error(e)
            if (e.message === 'Request failed with status code 401') {
              console.error(e)
            }
            this.loading = false
          })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
@import 'src/styles/theme/mixin.scss';

$bg: $loginBackground;
$dark_gray: #889aa4;
$light_gray: #eee;

.container-login {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  background: #f2f2f2;

  .wrap-login {
    width: 100%;
    background: #fff;
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    flex-direction: row-reverse;

    .login-form {
      width: 520px;
      min-height: 100vh;
      display: block;
      background-color: #f7f7f7;
      padding: 200px 80px;
      transition: padding 0.2s ease-in-out;

      .login-form-title {
        width: 100%;
        display: block;
        font-size: 30px;
        color: #333;
        line-height: 1.2;
        text-align: center;
        padding-bottom: 43px;

        .sidebar-logo {
          width: 40px;
          height: 40px;
          vertical-align: middle;
        }
      }

      .login-btn {
        background-color: $menuBg !important;
        color: white !important;

        &:hover,
        &:active,
        &:focus {
          @include background-border-color($menuBg, $menuBg);
          color: white !important;
        }
      }
    }

    .login-more {
      @include cover-background;
      width: calc(100% - 520px);
      background: linear-gradient(rgba(150, 150, 150, 0.4), rgba(150, 150, 150, 0.4)), url('../assets/bg-image.jpg');
      position: relative;
      z-index: 1;
      box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    }
  }

  ::v-deep {
    .el-input__inner:focus {
      border: 1px solid #dadada;
      outline: 0;
    }

    .el-input__inner,
    .el-button {
      border-radius: 6px;
      height: 54px;
      font-size: 16px;
    }

    .el-input__inner {
      box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;
      border: 1px solid #eaeaea;
    }

    .el-form-item {
      margin-bottom: 28px;
    }
  }
}

@include tablet {
  ::v-deep {
    .login-form {
      padding: 140px 40px 40px !important;
      width: 100% !important;
    }

    .login-more {
      box-shadow: none;
    }

    .el-input__inner {
      height: 48px !important;
      font-size: 14px !important;
    }
  }
}

.limiter {
  width: 100%;
  margin: 0 auto;
}

.lite {
  font-family: 'Poiret One', cursive !important;
  font-weight: bold;
  color: $primary;
}

::v-deep {
  input,
  textarea,
  select {
    &:-webkit-autofill {
      transition: background-color 5000s ease-in-out 0s;
      -webkit-text-fill-color: $primary;
      -webkit-font-feature-settings: 16px;
      font-size: 16px !important;
    }
  }
}
</style>
