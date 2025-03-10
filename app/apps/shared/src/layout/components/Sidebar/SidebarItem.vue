<template>
  <div v-if="!item.hidden">
    <template v-if="isSingleChild">
      <AppLink
        v-if="onlyOneChild.meta"
        :name="onlyOneChild.name"
        :params="{ projectName: $store.getters.selectedProject.identifier }"
        :to="resolvedPath(onlyOneChild.path)"
      >
        <el-menu-item
          :class="{ 'submenu-title-noDropdown': !isNest }"
          :index="resolvedPath(onlyOneChild.path)"
        >
          <Item
            :disable-tooltip="isNest"
            :has-children="hasChildren"
            :icon="childIcon"
            :name="item.name"
            :title="generateTitle(onlyOneChild.meta.title)"
            @onAddPinnedRoute="addPinnedRoute"
            @onRemovePinnedRoute="removePinnedRoute"
          />
        </el-menu-item>
      </AppLink>
    </template>
    <el-submenu
      v-else
      ref="subMenu"
      :index="resolvedPath(item.path)"
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
        :base-path="resolvedPath(child.path)"
        :is-collapse="isCollapse"
        :is-nest="true"
        :item="child"
        :parent-menu="parentMenu"
        class="nest-menu"
      />
    </el-submenu>
  </div>
</template>

<script>
import { generateTitle } from '@shared/utils/i18n'
import { isExternal } from '@shared/utils/validate'
import { mapActions, mapGetters } from 'vuex'
import FixiOSBug from './FixiOSBug'
import Item from './Item'
import AppLink from './Link'

export default {
  name: 'SidebarItem',
  components: { Item, AppLink },
  mixins: [FixiOSBug],

  props: {
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
    return {}
  },

  computed: {
    ...mapGetters(['pinnedRoutes', 'userId', 'userRole']),
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    onlyOneChild() {
      return this.getOnlyShowingChild(this.item, this.item.children)
    },
    isSingleChild() {
      return (
        this.hasOneShowingChild(this.item.children) &&
        (!this.onlyOneChild.children || this.onlyOneChild.noShowingChildren) &&
        !this.item.alwaysShow
      )
    },
    childIcon() {
      return (
        this.onlyOneChild.meta.icon || (this.item.meta && this.item.meta.icon)
      )
    },
    hasChildren() {
      return this.allowedRoutes.includes(this.item.name)
    },
    allowedRoutes() {
      if (this.isLite) {
        return this.getLiteRoleRoutes(this.userRole)
      }
      return this.getStandardRoleRoutes(this.userRole)
    },
    isLogoActive() {
      const [, firstPathSegment] = this.item.path.split('/')
      return firstPathSegment === this.parentMenu && this.isCollapse
    }
  },

  methods: {
    ...mapActions('user', ['setPinnedRoutes']),
    generateTitle,
    getLiteRoleRoutes(role) {
      switch (role) {
        case 'sysadmin':
        case 'Organization Owner':
          return ['Works', 'Progress', 'Scan', 'Admin']
        case 'Project Manager':
          return ['Works', 'Progress', 'Scan']
        default:
          return []
      }
    },
    getStandardRoleRoutes(role) {
      switch (role) {
        case 'sysadmin':
        case 'Organization Owner':
          return [
            'DashboardParent',
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
        default: // PM & RD
          return ['Management', 'Progress', 'Test', 'Scan', 'Activities']
      }
    },
    getOnlyShowingChild(parent, children = []) {
      const showingChildren = children.filter((item) => !item.hidden)

      // When there is only one child router, return it
      if (showingChildren.length === 1) {
        return showingChildren[0]
      }

      // When no children to show, return parent itself
      if (showingChildren.length === 0) {
        return { ...parent, path: '', noShowingChildren: true }
      }

      // When multiple children, return null (will be handled by el-submenu)
      return { ...parent }
    },
    hasOneShowingChild(children = []) {
      const showingChildren = children.filter((item) => !item.hidden)
      return showingChildren.length <= 1
    },
    resolvedPath(routePath) {
      const projectName = this.$store.getters.selectedProject.identifier || ''

      const normalizedRoutePath = routePath.replace(
        ':projectName?',
        projectName
      )
      const normalizedBasePath = this.basePath.replace(
        ':projectName?',
        projectName
      )

      if (isExternal(normalizedRoutePath)) {
        return routePath
      }
      if (isExternal(normalizedBasePath)) {
        return normalizedBasePath
      }

      const separator = normalizedBasePath.endsWith('/') ? '' : '/'
      return `${normalizedBasePath}${separator}${normalizedRoutePath}`
    },

    addPinnedRoute() {
      const { name, meta, children } = this.item

      const cleanChildren = children?.map((child) => {
        const { component, ...cleanChild } = child
        return cleanChild
      })

      const routeToPin = {
        name,
        children: cleanChildren,
        meta: {
          roles: meta?.roles,
          title: meta?.title
        }
      }

      const updatedRoutes =
        this.pinnedRoutes?.length > 0
          ? [...this.pinnedRoutes, routeToPin]
          : [routeToPin]

      this.setPinnedRoutes({
        user_id: this.userId,
        route: updatedRoutes
      })
    },

    removePinnedRoute() {
      const index = this.pinnedRoutes.findIndex(
        (route) => route.name === this.item.name
      )
      if (index === -1) return

      const updatedRoutes = [...this.pinnedRoutes]
      updatedRoutes.splice(index, 1)

      this.setPinnedRoutes({
        user_id: this.userId,
        route: updatedRoutes
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.nest-menu {
  ::v-deep li {
    div::before {
      position: relative;
      left: -6px;
      content: '\25C9';
      font-size: 8px;
    }
  }
}
</style>
