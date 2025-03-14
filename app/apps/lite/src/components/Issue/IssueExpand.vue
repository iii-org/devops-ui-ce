<template>
  <el-row
    v-if="issue.has_family || family"
    :class="device === 'mobile' ? 'mobile' : 'px-2'"
  >
    <el-skeleton
      v-if="issue.hasOwnProperty('isLoadingFamily') && issue.isLoadingFamily"
      class="p-5"
    />
    <ul v-else class="family">
      <li v-if="issue.parent && Object.keys(issue.parent).length > 0">
        <span class="title">{{ $t('Issue.ParentIssue') }}:</span>
        <ul class="issue-list">
          <li class="issue-item">
            <IssueRow
              :is-button-disabled="isButtonDisabled"
              :is-parent="true"
              :issue="issue.parent"
              :reload="reload"
              @click-title="handleEdit"
              @show-context-menu="handleContextMenu(issue.parent, '', $event)"
              @remove-confirm="removeIssueRelation"
            />
          </li>
        </ul>
      </li>
      <li v-if="issue.children && issue.children.length > 0">
        <span class="title">{{ $t('Issue.ChildrenIssue') }}:</span>
        <ol class="issue-list">
          <template v-for="child in issue.children">
            <li
              v-if="Object.keys(child).length > 0"
              :key="child.id"
              class="issue-item"
            >
              <IssueRow
                :is-button-disabled="isButtonDisabled"
                :issue="child"
                :reload="reload"
                @click-title="handleEdit"
                @show-context-menu="handleContextMenu(child, '', $event)"
                @remove-confirm="removeIssueRelation"
              />
            </li>
          </template>
        </ol>
      </li>
      <li v-if="issue.relations && issue.relations.length > 0">
        <span class="title">{{ $t('Issue.RelatedIssue') }}:</span>
        <ol class="issue-list">
          <template v-for="child in issue.relations">
            <li
              v-if="Object.keys(child).length > 0"
              :key="child.id"
              class="issue-item"
            >
              <IssueRow
                :is-button-disabled="isButtonDisabled"
                :issue="child"
                :reload="reload"
                @click-title="handleEdit"
                @show-context-menu="handleContextMenu(child, '', $event)"
                @remove-confirm="removeRelationIssue"
              />
            </li>
          </template>
        </ol>
      </li>
    </ul>
    <slot></slot>
  </el-row>
</template>

<script>
import { deleteIssueRelation, updateIssue } from '@/api_v3/issues'
import IssueRow from './components/IssueRow'
import { mapGetters } from 'vuex'

export default {
  name: 'IssueExpand',
  components: { IssueRow },
  props: {
    issue: {
      type: Object,
      default: () => ({})
    },
    popup: {
      type: Boolean,
      default: false
    },
    family: {
      type: Boolean,
      default: false
    },
    reload: {
      type: [String, Number],
      default: 0
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(['device'])
  },
  methods: {
    async removeIssueRelation(issue) {
      const { issueData, isParent } = issue
      this.listLoading = true
      try {
        const sendData = { parent_id: null }
        if (isParent) {
          await updateIssue(this.issue.id || this.issue.issueId, sendData)
        } else {
          await updateIssue(issueData.id, sendData)
        }
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        this.loadData()
      } catch (err) {
        console.error(err)
      }
      this.listLoading = false
    },
    async removeRelationIssue(issue) {
      const { issueData } = issue
      this.listLoading = true
      try {
        await deleteIssueRelation(issueData.relation_id)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        this.loadData()
      } catch (err) {
        console.error(err)
      }
      this.listLoading = false
    },
    loadData() {
      this.$emit('update', this.issue.id)
    },
    handleEdit(issueId) {
      if (!this.popup) {
        this.$router.push({ name: 'IssueDetail', params: { issueId }})
      } else {
        this.$emit('popup-dialog', issueId)
      }
    },
    handleContextMenu(row, column, event) {
      this.$emit('on-context-menu', { row, column, event })
    }
  }
}
</script>

<style lang="scss" scoped>
.family {
  @apply space-y-3;
  .title {
    @apply text-sm font-bold;
  }

  .issue-list {
    @apply space-y-1;
    .issue-item:hover {
      @apply bg-gray-100 text-primary font-bold rounded;
      ::v-deep.el-tag {
        @apply font-normal;
      }
    }
  }
}

.mobile {
  ul,
  ol {
    padding-left: 24px;
  }

  ::v-deep .el-button--mini,
  .el-button--mini.is-round {
    padding: 7px;
  }
}
</style>
