<template>
  <div class="navbar" :class="isMobile ? 'mobile' : ''">
    <hamburger
      :is-active="sidebar.opened"
      class="hamburger-container"
      @toggleClick="toggleSideBar"
    />

    <breadcrumb class="breadcrumb-container" />
    <div class="flex right-menu items-center">
      <Notification />
      <lang-select class="right-menu-item hover-effect" />
      <el-dropdown
        class="right-menu-item"
        :class="!isMobile ? 'hover-effect' : ''"
        trigger="click"
        :style="isMobile ? 'cursor: pointer;' : ''"
      >
        <div>
          <el-avatar v-if="isMobile" class="align-middle" :src="userAvatar" :size="32" />
          <span v-else>
            {{ userName }}
            <em class="el-icon-caret-bottom" />
          </span>
        </div>
        <el-dropdown-menu
          slot="dropdown"
          class="user-dropdown"
        >
          <router-link to="/">
            <el-dropdown-item>
              <router-link
                :to="{ name: 'UserProfile' }"
                class="link-text-color"
              >
                <span>{{ $t('navbar.profile') }}</span>
              </router-link>
            </el-dropdown-item>
            <el-dropdown-item>
              <router-link
                :to="{ name: 'SystemVersion' }"
                class="link-text-color"
              >
                <span>{{ $t('navbar.versions') }}</span>
              </router-link>
            </el-dropdown-item>
          </router-link>
          <el-dropdown-item
            id="systemLogoutBtn"
            divided
            @click.native="logout"
          >
            <span style="display:block;">{{ $t('navbar.logOut') }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { Breadcrumb, Hamburger, LangSelect } from '@shared/components'
import Notification from '@/components/Notification'

export default {
  components: {
    Breadcrumb,
    Hamburger,
    LangSelect,
    Notification
  },
  computed: {
    ...mapGetters(['sidebar', 'userName', 'userAvatar', 'device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push('/login?redirect=/')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: $navbarBg;  /* theme_discussion navbar background*/
  box-shadow: rgba(0, 0, 0, 0.01) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px;
  z-index: 1;

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: $navbarHover;
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 7px;
      height: 100%;
      font-size: 18px;
      color: $navbarRightText; /* theme_discussion right font color */
      cursor: pointer;
      &.hover-effect {
        transition: background 0.3s;
      }
      &:hover {
        background: $navbarHover;
        border-radius: 6px;
      }
    }
  }
}
.mobile {
  .navbar {
    display: flex;
  }

  .breadcrumb-container {
    overflow-x: auto;
    overflow-y: hidden;
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .breadcrumb-container::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }

  .breadcrumb-container > ::v-deep span {
    white-space: nowrap;
    display: flex;
  }
  .right-menu {
    margin-left: auto;
  }
}
</style>
