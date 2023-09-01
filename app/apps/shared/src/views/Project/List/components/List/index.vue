<template>
  <div :class="isMobile ? 'mobile' : ''">
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
      @pagination="handleCurrentChange"
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
import {
  Columns,
  IssueExpand,
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
    IssueTable: () => import('@shared/views/Project/IssueList/components/Desktop'),
    IssueCard: () => import('@shared/views/Project/IssueList/components/Mobile')
  },
  mixins: [
    Columns,
    IssueExpand,
    Pagination,
    ContextMenu
  ],
  props: {
    listLoadingProp: {
      type: Boolean,
      default: false
    },
    allDataLoadingProp: {
      type: Boolean,
      default: false
    },
    quickAddTopicDialogVisible: {
      type: Boolean,
      default: false
    },
    displayFieldsProp: {
      type: Array,
      default: () => []
    },
    mainSelectedProjectId: {
      type: Number,
      default: null
    },
    filterValue: {
      type: Object,
      default: () => ({})
    },
    keywordProp: {
      type: String,
      default: null
    },
    socketUpdate: {
      type: Object,
      default: () => ({
        type: '',
        elements: []
      })
    }
  },
  data() {
    return {
      addTopicDialogVisible: false,
      listLoading: false,
      allDataLoading: false,
      listData: [],
      form: {},
      selectedIssueList: [],
      excelColumnSelected: ['tracker', 'id', 'name', 'priority', 'status', 'assigned_to'],
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
      storageName: 'list_board',
      storageType: ['SearchFilter', 'Pagination'],
      parentId: 0,
      sort: '',
      lastIssueListCancelToken: null,
      expands: [],
      filterSelected: ''
    }
  },
  computed: {
    ...mapGetters(['device', 'selectedProjectId']),
    hasSelectedIssue() {
      const selectedIssue = this.selectedIssueList.length > 0
      this.$emit('update:hasSelectedIssue', selectedIssue)
      return selectedIssue
    },
    // main
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    keyword() {
      return this.keywordProp || this.filterValue.keyword || ''
    }
  },
  watch: {
    'filterValue.tracker'() {
      this.quickAddTopicDialogVisible = false
    },
    filterSelected(val) {
      if (val === 'Filter') this.filterSelected = ''
    },
    listLoading() {
      this.$emit('update:listLoadingProp', this.listLoading)
    },
    allDataLoading() {
      this.$emit('update:allDataLoadingProp', this.allDataLoading)
    },
    displayFieldsProp() {
      this.displayFields = this.displayFieldsProp
    },
    listQuery: {
      handler(val) {
        this.$emit('setListQuery', val)
      },
      deep: true
    },
    displayFields(val) {
      this.$emit('setDisplayField', val)
    },
    socketUpdate: {
      deep: true,
      handler(val) {
        for (const data of val.elements) {
          const findChangeIndex = this.listData.findIndex(issue => parseInt(data.id) === parseInt(issue.id))
          if (val.type === 'update') {
            this.$set(this.listData, findChangeIndex, Object.assign({}, this.listData[findChangeIndex], data))
          } else if (val.type === 'create') {
            if ((this.filterValue.project) && (this.filterValue.project === data.project.id) || !this.filterValue.project) {
              if (findChangeIndex !== -1) {
                this.$set(this.listData, findChangeIndex, data)
              } else {
                this.$set(this.listData, this.listData.length, data)
              }
            }
          } else if (val.type === 'delete') {
            this.$delete(this.listData, findChangeIndex)
          }
        }
      }
    }
  },
  created() {
    this.getStoredListQuery()
  },
  methods: {
    ...mapActions('projects', ['getSort', 'setSort']),
    async loadData() {
      await this.fetchData()
    },
    async getStoredListQuery() {
      const [storeQuery, storeSort] = await Promise.all([this.getListQuery(), this.getSort()])
      const storedQuery = storeQuery[this.storageName]
      const storedSort = storeSort[this.storageName]
      if (storedQuery !== undefined) this.listQuery = JSON.parse(JSON.stringify(storedQuery))
      if (storedSort !== undefined) this.sort = storedSort
    },
    async fetchAllDownloadData() {
      this.allDataLoading = true
      const res = await getProjectIssueList(
        this.mainSelectedProjectId,
        this.getParams(this.listQuery.total)
      )
      this.allDataLoading = false
      return res.data.issue_list
    },
    async fetchData() {
      let resData
      this.listLoading = true
      try {
        await this.checkLastRequest()
        const cancelTokenSource = axios.CancelToken.source()
        this.lastIssueListCancelToken = cancelTokenSource
        const res = await getProjectIssueList(
          this.mainSelectedProjectId,
          this.$parent.getParams(), {
            cancelToken: cancelTokenSource.token
          })
        resData = res.data.issue_list
        resData = resData.map((element) => ({
          ...element,
          showQuickAddIssue: false
        }))
        this.setNewListQuery(res.data.page)
        this.listData = resData
        this.listLoading = false
      } catch (e) {
        // null
      }
      if (!resData) this.listLoading = true
      this.lastIssueListCancelToken = null
      this.$set(this, 'listData', resData)
      return resData
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
    backToFirstPage() {
      this.listQuery.page = 1
      this.listQuery.offset = 0
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
      this.$parent.$refs.searchFilterDrawer.cleanFilter()
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
