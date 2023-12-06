<template>
  <div class="app-container" :class="isMobile ? 'mobile' : ''">
    <ProjectListSelector :show-button="!isMobile">
      <el-button
        id="btn-add-issue"
        slot="button"
        v-permission="['Administrator','Project Manager', 'Engineer']"
        class="button-primary"
        icon="el-icon-plus"
        :size="isMobile ? 'small' : 'medium'"
        :disabled="isDisabled"
        @click="handleQuickAddClose"
      >
        {{ $t('Issue.AddIssue') }}
      </el-button>
      <SearchFilter
        :filter-options="filterOptions"
        :list-loading="listLoading"
        :selection-options="contextOptions"
        :is-drawer="isMobile"
        :prefill="{
          filterValue: filterValue,
          keyword: keyword,
          displayClosed: displayClosed,
          fixed_version_closed: fixed_version_closed
        }"
        type="issue_list"
        @add-issue="handleQuickAddClose"
        @change-filter="onChangeFilterForm"
        @change-fixed-version="onChangeFixedVersionStatus"
        @add-custom-filter="updateCustomFilter"
        @clean-filter="cleanFilter"
      >
        <CustomFilter
          ref="customFilter"
          type="issue_list"
          :selection-options="contextOptions"
          @apply-filter="applyCustomFilter"
        />
        <span
          slot="download"
          v-permission="['QA']"
        >
          <el-divider direction="vertical" />
          <el-popover
            placement="bottom"
            trigger="click"
          >
            <el-menu class="download">
              <el-menu-item
                :disabled="isDisabled || allDataLoading"
                @click="downloadExcel('allDownloadData')"
              >
                <em class="el-icon-download" />
                {{ $t('Dashboard.ADMIN.ProjectList.all_download') }}
              </el-menu-item>
              <el-menu-item
                v-show="hasSelectedIssue"
                :disabled="isDisabled"
                @click="downloadExcel(selectedIssueList)"
              >
                <em class="el-icon-download" />
                {{ $t('Dashboard.ADMIN.ProjectList.excel_download') }}
              </el-menu-item>
            </el-menu>
            <el-button
              slot="reference"
              class="button-primary-reverse"
              icon="el-icon-download"
              size="mini"
            >
              {{ $t('File.Download') }}
            </el-button>
          </el-popover>
        </span>
        <Columns
          :columns-options="columnsOptions"
          :display-fields.sync="displayFields"
          :filter-value="filterValue"
          :type="type"
        />
        <el-divider direction="vertical" />
      </SearchFilter>
    </ProjectListSelector>
    <el-divider />
    <component :is="isMobile ? 'div' : 'el-collapse-transition'">
      <QuickAddIssue
        v-if="quickAddTopicDialogVisible"
        ref="quickAddIssue"
        :project-id="selectedProjectId"
        :visible.sync="quickAddTopicDialogVisible"
        :filter-conditions="filterValue"
        :is-drawer="isMobile"
        @update="loadData"
      />
    </component>
    <div
      ref="wrapper"
      class="wrapper"
      :class="{'show-quick':quickAddTopicDialogVisible}"
    >
      <el-row
        v-loading="listLoading"
        :element-loading-text="$t('Loading')"
      >
        <IssueTable v-if="!isMobile" ref="Desktop" />
        <IssueCard v-else>
          <template v-slot:header>
            <div class="filter-selected">
              <span>{{ filterSelected }}</span>
              <span v-if="filterSelected !== ''&& keyword !== '' && keyword !== null">; </span>
              <span>{{ keyword !== '' && keyword !== null ? $t('general.Search') + ': ' + keyword : '' }}</span>
              <el-button
                v-if="filterSelected !== '' || (keyword !== '' && keyword !== null)"
                size="small"
                icon="el-icon-close"
                type="text"
                @click="cleanFilterLabel"
              />
            </div>
          </template>
        </IssueCard>
      </el-row>
    </div>
    <Pagination
      :total="listQuery.total"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="isSearch ? onPagination($event) : handleCurrentChange($event)"
    />
    <ContextMenu
      ref="contextmenu"
      :visible="contextMenu.visible"
      :row="contextMenu.row"
      :filter-column-options="contextMenuFilterOptions"
      :selection-options="contextOptions"
      :simple-add-issue="isTable"
      @backToFirstPage="backToFirstPage"
      @update="loadData"
      @update-card="loadDataAfterSetIssue"
      @update-row="getContextRow"
    />
    <SearchFilter
      v-if="isMobile"
      ref="searchFilterDrawer"
      :filter-options="filterOptions"
      :list-loading="listLoading"
      :selection-options="contextOptions"
      :is-drawer="isMobile"
      :prefill="{
        filterValue: filterValue,
        keyword: keyword,
        displayClosed: displayClosed,
        fixed_version_closed: fixed_version_closed
      }"
      @add-issue="handleQuickAddClose"
      @change-filter="onChangeFilterForm"
      @filter-label="filterSelected = $event"
      @change-fixed-version="onChangeFixedVersionStatus"
      @add-custom-filter="updateCustomFilter"
      @clean-filter="cleanFilter"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getProjectIssueList } from '@/api_v2/projects'
import {
  getStatusTagType,
  getPriorityTagType,
  getCategoryTagType
} from '@shared/utils/getElementType'
import { excelTranslate } from '@shared/utils/excelTableTranslate'
import { ProjectListSelector } from '@shared/components'

import {
  BasicData,
  Columns,
  IssueExpand,
  SearchFilter,
  Pagination,
  ContextMenu
} from '@/mixins'
import axios from 'axios'
import XLSX from 'xlsx'

/**
 * @param row.relations  row maybe have parent or children issue
 * @param data.issue_list get paged data from api
 */

export default {
  name: 'ProjectIssueList',
  components: {
    ProjectListSelector,
    QuickAddIssue: () => import('@shared/views/MyWork/components/QuickAddIssue'),
    IssueTable: () => import('./components/Desktop'),
    IssueCard: () => import('./components/Mobile')
  },
  mixins: [
    BasicData,
    Columns,
    IssueExpand,
    SearchFilter,
    Pagination,
    ContextMenu
  ],
  data() {
    return {
      quickAddTopicDialogVisible: false,
      addTopicDialogVisible: false,
      form: {},
      selectedIssueList: [],
      allDataLoading: false,
      excelColumnSelected: ['tracker', 'id', 'name', 'priority', 'status', 'assigned_to'],
      columnsOptions: Object.freeze([
        { display: this.$t('Issue.project'), field: 'project' },
        { display: this.$t('Issue.name'), field: 'name' },
        { display: this.$t('Issue.tracker'), field: 'tracker' },
        { display: this.$t('Issue.status'), field: 'status' },
        { display: this.$t('Issue.fixed_version'), field: 'fixed_version' },
        { display: this.$t('Issue.StartDate'), field: 'StartDate' },
        { display: this.$t('Issue.EndDate'), field: 'EndDate' },
        { display: this.$t('Issue.priority'), field: 'priority' },
        { display: this.$t('Issue.assigned_to'), field: 'assigned_to' },
        { display: this.$t('Issue.DoneRatio'), field: 'DoneRatio' }
      ]),
      filterOptions: Object.freeze([
        {
          id: 1,
          label: this.$t('Issue.FilterDimensions.tracker'),
          value: 'tracker',
          placeholder: 'Type',
          tag: true
        },
        {
          id: 2,
          label: this.$t('Issue.FilterDimensions.status'),
          value: 'status',
          placeholder: 'Status',
          tag: true
        },
        {
          id: 3,
          label: this.$t('Issue.FilterDimensions.tags'),
          value: 'tags',
          placeholder: 'Tag'
        },
        {
          id: 4,
          label: this.$t('Issue.FilterDimensions.assigned_to'),
          value: 'assigned_to',
          placeholder: 'Member'
        },
        {
          id: 5,
          label: this.$t('Issue.FilterDimensions.fixed_version'),
          value: 'fixed_version',
          placeholder: 'Version'
        },
        {
          id: 6,
          label: this.$t('Issue.FilterDimensions.priority'),
          value: 'priority',
          placeholder: 'Priority',
          tag: true
        }
      ]),
      contextMenuFilterOptions: Object.freeze([
        {
          id: 1,
          label: this.$t('Issue.FilterDimensions.tracker'),
          value: 'tracker',
          placeholder: 'Type',
          tag: true
        },
        {
          id: 2,
          label: this.$t('Issue.FilterDimensions.status'),
          value: 'status',
          placeholder: 'Status',
          tag: true
        },
        {
          id: 4,
          label: this.$t('Issue.FilterDimensions.assigned_to'),
          value: 'assigned_to',
          placeholder: 'Member'
        },
        {
          id: 5,
          label: this.$t('Issue.FilterDimensions.fixed_version'),
          value: 'fixed_version',
          placeholder: 'Version'
        },
        {
          id: 6,
          label: this.$t('Issue.FilterDimensions.priority'),
          value: 'priority',
          placeholder: 'Priority',
          tag: true
        }
      ]),
      storageName: 'issueList',
      storageType: ['SearchFilter', 'Pagination'],
      parentId: 0,
      sort: '',
      lastIssueListCancelToken: null,
      expands: [],
      filterSelected: '',
      listData: [],
      listLoading: false,
      type: 'issue_list'
    }
  },
  computed: {
    ...mapGetters(['device']),
    hasSelectedIssue() {
      return this.selectedIssueList.length > 0
    },
    mainSelectedProjectId() {
      return this.filterValue.project || this.selectedProjectId
    },
    isDisabled() {
      return this.mainSelectedProjectId === -1
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    isSearch() {
      return this.keyword && this.keyword !== '' && this.keyword.length > 1
    }
  },
  watch: {
    'filterValue.tracker'() {
      this.quickAddTopicDialogVisible = false
    },
    filterSelected(val) {
      if (val === 'Filter') this.filterSelected = ''
    }
  },
  mounted() {
    this.listLoading = true
  },
  methods: {
    ...mapActions('projects', ['getSort', 'setSort']),
    async fetchAllDownloadData() {
      this.allDataLoading = true
      const res = await getProjectIssueList(
        this.mainSelectedProjectId,
        this.getParams(this.listQuery.total)
      )
      this.allDataLoading = false
      return res.data.issue_list
    },
    async getStoredListQuery() {
      const res = await Promise.allSettled([this.getListQuery(), this.getSort()])
      const [storeListQuery, storeSort] = res.map((item) => item.value)
      const storedTabQuery = storeListQuery[this.storageName]
      const storedSort = storeSort[this.storageName]
      if (storedTabQuery !== undefined) this.listQuery = storedTabQuery
      if (storedSort !== undefined) this.sort = storedSort
    },
    async loadData() {
      this.listLoading = true
      await this.fetchData()
      this.listLoading = false
    },
    async fetchData() {
      await this.checkLastRequest()
      const cancelTokenSource = axios.CancelToken.source()
      this.lastIssueListCancelToken = cancelTokenSource
      this.listData = []
      await getProjectIssueList(
        this.mainSelectedProjectId,
        this.getParams(),
        { cancelToken: cancelTokenSource.token }
      ).then((res) => {
        if (!res.data) return
        if (this.isSearch) {
          this.listData = res.data.map((element) => ({
            ...element,
            showQuickAddIssue: false
          }))
          this.setNewListQuery({ total: res.data.length })
        } else {
          this.listData = res.data.issue_list.map((element) => ({
            ...element,
            showQuickAddIssue: false
          }))
          this.setNewListQuery(res.data.page)
        }
      })
      this.lastIssueListCancelToken = null
    },
    async loadDataAfterSetIssue(issueId = null) {
      await this.loadData()
      issueId = issueId || this.expands[0]
      const row = this.listData.find((item) => item.id === issueId)
      if (row.family) await this.getIssueFamilyData()
      else this.$refs['Desktop'].$refs['issueList'].toggleRowExpansion(row, false)
    },
    checkLastRequest() {
      if (this.lastIssueListCancelToken && this.listLoading) {
        this.lastIssueListCancelToken.cancel()
      }
    },
    handleSelectionChange(list) {
      this.selectedIssueList = list
    },
    handleClick(row, column) {
      if (column) {
        if (column.type === 'action') {
          return false
        }
        if (column.type === 'expand' && row.family) {
          return this.$refs['Desktop'].$refs['issueList'].toggleRowExpansion(row)
        }
      }
      this.$router.push({ name: 'IssueDetail', params: { issueId: row.id, project: row.project }})
    },
    // async saveIssue(data) {
    //   const res = await addIssue(data)
    //   this.$message({
    //     title: this.$t('general.Success'),
    //     message: this.$t('Notify.Added'),
    //     type: 'success'
    //   })
    //   this.backToFirstPage()
    //   this.loadData()
    //   this.addTopicDialogVisible = false
    //   this.$refs['quickAddIssue'].form.name = ''
    //   return res
    // },
    backToFirstPage() {
      this.listQuery.page = 1
      this.listQuery.offset = 0
    },
    handleQuickAddClose() {
      this.quickAddTopicDialogVisible = !this.quickAddTopicDialogVisible
    },
    async handleSortChange({ prop, order }) {
      const orderBy = this.checkOrder(order)
      if (orderBy) {
        this.sort = prop + ':' + orderBy
      } else {
        this.sort = orderBy
      }
      this.loadData()
      const storedSort = await this.getSort()
      storedSort[this.storageName] = this.sort
      await this.setSort(storedSort)
    },
    checkOrder(order) {
      if (order === 'descending') {
        return 'desc'
      }
      if (order === 'ascending') {
        return 'asc'
      }
      return false
    },
    advancedAddIssue(form) {
      this.addTopicDialogVisible = true
      this.parentId = 0
      this.form = form
    },
    async downloadExcel(selectedIssueList) {
      if (selectedIssueList === 'allDownloadData') {
        this.$notify({ type: 'warning', title: this.$t('Loading').toString() })
        const issueList = await this.fetchAllDownloadData()
        this.handleDownload(issueList)
      } else this.handleDownload(selectedIssueList)
    },
    handleDownload(issueList) {
      const selectedColumn = this.handleCsvSelectedColumn(issueList)
      const translateTable = this.handleCsvTranslateTable(selectedColumn)
      const worksheet = XLSX.utils.json_to_sheet(translateTable)
      this.$excel(worksheet, 'projectIssues')
    },
    handleCsvSelectedColumn(selectedIssueList) {
      const selectedColumn = []
      selectedIssueList.forEach((item) => {
        const targetObject = {}
        this.excelColumnSelected.forEach((itemSelected) => {
          switch (itemSelected) {
            case 'status':
              this.$set(targetObject, itemSelected, getStatusTagType(item.status.name))
              break
            case 'priority':
              this.$set(targetObject, itemSelected, getPriorityTagType(item.priority.name))
              break
            case 'tracker':
              this.$set(targetObject, itemSelected, getCategoryTagType(item.tracker.name))
              break
            case 'assigned_to':
              this.$set(
                targetObject,
                itemSelected,
                item.assigned_to.name ? `${item.assigned_to.name}(${item.assigned_to.login})` : ''
              )
              break
            default:
              this.$set(targetObject, itemSelected, item[itemSelected])
          }
        })
        selectedColumn.push(targetObject)
      })
      return selectedColumn
    },
    handleCsvTranslateTable(selectedColumn) {
      const translateTable = []
      selectedColumn.forEach((item) => {
        const chineseExcel = {}
        const chineseColumnKey = Object.keys(item).map((key) => {
          key = excelTranslate.projectIssues[key]
          return key
        })
        Object.values(item).forEach((val, index) => {
          this.$set(chineseExcel, chineseColumnKey[index], val)
        })
        translateTable.push(chineseExcel)
      })
      return translateTable
    },
    getRowClass({ row }) {
      const result = []
      if (!row.family) {
        result.push('hide-expand-icon')
      }
      this.contextMenu ? result.push('context-menu') : result.push('cursor-pointer')
      return result.join(' ')
    },
    collapseExpandRow(issueId) {
      const row = this.listData.find((item) => item.id === issueId)
      this.$refs['Desktop'].$refs.issueList.toggleRowExpansion(row, false)
    },
    closeQuickAddIssue(row) {
      this.$set(row, 'showQuickAddIssue', false)
      if (!row.family) {
        this.collapseExpandRow(row.id)
      }
    },
    cleanFilterLabel() {
      this.filterSelected = ''
      this.$refs.searchFilterDrawer.cleanFilter()
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
.wrapper {
  overflow: auto;
  height: auto;
}
.download {
  @apply border-none;
}
::v-deep .context-menu {
  cursor: context-menu;
}
::v-deep .el-table__body-wrapper {
  overflow-y: auto;
}
::v-deep .el-table {
  .hide-expand-icon {
    .el-table__expand-column .cell {
      display: none;
    }
  }
  .action {
    @apply border-0;
  }
}
::v-deep .el-table__expanded-cell {
  font-size: 0.875em;
  padding-top: 10px;
  padding-bottom: 10px;
}
::v-deep .row-expand-loading .el-table__expand-column .cell {
  padding: 0;
  .el-table__expand-icon {
    .el-icon-arrow-right {
      animation: rotating 2s linear infinite;
    }
    .el-icon-arrow-right:before {
      content: '\e6cf';
      font-size: 1.25em;
    }
  }
}

.mobile {
  ::v-deep .pagination-container {
    background-color: $appMainBg;
  }
  .filter-selected {
    margin: 0 5px;
    color: #409EFF;
    font-weight: bold;
    font-size: 12px;
  }
}
</style>
