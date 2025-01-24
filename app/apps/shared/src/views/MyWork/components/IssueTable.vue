<template>
  <div>
    <el-row v-loading="listLoading" :element-loading-text="$t('Loading')">
      <el-table
        ref="issueList"
        :data="isSearch ? pagedData : listData"
        :expand-row-keys="expandedRow"
        :row-class-name="getRowClass"
        :tree-props="{ children: 'child' }"
        highlight-current-row
        row-key="id"
        size="mini"
        @row-contextmenu="handleContextMenu"
        @cell-click="handleCellClick"
        @expand-change="getIssueFamilyData"
        @sort-change="handleSortChange"
      >
        <el-table-column type="expand">
          <template slot-scope="{ row }">
            <el-row v-if="row.showQuickAddIssue" class="add-issue">
              <QuickAddIssue
                :filter-conditions="filterConditionsProps"
                :is-table="true"
                :parent="row"
                :project-id="row.project.id"
                :sub-issue="true"
                :visible.sync="row.showQuickAddIssue"
                @close="closeQuickAddIssue(row)"
                @update="fetchData"
              />
            </el-row>
            <IssueExpand
              :issue="row"
              style="margin-right: 20px"
              @update="fetchData"
              @on-context-menu="onContextMenu"
              @handle-expand-row="collapseExpandRow"
            />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('general.Type')"
          prop="tracker"
          sortable="custom"
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
          :label="$t('Project.Name')"
          min-width="150"
          prop="project"
          show-overflow-tooltip
          sortable="custom"
        >
          <template slot-scope="scope">
            {{ scope.row.project.display_name }}
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Issue.Id')"
          min-width="280"
          prop="id"
          show-overflow-tooltip
          sortable="custom"
        >
          <template slot-scope="scope">
            <span style="display: flex">
              <div
                class="text-success mr-2"
                style="display: flex; align-items: center"
              >
                #{{ scope.row.id }}
              </div>
              <div class="truncate">
                <template v-if="scope.row.tags.length > 0">
                  <el-tag
                    v-for="item in scope.row.tags"
                    :key="item.id"
                    class="mr-1"
                    size="mini"
                  >
                    [{{ item.name }}]
                  </el-tag>
                  <br />
                </template>
                {{ scope.row.subject }}
              </div>
            </span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Issue.Priority')"
          align="center"
          prop="priority"
          sortable="custom"
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
          :label="$t('general.Status')"
          align="center"
          prop="status"
          sortable="custom"
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
          v-if="from === 'author'"
          :label="$t('Issue.Assignee')"
          align="center"
          min-width="180"
          prop="assigned"
          show-overflow-tooltip
          sortable="custom"
        >
          <template v-if="scope.row.assigned" slot-scope="scope">
            <span>
              {{ scope.row.assigned.full_name }}
            </span>
            <span v-if="scope.row.assigned.username">
              ({{ scope.row.assigned.username }})
            </span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="from === 'assigned'"
          :label="$t('Issue.Author')"
          align="center"
          min-width="180"
          prop="author"
          show-overflow-tooltip
          sortable="custom"
        >
          <template v-if="scope.row.author" slot-scope="scope">
            <span>
              {{ scope.row.author.full_name }}
            </span>
            <span v-if="scope.row.author.username">
              ({{ scope.row.author.username }})
            </span>
          </template>
        </el-table-column>
        <template slot="empty">
          <el-empty :description="$t('general.NoData')" :image-size="100" />
        </template>
      </el-table>
      <Pagination
        ref="pagination"
        :layout="'total, sizes, prev, pager, next'"
        :limit="listQuery.limit"
        :page="listQuery.page"
        :page-sizes="[10, 25, 50, 100]"
        :total="listQuery.total"
        @pagination="handlePaginationChange"
      />
    </el-row>
    <ContextMenu
      ref="contextmenu"
      :filter-column-options="filterOptions"
      :row="contextMenu.row"
      :selection-options="contextOptions"
      :simple-add-issue="isTable"
      :visible="contextMenu.visible"
      @update="updateAllIssueTables"
      @update-row="getContextRow"
    />
  </div>
</template>

<script>
import { getIssueFamily } from '@/api_v3/issues'
import { getUserIssueList } from '@/api_v3/user'
import CancelRequest from '@/mixins/CancelRequest'
import ContextMenu from '@/mixins/ContextMenu'
import Pagination from '@/mixins/Pagination'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'MyWorkIssueTable',
  components: {
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker'),
    Priority: () => import('@/components/Issue/Priority'),
    IssueExpand: () => import('@/components/Issue/IssueExpand'),
    QuickAddIssue: () => import('./QuickAddIssue')
  },
  mixins: [ContextMenu, Pagination, CancelRequest],
  props: {
    from: {
      type: String,
      default: 'assigned'
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
      return (
        this.keywordProps &&
        this.keywordProps !== '' &&
        this.keywordProps.length > 1
      )
    }
  },
  watch: {
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
    ...mapActions('projects', [
      'setFixedVersionShowClosed',
      'getListQuery',
      'setListQuery',
      'getSort',
      'setSort'
    ]),
    async getStoredListQuery() {
      const res = await Promise.allSettled([
        this.getListQuery(),
        this.getSort()
      ])
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
      await getUserIssueList(this.userId, this.getParams())
        .then((res) => {
          if (this.isSearch) {
            this.listData = res.data.items.map((element) => ({
              ...element,
              showQuickAddIssue: false
            }))
            this.setNewListQuery({ total: res.data.pagination.total })
          } else {
            this.listData = res.data.items.map((element) => ({
              ...element,
              showQuickAddIssue: false
            }))
            this.setNewListQuery(res.data.pagination)
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
        page: this.listQuery.page,
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
        result['exclude_closed'] = true
      }
      Object.keys(this.filterConditionsProps).forEach((item) => {
        if (this.filterConditionsProps[item]) {
          result[item + '_id'] = this.filterConditionsProps[item]
        }
      })
      if (result.status_id) delete result.closed
      if (this.keywordProps) {
        result['search'] = this.keywordProps
      }
      return result
    },
    setNewListQuery(pageInfo) {
      const { total } = pageInfo
      this.listQuery.total = total
    },
    async resetListQuery() {
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
          if (getIssue.has_family) {
            await this.getIssueFamilyData(getIssue, [getIssue])
          } else this.collapseExpandRow(id)
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
      this.contextMenu
        ? result.push('context-menu')
        : result.push('cursor-pointer')
      return result.join(' ')
    },
    handleCellClick(row, column) {
      if (column.type === 'action') {
        return false
      }
      if (column.type === 'expand' && this.hasRelationIssue(row)) {
        return this.refTable.toggleRowExpansion(row)
      }
      this.$router.push({
        name: 'IssueDetail',
        params: { issueId: row.id, project: row.project }
      })
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
      return row.has_family
    },
    collapseExpandRow(issueId) {
      const row = this.listData.find((item) => item.id === issueId)
      this.$refs.issueList.toggleRowExpansion(row, false)
    },
    closeQuickAddIssue(row) {
      this.$set(row, 'showQuickAddIssue', false)
      if (!row.has_family) {
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
