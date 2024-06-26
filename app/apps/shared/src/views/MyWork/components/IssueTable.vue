<template>
  <div>
    <el-row
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
    >
      <el-table
        ref="issueList"
        :data="isSearch ? pagedData : listData"
        :expand-row-keys="expandedRow"
        :tree-props="{ children: 'child' }"
        :row-class-name="getRowClass"
        highlight-current-row
        size="mini"
        row-key="id"
        @row-contextmenu="handleContextMenu"
        @cell-click="handleCellClick"
        @expand-change="getIssueFamilyData"
        @sort-change="handleSortChange"
      >
        <el-table-column type="expand">
          <template slot-scope="{row}">
            <el-row v-if="row.showQuickAddIssue" class="add-issue">
              <QuickAddIssue
                :project-id="row.project.id"
                :visible.sync="row.showQuickAddIssue"
                :filter-conditions="filterConditionsProps"
                :parent="row"
                :is-table="true"
                :sub-issue="true"
                @close="closeQuickAddIssue(row)"
                @update="fetchData"
              />
            </el-row>
            <IssueExpand
              :issue="row"
              style="margin-right: 20px;"
              @update="fetchData"
              @on-context-menu="onContextMenu"
              @handle-expand-row="collapseExpandRow"
            />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('general.Type')"
          width="130"
          prop="tracker"
          sortable="custom"
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
          :label="$t('Project.Name')"
          min-width="150"
          show-overflow-tooltip
          prop="project"
          sortable="custom"
        >
          <template slot-scope="scope">
            {{ scope.row.project.display }}
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Issue.Id')"
          min-width="280"
          show-overflow-tooltip
          prop="id"
          sortable="custom"
        >
          <template slot-scope="scope">
            <span style="display:flex;">
              <div
                class="text-success mr-2"
                style="display:flex; align-items:center;"
              >
                #{{ scope.row.id }}
              </div>
              <div class="truncate">
                <template v-if="scope.row.tags.length > 0">
                  <el-tag
                    v-for="item in scope.row.tags"
                    :key="item.id"
                    size="mini"
                    class="mr-1"
                  >
                    [{{ item.name }}]
                  </el-tag>
                  <br>
                </template>
                {{ scope.row.name }}
              </div>
            </span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Issue.Priority')"
          align="center"
          width="150"
          prop="priority"
          sortable="custom"
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
          :label="$t('general.Status')"
          align="center"
          width="150"
          prop="status"
          sortable="custom"
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
          v-if="from === 'author_id'"
          :label="$t('Issue.Assignee')"
          align="center"
          min-width="180"
          prop="assigned_to"
          sortable="custom"
          show-overflow-tooltip
        >
          <template
            v-if="scope.row.assigned_to"
            slot-scope="scope"
          >
            <span>
              {{ scope.row.assigned_to.name }}
            </span>
            <span v-if="scope.row.assigned_to.login">
              ({{ scope.row.assigned_to.login }})
            </span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="from === 'assigned_to_id'"
          :label="$t('Issue.Author')"
          align="center"
          min-width="180"
          prop="author"
          sortable="custom"
          show-overflow-tooltip
        >
          <template
            v-if="scope.row.author"
            slot-scope="scope"
          >
            <span>
              {{ scope.row.author.name }}
            </span>
            <span v-if="scope.row.author.login">
              ({{ scope.row.author.login }})
            </span>
          </template>
        </el-table-column>
        <template slot="empty">
          <el-empty
            :description="$t('general.NoData')"
            :image-size="100"
          />
        </template>
      </el-table>
      <Pagination
        ref="pagination"
        :total="listQuery.total"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :page-sizes="[10, 25, 50, 100]"
        :layout="'total, sizes, prev, pager, next'"
        @pagination="handlePaginationChange"
      />
    </el-row>
    <ContextMenu
      ref="contextmenu"
      :visible="contextMenu.visible"
      :row="contextMenu.row"
      :filter-column-options="filterOptions"
      :selection-options="contextOptions"
      :simple-add-issue="isTable"
      @update="updateAllIssueTables"
      @update-row="getContextRow"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getUserIssueList } from '@/api/user'
import { getUserWatchList } from '@/api_v2/user'
import { getIssueFamily } from '@/api/issue'
import { ContextMenu, Pagination, CancelRequest } from '@/mixins'
import { Status, Tracker, Priority, IssueExpand } from '@/components/Issue'

export default {
  name: 'MyWorkIssueTable',
  components: {
    Status,
    Tracker,
    Priority,
    IssueExpand,
    QuickAddIssue: () => import('./QuickAddIssue')
  },
  mixins: [ContextMenu, Pagination, CancelRequest],
  props: {
    from: {
      type: String,
      default: 'assigned_to'
    },
    projectId: {
      type: [String, Number],
      default: ''
    },
    filterConditionsProps: {
      type: Object,
      default: () => ({})
    },
    displayClosedProps: {
      type: Boolean,
      default: false
    },
    keywordProps: {
      type: String,
      default: ''
    },
    listDataProps: {
      type: Object,
      default: undefined
    }
  },
  data() {
    return {
      listLoading: false,
      listData: [],
      sort: '',
      expandedRow: [],
      simpleAddIssue: false
    }
  },
  computed: {
    ...mapGetters(['userId']),
    refTable() {
      return this.$refs['issueList']
    },
    dynamicParams() {
      return {
        projectId: this.projectId,
        filterConditions: this.filterConditionsProps,
        displayClosed: this.displayClosedProps,
        keyword: this.keywordProps
      }
    },
    isSearch() {
      return this.keywordProps && this.keywordProps !== '' && this.keywordProps.length > 1
    }
  },
  watch: {
    dynamicParams: {
      handler() {
        this.fetchData()
      },
      deep: true
    },
    'listQuery.total'(value) {
      this.$emit('total', value)
    },
    filterConditionsProps: {
      handler() {
        this.resetListQuery()
      },
      deep: true
    },
    keywordProps() {
      this.resetListQuery()
    }
  },

  mounted() {
    if (this.listDataProps === undefined) this.getStoredListQuery()
    else {
      if (this.listDataProps[this.from]) {
        this.listData = this.listDataProps[this.from].data
        this.listQuery = this.listDataProps[this.from].query
      }
      this.$emit('total', this.listData ? this.listData.length : 0)
    }
  },
  methods: {
    ...mapActions('projects', ['setFixedVersionShowClosed', 'getListQuery', 'setListQuery', 'getSort', 'setSort']),
    async getStoredListQuery() {
      const res = await Promise.allSettled([this.getListQuery(), this.getSort()])
      const [storeListQuery, storeSort] = res.map((item) => item.value)
      const storedTabQuery = storeListQuery[`MyWork_${this.from}`]
      const storedSort = storeSort[`MyWork_${this.from}`]
      if (storedTabQuery !== undefined) this.listQuery = storedTabQuery
      if (storedSort !== undefined) this.sort = storedSort
      await this.fetchData()
      return Promise.resolve()
    },
    async fetchData() {
      if (this.listLoading) {
        this.cancelRequest()
      }
      this.listLoading = true
      this.listData = []
      const getAPI = this.from === 'watcher_id' ? getUserWatchList : getUserIssueList
      await getAPI(this.userId, this.getParams())
        .then((res) => {
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
          this.listLoading = false
          this.$emit('list-data')
        })
        .catch(() => {
          this.listLoading = false
        })
      await this.setExpandedRow()
    },
    getParams() {
      const result = {
        offset: this.listQuery.offset,
        limit: this.listQuery.limit,
        from: this.from
      }
      if (this.projectId && this.projectId !== '') {
        result['project_id'] = this.projectId
      }
      if (this.sort) {
        result['sort'] = this.sort
      }
      if (!this.displayClosedProps) {
        result['status_id'] = 'open'
      }
      Object.keys(this.filterConditionsProps).forEach((item) => {
        if (this.filterConditionsProps[item]) {
          result[item + '_id'] = this.filterConditionsProps[item]
        }
      })
      if (this.keywordProps) {
        result['search'] = this.keywordProps
      }
      return result
    },
    setNewListQuery(pageInfo) {
      const {
        // offset,
        // limit,
        // current,
        // pages,
        total
      } = pageInfo
      // if (pages !== 0 && current > pages) {
      //   this.resetListQuery()
      // } else {
      //   this.listQuery = { offset, limit, total, page: current }
      // }
      this.listQuery.total = total
    },
    async resetListQuery() {
      this.listQuery.offset = 0
      this.listQuery.page = 1
      const storeListQuery = await this.getListQuery()
      storeListQuery[`MyWork_${this.from}`] = this.listQuery
      await this.setListQuery(storeListQuery)
      await this.fetchData()
    },
    async setExpandedRow() {
      if (this.expandedRow.length > 0) {
        for (const id of this.expandedRow) {
          const getIssue = this.listData.find((item) => item.id === id)
          if (getIssue.family) await this.getIssueFamilyData(getIssue, [getIssue])
          else this.collapseExpandRow(id)
        }
      }
    },
    async handleSortChange({ prop, order }) {
      const orderBy = this.checkOrder(order)
      this.sort = orderBy ? `${prop}:${orderBy}` : orderBy
      await this.fetchData()
      const storedSort = await this.getSort()
      storedSort[`MyWork_${this.from}`] = this.sort
      await this.setSort(storedSort)
    },
    checkOrder(order) {
      const orderMap = {
        ascending: 'asc',
        descending: 'desc'
      }
      return orderMap[order] || false
    },
    async handlePaginationChange(val) {
      this.listQuery.offset = val.limit * val.page - val.limit
      this.listQuery.limit = val.limit
      this.listQuery.page = val.page
      if (!this.isSearch) await this.fetchData()
      const storeListQuery = await this.getListQuery()
      storeListQuery[`MyWork_${this.from}`] = this.listQuery
      await this.setListQuery(storeListQuery)
    },
    getRowClass({ row }) {
      const result = []
      if (!this.hasRelationIssue(row)) {
        result.push('hide-expand-icon')
      }
      this.contextMenu ? result.push('context-menu') : result.push('cursor-pointer')
      return result.join(' ')
    },
    handleCellClick(row, column) {
      if (column.type === 'action') {
        return false
      }
      if (column.type === 'expand' && this.hasRelationIssue(row)) {
        return this.refTable.toggleRowExpansion(row)
      }
      // this.$router.push({ name: 'issue-detail', params: { issueId: row.id }})
      this.$router.push({ name: 'IssueDetail', params: { issueId: row.id, project: row.project }})
    },
    async getIssueFamilyData(row, expandedRows) {
      this.expandedRow = []
      if (expandedRows.length) this.expandedRow.push(row.id)
      if (expandedRows.find((item) => item.id === row.id)) {
        try {
          this.$set(row, 'isLoadingFamily', true)
          const family = await getIssueFamily(row.id)
          const data = family.data
          this.formatIssueFamilyData(row, data)
          this.$set(row, 'isLoadingFamily', false)
        } catch (e) {
          return Promise.resolve()
        }
      } else {
        this.$set(row, 'showQuickAddIssue', false)
      }
      return Promise.resolve()
    },
    formatIssueFamilyData(row, data) {
      if (data.hasOwnProperty('parent')) {
        this.$set(row, 'parent', data.parent)
      }
      if (data.hasOwnProperty('children')) {
        this.$set(row, 'children', data.children)
      }
      if (data.hasOwnProperty('relations')) {
        this.$set(row, 'relations', data.relations)
      }
    },
    updateAllIssueTables(assignedToId) {
      this.$emit('update', assignedToId)
    },
    hasRelationIssue(row) {
      return row.family
    },
    collapseExpandRow(issueId) {
      const row = this.listData.find((item) => item.id === issueId)
      this.$refs.issueList.toggleRowExpansion(row, false)
    },
    closeQuickAddIssue(row) {
      this.$set(row, 'showQuickAddIssue', false)
      if (!row.family) {
        this.collapseExpandRow(row.id)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  height: calc(100vh - 50px - 20px - 50px - 50px - 50px - 40px);
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

::v-deep .context-menu {
  cursor: context-menu;
}
.add-issue {
  margin-left: 24px;
  margin-right: 29px;
  border: solid 1px #cbcbcb;
  border-radius: 4px;
  padding: 10px;
}
</style>
