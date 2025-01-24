<template>
  <el-dialog
    :close-on-click-modal="false"
    :title="$t('general.Delete')"
    :visible.sync="deleteWarningDialog.visible"
    append-to-body
    top="20vh"
    width="30%"
  >
    <div class="flex items-center">
      <div>
        <em class="el-icon-circle-close text-danger mr-3"></em>
      </div>
      <div class="flex-col">
        <template v-if="relatedIssues.length > 0">
          <div class="tracking-wide leading-6">
            {{ $t('Issue.ConfirmDeleteIssueWithSub') }}
          </div>
          <div>
            <ul>
              <template v-for="issue in relatedIssues">
                <li :key="issue.id">
                  <span>#{{ issue.id }} - </span>
                  <span v-if="issue.tags.length > 0">
                    <el-tag
                      v-for="tag in issue.tags"
                      :key="tag.id"
                      class="mr-1"
                      type="mini"
                    >
                      {{ tag.name }}
                    </el-tag>
                  </span>
                  <span>{{ issue.subject }}</span>
                  <span> ({{ getAssignedToDisplay(issue.assigned) }}) </span>
                </li>
              </template>
            </ul>
          </div>
        </template>
        <template v-else>
          <div class="tracking-wide leading-6">
            {{ $t('Issue.ConfirmDeleteIssue', { issueName: row.subject }) }}
          </div>
        </template>
      </div>
    </div>
    <div slot="footer">
      <el-button size="small" @click="handleClickCancel">
        {{ $t('general.Cancel') }}
      </el-button>
      <el-button size="small" type="danger" @click="handleClickDelete">
        {{ $t('general.Delete') }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'WBSDeleteWarningDialog',
  props: {
    deleteWarningDialog: {
      type: Object,
      default: () => ({
        visible: false,
        row: {},
        relatedIssues: []
      })
    }
  },
  computed: {
    row() {
      return this.deleteWarningDialog.row
    },
    relatedIssues() {
      return this.deleteWarningDialog.relatedIssues
    }
  },
  methods: {
    getAssignedToDisplay(assignedTo) {
      if (!assignedTo) return '-'
      const { name, login } = assignedTo
      return `${this.$t(`Issue.assigned`)}: ${name} - ${login}`
    },
    handleClickCancel() {
      this.$emit('onCloseDeleteWarning')
    },
    handleClickDelete() {
      this.$emit('onCloseDeleteWarning')
      this.relatedIssues.length > 0
        ? this.$emit('onRemoveIssue', this.row, true)
        : this.$emit('onRemoveIssue', this.row, false, true)
    }
  }
}
</script>
