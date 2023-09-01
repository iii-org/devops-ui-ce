<template>
  <el-tag
    :type="getStatusTagType(type)"
    class="rounded-xl font-bold"
    effect="dark"
    :size="size"
  >
    {{ name }}
  </el-tag>
</template>

<script>
export default {
  name: 'Status',
  props: {
    name: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: null
    }
  },
  methods: {
    getStatusTagType(status) {
      const map = {
        Active: 'active',
        Assigned: 'assigned',
        Closed: 'closed',
        Solved: 'solved',
        InProgress: 'inProgress',
        Finished: 'verified',
        Verified: 'verified',
        Overdued: 'assigned'
      }
      return map[status] || 'active'
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

.el-tag {
  &--active {
    background-color: $active;
    border-color: $active;
  }
  &--assigned {
    background-color: $assigned;
    border-color: $assigned;
  }
  &--closed {
    background-color: $closed;
    border-color: $closed;
  }
  &--inProgress {
    background-color: $inProgress;
    border-color: $inProgress;
  }
  &--solved {
    background-color: $solved;
    border-color: $solved;
  }
  &--verified {
    background-color: $verified;
    border-color: $verified;
  }
  &--inProgress, &--solved {
    color: #5a5c5f;
  }
}
</style>
