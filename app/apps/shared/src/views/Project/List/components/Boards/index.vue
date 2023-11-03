<template>
  <div
    v-loading="isLoading"
    :element-loading-text="$t('Loading')"
  >
    <Boards
      :group-by="groupBy"
      :display-closed="displayClosed"
      :filter-options="filterOptions"
      :context-options="contextOptions"
      :relative-issue-list="relativeIssueList"
      :classify-issue-list="classifyIssueList"
      :project-issue-list="projectIssueList"
      :fixed_version="fixedVersion"
      :assigned_to="assignedTo"
      :element-ids="elementIds"
      :project-id="projectId"
      filter-type="issue_board"
      @getRelativeList="getRelativeList"
      @updateIssueList="updateIssueList"
      @loadData="loadData"
    />
  </div>
</template>

<script>
import Boards from '@shared/views/Project/IssueBoards/components/Boards'

export default {
  name: 'IssueBoards',
  components: {
    Boards
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    groupBy: {
      type: Object,
      default: () => ({
        dimension: 'status',
        value: []
      })
    },
    displayClosed: {
      type: Boolean,
      default: false
    },
    filterOptions: {
      type: Array,
      default: () => []
    },
    filterValue: {
      type: Object,
      default: () => ({})
    },
    fixedVersion: {
      type: Object,
      default: () => ({})
    },
    assignedTo: {
      type: Object,
      default: () => ({})
    },
    keyword: {
      type: String,
      default: null
    },
    tags: {
      type: Array,
      default: () => []
    },
    projectId: {
      type: [Number, String],
      default: null
    },
    elementIds: {
      type: Array,
      default: () => []
    },
    projectIssueList: {
      type: Array,
      default: () => []
    },
    classifyIssueList: {
      type: Object,
      default: () => ({})
    },
    relativeIssueList: {
      type: Array,
      default: () => []
    },
    contextOptions: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      // isLoading: false
    }
  },
  methods: {
    async getRelativeList() {
      this.$emit('getRelativeList')
    },
    updateIssueList(index, issue) {
      this.$emit('updateIssueList', { index, issue })
    },
    loadData() {
      this.$emit('loadData')
    },
    reloadPage() {
      window.location.reload()
    }
  }
}
</script>
