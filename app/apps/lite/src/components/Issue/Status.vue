<template>
  <el-tooltip
    :disabled="!tooltip"
    :content="name"
    placement="bottom"
  >
    <el-tag
      :type="getStatusTagType(type)"
      class="rounded-xl font-bold"
      effect="dark"
      :size="size"
    >
      {{ !tooltip ? name : name.charAt(0) }}
    </el-tag>
  </el-tooltip>
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
    },
    tooltip: {
      type: Boolean,
      default: false
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
  active: ($active white),
  assigned: ($assigned white),
  closed: ($closed white),
  inProgress: ($inProgress #525252),
  solved: ($solved #525252),
  verified: ($verified white)
);

@each $key, $value in $tag-options {
  .el-tag--#{$key} {
    @include background-border-color(nth($value, 1), nth($value, 1));
    color: nth($value, 2);
  }
}
</style>
