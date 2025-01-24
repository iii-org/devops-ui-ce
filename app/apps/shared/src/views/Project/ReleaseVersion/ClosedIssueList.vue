<template>
  <div class="app-container">
    <div class="clearfix">
      <div>
        <el-button
          class="previous link-text-color"
          icon="el-icon-arrow-left"
          size="medium"
          type="text"
          @click="handleBackPage"
        >
          {{ $t('general.Back') }}
        </el-button>
        <div class="text-right float-right">
          <el-popover placement="bottom" trigger="click">
            <el-form v-loading="listLoading">
              <template v-for="dimension in filterOptions">
                <el-form-item :key="dimension.id">
                  <div slot="label">
                    {{ $t('Issue.' + dimension.value) }}
                    <el-tag
                      v-if="dimension.value === 'version'"
                      class="flex-1"
                      type="info"
                    >
                      <el-checkbox v-model="version_closed">
                        {{ $t('Issue.DisplayClosedVersion') }}
                      </el-checkbox>
                    </el-tag>
                  </div>
                  <el-select
                    v-model="filterValue[dimension.value]"
                    :disabled="selectedProjectId === -1"
                    :placeholder="$t('Issue.Select' + dimension.placeholder)"
                    clearable
                    filterable
                    @change="loadData"
                  >
                    <el-option
                      v-for="item in dimension.value === 'status'
                        ? filterClosedStatus($data[dimension.value])
                        : $data[dimension.value]"
                      :key="item.id"
                      :label="getSelectionLabel(item)"
                      :value="item.id"
                    >
                      <component
                        :is="dimension.value"
                        v-if="dimension.tag"
                        :name="$t(`Issue.${item.name}`)"
                        :type="item.name"
                      />
                    </el-option>
                  </el-select>
                </el-form-item>
              </template>
              <el-form-item
                :label="$t('Issue.DisplayClosedIssue')"
                class="checkbox"
              >
                <el-checkbox v-model="displayClosed" @change="loadData" />
              </el-form-item>
            </el-form>
            <el-button
              slot="reference"
              class="header-text-color"
              disabled
              icon="el-icon-s-operation"
              type="text"
            >
              {{ displayFilterValue }}
            </el-button>
          </el-popover>
          <el-divider direction="vertical" />
          <el-input
            v-if="searchVisible"
            id="input-search"
            v-model="keyword"
            :placeholder="$t('Issue.SearchNameOrAssignee')"
            clearable
            prefix-icon="el-icon-search"
            style="width: 250px"
            @blur="searchVisible = !searchVisible"
            @change="loadData"
          />
          <el-button
            v-else
            class="header-text-color"
            icon="el-icon-search"
            type="text"
            @click="searchVisible = !searchVisible"
          >
            {{ $t('general.Search') + (keyword ? ': ' + keyword : '') }}
          </el-button>
        </div>
      </div>
    </div>
    <el-divider />
    <el-row v-loading="listLoading" :element-loading-text="$t('Loading')">
      <el-table
        ref="issueList"
        :data="pagedData"
        :row-class-name="getRowClass"
        :tree-props="{ children: 'child' }"
        fit
        height="60vh"
        highlight-current-row
        row-key="id"
        @cell-click="handleClick"
        @expand-change="getIssueFamilyData"
        @sort-change="handleSortChange"
      >
        <el-table-column class-name="informationExpand" type="expand">
          <template slot-scope="{ row }">
            <IssueExpand :issue="row" />
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
          :label="$t('Issue.Id')"
          min-width="280"
          prop="id"
          show-overflow-tooltip
          sortable="custom"
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
          :label="$t('Issue.Assignee')"
          align="center"
          min-width="180"
          prop="assigned"
          sortable="custom"
        >
          <template slot-scope="scope">
            <span>{{ scope.row.assigned?.full_name }}</span>
            <span v-if="scope.row.assigned?.username">({{ scope.row.assigned.username }})</span>
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        :layout="'total, prev, pager, next'"
        :limit="listQuery.limit"
        :page="listQuery.page"
        :total="listQuery.total"
        @pagination="handleCurrentChange"
      />
    </el-row>
  </div>
</template>

<script>
import {
  getIssueFamily,
  getIssuePriority,
  getIssueStatus,
  getIssueTracker
} from '@/api_v3/issues'
import {
  getProjectIssueList,
  getProjectUserList,
  getProjectVersion
} from '@/api_v3/projects'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import axios from 'axios'
import { mapActions, mapGetters } from 'vuex'

/**
 * @param row.relations  row maybe have parent or children issue
 * @param data.issue_list get paged data from api
 */

export default {
  name: 'ClosedIssueList',
  components: {
    ContextMenu: () => import('@/components/Issue/ContextMenu'),
    Priority: () => import('@/components/Issue/Priority'),
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker'),
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    IssueExpand: () => import('@/components/Issue/IssueExpand')
  },
  mixins: [BasicData, Pagination],
  data() {
    return {
      searchVisible: false,
      version_closed: false,
      displayClosed: true,
      search: '',
      sort: '',
      version: [],
      tracker: [],
      assigned: [],
      status: [],
      priority: [],
      filterOptions: Object.freeze([
        {
          id: 1,
          label: this.$t('Issue.FilterDimensions.status'),
          value: 'status',
          placeholder: 'Status',
          tag: true
        },
        {
          id: 2,
          label: this.$t('Issue.FilterDimensions.tracker'),
          value: 'tracker',
          placeholder: 'Type',
          tag: true
        },
        {
          id: 3,
          label: this.$t('Issue.FilterDimensions.assigned'),
          value: 'assigned',
          placeholder: 'Member'
        },
        {
          id: 4,
          label: this.$t('Issue.FilterDimensions.version'),
          value: 'version',
          placeholder: 'Version'
        },
        {
          id: 5,
          label: this.$t('Issue.FilterDimensions.priority'),
          value: 'priority',
          placeholder: 'Priority',
          tag: true
        }
      ]),
      filterValue: {},
      originFilterValue: {},
      quickChangeDialogVisible: false,
      quickChangeForm: {},
      assigneeList: [],
      form: {},
      keyword: null,
      lastIssueListCancelToken: null
    }
  },
  computed: {
    ...mapGetters([
      'userRole',
      'userId',
      'fixedVersionShowClosed',
      'selectedProjectId'
    ]),
    contextOptions() {
      const result = {}
      this.filterOptions.forEach((item) => {
        result[item.value] = this[item.value]
      })
      return result
    },
    displayFilterValue() {
      const result = []
      Object.keys(this.filterValue).forEach((item) => {
        if (this.filterValue[item]) {
          const value = this[item].find(
            (search) => search.id === this.filterValue[item]
          )
          if (value) {
            result.push(this.getSelectionLabel(value))
          }
        }
      })
      return (
        this.$t('general.Filter') +
        (result.length > 0 ? ': ' : '') +
        result.join(', ')
      )
    }
  },
  watch: {
    version_closed(value) {
      // this.setFixedVersionShowClosed(value)
      this.loadVersionList(value)
    },
    version: {
      handler(value) {
        if (value && value.length > 0) {
          this.getFixedVersionClosed()
          this.loadData()
        }
      },
      immediate: true
    }
  },
  async created() {
    this.version_closed = true
    await this.loadSelectionList()
  },
  methods: {
    ...mapActions('projects', ['setFixedVersionShowClosed']),
    handleBackPage() {
      this.$router.push({
        name: 'ReleaseVersion',
        params: { projectName: this.selectedProject.name }
      })
    },
    getFixedVersionClosed() {
      const version = this.version.filter(
        (item) => item.name === this.$route.params.issueTag
      )[0]?.id
      if (version) {
        this.filterValue = {
          version,
          status: 6
        }
      }
    },
    showNoProjectWarning() {
      // noinspection JSCheckFunctionSignatures
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.NoProject'),
        type: 'warning'
      })
      this.listLoading = false
    },
    getParams() {
      const result = {
        page: this.listQuery.page,
        limit: this.listQuery.limit
      }
      if (this.sort) {
        result['sort'] = this.sort
      }
      Object.keys(this.filterValue).forEach((item) => {
        if (this.filterValue[item]) {
          result[item + '_id'] = this.filterValue[item]
        }
      })
      if (this.keyword) {
        result['search'] = this.keyword
      }
      return result
    },
    async fetchData() {
      if (this.selectedProjectId === -1) {
        this.showNoProjectWarning()
        return []
      }
      let data
      try {
        // const params = await
        if (this.lastIssueListCancelToken && this.listLoading) {
          this.lastIssueListCancelToken.cancel()
        }
        const cancelTokenSource = axios.CancelToken.source()
        this.lastIssueListCancelToken = cancelTokenSource
        if (!this.getParams().version_id) return []
        const listData = await getProjectIssueList(
          this.selectedProjectId,
          this.getParams(),
          { cancelToken: cancelTokenSource.token }
        )
        data = listData.data.items
        if (listData.data.hasOwnProperty('pagination')) {
          this.listQuery = listData.data.pagination
        }
      } catch (e) {
        // null
      }
      return data
    },
    async loadVersionList(status) {
      let params = { all: true, status: 'open,locked' }
      if (status) {
        params = { all: true, status: 'closed' }
      }
      const versionList = await getProjectVersion(
        this.selectedProjectId,
        params
      )
      this.version = [
        { name: this.$t('Issue.VersionUndecided'), id: 'null' },
        ...versionList.data
      ]
    },
    async loadSelectionList() {
      await Promise.allSettled([
        getProjectUserList(this.selectedProjectId),
        getIssueTracker(),
        getIssueStatus(),
        getIssuePriority()
      ]).then((res) => {
        const [assigneeList, typeList, statusList, priorityList] = res.map(
          (item) => item.value.data
        )
        this.tracker = typeList
        this.assigned = [
          { full_name: this.$t('Issue.Unassigned'), id: 'null' },
          ...assigneeList
        ]
        this.status = statusList
        this.priority = priorityList
      })
      await this.loadVersionList(this.version_closed)
    },
    getSelectionLabel(item) {
      const visibleStatus = ['closed', 'locked']
      let result = this.$te('Issue.' + item.name)
        ? this.$t('Issue.' + item.name)
        : item.name
      if (
        item.hasOwnProperty('status') &&
        visibleStatus.includes(item.status)
      ) {
        result +=
          ' (' +
          (this.$te('Issue.' + item.status)
            ? this.$t('Issue.' + item.status)
            : item.status) +
          ')'
      }
      return result
    },
    async getIssueFamilyData(row, expandedRows) {
      if (expandedRows.find((item) => item.id === row.id)) {
        try {
          this.$set(row, 'isLoadingFamily', true)
          const family = await getIssueFamily(row.id)
          const data = family.data
          if (data.hasOwnProperty('parent')) {
            await this.$set(row, 'parent', data.parent)
          }
          if (data.hasOwnProperty('children')) {
            await this.$set(row, 'children', data.children)
          }
          if (data.hasOwnProperty('relations')) {
            await this.$set(row, 'relations', data.relations)
          }
          this.$set(row, 'isLoadingFamily', false)
        } catch (e) {
          //   null
        }
      }
    },
    filterClosedStatus(statusList) {
      if (this.displayClosed) return statusList
      return statusList.filter((item) => item.is_closed === false)
    },
    handleClick(row, column) {
      if (column.type === 'expand' && this.isRelationIssueLoading(row)) {
        this.$refs['issueList'].toggleRowExpansion(row)
      } else if (column.type === 'expand' && this.hasRelationIssue(row)) {
        this.$refs['issueList'].toggleRowExpansion(row)
      } else {
        this.$router.push({
          name: 'IssueDetail',
          params: { issueId: row.id, disableButton: true }
        })
      }
    },
    isRelationIssueLoading(row) {
      if (row.has_family && !row.hasOwnProperty('loadingRelation')) {
        this.$set(row, 'loadingRelation', false)
      }
      return row.loadingRelation
    },
    hasRelationIssue(row) {
      return row.has_family
    },
    handleSortChange({ prop, order }) {
      const orderBy = this.checkOrder(order)
      if (orderBy) {
        this.sort = prop + ':' + orderBy
      } else {
        this.sort = orderBy
      }
      this.loadData()
    },
    checkOrder(order) {
      switch (order) {
        case 'descending':
          return 'desc'
        case 'ascending':
          return 'asc'
        case null:
          return false
      }
    },
    getRowClass({ row }) {
      const result = []
      if (this.isRelationIssueLoading(row)) {
        result.push('row-expand-loading')
      } else if (this.hasRelationIssue(row) === false) {
        result.push('row-expand-cover')
      }
      result.push('context-menu')
      return result.join(' ')
    },
    backToFirstPage() {
      this.listQuery.page = 1
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .row-expand-cover .el-table__expand-column .cell {
  display: none;
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
</style>
