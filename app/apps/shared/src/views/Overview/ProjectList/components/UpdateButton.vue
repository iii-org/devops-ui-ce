<template>
  <el-button
    :loading="listLoading"
    icon="el-icon-refresh"
    plain
    size="small"
    type="primary"
    @click="updateProjectList"
  >
    {{ $t('Dashboard.ADMIN.UpdateNow') }}
  </el-button>
</template>

<script>
export default {
  name: 'UpdateButton',
  props: {
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    updateProjectList() {
      this.$emit('update')
    }
  }
}
</script>
