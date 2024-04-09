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
      :tags="tags"
      :element-ids="elementIds"
      :project-id="projectId"
      :custom-sort="customSort"
      filter-type="issue_board"
      @getRelativeList="getRelativeList"
      @updateIssueList="updateIssueList"
      @loadData="loadData"
    />
    <el-dialog
      :title="$t('general.Add') + $t('Issue.CustomBoard')"
      :visible.sync="customBoardDialogVisible"
      :close-on-click-modal="false"
      :before-close="closeCustomBoardDialog"
      top="3vh"
      append-to-body
      destroy-on-close
    >
      <div style="max-height: 25vh; overflow: auto;">
        <CustomItem
          v-loading="isLoading"
          v-for="(boardObject, index) in customValueOnBoard"
          :key="boardObject.id"
          :order="index"
          :board-object.sync="boardObject"
          :custom-value-on-board="customValueOnBoard"
          class="mb-3"
        />
      </div>
      <el-link
        icon="ri-add-line"
        type="primary"
        @click="addCustomBoard"
      >
        看板標題
      </el-link>
      <el-row slot="footer">
        <el-col
          :lg="16"
          :md="14"
          :sm="12"
          :xs="10"
        >
          <el-input
            v-model="boardName"
            placeholder="看板名稱"
          />
        </el-col>
        <el-col
          :lg="8"
          :md="10"
          :sm="12"
          :xs="14"
        >
          <el-button
            :loading="isLoading"
            class="buttonSecondaryReverse"
            @click="closeCustomBoardDialog"
          >
            {{ $t('general.Cancel') }}
          </el-button>
          <el-button
            :loading="isLoading"
            class="buttonPrimary"
            @click="confirmCustomBoardDialog"
          >
            {{ $t('general.Confirm') }}
          </el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
import Boards from '@shared/views/Project/IssueBoards/components/Boards'
import CustomItem from '@shared/views/Project/IssueBoards/components/CustomItem'

export default {
  name: 'IssueBoards',
  components: {
    Boards,
    CustomItem
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
    },
    customBoardDialogVisible: {
      type: Boolean,
      default: false
    },
    customSort: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // isLoading: false
      customValueOnBoard: [],
      boardName: ''
    }
  },
  methods: {
    addCustomBoard() {
      this.customValueOnBoard.push({
        id: null,
        name: '',
        color: '#409EFF'
      })
    },
    closeCustomBoardDialog() {
      this.$emit('update:customBoardDialogVisible', false)
      this.customValueOnBoard.length = 0
    },
    confirmCustomBoardDialog() {
      this.$emit('addCustomOption', this.boardName)
      this.$emit('addCustomBoard', this.customValueOnBoard)
      this.$emit('update:customBoardDialogVisible', false)
      this.customValueOnBoard.length = 0
    },
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
