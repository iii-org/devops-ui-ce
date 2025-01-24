<template>
  <div :class="isMobile ? 'mobile' : ''" class="app-container">
    <el-card>
      <el-row align="middle" class="my-3" type="flex">
        <el-col :span="6">
          <el-button
            class="text-title link-text-color"
            icon="el-icon-arrow-left"
            size="medium"
            type="text"
            @click="onBackClick"
          >
            {{ $t('general.Back') }}
          </el-button>
        </el-col>
        <el-col :span="12" class="text-center">
          <span class="text-xl font-medium">{{ $t('Issue.IssueList') }}：{{ userName }}
          </span>
        </el-col>
        <el-col :span="6" class="text-right">
          <el-button
            v-show="!isSearchVisible"
            class="header-text-color"
            icon="el-icon-search"
            type="text"
            @click="showSearchInput"
          >
            {{ $t('general.Search') + (keyword ? ': ' + keyword : '') }}
          </el-button>
          <el-input
            v-show="isSearchVisible"
            ref="inputKeyword"
            v-model="keyword"
            :placeholder="$t('general.Search') + $t('Issue.name')"
            class="py-1"
            clearable
            prefix-icon="el-icon-search"
            size="small"
            style="width: 210px"
            @blur="isSearchVisible = !isSearchVisible"
          />
        </el-col>
      </el-row>
      <div class="flex justify-between items-center mb-2">
        <el-checkbox
          v-model="isCheckedAllIssues"
          :disabled="listData.length < 1"
          class="ml-3"
          @change="handleAllIssuesChange"
        >
          <span>{{ $t('general.SelectAll') }}</span>
        </el-checkbox>
        <div style="text-align: right">
          <el-button
            :disabled="!hasCheckedIssues"
            plain
            size="mini"
            type="primary"
            @click="onBatchTransferClick"
          >
            {{ `${$t('Issue.batchTransfer')} (${checkedIssueIds.length})` }}
          </el-button>
          <el-button
            :disabled="!hasCheckedIssues"
            plain
            size="mini"
            type="danger"
            @click="onBatchCloseClick"
          >
            {{ `${$t('Issue.batchClose')} (${checkedIssueIds.length})` }}
          </el-button>
        </div>
      </div>
      <el-table
        ref="issueList"
        v-loading="listLoading"
        :data="listData"
        :expand-row-keys="expands"
        :row-class-name="getRowClass"
        :tree-props="{ children: 'child' }"
        fit
        row-key="id"
        @row-contextmenu="handleContextMenu"
        @expand-change="getIssueFamilyData"
      >
        <el-table-column align="center" width="40">
          <template slot="header" slot-scope="{ column }">
            <el-checkbox
              v-model="isCheckedAllIssuesByPage"
              :disabled="listData.length < 1"
              @change="handleSinglePageChange"
            />
          </template>
          <template slot-scope="scope">
            <el-checkbox
              :disabled="!scope.row.is_closable"
              :value="isCheckedIssue(scope.row)"
              @change="toggleIssue(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column type="expand" width="30">
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
          :label="$t('general.Type')"
          prop="tracker.name"
          width="130"
        >
          <template slot-scope="{ row }">
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
          prop="id"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <span class="text-success mr-2">#{{ scope.row.id }}</span>
            <el-tag
              v-for="item in scope.row.tags"
              :key="item.id"
              class="mr-1"
              size="mini"
            >[{{ item.name }}]
            </el-tag>
            {{ scope.row.subject }}
          </template>
        </el-table-column>

        <el-table-column
          v-if="!isMobile"
          :label="$t('Issue.Priority')"
          align="center"
          prop="priority.name"
          width="150"
        >
          <template slot-scope="{ row }">
            <Priority
              v-if="row.priority.name"
              :name="$t(`Issue.${row.priority.name}`)"
              :type="row.priority.name"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-if="!isMobile"
          :label="$t('general.Status')"
          align="center"
          prop="status.name"
          width="150"
        >
          <template slot-scope="{ row }">
            <Status
              v-if="row.status.name"
              :name="$t(`Issue.${row.status.name}`)"
              :type="row.status.name"
            />
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('general.Actions')"
          align="center"
          width="75"
        >
          <template slot-scope="scope">
            <el-tooltip :content="$t('general.Transfer')" placement="bottom">
              <em
                class="ri-file-transfer-line success table-button"
                @click="onTransferClick(scope.row.id)"
              ></em>
            </el-tooltip>
            <el-tooltip :content="$t('general.Close')" placement="bottom">
              <span>
                <em
                  :class="!scope.row.is_closable ? 'disabled' : 'danger'"
                  class="ri-delete-bin-2-line table-button"
                  @click="onCloseClick(scope.row)"
                ></em>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        :layout="paginationLayout"
        :limit="listQuery.limit"
        :page="listQuery.page"
        :page-sizes="[listQuery.limit]"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        :total="listQuery.total"
        @pagination="onPagination"
      />
    </el-card>
    <context-menu
      ref="contextmenu"
      :filter-column-options="filterOptions"
      :row="contextMenu.row"
      :selection-options="contextOptions"
      :visible="contextMenu.visible"
      @update="loadData"
    />
    <el-dialog
      :before-close="handleClose"
      :close-on-click-modal="false"
      :visible.sync="dialogVisible"
      width="50%"
    >
      <div slot="title" class="text-title">
        {{ $t('Issue.batchTransfer') }}
      </div>
      <div class="text-base mb-2">
        {{ $t('Issue.TransferIssueTo', { value: checkedIssueIds.length }) }}
      </div>
      <el-select
        v-model="assigneeId"
        :placeholder="$t('RuleMsg.PleaseSelect')"
        clearable
        filterable
        required
        style="width: 100%"
      >
        <el-option
          v-for="assignee in transferable"
          :key="assignee.value"
          :label="assignee.label"
          :value="assignee.value"
        />
      </el-select>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleClose">{{ $t('general.Cancel') }}</el-button>
        <el-button
          :loading="isTransferring"
          type="primary"
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
      @handleCancel="isCloseIssueDialog = false"
      @handleClose="handleCloseAllIssue"
    />
  </div>
</template>

<script>
import {
  checkIssueClosable,
  getIssueFamily,
  updateIssue
} from '@/api_v3/issues'
import { getProjectUserList } from '@/api_v3/projects'
import { getUserIssueList } from '@/api_v3/user'
import BasicData from '@/mixins/BasicData'
import ContextMenu from '@/mixins/ContextMenu'
import IssueExpand from '@/mixins/IssueExpand'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { mapGetters } from 'vuex'

const params = () => ({
  page: 1,
  limit: 10,
  from: 'assigned',
  exclude_closed: true
})

export default {
  name: 'ProjectIssueTransfer',
  components: {
    Tracker: () => import('@/components/Issue/Tracker'),
    Priority: () => import('@/components/Issue/Priority'),
    Status: () => import('@/components/Issue/Status'),
    SubIssueDialog: () =>
      import('@shared/views/Project/IssueDetail/components/SubIssueDialog')
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
      issue: {},
      searchKeys: ['subject'],
      timeoutId: -1,
      params: params()
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device']),
    userId() {
      return this.$route.params.userId
    },
    hasCheckedIssues() {
      return this.checkedIssueIds.length > 0
    },
    transferable() {
      return this.assigneeList.filter(
        (assignee) => assignee.value !== this.userId
      )
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    }
  },
  watch: {
    keyword(val) {
      if (val !== null) {
        this.params.page = 1
        this.params.limit = 10
        this.params.search = this.keyword
        clearTimeout(this.timeoutId)
        this.timeoutId = window.setTimeout(() => {
          this.loadData()
          this.isCheckedAllIssues = false
          this.isCheckedAllIssues
        }, 1000)
      } else {
        this.keyword = ''
      }
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timeoutId)
  },
  mounted() {
    this.fetchAssignee()
  },
  methods: {
    async fetchData() {
      this.params.project_id = this.selectedProject.id
      return getUserIssueList(this.userId, this.params)
        .then((res) => {
          const { items, pagination } = res.data
          this.listQuery = pagination
          return this.formatIssue(items)
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
          hasFamily: issue.has_family || issue.children
        })
      }
      await this.setExpandedRow()
      return result
    },
    fetchAssignee() {
      getProjectUserList(this.selectedProject.id)
        .then((res) => {
          this.assigneeList = res.data.map((user) => {
            const { full_name, username, id } = user
            return { value: id, label: `${full_name}(${username})` }
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
      this.isCheckedIssue(issue)
        ? this.removeIssue(issue)
        : this.addIssue(issue)
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
      this.isCheckedAllIssues =
        this.checkedIssueIds.length === this.listQuery.total
      this.handleSinglePageChecked()
    },
    onBackClick() {
      this.$router.go(-1)
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
      const sendData = {
        status_id: 6,
        close_all: true
      }
      await updateIssue(this.issue.id, sendData).then(() => {
        this.loadData()
      })
    },
    async onPagination(listQuery) {
      const { page, limit } = listQuery
      this.listQuery.page = page
      this.listQuery.limit = limit
      this.params.page = page
      this.params.limit = limit
      await this.loadData()
      this.handleSinglePageChecked()
    },
    handleSinglePageChange(val) {
      this.listData.forEach((issue) => {
        val ? this.addIssue(issue) : this.removeIssue(issue)
      })
      this.isCheckedAllIssues =
        this.checkedIssueIds.length === this.listQuery.total
    },
    handleAllIssuesChange(val) {
      const params = Object.assign({}, this.params)
      params.all = true
      delete params.page
      delete params.limit
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
        this.$message.warning(
          this.$t('Validation.Select', [this.$t('Issue.Assignee')])
        )
        return
      }
      this.handleBatchTransfer()
    },
    handleBatchTransfer() {
      this.isTransferring = true
      this.checkedIssueIds.forEach((issueId) => {
        const sendData = { assigned_id: this.assigneeId }
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
        const sendData = { status_id: 6 }
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
      return (await checkIssueClosable(issueId)).data
    },
    showSearchInput() {
      this.isSearchVisible = !this.isSearchVisible
      this.$nextTick(() => this.$refs.inputKeyword.focus())
    },
    setUserName() {
      const idx = this.assigneeList.findIndex(
        (assignee) => assignee.value === this.userId
      )
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
  ::v-deep .el-card__body {
    padding: 10px;
  }
}
</style>
