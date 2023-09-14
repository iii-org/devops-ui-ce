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
@import 'src/styles/theme/mixin.scss';

$tag-options: (
  active: $active,
  assigned: $assigned,
  closed: $closed,
  inProgress: $inProgress,
  solved: $solved,
  verified: $verified
);

@each $key, $value in $tag-options {
  .el-tag--#{$key} {
    @include background-border-color($value, $value);
  }
}
</style>
