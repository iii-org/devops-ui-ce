<template>
  <div :class="{ 'has-logo': showLogo }">
    <Logo
      v-if="showLogo"
      :collapse="isCollapse"
    />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <template v-if="pinnedRoutes?.length > 0">
        <el-menu
          ref="pinned-menu"
          :default-active="activeMenu"
          :collapse="isCollapse"
          :default-openeds="['pinned']"
          :background-color="variables.menuBg"
          :text-color="variables.menuText"
          :active-text-color="variables.menuActiveText"
          mode="vertical"
        >
          <el-submenu
            index="pinned"
            popper-append-to-body
          >
            <template slot="title">
              <em
                class="ri-pushpin-fill sub-el-icon text-xl"
                style="margin-right: 12px"
              ></em>
              <span>Pinned</span>
            </template>
            <SidebarItem
              v-for="route in pinnedRoutes"
              :key="route.path"
              :item="route"
              :base-path="route.path"
              class="pinned-menu"
            />
          </el-submenu>
        </el-menu>
        <el-divider />
      </template>
      <el-menu
        ref="menu"
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
        unique-opened
        mode="vertical"
      >
        <SidebarItem
          v-for="route in permission_routes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
          :is-collapse="isCollapse"
          :parent-menu="parentMenu"
        />
        <li class="block-menu cursor-default"></li>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/styles/theme/variables.module.scss'

export default {
  components: { SidebarItem, Logo },
  computed: {
    ...mapGetters(['permission_routes', 'pinnedRoutes', 'sidebar']),
    routes() {
      return this.$router.options.routes
    },
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    parentMenu() {
      return this.activeMenu.split('/')[1]
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo
    },
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    }
  },
  watch: {
    $route(to, from) {
      setTimeout(() => {
        let page = ''
        const include = Object.keys(this.$refs.menu.submenus).filter((item) => {
          if (item.split('/')[1] === to.path.split('/')[1]) {
            page = item.split('/')[1]
            return true
          }
        })
        this.$refs.menu.activeIndex = to.path
        if (!this.isCollapse && page === 'plan') this.$refs.menu.openedMenus = include
      }, 100)
    }
  }
}
</script>

<style lang="scss" scoped>
.sub-el-icon {
  color: currentColor;
  width: 1em !important;
  height: 1em !important;
}
.pinned-menu {
  ::v-deep li {
    div:before {
      position: relative;
      left: -6px;
      content: '\25C9';
      font-size: 8px;
    }
  }
}
.block-menu {
  height: 56px;
  line-height: 56px;
  list-style: none;
}
</style>
