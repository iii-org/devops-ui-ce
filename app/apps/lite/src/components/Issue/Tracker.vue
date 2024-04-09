<template>
  <span>
    <el-tooltip
      :disabled="!isHideName"
      :content="name"
      placement="bottom"
    >
      <em v-if="name" :class="mapTagType(type)" class="point"></em>
    </el-tooltip>
    <span v-if="!isHideName" class="break-normal">{{ name }}</span>
  </span>
</template>

<script>
export default {
  name: 'Tracker',
  props: {
    name: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    isHideName: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    mapTagType(category) {
      const map = {
        Document: 'ri-file-fill bg-document',
        Research: 'bg-research',
        Epic: 'ri-flashlight-fill bg-epic',
        Audit: 'ri-bookmark-2-fill bg-audit',
        Feature: 'ri-lightbulb-fill bg-feature',
        Bug: 'ri-bug-fill bg-bug',
        Issue: 'ri-circle-fill bg-issue',
        'Change Request': 'ri-repeat-2-fill bg-changeRequest',
        Risk: 'ri-close-circle-line bg-risk',
        'Test Plan': 'ri-check-double-fill bg-testPlan',
        'Fail Management': 'ri-alert-line bg-failManagement'
      }
      return map[category] || 'bg-feature'
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

.point {
  @apply mr-1 rounded text-white;
  padding: 3px;
  aspect-ratio: 1 / 1;
  width: 100%;
  max-height: 100%;
}
</style>
