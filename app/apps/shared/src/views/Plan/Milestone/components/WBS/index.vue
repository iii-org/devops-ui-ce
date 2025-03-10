<template>
  <div>
    <div :style="{ minHeight: `${tableHeight}px` }" class="relative">
      <el-table
        ref="WBS"
        v-el-table-infinite-scroll="fetchMoreData"
        v-loading="listLoading"
        :data="listData"
        :element-loading-text="$t('Loading')"
        :height="tableHeight"
        :infinite-scroll-disabled="infiniteScrollDisabled"
        :load="getIssueFamilyData"
        :row-class-name="getRowClass"
        :row-style="getRowStyle"
        :tree-props="{ hasChildren: 'has_children' }"
        class="table-css"
        fit
        lazy
        row-key="id"
        @row-contextmenu="handleContextMenu"
        @cell-mouse-enter="handleCellMouseEnter"
        @cell-mouse-leave="handleCellMouseLeave"
        @cell-click="handleCellClick"
        @expand-change="checkResetCreate"
      >
        <WBSInputColumn
          v-if="columns.indexOf('subject') >= 0"
          :edit-row-id="editRowId"
          :has-child-edit="true"
          :label="$t('Issue.name')"
          :show-icon-row-id="showIconRowId"
          fixed
          min-width="250px"
          prop="subject"
          required
          show-overflow-tooltip
          sortable
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @onCellClick="handleIssueNameCellClick"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <el-table-column width="50px">
          <template slot-scope="{ row }">
            <div class="action">
              <div
                class="icon"
                @click.stop="handleContextMenu(row, '', $event)"
              >
                <em class="el-icon-more"></em>
              </div>
            </div>
          </template>
        </el-table-column>
        <WBSSelectColumn
          v-if="columns.indexOf('tracker') >= 0"
          ref="tracker"
          :components="Tracker"
          :edit-row-id="editRowId"
          :has-child-edit="true"
          :is-parent-exist="isParentExist"
          :label="$t('Issue.tracker')"
          :options="tracker"
          :strict-options="strictTracker"
          prop="tracker.id"
          prop-key="tracker"
          sortable
          width="155px"
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSSelectColumn
          v-if="columns.indexOf('status') >= 0"
          ref="status"
          :assigned-to="assignedTo"
          :components="Status"
          :edit-row-id="editRowId"
          :has-child-edit="true"
          :label="$t('Issue.status')"
          :options="status"
          prop="status.id"
          prop-key="status"
          width="125px"
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSSelectColumn
          v-if="columns.indexOf('version') >= 0"
          ref="version"
          :edit-row-id="editRowId"
          :edit-row-versions="editRowVersions"
          :has-child-edit="true"
          :label="$t('Issue.version')"
          :options="fixedVersion"
          min-width="110px"
          prop="version.id"
          prop-key="version"
          sortable
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSDateColumn
          v-if="columns.indexOf('StartDate') >= 0"
          ref="start_date"
          :edit-row-id="editRowId"
          :label="$t('Issue.StartDate')"
          before-date-column="due_date"
          min-width="125px"
          prop="start_date"
          sortable
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSDateColumn
          v-if="columns.indexOf('EndDate') >= 0"
          ref="due_date"
          :edit-row-id="editRowId"
          :label="$t('Issue.EndDate')"
          after-date-column="start_date"
          min-width="125px"
          prop="due_date"
          sortable
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSSelectColumn
          v-if="columns.indexOf('priority') >= 0"
          ref="priority"
          :components="Priority"
          :edit-row-id="editRowId"
          :label="$t('Issue.priority')"
          :options="priority"
          min-width="110px"
          prop="priority.id"
          prop-key="priority"
          sortable
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSSelectColumn
          v-if="columns.indexOf('assigned') >= 0"
          ref="assigned"
          :edit-row-assigned-to="editRowAssignedTo"
          :edit-row-id="editRowId"
          :has-child-edit="true"
          :label="$t('Issue.assigned')"
          :options="assignedTo"
          min-width="125px"
          prop="assigned.id"
          prop-key="assigned"
          sortable
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSInputColumn
          v-if="columns.indexOf('done_ratio') >= 0"
          :edit-row-id="editRowId"
          :label="$t('Issue.DoneRatio')"
          :max="100"
          :min="0"
          number
          prop="done_ratio"
          sortable
          width="130px"
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSInputColumn
          v-if="columns.indexOf('points') >= 0"
          :edit-row-id="editRowId"
          :has-child-edit="true"
          :label="$t('Issue.points')"
          :max="100"
          :min="0"
          number
          prop="point"
          sortable
          width="100px"
          @create="handleCreateIssue"
          @edit="handleUpdateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <el-empty
          v-if="listData?.length === 0"
          slot="empty"
          :description="$t('general.NoData')"
        />
        <tr v-if="scrollLoading" slot="append" v-loading="scrollLoading">
          <td class="add-issue-inline w-screen text-center"></td>
        </tr>
        <tr v-if="!hasInlineCreate && userRole !== 'QA'" slot="append">
          <td class="add-issue-inline w-screen">
            <el-link icon="el-icon-plus" type="text" @click="appendIssue()">
              {{ $t('Issue.AddIssue') }}
            </el-link>
          </td>
        </tr>
      </el-table>
      <WBSContextMenu
        v-if="!isMobile"
        ref="contextmenu"
        :columns="columns"
        :context-menu="contextMenu"
        :edit-row-assigned-to="editRowAssignedTo"
        :edit-row-versions="editRowVersions"
        :permission="permission"
        :tags="tags"
        @addToCalendar="addToCalendar"
        @appendIssue="appendIssue"
        @handleRelationDelete="handleRelationDelete"
        @handleRelationUpdate="handleRelationUpdate"
        @handleRemoveIssue="handleRemoveIssue"
        @handleUpdateIssue="handleUpdateIssue"
        @toggleIssueMatrixDialog="toggleIssueMatrixDialog"
        @toggleRelationDialog="toggleRelationDialog"
      />
      <WBSDrawerMenu
        v-else
        ref="drawermenu"
        :context-menu="contextMenu"
        :permission="permission"
        :tags="tags"
        @addToCalendar="addToCalendar"
        @appendIssue="appendIssue"
        @handleRemoveIssue="handleRemoveIssue"
        @handleUpdateIssue="handleUpdateIssue"
        @toggleIssueMatrixDialog="toggleIssueMatrixDialog"
        @toggleRelationDialog="toggleRelationDialog"
      />
      <WBSIssueRelatedDialog
        v-if="relationDialog.visible"
        :context-menu="contextMenu"
        :relation-dialog="relationDialog"
        @onFamilyUpdate="handleFamilyUpdate"
        @onRelationIssueUpdate="onRelationIssueUpdate"
        @toggleRelationDialog="toggleRelationDialog"
      />
      <WBSIssueMatrixDialog
        v-if="issueMatrixDialog.visible"
        :issue-matrix-dialog="issueMatrixDialog"
        @onCloseIssueMatrix="onCloseIssueMatrix"
        @onUpdateIssue="loadData"
      />
      <WBSDeleteWarningDialog
        v-if="deleteWarningDialog.visible"
        :delete-warning-dialog="deleteWarningDialog"
        @onCloseDeleteWarning="onCloseDeleteWarning"
        @onRemoveIssue="handleRemoveIssue"
      />
    </div>
    <div v-if="listData?.length < pageQuery.total">
      <div class="scroll-down-hint"></div>
    </div>
  </div>
</template>

<script>
import {
  deleteIssue,
  getIssueDetails,
  getIssueFamily,
  updateIssue
} from '@/api_v3/issues'
import {
  createProjectIssue,
  getProjectIssueList,
  getProjectUserList,
  getProjectVersion
} from '@/api_v3/projects'
import Priority from '@/components/Issue/Priority'
import Status from '@/components/Issue/Status'
import Tracker from '@/components/Issue/Tracker'
import CancelRequest from '@/mixins/CancelRequest'
import { calendarUrl } from '@shared/utils/addToCalendar'
import { getLocalTime, isTimeValid } from '@shared/utils/handleTime'
import { ics } from '@shared/utils/ics'
import ElTableInfiniteScroll from 'el-table-infinite-scroll'
import { cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'
import { validate as isValidUUID } from 'uuid'

const defaultRowVersions = [{ id: 'null', name: 'VersionUndecided' }]

export default {
  name: 'WBS',
  components: {
    WBSSelectColumn: () => import('./components/WBSSelectColumn'),
    WBSInputColumn: () => import('./components/WBSInputColumn'),
    WBSDateColumn: () => import('./components/WBSDateColumn'),
    WBSContextMenu: () => import('./components/WBSContextMenu'),
    WBSDrawerMenu: () => import('./components/WBSDrawerMenu'),
    WBSIssueRelatedDialog: () => import('./components/WBSIssueRelatedDialog'),
    WBSIssueMatrixDialog: () => import('./components/WBSIssueMatrixDialog'),
    WBSDeleteWarningDialog: () => import('./components/WBSDeleteWarningDialog')
  },
  directives: {
    'el-table-infinite-scroll': ElTableInfiniteScroll
  },
  mixins: [CancelRequest],
  props: {
    filterValue: {
      type: Object,
      default: () => {}
    },
    keyword: {
      type: String,
      default: null
    },
    columns: {
      type: Array,
      default: () => []
    },
    assignedTo: {
      type: Array,
      default: () => []
    },
    fixedVersion: {
      type: Array,
      default: () => []
    },
    tags: {
      type: Array,
      default: () => []
    },
    tableHeight: {
      type: Number,
      default: 0
    },
    displayClosed: {
      type: Boolean,
      default: false
    },
    issueDetailOpenedId: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      Priority,
      Tracker,
      Status,
      listLoading: false,
      listData: [],
      addIssueVisible: false,
      updateLoading: false,
      editRowId: null,
      isParentExist: false,
      contextMenu: { visible: false, row: {}},
      originSelectedRow: {},
      relationDialog: {
        visible: false,
        target: 'Parent'
      },
      issueMatrixDialog: {
        visible: false,
        row: { id: null, subject: null }
      },
      deleteWarningDialog: {
        visible: false,
        row: {},
        relatedIssues: []
      },
      showIconRowId: null,
      infiniteScrollDisabled: false,
      pageQuery: {
        page: 1,
        total: 0
      },
      scrollLoading: false,
      existCreatedRow: {},
      editRowVersions: defaultRowVersions,
      editRowAssignedTo: [
        { id: 'null', name: 'Unassigned' },
        {
          class: 'bg-yellow-100',
          id: this.userId,
          username: '-Me-',
          name: '<<我自己>>'
        }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'selectedProjectId',
      'priority',
      'tracker',
      'status',
      'userId',
      'userRole',
      'strictTracker',
      'device'
    ]),
    hasInlineCreate() {
      const create = this.listData
        ? this.listData.filter((item) => item.create)
        : false
      return create?.length > 0
    },
    isButtonDisabled() {
      return this.userRole === 'QA'
    },
    permission() {
      return ['sysadmin', 'Organization Owner', 'Project Manager', 'Engineer']
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  // watch: {
  //   originSelectedRow: { //TODO: check if this is necessary
  //     handler(newRow) {
  //       if (typeof newRow?.id === 'number') {
  //         this.getIssueFamilyData(newRow, newRow.id, null, true)
  //       }
  //     },
  //     deep: true
  //   }
  // },
  mounted() {
    this.loadData()
    window.addEventListener('resize', this.$emit('resize-table'))
  },
  destroyed() {
    window.removeEventListener('resize', this.$emit('resize-table'))
  },
  methods: {
    getParams() {
      const result = {
        sort: 'subject:asc',
        parent_id: 'null', // root issue only (parent issue only)
        page: this.pageQuery.page,
        limit: 5
      }

      if (!this.displayClosed) {
        result['exclude_closed'] = true
      }

      if (this.keyword) {
        result['search'] = this.keyword
      }

      Object.keys(this.filterValue).forEach((item) => {
        if (this.filterValue[item] && this.filterValue[item] !== '') {
          delete result.parent_id // Show all parent and child issues

          if (this.filterValue[item] === 'overdue') {
            result['is_expired'] = true
            result['expired_days'] = Number(this.filterValue.expiredDays) || ~~1
          } else if (item === 'due_date_start' || item === 'due_date_end') {
            result[item] = isTimeValid(this.filterValue[item])
              ? getLocalTime(this.filterValue[item], 'YYYY-MM-DD')
              : null
          } else if (item === 'tags' && this.filterValue[item]?.length > 0) {
            result[item] = this.filterValue[item].join()
          } else {
            result[item + '_id'] = this.filterValue[item]
          }
        }
      })

      return result
    },
    async loadData() {
      // Cancel request causes infinite scroll failed
      // if (this.listLoading) {
      //   this.cancelRequest()
      // }
      if (this.selectedProjectId === -1) return
      this.initInfiniteScrollQuery()
      this.listData = await this.fetchData()
      this.$nextTick(() => {
        // this.$set(this.$refs['WBS'].resizeState, 'height', 0)
        if (this.$refs['WBS']) {
          this.$set(this.$refs['WBS'], 'isGroup', true)
          this.$set(this.$refs['WBS'], 'isGroup', false)
        }
      })

      if (this.issueMatrixDialog.row.id) {
        const issue = await getIssueDetails(this.issueMatrixDialog.row.id)
        this.$nextTick(() => {
          this.issueMatrixDialog.row = issue.data
        })
      }
    },
    initInfiniteScrollQuery() {
      this.infiniteScrollDisabled = false
      this.pageQuery.page = 1
      this.pageQuery.total = 0
    },
    async fetchData() {
      if (!this.selectedProjectId) return
      this.listLoading = true
      await this.getVersionAssigneeData()
      const res = await this.getProjectIssueList()
      if (res.hasOwnProperty('data')) {
        this.listLoading = false
        return Promise.resolve(
          res.data.items.map((item) => this.issueFormatter(item))
        )
      }
    },
    async fetchMoreData() {
      if (
        this.selectedProjectId === -1 ||
        this.infiniteScrollDisabled ||
        this.scrollLoading
      ) {
        return
      }
      let data = []
      if (this.pageQuery.page < this.pageQuery.pages) {
        this.pageQuery.page += 1
        data = await this.getProjectIssueList()
      } else {
        this.infiniteScrollDisabled = true
      }
      if (data.hasOwnProperty('data')) {
        const formatterData = data.data.items.map((item) =>
          this.issueFormatter(item)
        )
        formatterData.forEach((item) => {
          if (
            this.listData &&
            !this.listData.find((listDataItem) => listDataItem.id === item.id)
          ) {
            this.listData = this.listData.concat(item)
          }
        })
      }
    },
    async getProjectIssueList() {
      this.scrollLoading = true
      return await getProjectIssueList(
        this.selectedProjectId,
        this.getParams(),
        { cancelToken: this.cancelToken }
      )
        .then((res) => {
          if (res.data?.pagination) {
            this.pageQuery = res.data.pagination
            return res
          } else {
            return {
              data: {
                items: res.data
              }
            }
          }
        })
        .finally(() => {
          this.scrollLoading = false
        })
    },
    issueFormatter(issue) {
      if (!issue.assigned) {
        issue.assigned = { id: null }
      }
      if (!issue.version) {
        issue.version = { id: null }
      }
      issue.start_date = issue.start_date ? new Date(issue.start_date) : null
      issue.due_date = issue.due_date ? new Date(issue.due_date) : null
      return issue
    },
    setTreeData(row, treeData, lazyTreeNodeMap) {
      this.$set(row, 'has_children', true)
      this.$set(treeData, row.id, {})
      this.$set(treeData[row.id], 'display', true)
      this.$set(treeData[row.id], 'lazy', true)
      this.$set(treeData[row.id], 'loaded', true)
      this.$set(treeData[row.id], 'loading', false)
      this.$set(treeData[row.id], 'expanded', false)
      this.$set(treeData[row.id], 'children', [])
      if (row.parent_object && treeData[row.parent_object.id]) {
        treeData[row.id]['level'] = treeData[row.parent_object.id]['level'] + 1
      }
      this.$set(lazyTreeNodeMap, row.id, [])
    },
    async getTreeDataArray(row, subLevel) {
      let treeDataArray = []
      let updateNodeMap = []
      const { treeData, lazyTreeNodeMap } = this.$refs.WBS.layout.store.states
      const { states } = this.$refs.WBS.store
      if (row?.id) {
        if (subLevel) {
          if (!treeData[row.id]) {
            this.setTreeData(row, treeData, lazyTreeNodeMap)
          } else if (!states.treeData[row.id].loaded) {
            states.treeData[row.id].loading = true
            await this.getIssueFamilyData(row, row.id, null, true)
            states.treeData[row.id].loaded = true
            states.treeData[row.id].loading = false
          }
          states.treeData[row.id].expanded = true
          treeDataArray = treeData[row.id].children
          updateNodeMap = lazyTreeNodeMap[row.id]
        } else if (row.parent_object) {
          if (row.parent_object.id && treeData[row.parent_object.id]) {
            treeDataArray = treeData[row.parent_object.id].children
            updateNodeMap = lazyTreeNodeMap[row.parent_object.id]
          }
        }
      }
      return { treeDataArray, updateNodeMap }
    },
    issueForm(prefill, timestamp) {
      const findEpic = this.tracker.find((item) => item.name === 'Epic')
      const form = {
        id: `new_${timestamp}`,
        parent_id: null,
        assigned: { id: '', name: '' },
        subject: '',
        version: { id: '', name: '' },
        tracker: { id: findEpic ? findEpic.id : '', name: '' },
        status: { id: 1, name: '' },
        priority: { id: 2, name: '' },
        estimated_hours: 0,
        done_ratio: 0,
        point: 0,
        start_date: '',
        due_date: '',
        create: true,
        description: ''
      }
      for (const data in form) {
        if (!prefill) break
        if (data !== 'id' && data !== 'create' && prefill[data]) {
          if (data === 'subject') {
            form[data] = `${prefill.subject}(${this.$t('Issue.Copy')})`
          } else form[data] = prefill[data]
        }
      }
      return form
    },
    async appendIssue(row, subLevel, prefill) {
      this.checkResetCreate()
      if (row) {
        this.$set(
          this.$data,
          'isParentExist',
          Object.prototype.hasOwnProperty.call(row, 'parent_object')
        )
      }
      const { treeDataArray, updateNodeMap } = await this.getTreeDataArray(
        row,
        subLevel
      )
      const store = this.$refs.WBS.layout.store
      const { treeData, lazyTreeNodeMap } = store.states
      const timestamp = Math.floor(new Date().getTime() / 1000)
      const issueForm = this.issueForm(prefill, timestamp)
      if (subLevel) {
        treeDataArray.splice(0, 0, `new_${timestamp}`)
        issueForm['parent_id'] = row.id
        issueForm['sub_level'] = true
        issueForm['parent_object'] = row
        updateNodeMap.splice(0, 0, issueForm)
        store.$set(treeData[row.id], 'children', treeDataArray)
        store.$set(lazyTreeNodeMap, row.id, updateNodeMap)
      } else if (row?.parent_object) {
        treeDataArray.splice(0, 0, `new_${timestamp}`)
        issueForm['parent_id'] = row.parent_object.id
        issueForm['parent_object'] = row.parent_object
        updateNodeMap.splice(0, 0, issueForm)
        store.$set(treeData[row.parent_object.id], 'children', treeDataArray)
        store.$set(lazyTreeNodeMap, row.parent_object.id, updateNodeMap)
      } else {
        if (row?.id) {
          const row_index =
            this.listData.findIndex((issue) => issue.id === row.id) + 1
          this.listData.splice(row_index, 0, issueForm)
        } else {
          const { scrollHeight, scrollTop } = this.$refs.WBS.bodyWrapper
          let row_index =
            Math.round((this.listData?.length * scrollTop) / scrollHeight) + 2
          if (scrollTop === 0) row_index = 0
          else if (scrollTop === scrollHeight) row_index += 1
          this.listData.splice(row_index, 0, issueForm)
        }
      }
      this.existCreatedRow = issueForm
    },
    async removeIssue(row) {
      let row_index = this.listData?.length
      let treeDataArray = []
      let updateNodeMap = []
      const store = this.$refs.WBS.layout.store
      const { treeData, lazyTreeNodeMap } = store.states
      if (row.id) {
        if (row?.parent_object) {
          if (row.parent_object.id && treeData[row.parent_object.id]) {
            treeDataArray = treeData[row.parent_object.id].children
            updateNodeMap = lazyTreeNodeMap[row.parent_object.id]
          }
          row_index = updateNodeMap.findIndex((issue) => issue.id === row.id)
        } else {
          row_index = this.listData.findIndex((issue) => issue.id === row.id)
        }
      }
      if (row?.parent_object) {
        updateNodeMap.splice(row_index, 1)
        treeDataArray.splice(
          treeDataArray.findIndex((issue) => issue.id === row.id),
          1
        )
        store.$set(lazyTreeNodeMap, row.parent_object.id, updateNodeMap)
      } else {
        this.listData.splice(row_index, 1)
      }
    },
    async handleRemoveIssue(row, force, isDirectDelete = false) {
      if (!row.has_children && !isDirectDelete) {
        this.deleteWarningDialog.visible = true
        this.deleteWarningDialog.row = row
        return
      }
      this.updateLoading = true
      this.$emit('update-loading', true)
      await this.deleteIssueAPI(force, row).catch((error) => {
        const errorRes = error.response.data
        if (errorRes && errorRes.error.code === 400) {
          this.deleteWarningDialog.visible = true
          this.deleteWarningDialog.row = row
          this.deleteWarningDialog.relatedIssues =
            errorRes.error.parameters.children || []
        } else {
          this.$emit('update-status', { error })
          this.$message({
            title: this.$t('general.Error').toString(),
            type: 'error',
            message: this.$t(
              `errorMessage.${error.response.data.error.code}`,
              error.response.data.error.details
            ).toString()
          })
        }
      })
    },
    async deleteIssueAPI(force, row) {
      const res = await deleteIssue(row.id, { force: force })
      this.$emit('update-status', {
        time: res.datetime
      })
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('Notify.Deleted'),
        type: 'success'
      })
      this.updateLoading = false
      this.$emit('update-loading', false)
      await this.removeIssue(row)
    },
    handleContextMenu(row, column, event) {
      this.originSelectedRow = cloneDeep(row)
      if (!this.isMobile) {
        this.$refs?.contextmenu.handleContextMenu(row, column, event)
      } else {
        this.$refs?.drawermenu.handleInputDrawerMenu(row, event)
      }
    },
    handleCellClick(row, column) {
      this.originSelectedRow = cloneDeep(row)
      if (row.create) return
      if (column.property === 'subject' && row.id.toString().includes('new')) {
        return
      }
      if (column.property === 'subject' && !row.editColumn) {
        this.$emit('onOpenIssueDetail', row.id)
        return
      }
      this.handleIssueNameCellClick(row, column)
    },
    handleIssueNameCellClick(row, column) {
      this.originSelectedRow = cloneDeep(row)
      if (!this.isButtonDisabled && column['property']) {
        let columnName = column['property'].split('.')
        if (columnName.length >= 2) {
          columnName = columnName[0]
        } else {
          columnName = column['property']
        }
        this.$set(this.$data, 'editRowId', row.id)
        this.$set(
          this.$data,
          'isParentExist',
          Object.prototype.hasOwnProperty.call(row, 'parent_object')
        )
        this.$set(row, 'originColumn', cloneDeep(row[columnName]))
        this.$set(row, 'editColumn', columnName)
        this.$nextTick(() => {
          // autofocus on the selector
          this.$refs[columnName].$refs[`${columnName}_${row.id}`]?.focus()
        })
      }
    },
    handleResetEdit({ value, row }) {
      if (row.originColumn) {
        this.$set(this.$data, 'editRowId', null)
        this.$set(row, value, row.originColumn)
        this.$set(row, 'editColumn', false)
        this.$set(row, 'originColumn', null)
      }
    },
    handleResetCreate({ row }) {
      let row_index = 0
      let treeDataArray = []
      let updateNodeMap = []
      const store = this.$refs.WBS.layout.store
      const { treeData, lazyTreeNodeMap } = store.states
      if (row?.parent_object) {
        if (row.parent_object.id && treeData[row.parent_object.id]) {
          treeDataArray = treeData[row.parent_object.id].children
          updateNodeMap = lazyTreeNodeMap[row.parent_object.id]
        }
        row_index = treeDataArray.findIndex((issue) => issue === row.id)
        treeDataArray.splice(row_index, 1)
        updateNodeMap.splice(row_index, 1)
        store.$set(treeData[row.parent_object.id], 'children', treeDataArray)
        store.$set(lazyTreeNodeMap, row.parent_object.id, updateNodeMap)
      } else {
        row_index = this.listData.findIndex((issue) => issue.id === row.id)
        this.listData.splice(row_index, 1)
      }
      this.$set(row, 'create', false)
      this.existCreatedRow = {}
    },
    async handleUpdateIssue({ value, row }) {
      const isUpdate = this.checkIssueUpdate(value, row)
      if (row.subject.length <= 0) {
        return
      }

      if (isUpdate) {
        if (!this.updateLoading) {
          this.updateLoading = true
          this.$emit('update-loading', true)
          try {
            Object.keys(value).forEach((key) => {
              if (value[key] === null) {
                value[key] = ''
              }
            })
            const res = await updateIssue(row.id, value)
            this.$set(row, 'editColumn', false)
            this.$set(row, 'originColumn', null)
            if (row.parent_object) {
              let treeDataArray = []
              let updateNodeMap = []
              const store = this.$refs.WBS.layout.store
              const { treeData, lazyTreeNodeMap } = store.states
              if (row.parent_object.id && treeData[row.parent_object.id]) {
                treeDataArray = treeData[row.parent_object.id].children
                updateNodeMap = lazyTreeNodeMap[row.parent_object.id]
              }
              const findIssueIndex = treeDataArray.findIndex(
                (issue) => issue === row.id
              )
              this.$set(updateNodeMap, findIssueIndex, {
                ...this.issueFormatter(res.data),
                parent_object: row.parent_object
              })
              store.$set(
                treeData[row.parent_object.id],
                'children',
                treeDataArray
              )
              store.$set(lazyTreeNodeMap, row.parent_object.id, updateNodeMap)
            } else {
              const row_index = this.listData.findIndex(
                (issue) => row.id === issue.id
              )
              this.$set(this.listData, row_index, this.issueFormatter(res.data))
            }
            this.$emit('update-status', {
              time: res.datetime
            })
            this.$notify({
              title: this.$t('general.Success').toString(),
              type: 'success',
              message: this.$t('Notify.Updated').toString()
            })
          } catch (e) {
            this.$emit('update-status', {
              error: e
            })
            this.$notify({
              title: this.$t('general.Error').toString(),
              type: 'error',
              message: this.$t(
                `errorMessage.${e.response?.data.error.code}`,
                e.response?.data.error.details
              ).toString()
            })
          }
          this.updateLoading = false
          this.$emit('update-loading', false)
        }
      } else {
        this.handleResetEdit({ value, row })
        this.$notify({
          title: this.$t('general.Cancel').toString(),
          type: 'warning',
          message: this.$t('Notify.Same').toString()
        })
      }
    },
    checkIssueUpdate(value, row) {
      let isUpdate = false
      if (value['tags']) {
        const tags = row['tags'].map((item) => item.id)
        const findTags = tags.findIndex((item) => item === value['tags'])
        if (findTags >= 0) {
          tags.splice(findTags, 1)
        } else {
          tags.push(value['tags'])
        }
        value['tags_list'] = tags.join(',')
        isUpdate = true
      } else if (typeof value['priority_id'] === 'number') {
        isUpdate = value['priority_id'] !== this.originSelectedRow.priority.id
      } else if (typeof value['tracker_id'] === 'number') {
        isUpdate = value['tracker_id'] !== this.originSelectedRow.tracker.id
      } else if (typeof value['status_id'] === 'number') {
        isUpdate = value['status_id'] !== this.originSelectedRow.status.id
      } else if (
        value['version_id'] === 'null' ||
        typeof value['version_id'] === 'number'
      ) {
        isUpdate = value['version_id'] !== this.originSelectedRow.version.id
      } else if (
        value['assigned_id'] === 'null' ||
        isValidUUID(value.assigned_id)
      ) {
        value['status_id'] = value['assigned_id'] === 'null' ? 1 : 2
        isUpdate = value['assigned_id'] !== this.originSelectedRow.assigned.id
      } else if (typeof value['done_ratio'] === 'number') {
        isUpdate = value['done_ratio'] !== this.originSelectedRow.done_ratio
      } else if (
        typeof row.originColumn === 'object' &&
        row.originColumn instanceof Date
      ) {
        isUpdate = isTimeValid(row.originColumn)
          ? value[row.editColumn] !==
            getLocalTime(row.originColumn, 'YYYY-MM-DD')
          : value[`${row.editColumn}_id`] !== row.originColumn.id
      } else {
        isUpdate = value[row.editColumn] !== row.originColumn
      }
      return isUpdate
    },
    async handleCreateIssue({ row }) {
      if (!this.updateLoading) {
        if (row.subject.length <= 0) {
          return
        }
        const data = {}
        Object.keys(row).forEach((item) => {
          if (row[item] && typeof row[item] === 'object') {
            data[`${item}_id`] = row[item]['id'] ? row[item]['id'] : null
          } else {
            data[item] = row[item]
          }
          if (data[item] === '') delete data[item]
        })
        this.updateLoading = true
        this.$emit('update-loading', true)
        try {
          const res = await createProjectIssue(this.selectedProjectId, data)
          this.$set(row, 'create', false)
          this.$set(row, 'editColumn', false)
          res.data = this.issueFormatter(res.data)
          Object.keys(res.data).forEach((item) => {
            this.$set(row, item, res.data[item])
          })
          this.$emit('update-status', {
            time: res.datetime
          })
          this.$notify({
            title: this.$t('general.Success').toString(),
            type: 'success',
            message: this.$t('Notify.Added').toString()
          })
        } catch (e) {
          this.$emit('update-status', {
            error: e
          })
          this.$notify({
            title: this.$t('general.Error').toString(),
            type: 'error',
            message: this.$t(
              `errorMessage.${e.response.data.error.code}`,
              e.response.data.error.details
            ).toString()
          })
        }
        this.existCreatedRow = {}
        this.updateLoading = false
        this.$emit('update-loading', false)
      }
    },
    handleFamilyUpdate(issues) {
      Object.values(issues).forEach(async (issue) => {
        await this.getIssueFamilyData(issue, issue.id, null, true)
        if (issue.parent) {
          this.handleFamilyUpdate({
            [issue.parent.id]: issue.parent
          })
        }
      })
    },
    async getIssueFamilyData(row, _, resolve, treeData) {
      try {
        const family = await getIssueFamily(row.id)
        const data = family.data
        if (data.hasOwnProperty('children')) {
          data.children = data.children.map((item) => this.issueFormatter(item))
          if (treeData) {
            const store = this.$refs.WBS.layout.store
            const { treeData, lazyTreeNodeMap } = store.states
            const childrenData = data.children.map((item) => ({
              parent_object: {
                ...row,
                children: data.children
              },
              ...item
            }))
            if (!treeData[row.id]) {
              this.setTreeData(row, treeData, lazyTreeNodeMap)
            }
            store.$set(
              treeData[row.id],
              'children',
              data.children.map((item) => item.id)
            )
            store.$set(lazyTreeNodeMap, row.id, childrenData)
          } else {
            resolve(
              data.children.map((item) => ({
                parent_object: { ...row, children: data.children },
                ...item
              }))
            )
          }
        } else {
          if (treeData) {
            const store = this.$refs.WBS.layout.store
            const { treeData, lazyTreeNodeMap } = store.states
            if (treeData[row.id]) {
              store.$set(treeData[row.id], 'children', [])
            }
            store.$set(lazyTreeNodeMap, row.id, [])
          } else {
            resolve([])
          }
        }
      } catch (e) {
        //   null
        return Promise.resolve()
      }
      return Promise.resolve()
    },
    handleRelationDelete() {
      this.$nextTick(() => {
        this.$refs.contextmenu.relationIssue.visible = false
      })
      this.loadData()
    },
    handleRelationUpdate() {
      this.loadData()
      this.$emit('update-selection-list')
    },
    onRelationIssueUpdate(target) {
      this.toggleRelationDialog(target)
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('Notify.Updated'),
        type: 'success'
      })
      this.loadData()
      this.getIssueFamilyData(
        this.originSelectedRow,
        this.originSelectedRow.id,
        null,
        true
      )
    },
    toggleRelationDialog(target, row) {
      this.relationDialog.visible = !this.relationDialog.visible
      this.relationDialog.target = target
      if (row) {
        this.contextMenu.row = row
      }
    },
    toggleIssueMatrixDialog(row) {
      this.issueMatrixDialog.visible = !this.issueMatrixDialog.visible
      this.issueMatrixDialog.row = row
    },
    getRowClass({ row }) {
      return parseInt(row.id) ? 'cursor-context-menu' : ''
    },
    handleCellMouseEnter(row) {
      this.showIconRowId = row.id
      this.fetchMoreData()
    },
    handleCellMouseLeave() {
      this.showIconRowId = null
    },
    getRowStyle({ row }) {
      const style = {}
      if (row.id === this.issueDetailOpenedId) {
        style['background-color'] = '#e5e7eb'
        style['color'] = '#409eff'
      }
      return style
    },
    addToCalendar(type, row) {
      if (type) {
        const { id, subject, start_date, due_date, tracker } = row

        if (subject) {
          const title = `${tracker.name} #${id}: ${subject}`
          const link = `${window.location.origin}/#/project/issues/${id}`
          const description = title.link(link)
          const data = {
            type: type,
            title: subject,
            details: description,
            start: start_date,
            end: due_date
          }
          if (type === 'ical') {
            ics({
              id,
              subject: subject,
              description,
              begin: getLocalTime(start_date),
              stop: getLocalTime(due_date),
              location: ''
            })
            return
          }
          window.open(calendarUrl(data))
        }
      }
    },
    onCloseIssueMatrix() {
      this.issueMatrixDialog.visible = false
      this.loadData()
    },
    onCloseDeleteWarning() {
      this.deleteWarningDialog.visible = false
    },
    checkResetCreate(row) {
      if (
        Object.keys(this.existCreatedRow).length > 0 &&
        (!row || row.id === this.existCreatedRow.parent_id)
      ) {
        this.handleResetCreate({ row: this.existCreatedRow })
      }
    },
    async getVersionAssigneeData() {
      const editRowVersions = cloneDeep(defaultRowVersions)
      const editRowAssignedTo = cloneDeep([
        { id: 'null', name: 'Unassigned' },
        {
          class: 'bg-yellow-100',
          id: this.userId,
          username: '-Me-',
          name: '<<我自己>>'
        }
      ])

      const params = {
        all: true,
        status: 'open,locked'
      }
      await Promise.allSettled([
        getProjectVersion(this.selectedProjectId, params),
        getProjectUserList(this.selectedProjectId)
      ]).then((res) => {
        const [version, assigned] = res.map((item) => item.value.data)
        version.forEach((version) => editRowVersions.push(version))
        const assignee = assigned.map((user) => ({
          id: user.id,
          username: user.username,
          name: user.full_name
        }))
        assignee.forEach((user) => editRowAssignedTo.push(user))
      })
      this.editRowVersions = editRowVersions
      this.editRowAssignedTo = editRowAssignedTo
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';
@import 'src/styles/theme/transition.scss';
@import 'src/styles/theme/variables.module.scss';

$light-gray: #9ca3af;
$deep-gray: #333333;

$tag-options: (
  active: darken($active, 10%),
  assigned: darken($assigned, 10%),
  closed: darken($closed, 10%),
  inProgress: darken($inProgress, 10%),
  solved: darken($solved, 10%),
  verified: darken($verified, 10%)
);

@each $key, $value in $tag-options {
  ::v-deep .el-tag--#{$key}.cursor-pointer:hover {
    @include background-border-color($value, $value);
    transition: all 0.1s ease;
  }
}

::v-deep .cell {
  .cursor-pointer:hover {
    font-weight: bold;
    transition: all 0.1s ease;
  }
}

.add-issue-inline {
  @apply pl-5 py-5;
}

.table-css {
  //height: 100% !important;
  .action {
    @apply flex cursor-pointer;
    width: 15px;
    height: 25px;

    .icon {
      @apply bg-gray-200 text-black rounded-md text-center align-middle px-1;
    }
  }

  ::v-deep {
    table {
      th {
        padding: 5px;
      }

      td {
        padding: 5px;
      }
    }
  }
}

.scroll-down-hint {
  left: 50%;
  width: 28px;
  height: 42px;
  border: 3px solid $light-gray;
  border-radius: 60px;
  margin-top: 6px;
  position: relative;

  &::before {
    @include css-prefix(animation, wheel 2s infinite);
    content: '';
    width: 10px;
    height: 10px;
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: $deep-gray;
    border-radius: 50%;
    opacity: 1;
  }
}

::v-deep .el-table__append-wrapper {
  position: sticky;
  position: -webkit-sticky;
  bottom: 0;
  z-index: 99;
}

::v-deep .cursor-context-menu {
  cursor: context-menu;
}
</style>
