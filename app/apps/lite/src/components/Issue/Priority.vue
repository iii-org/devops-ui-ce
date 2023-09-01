<template>
  <el-tag
    v-if="!icon"
    :type="getPriorityTagType(type)"
    :size="size"
  >
    {{ name }}
  </el-tag>
  <el-tooltip
    v-else
    :content="name"
    placement="bottom"
  >
    <em :class="getPriorityIconType(type)" class="icon" />
  </el-tooltip>
</template>

<script>
export default {
  name: 'Priority',
  props: {
    name: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    icon: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    getPriorityTagType(priority) {
      switch (priority) {
        case 'Immediate':
          return 'danger'
        case 'High':
          return 'warning'
        case 'Normal':
          return ''
        case 'Low':
          return 'info'
      }
    },
    getPriorityIconType(priority) {
      switch (priority) {
        case 'Immediate':
          return 'ri-arrow-up-double-line bg-danger'
        case 'High':
          return 'ri-arrow-up-double-line bg-warning'
        case 'Normal':
          return 'ri-equal-line bg-success'
        case 'Low':
          return 'ri-arrow-down-double-line bg-info'
      }
    }
  }
}
</script>

<style lang="scss" scoped>

.icon {
  @apply rounded text-white text-xs;
  padding: 3px;
}
</style>
