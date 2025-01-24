<template>
  <div v-if="!item.hidden">
    <template
      v-if="
        hasOneShowingChild(item, item.children) &&
          (!onlyOneChild.children || onlyOneChild.noShowingChildren) &&
          !item.alwaysShow
      "
    >
      <AppLink
        v-if="onlyOneChild.meta"
        :name="onlyOneChild.name"
        :to="resolvePath(onlyOneChild.path)"
      >
        <el-menu-item
          :class="{ 'submenu-title-noDropdown': !isNest }"
          :index="resolvePath(onlyOneChild.path)"
        >
          <Item
            :disable-tooltip="isNest"
            :has-children="hasChildren"
            :icon="onlyOneChild.meta.icon || (item.meta && item.meta.icon)"
            :name="item.name"
            :title="generateTitle(onlyOneChild.meta.title)"
            @onAddPinnedRoute="handleAddPinnedRoute"
            @onRemovePinnedRoute="handleRemovePinnedRoute"
          />
        </el-menu-item>
      </AppLink>
    </template>
    <el-submenu
      v-else
      ref="subMenu"
      :index="resolvePath(item.path)"
      popper-append-to-body
    >
      <template slot="title">
        <Item
          v-if="item.meta"
          :disable-tooltip="true"
          :has-children="hasChildren"
          :icon="item.meta && item.meta.icon"
          :is-logo-active="isLogoActive"
          :name="item.name"
          :title="generateTitle(item.meta.title)"
        />
      </template>
      <SidebarItem
        v-for="child in item.children"
        :key="child.path"
        :base-path="resolvePath(child.path)"
        :is-nest="true"
        :item="child"
        class="nest-menu"
      />
    </el-submenu>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Item from './Item'
import AppLink from './Link'
import FixiOSBug from './FixiOSBug'
import { isExternal } from '@shared/utils/validate'
import { generateTitle } from '@shared/utils/i18n'

export default {
  name: 'SidebarItem',
  components: { Item, AppLink },
  mixins: [FixiOSBug],
  props: {
    // route object
    item: {
      type: Object,
      required: true
    },
    isNest: {
      type: Boolean,
      default: false
    },
    basePath: {
      type: String,
      default: ''
    },
    parentMenu: {
      type: String,
      default: ''
    },
    isCollapse: {
      type: Boolean,
      default: false
    }
  },
  data() {
    // To fix https://github.com/PanJiaChen/vue-admin-template/issues/237
    // TODO: refactor with render function
    this.onlyOneChild = null
    return {}
  },
  computed: {
    ...mapGetters(['pinnedRoutes', 'userId', 'userRole']),
    isLite() {
      return import.meta.env.VUE_APP_PROJECT === 'LITE'
    },
    hasChildren() {
      return (
        this.getWhiteList().findIndex((item) => item === this.item.name) >= 0
      )
    },
    active() {
      return this.$refs
    },
    isLogoActive() {
      const splitPath = this.item.path.split('/')
      return splitPath[1] === this.parentMenu && this.isCollapse
    }
  },
  methods: {
    ...mapActions('user', ['setPinnedRoutes']),
    generateTitle,
    getWhiteList() {
      if (this.isLite) {
        switch (this.userRole) {
          case 'sysadmin':
          case 'Organization Owner':
            return ['Overviews', 'Works', 'Progress', 'Admin']
          case 'Project Manager':
            return ['Works', 'Progress']
        }
      } else {
        switch (this.userRole) {
          case 'sysadmin':
          case 'Organization Owner':
            return [
              'OverviewParent',
              'Management',
              'Works',
              'Progress',
              'Test',
              'Scan',
              'SystemResource',
              'Activities',
              'Admin'
            ]
          case 'QA':
            return ['DashboardParent', 'Works', 'Scan']
          default:
            // PM & RD
            return ['Management', 'Progress', 'Scan', 'Activities']
        }
      }
    },
    hasOneShowingChild(parent, children = []) {
      const showingChildren = children.filter((item) => {
        if (item.hidden) {
          return false
        } else {
          // Temp set(will be used if only has one showing child)
          this.onlyOneChild = item
          return true
        }
      })

      // When there is only one child router, the child router is displayed by default
      if (showingChildren.length === 1) {
        return true
      }

      // Show parent if there are no child router to display
      if (showingChildren.length === 0) {
        this.onlyOneChild = { ...parent, path: '', noShowingChildren: true }
        return true
      }

      return false
    },
    resolvePath(routePath) {
      const projectName = this.$store.getters.selectedProject.name || ''
      const pathWithProjectName = routePath.replace(
        ':projectName?',
        projectName
      )
      const basePathWithProjectName = this.basePath.replace(
        ':projectName?',
        projectName
      )
      if (isExternal(pathWithProjectName)) {
        return routePath
      }
      if (isExternal(basePathWithProjectName)) {
        return basePathWithProjectName
      }
      const separator = basePathWithProjectName.endsWith('/') ? '' : '/'
      return `${basePathWithProjectName}${separator}${routePath}`
    },
    handleAddPinnedRoute() {
      const { name, meta } = this.item
      let { children } = this.item
      children = children?.map((child) => {
        delete child.component
        return child
      })
      const route = {
        name,
        children,
        meta: {
          roles: meta?.roles,
          title: meta?.title
        }
      }
      if (this.pinnedRoutes?.length > 0) {
        this.pinnedRoutes.push(route)
        this.setPinnedRoutes({
          user_id: this.userId,
          route: this.pinnedRoutes
        })
      } else {
        this.setPinnedRoutes({
          user_id: this.userId,
          route: [route]
        })
      }
    },
    handleRemovePinnedRoute() {
      const index = this.pinnedRoutes.findIndex(
        (route) => route.name === this.item.name
      )
      this.setPinnedRoutes({
        user_id: this.userId,
        route: this.pinnedRoutes.toSpliced(index, 1)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.nest-menu {
  ::v-deep li {
    div:before {
      position: relative;
      left: -6px;
      content: '\25C9';
      font-size: 8px;
    }
  }
}
</style>
