<template>
  <div v-loading="listLoading">
    <div class="header resizeHeight">
      <Kanban
        v-if="listData && listData.length > 0"
        :id="`kanban-work_${from}`"
        :board-object="{ id: 1, is_closed: false, name: 'Active' }"
        :dimension="'version'"
        :disabled="true"
        :from-tab="from"
        :from-wbs="true"
        :list="listData"
        :status="status"
        class="kanban"
        @contextmenu="handleDrawerMenu"
        @relationIssueId="handleCellClick($event)"
        @update="updateAllIssueTables"
      />
      <el-empty v-else :description="$t('general.NoData')" :image-size="100" />
    </div>
    <Pagination
      v-if="listData && listData.length > 0"
      ref="pagination"
      :layout="'total, prev, pager, next'"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :pager-count="5"
      :total="listQuery.total"
      class="pagination"
      small
      @pagination="handlePaginationChange"
    />
    <el-drawer
      v-loading="listLoading"
      :title="`#${contextMenu.row.id} - ${contextMenu.row.name}`"
      :visible.sync="contextMenu.visible"
      class="drawer"
      destroy-on-close
      direction="btt"
      size="60%"
    >
      <DrawerMenu
        :key="drawerKey"
        ref="contextmenu"
        :filter-column-options="filterOptions"
        :row="contextMenu.row"
        @update="updateAllIssueTables"
        @update-row="getContextRow"
      />
    </el-drawer>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Kanban from '@shared/views/Project/IssueBoards/components/Kanban'
import { getUserIssueList } from '@/api_v3/user'
import ContextMenu from '@/mixins/ContextMenu'
import Pagination from '@/mixins/Pagination'
import CancelRequest from '@/mixins/CancelRequest'

export default {
  name: 'MyWorkMobile',
  components: {
    Kanban,
    DrawerMenu: () => import('@/components/Issue/DrawerMenu')
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
      listData: [],
      listLoading: false,
      drawerKey: 0
    }
  },
  computed: {
    ...mapGetters(['projectOptions', 'userId', 'status']),
    dynamicParams() {
      return {
        projectId: this.projectId,
        filterConditions: this.filterConditionsProps,
        displayClosed: this.displayClosedProps,
        keyword: this.keywordProps
      }
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
    }
  },
  mounted() {
    if (this.listDataProps === undefined) this.getStoredListQuery()
    else {
      this.listData = this.listDataProps[this.from].data
      this.listQuery = this.listDataProps[this.from].query
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
      await getUserIssueList(this.userId, this.getParams())
        .then(async (res) => {
          this.listData = res.data.items
          this.listData = this.listData.map((element) => ({
            ...element,
            showQuickAddIssue: false
          }))
          this.setNewListQuery(res.data.pagination)
          this.listLoading = false
          this.$emit('list-data')
        })
        .catch(() => {
          this.listLoading = false
        })
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
      if (this.keywordProps) {
        result['search'] = this.keywordProps
      }
      return result
    },
    setNewListQuery(pageInfo) {
      const { limit, page, total, pages } = pageInfo
      if (pages !== 0 && page > pages) {
        this.resetListQuery()
      } else {
        this.listQuery = { limit, total, page }
      }
    },
    async setExpandedRow() {
      if (this.expandedRow.length > 0) {
        for (const row of this.expandedRow) {
          const getIssue = this.listData.find((item) => item.id === row.id)
          await this.getIssueFamilyData(getIssue, this.expandedRow)
        }
      }
    },
    async handleSortChange({ prop, order }) {
      const orderBy = this.checkOrder(order)
      this.sort = orderBy ? `${prop}:${orderBy}` : orderBy
      this.fetchData()
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
      await this.fetchData()
      const storeListQuery = await this.getListQuery()
      storeListQuery[`MyWork_${this.from}`] = this.listQuery
      await this.setListQuery(storeListQuery)
    },
    async resetListQuery() {
      this.listQuery.page = 1
      const storeListQuery = await this.getListQuery()
      storeListQuery[`MyWork_${this.from}`] = this.listQuery
      await this.setListQuery(storeListQuery)
      await this.fetchData()
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
    handleCellClick(issue) {
      this.$router.push({
        name: 'IssueDetail',
        params: { issueId: issue.id, project: issue.project }
      })
    },
    updateAllIssueTables(assignedToId) {
      this.$emit('update', assignedToId)
    },
    handleDrawerMenu(val) {
      this.drawerKey = val.id
      this.contextMenu.visible = true
      this.contextMenu.row = val
    }
  }
}
</script>

<style lang="scss" scoped>
.kanban {
  width: auto;
  background-color: white;

  ::v-deep .board-item {
    margin-top: 5px !important;
  }
}

.pagination {
  padding: 2px;
  background: transparent;
}

::v-deep .board-column {
  background-color: white;
}

.drawer {
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }

  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    padding: 10px;
  }

  ::v-deep .el-drawer__body::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }

  ::v-deep .el-drawer__body {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
}
</style>
