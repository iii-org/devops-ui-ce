<template>
  <el-dialog
    :visible.sync="issueMatrixDialog.visible"
    :close-on-click-modal="false"
    :title="getTitle"
    width="80%"
    top="20px"
    append-to-body
    destroy-on-close
  >
    <IssueMatrix
      v-if="issueMatrixDialog.visible"
      :row.sync="issueMatrixDialog.row"
      @update-issue="onUpdateIssue"
      @onCloseIssueMatrix="onCloseIssueMatrix"
    />
  </el-dialog>
</template>

<script>
export default {
  name: 'WBSIssueMatrixDialog',
  props: {
    issueMatrixDialog: {
      type: Object,
      default: () => ({
        visible: false,
        row: {
          id: null,
          name: null
        }
      })
    }
  },
  components: {
    IssueMatrix: () => import('@/views/Project/IssueDetail/components/IssueMatrix')
  },
  computed: {
    getTitle() {
      const matrixTitle = this.$t('Issue.TraceabilityMatrix')
      const { id, name } = this.issueMatrixDialog.row
      return `${matrixTitle}(#${id}-${name})`
    }
  },
  methods: {
    onUpdateIssue() {
      this.$emit('onUpdateIssue')
    },
    onCloseIssueMatrix() {
      this.$emit('onCloseIssueMatrix')
    }
  }
}
</script>
