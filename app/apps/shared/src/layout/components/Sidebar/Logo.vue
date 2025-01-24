<template>
  <div :class="{ collapse: collapse }" class="sidebar-logo-container">
    <transition name="sidebarLogoFade">
      <router-link
        v-if="collapse"
        key="collapse"
        class="sidebar-logo-link"
        to="/"
      >
        <img :src="logo" alt="" class="sidebar-logo" />
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <div>
          <img :src="logo" alt="" class="sidebar-logo" />
        </div>
        <div>
          <h1 :class="isLite ? 'lite' : ''" class="sidebar-title">
            {{ defaultSettings.title }}
          </h1>
        </div>
      </router-link>
    </transition>
  </div>
</template>

<script>
import defaultSettings from '@/settings'
import logoLight from '../../../assets/logo_2.png'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      defaultSettings
      // logo: 'https://wpimg.wallstcn.com/69a1c46c-eb1c-4b46-8bd4-e9e686ef5251.png'
    }
  },
  computed: {
    isLite() {
      return this.defaultSettings.type === 'LITE'
    },
    logo() {
      const externalLogo = import.meta.env.VITE_APP_LOGO_LIGHT
      return externalLogo && String(externalLogo) !== ''
        ? externalLogo
        : logoLight
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 90px;
  // line-height: 40px;
  background: $sideBarTitleBg;
  text-align: center;
  padding: 14px 12px;
  overflow: hidden;
  //margin-bottom: 10px;
  border-radius: 0 0 15px 15px;
  box-shadow: rgba(0, 0, 0, 0.5) 0px 3px 8px;
  z-index: 1;
  transition: height 0.3s;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;

    & .sidebar-logo {
      width: 30px;
      height: 30px;
      vertical-align: middle;
      // margin-right: 12px;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #e9e9e9;
      font-weight: 100;
      line-height: 34px;
      font-size: 16px;
      vertical-align: middle;
      font-family: 'Audiowide', cursive;
    }
  }

  &.collapse {
    height: 60px;
    visibility: visible !important;

    .sidebar-logo {
      margin-right: 0px;
    }
  }
}

.lite {
  font-family: 'Poiret One', cursive !important;
  font-weight: 600 !important;
}
</style>
