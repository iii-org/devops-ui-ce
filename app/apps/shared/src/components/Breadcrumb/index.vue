<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <TransitionGroup name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <span
          v-if="
            item.redirect === 'noRedirect' || index === levelList.length - 1
          "
          class="no-redirect"
        >
          {{ generateTitle(item.meta.title) }}
        </span>
        <a v-else @click.prevent="handleLink(item)">
          {{ generateTitle(item.meta.title) }}
        </a>
      </el-breadcrumb-item>
    </TransitionGroup>
  </el-breadcrumb>
</template>

<script>
import { pathToRegexp } from 'path-to-regexp'
import { generateTitle } from '@shared/utils/i18n'

export default {
  data() {
    return {
      levelList: null
    }
  },
  watch: {
    $route() {
      this.getBreadcrumb()
    }
  },
  created() {
    this.getBreadcrumb()
  },
  methods: {
    generateTitle,
    getBreadcrumb() {
      // only show routes with meta.title
      const matched = this.$route.matched.filter(
        (item) => item.meta && item.meta.title
      )
      this.levelList = matched.filter(
        (item) => item.meta && item.meta.title && item.meta.breadcrumb !== false
      )
    },
    isDashboard(route) {
      const name = route && route.name
      if (!name) {
        return false
      }
      return name.trim().toLocaleLowerCase() === 'Dashboard'.toLocaleLowerCase()
    },
    pathCompile(path) {
      // To solve this problem https://github.com/PanJiaChen/vue-element-admin/issues/561
      const { params } = this.$route
      const toPath = pathToRegexp.compile(path)
      return toPath(params)
    },
    handleLink(item) {
      const { redirect, path } = item
      if (redirect) {
        this.$router.push(redirect)
        return
      }
      this.$router.push(this.pathCompile(path))
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;

  .el-breadcrumb__inner a {
    color: $breadcrumpText;

    &:hover {
      color: $breadcrumpTextHover;
    }
  }

  .no-redirect {
    color: $primary;
    font-weight: 600;
  }
}
</style>
