<template>
  <div class="app-container" :class="isMobile ? 'mobile' : ''">
    <el-card>
      <el-row
        type="flex"
        align="middle"
        class="my-3"
      >
        <el-col :span="6">
          <el-button
            type="text"
            size="medium"
            icon="el-icon-arrow-left"
            class="text-title link-text-color"
            @click="onBackClick"
          >
            {{ $t('general.Back') }}
          </el-button>
        </el-col>
        <el-col
          :span="12"
          class="text-center"
        >
          <span class="text-xl font-medium">{{ $t('Issue.IssueList') }}：{{ userName }} </span>
        </el-col>
        <el-col
          :span="6"
          class="text-right"
        >
          <el-button
            v-show="!isSearchVisible"
            type="text"
            class="header-text-color"
            icon="el-icon-search"
            @click="showSearchInput"
          >
            {{ $t('general.Search') + (keyword ? ': ' + keyword : '') }}
          </el-button>
          <el-input
            v-show="isSearchVisible"
            ref="inputKeyword"
            v-model="keyword"
            size="small"
            prefix-icon="el-icon-search"
            :placeholder="$t('general.Search') + $t('Issue.name')"
            class="py-1"
            style="width: 210px"
            clearable
            @blur="isSearchVisible = !isSearchVisible"
          />
        </el-col>
      </el-row>
      <div class="flex justify-between items-center mb-2">
        <el-checkbox
          v-model="isCheckedAllIssues"
          class="ml-3"
          :disabled="listData.length < 1"
          @change="handleAllIssuesChange"
        >
          <span>{{ $t('general.SelectAll') }}</span>
        </el-checkbox>
        <div style="text-align: right;">
          <el-button
            size="mini"
            :class="hasCheckedIssues ? 'button-primary-reverse' : ''"
            plain
            :disabled="!hasCheckedIssues"
            @click="onBatchTransferClick"
          >
            {{ `${$t('Issue.batchTransfer')} (${checkedIssueIds.length})` }}
          </el-button>
          <el-button
            size="mini"
            :type="hasCheckedIssues ? 'danger' : ''"
            plain
            :disabled="!hasCheckedIssues"
            @click="onBatchCloseClick"
          >
            {{ `${$t('Issue.batchClose')} (${checkedIssueIds.length})` }}
          </el-button>
        </div>
      </div>
      <el-table
        ref="issueList"
        v-loading="listLoading"
        :data="filteredData"
        fit
        row-key="id"
        :expand-row-keys="expands"
        :tree-props="{ children: 'child' }"
        :row-class-name="getRowClass"
        @row-contextmenu="handleContextMenu"
        @expand-change="getIssueFamilyData"
      >
        <el-table-column
          align="center"
          width="40"
        >
          <template slot="header">
            <el-checkbox
              v-model="isCheckedAllIssuesByPage"
              :disabled="listData.length < 1"
              @change="handleSinglePageChange"
            />
          </template>
          <template slot-scope="scope">
            <el-checkbox
              :value="isCheckedIssue(scope.row)"
              :disabled="!scope.row.is_closable"
              @change="toggleIssue(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column
          type="expand"
          width="30"
        >
          <template slot-scope="scope">
            <IssueExpand
              :issue="scope.row"
              @update="loadData"
              @on-context-menu="onContextMenu"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-if="!isMobile"
          prop="tracker.name"
          :label="$t('general.Type')"
          width="130"
        >
          <template slot-scope="{row}">
            <Tracker
              v-if="row.tracker.name"
              :name="$t(`Issue.${row.tracker.name}`)"
              :type="row.tracker.name"
            />
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('Issue.Id')"
          min-width="175"
          show-overflow-tooltip
          prop="id"
        >
          <template slot-scope="scope">
            <span class="text-success mr-2">#{{ scope.row.id }}</span>
            <el-tag
              v-for="item in scope.row.tags"
              :key="item.id"
              size="mini"
              class="mr-1"
            >[{{ item.name }}]</el-tag>
            {{ scope.row.name }}
          </template>
        </el-table-column>

        <el-table-column
          v-if="!isMobile"
          prop="priority.name"
          :label="$t('Issue.Priority')"
          align="center"
          width="150"
        >
          <template slot-scope="{row}">
            <Priority
              v-if="row.priority.name"
              :name="$t(`Issue.${row.priority.name}`)"
              :type="row.priority.name"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-if="!isMobile"
          prop="status.name"
          :label="$t('general.Status')"
          align="center"
          width="150"
        >
          <template slot-scope="{row}">
            <Status
              v-if="row.status.name"
              :name="$t(`Issue.${row.status.name}`)"
              :type="row.status.name"
            />
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          :label="$t('general.Actions')"
          width="75"
        >
          <template slot-scope="scope">
            <el-tooltip
              placement="bottom"
              :content="$t('general.Transfer')"
            >
              <em
                class="ri-file-transfer-line success table-button"
                @click="onTransferClick(scope.row.id)"
              ></em>
            </el-tooltip>
            <el-tooltip
              placement="bottom"
              :content="$t('general.Close')"
            >
              <span>
                <em
                  class="ri-delete-bin-2-line table-button"
                  :class="!scope.row.is_closable ? 'disabled' : 'danger'"
                  @click="onCloseClick(scope.row)"
                ></em>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        :total="listQuery.total"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :page-sizes="[listQuery.limit]"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
    </el-card>
    <context-menu
      ref="contextmenu"
      :visible="contextMenu.visible"
      :row="contextMenu.row"
      :filter-column-options="filterOptions"
      :selection-options="contextOptions"
      @update="loadData"
    />
    <el-dialog
      :visible.sync="dialogVisible"
      :before-close="handleClose"
      :close-on-click-modal="false"
      width="50%"
    >
      <div
        slot="title"
        class="text-title"
      >
        {{ $t('Issue.batchTransfer') }}
      </div>
      <div class="text-base mb-2">{{ $t('Issue.TransferIssueTo', { value: checkedIssueIds.length }) }}</div>
      <el-select
        v-model="assigneeId"
        style="width: 100%"
        clearable
        :placeholder="$t('RuleMsg.PleaseSelect')"
        filterable
        required
      >
        <el-option
          v-for="assignee in transferable"
          :key="assignee.value"
          :label="assignee.label"
          :value="assignee.value"
        />
      </el-select>
      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button class="button-secondary-reverse" @click="handleClose">{{ $t('general.Cancel') }}</el-button>
        <el-button
          :loading="isTransferring"
          class="button-primary"
          @click="onBatchTransferConfirm"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
    <SubIssueDialog
      v-if="isCloseIssueDialog"
      :is-issue-dialog.sync="isCloseIssueDialog"
      :issue="issue"
      @handleClose="handleCloseAllIssue"
      @handleCancel="isCloseIssueDialog"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getUserIssueList } from '@/api/user'
import { getProjectAssignable } from '@/api/projects'
import {
  updateIssue,
  getCheckIssueClosable,
  getIssueFamily
} from '@/api/issue'
import { BasicData, Pagination, ContextMenu, SearchBar, IssueExpand } from '@/mixins'
import { Priority, Status, Tracker } from '@/components/Issue'

export default {
  name: 'ProjectIssueTransfer',
  components: {
    Tracker,
    Priority,
    Status,
    SubIssueDialog: () => import('@shared/views/Project/IssueDetail/components/SubIssueDialog')
  },
  mixins: [BasicData, Pagination, ContextMenu, SearchBar, IssueExpand],
  data() {
    return {
      userName: '',
      checkedIssueIds: [],
      isCheckedAllIssues: false,
      isCheckedAllIssuesByPage: false,
      isSearchVisible: false,
      dialogVisible: false,
      assigneeList: [],
      assigneeId: null,
      isTransferring: false,
      expands: [],
      isCloseIssueDialog: false,
      issue: {}
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device']),
    userId() {
      return Number(this.$route.params.userId)
    },
    hasCheckedIssues() {
      return this.checkedIssueIds.length > 0
    },
    transferable() {
      return this.assigneeList.filter((assignee) => assignee.value !== this.userId)
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    }
  },
  mounted() {
    this.fetchAssignee()
  },
  methods: {
    async fetchData() {
      const params = {
        offset: this.listQuery.offset,
        limit: this.listQuery.limit,
        from: 'assigned_to_id',
        status_id: 'open',
        project_id: this.selectedProject.id
      }
      return getUserIssueList(this.userId, params)
        .then((res) => {
          const { issue_list, page } = res.data
          this.listQuery = page
          return this.formatIssue(issue_list)
        })
        .catch((e) => {
          return Promise.reject(e)
        })
    },
    async formatIssue(issue_list) {
      const result = []
      for (const issue of issue_list) {
        result.push({
          ...issue,
          is_closable: await this.checkIssueClosable(issue.id),
          family: {},
          isLoadingFamily: false,
          hasFamily: issue.family || issue.child
        })
      }
      await this.setExpandedRow()
      return result
    },
    fetchAssignee() {
      getProjectAssignable(this.selectedProject.id)
        .then((res) => {
          this.assigneeList = res.data.user_list.map((user) => {
            const { name, login, id } = user
            return { value: id, label: `${name}(${login})` }
          })
          this.setUserName()
        })
        .catch((err) => {
          console.error(err)
        })
    },
    isCheckedIssue(issue) {
      const { id } = issue
      return this.checkedIssueIds.findIndex((item) => item === id) > -1
    },
    toggleIssue(issue) {
      this.isCheckedIssue(issue) ? this.removeIssue(issue) : this.addIssue(issue)
      this.checkIssueChanged()
    },
    addIssue(issue) {
      const { id, is_closable } = issue
      if (!is_closable) return
      if (this.isCheckedIssue(issue)) return
      this.checkedIssueIds.push(id)
    },
    removeIssue(issue) {
      const { id } = issue
      if (!this.isCheckedIssue(issue)) return
      const idx = this.checkedIssueIds.findIndex((item) => item === id)
      this.checkedIssueIds.splice(idx, 1)
    },
    checkIssueChanged() {
      const checkedCount = this.checkedIssueIds.length
      this.isCheckedAllIssuesByPage = checkedCount === this.listData.length
      this.isCheckedAllIssues = this.checkedIssueIds.length === this.listQuery.total
      this.handleSinglePageChecked()
    },
    onBackClick() {
      this.$router.push({ name: 'ProjectSettings', params: { projectName: this.selectedProject.name }})
    },
    onTransferClick(issueId) {
      this.$router.push({ name: 'IssueDetail', params: { issueId }})
    },
    async onCloseClick(row) {
      const issueId = row.id
      this.issue = {}
      this.isCloseIssueDialog = true
      try {
        const family = await getIssueFamily(issueId)
        this.formatIssueFamilyData(row, family.data)
      } finally {
        this.issue = row
      }
    },
    async handleCloseAllIssue() {
      const sendData = new FormData()
      sendData.append('status_id', 6)
      sendData.append('close_all', true)
      await updateIssue(this.issue.id, sendData)
        .then(() => {
          this.loadData()
        })
    },
    async onPagination(listQuery) {
      const { page, limit } = listQuery
      this.listQuery.offset = page * limit - limit
      await this.loadData()
      this.handleSinglePageChecked()
    },
    handleSinglePageChange(val) {
      this.listData.forEach((issue) => {
        val ? this.addIssue(issue) : this.removeIssue(issue)
      })
      this.isCheckedAllIssues = this.checkedIssueIds.length === this.listQuery.total
    },
    handleAllIssuesChange(val) {
      const params = {
        offset: 0,
        from: 'assigned_to_id',
        status_id: 'open',
        project_id: this.selectedProject.id
      }
      this.listLoading = true
      getUserIssueList(this.userId, params)
        .then(async (res) => {
          const list = await this.formatIssue(res.data.map((issue) => issue))
          list.forEach((issue) => {
            val ? this.addIssue(issue) : this.removeIssue(issue)
          })
          this.isCheckedAllIssuesByPage = val
        })
        .catch((err) => {
          console.error(err)
        })
        .then(() => {
          this.listLoading = false
        })
    },
    handleSinglePageChecked() {
      this.isCheckedAllIssuesByPage = this.listData.every(
        (issue) => this.checkedIssueIds.findIndex((id) => id === issue.id) > -1
      )
    },
    onBatchTransferClick() {
      this.dialogVisible = true
    },
    onBatchTransferConfirm() {
      if (this.assigneeId === null) {
        this.$message.warning(this.$t('Validation.Select', [this.$t('Issue.Assignee')]))
        return
      }
      this.handleBatchTransfer()
    },
    handleBatchTransfer() {
      this.isTransferring = true
      this.checkedIssueIds.forEach((issueId) => {
        const sendData = new FormData()
        sendData.append('assigned_to_id', this.assigneeId)
        updateIssue(issueId, sendData)
          .then(() => {
            this.removeIssue(issueId)
            this.loadData()
            this.handleClose()
            this.removeCheckedIssues()
          })
          .catch((err) => {
            console.error(err)
          })
          .then(() => {
            this.isTransferring = false
            this.isCheckedAllIssues = false
            this.isCheckedAllIssuesByPage = false
          })
      })
    },
    handleClose() {
      this.dialogVisible = false
      this.assigneeId = null
    },
    onBatchCloseClick() {
      this.listLoading = true
      this.checkedIssueIds.forEach((issueId) => {
        const sendData = new FormData()
        sendData.append('status_id', 6)
        updateIssue(issueId, sendData)
          .then(() => {
            this.removeIssue(issueId)
            this.loadData()
            this.removeCheckedIssues()
          })
          .catch((err) => {
            console.error(err)
          })
          .then(() => {
            this.isCheckedAllIssues = false
            this.isCheckedAllIssuesByPage = false
          })
      })
    },
    removeCheckedIssues() {
      this.checkedIssueIds = []
    },
    async checkIssueClosable(issueId) {
      return (await getCheckIssueClosable(issueId)).data
    },
    showSearchInput() {
      this.isSearchVisible = !this.isSearchVisible
      this.$nextTick(() => this.$refs.inputKeyword.focus())
    },
    setUserName() {
      const idx = this.assigneeList.findIndex((assignee) => assignee.value === this.userId)
      this.userName = this.assigneeList[idx]['label']
    },
    getRowClass(row) {
      if (!row.row.hasFamily) return 'hide-expand-icon'
    },
    async setExpandedRow() {
      if (this.expands.length === 0) return
      const row = this.listData.find((item) => item.id === this.expands[0])
      if (row.family) await this.getIssueFamilyData()
      else this.$refs['issueList'].toggleRowExpansion(row, false)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-table .hide-expand-icon .cell .el-table__expand-icon {
  display: none;
}
.mobile {
  ::v-deep  .el-card__body {
    padding: 10px;
  }
}
</style>
