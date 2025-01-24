<template>
  <div @mouseenter="handleMouseenter" @mouseleave="handleMouseleave">
    <el-tooltip
      :content="title"
      :disabled="icon === '' || disableTooltip || !isCollapse"
      effect="dark"
      placement="right"
    >
      <em
        v-if="icon !== ''"
        :class="isLogoActive ? `is-logo-active ${icon}` : `${icon}`"
        :style="isCollapse && { 'margin-left': '16px' }"
        class="sub-el-icon text-xl mr-2"
      ></em>
    </el-tooltip>
    <span :class="!hasChildren && isMouseenter && !isCollapse && 'hover-color'">
      {{ title }}
    </span>
    <transition name="fade">
      <template v-if="!hasChildren && isMouseenter">
        <em
          v-if="!isPin"
          class="ri-pushpin-fill float-right icon"
          @click.prevent.stop="handleAddPinnedRoute"
        ></em>
        <em
          v-else
          class="ri-unpin-fill float-right icon"
          @click.prevent.stop="handleRemovePinnedRoute"
        ></em>
      </template>
    </transition>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'MenuItem',
  props: {
    icon: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    },
    hasChildren: {
      type: Boolean,
      default: false
    },
    disableTooltip: {
      type: Boolean,
      default: false
    },
    isLogoActive: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isMouseenter: false,
      timer: null
    }
  },
  computed: {
    ...mapGetters(['pinnedRoutes', 'sidebar']),
    isPin() {
      return (
        this.pinnedRoutes.findIndex((route) => route.name === this.name) >= 0
      )
    },
    isCollapse() {
      return !this.sidebar.opened
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timer)
  },
  methods: {
    handleMouseenter() {
      if (this.isCollapse) return
      this.timer = window.setTimeout(() => {
        this.isMouseenter = true
      }, 500)
    },
    handleMouseleave() {
      if (this.isCollapse) return
      clearTimeout(this.timer)
      this.isMouseenter = false
    },
    handleAddPinnedRoute() {
      this.$emit('onAddPinnedRoute')
    },
    handleRemovePinnedRoute() {
      this.$emit('onRemovePinnedRoute')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.sub-el-icon {
  color: currentColor;
  width: 1em !important;
  height: 1em !important;
}

.hover-color {
  color: $warning !important;
}

.icon {
  color: $warning !important;
  font-size: 16px;
}

.is-logo-active {
  color: $menuActiveText !important;
  font-weight: bold;
}
</style>
