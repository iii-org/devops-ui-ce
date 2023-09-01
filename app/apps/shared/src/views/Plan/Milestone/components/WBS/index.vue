<template>
  <div>
    <div :style="{height: `${tableHeight}px`}" class="relative">
      <el-table
        ref="WBS"
        v-el-table-infinite-scroll="fetchMoreData"
        v-loading="listLoading"
        :infinite-scroll-disabled="infiniteScrollDisabled"
        :data="listData"
        :element-loading-text="$t('Loading')"
        :height="tableHeight"
        :row-style="rowStyle"
        class="table-css"
        row-key="id"
        lazy
        :load="getIssueFamilyData"
        fit
        :row-class-name="getRowClass"
        :tree-props="{hasChildren: 'has_children'}"
        @row-contextmenu="handleContextMenu"
        @cell-mouse-enter="handleCellMouseEnter"
        @cell-mouse-leave="handleCellMouseLeave"
        @cell-click="handleCellClick"
        @expand-change="checkResetCreate"
      >
        <WBSInputColumn
          v-if="columns.indexOf('name')>=0"
          min-width="250px"
          :label="$t('Issue.name')"
          prop="name"
          :edit-row-id="editRowId"
          required
          fixed
          show-overflow-tooltip
          sortable
          :has-child-edit="true"
          :show-icon-row-id="showIconRowId"
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
          @onCellClick="handleIssueNameCellClick"
        />
        <el-table-column width="50px">
          <template slot-scope="{row}">
            <div class="action">
              <div
                class="icon"
                @click.stop="handleContextMenu(row, '', $event)"
              >
                <em class="el-icon-more" />
              </div>
            </div>
          </template>
        </el-table-column>
        <WBSSelectColumn
          v-if="columns.indexOf('tracker')>=0"
          width="125px"
          :label="$t('Issue.tracker')"
          prop-key="tracker"
          prop="tracker.id"
          :edit-row-id="editRowId"
          :components="Tracker"
          :options="tracker"
          :strict-options="strictTracker"
          :is-parent-exist="isParentExist"
          sortable
          :has-child-edit="true"
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSSelectColumn
          v-if="columns.indexOf('status')>=0"
          width="125px"
          :label="$t('Issue.status')"
          prop-key="status"
          prop="status.id"
          :edit-row-id="editRowId"
          :components="Status"
          :options="status"
          sortable
          :has-child-edit="true"
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSSelectColumn
          v-if="columns.indexOf('fixed_version')>=0"
          min-width="110px"
          :label="$t('Issue.fixed_version')"
          prop-key="fixed_version"
          prop="fixed_version.id"
          :edit-row-id="editRowId"
          :options="fixedVersion"
          sortable
          :has-child-edit="true"
          show-overflow-tooltip
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSDateColumn
          v-if="columns.indexOf('StartDate')>=0"
          min-width="125px"
          :label="$t('Issue.StartDate')"
          prop="start_date"
          :edit-row-id="editRowId"
          show-overflow-tooltip
          sortable
          before-date-column="due_date"
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSDateColumn
          v-if="columns.indexOf('EndDate')>=0"
          min-width="125px"
          :label="$t('Issue.EndDate')"
          prop="due_date"
          :edit-row-id="editRowId"
          show-overflow-tooltip
          sortable
          after-date-column="start_date"
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSSelectColumn
          v-if="columns.indexOf('priority')>=0"
          min-width="110px"
          :label="$t('Issue.priority')"
          prop-key="priority"
          prop="priority.id"
          :edit-row-id="editRowId"
          :components="Priority"
          :options="priority"
          show-overflow-tooltip
          sortable
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSSelectColumn
          v-if="columns.indexOf('assigned_to')>=0"
          min-width="125px"
          :label="$t('Issue.assigned_to')"
          prop-key="assigned_to"
          prop="assigned_to.id"
          :edit-row-id="editRowId"
          :options="assignedTo"
          :has-child-edit="true"
          show-overflow-tooltip
          sortable
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSInputColumn
          v-if="columns.indexOf('DoneRatio')>=0"
          width="130px"
          :label="$t('Issue.DoneRatio_sm')"
          prop="done_ratio"
          :edit-row-id="editRowId"
          number
          sortable
          :min="0"
          :max="100"
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <WBSInputColumn
          v-if="columns.indexOf('points')>=0"
          width="100px"
          :label="$t('Issue.points')"
          :has-child-edit="true"
          prop="point"
          :edit-row-id="editRowId"
          number
          sortable
          :min="0"
          :max="100"
          @edit="handleUpdateIssue"
          @create="handleCreateIssue"
          @reset-edit="handleResetEdit"
          @reset-create="handleResetCreate"
        />
        <el-empty
          slot="empty"
          :description="$t('general.NoData')"
        />
        <tr
          v-if="scrollLoading"
          slot="append"
          v-loading="scrollLoading"
        >
          <td class="add-issue-inline w-screen text-center" />
        </tr>
        <tr
          v-if="!hasInlineCreate && userRole !=='QA'"
          slot="append"
        >
          <td class="add-issue-inline w-screen">
            <el-link
              type="text"
              icon="el-icon-plus"
              @click="appendIssue()"
            >
              {{ $t('Issue.AddIssue') }}
            </el-link>
          </td>
        </tr>
      </el-table>
      <WBSContextMenu
        v-if="!isMobile"
        ref="contextmenu"
        :context-menu="contextMenu"
        :permission="permission"
        :tags="tags"
        @handleUpdateIssue="handleUpdateIssue"
        @handleRelationUpdate="handleRelationUpdate"
        @handleRelationDelete="handleRelationDelete"
        @toggleIssueMatrixDialog="toggleIssueMatrixDialog"
        @toggleRelationDialog="toggleRelationDialog"
        @appendIssue="appendIssue"
        @addToCalendar="addToCalendar"
        @handleRemoveIssue="handleRemoveIssue"
      />
      <WBSDrawerMenu
        v-else
        ref="drawermenu"
        :context-menu="contextMenu"
        :permission="permission"
        :tags="tags"
        @handleUpdateIssue="handleUpdateIssue"
        @toggleIssueMatrixDialog="toggleIssueMatrixDialog"
        @toggleRelationDialog="toggleRelationDialog"
        @appendIssue="appendIssue"
        @addToCalendar="addToCalendar"
        @handleRemoveIssue="handleRemoveIssue"
      />
      <el-dialog
        :visible.sync="relationDialog.visible"
        :close-on-click-modal="false"
        width="80%"
        :show-close="false"
        append-to-body
      >
        <div slot="title">
          <el-row slot="title" type="flex" align="middle">
            <el-col :xs="24" :md="16">
              <span class="text-title">
                {{ $t('general.Settings', { name: $t('Issue.' + relationDialog.target + 'Issue') }) }}
              </span>
            </el-col>
            <el-col :xs="24" :md="8" class="text-right">
              <el-button class="buttonPrimary" @click="onSaveCheckRelationIssue">
                {{ $t('general.Save') }}
              </el-button>
              <el-button class="buttonSecondaryReverse" @click="toggleRelationDialog(relationDialog.target)">
                {{ $t('general.Close') }}
              </el-button>
            </el-col>
          </el-row>
        </div>
        <SettingRelationIssue
          v-if="relationDialog.visible"
          ref="settingRelationIssue"
          :row.sync="contextMenu.row"
          :target.sync="relationDialog.target"
        />
      </el-dialog>
      <el-dialog
        :visible.sync="issueMatrixDialog.visible"
        width="80%"
        top="20px"
        append-to-body
        destroy-on-close
        :close-on-click-modal="false"
        :title="$t('Issue.TraceabilityMatrix')+'(#'+issueMatrixDialog.row.id+' - '+ issueMatrixDialog.row.name+')'"
      >
        <IssueMatrix
          v-if="issueMatrixDialog.visible"
          :row.sync="issueMatrixDialog.row"
          @update-issue="loadData"
          @onCloseIssueMatrix="onCloseIssueMatrix"
        />
      </el-dialog>
    </div>
    <div v-if="listData?.length < 15 && pageQuery.pages !== 0 && pageQuery.pages !== pageQuery.current">
      <div class="scroll-down-hint" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { cloneDeep } from 'lodash'
import { calendarUrl } from '@shared/utils/addToCalendar'
import { isTimeValid, getLocalTime } from '@shared/utils/handleTime'
import { ics } from '@shared/utils/ics'
import {
  WBSSelectColumn,
  WBSInputColumn,
  WBSDateColumn,
  WBSContextMenu,
  WBSDrawerMenu
} from './components'
import { getProjectIssueList } from '@/api_v2/projects'
import { getIssue, addIssue, deleteIssue, getIssueFamily, updateIssue } from '@/api/issue'
import { CancelRequest } from '@/mixins'
import { Tracker, Priority, Status } from '@/components/Issue'
import ElTableInfiniteScroll from 'el-table-infinite-scroll'

export default {
  name: 'WBS',
  components: {
    WBSSelectColumn,
    WBSInputColumn,
    WBSDateColumn,
    WBSContextMenu,
    WBSDrawerMenu,
    SettingRelationIssue: () => import('@shared/views/Project/IssueList/components/SettingRelationIssue'),
    IssueMatrix: () => import('@/views/Project/IssueDetail/components/IssueMatrix')
    // eslint-disable-next-line vue/no-unused-components
  },
  directives: {
    'el-table-infinite-scroll': ElTableInfiniteScroll
  },
  mixins: [CancelRequest],
  props: {
    filterValue: {
      type: Object,
      default: () => ({})
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
      relationDialog: {
        visible: false,
        target: 'Parent'
      },
      issueMatrixDialog: {
        visible: false,
        row: { id: null, name: null }
      },
      showIconRowId: null,
      infiniteScrollDisabled: false,
      pageQuery: {
        current: 0,
        pages: 0
      },
      scrollLoading: false,
      existCreatedRow: {}
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'priority', 'tracker', 'status', 'userId', 'userRole', 'strictTracker', 'device']),
    hasInlineCreate() {
      const create = this.listData ? this.listData.filter((item) => item.create) : false
      return create.length > 0
    },
    isButtonDisabled() {
      return this.userRole === 'QA'
    },
    permission() {
      return ['Administrator', 'Project Manager', 'Engineer']
    },
    hasNoTagFilter() {
      return !this.filterValue || !this.filterValue.tags || !this.filterValue.tags.length > 0
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  mounted() {
    this.loadData()
    window.addEventListener('resize', this.loadData)
  },
  destroyed() {
    window.removeEventListener('resize', this.loadData)
  },
  methods: {
    getParams() {
      const result = {
        with_point: true,
        wbs: true,
        sort: 'subject:dec',
        parent_id: 'null',
        offset: 5 * this.pageQuery.current,
        limit: 5
      }
      if (this.hasNoTagFilter) {
        delete result.wbs
      } else {
        delete result.parent_id
        delete result.offset
        delete result.limit
      }
      if (!this.displayClosed) {
        result['status_id'] = 'open'
      }
      Object.keys(this.filterValue).forEach((item) => {
        if (this.filterValue[item]) {
          if (item === 'due_date_start' || item === 'due_date_end') {
            result['due_date_start'] = isTimeValid(this.filterValue['due_date_start'])
              ? getLocalTime(this.filterValue['due_date_start'], 'YYYY-MM-DD')
              : null
            result['due_date_end'] = isTimeValid(this.filterValue['due_date_end'])
              ? getLocalTime(this.filterValue['due_date_end'], 'YYYY-MM-DD')
              : null
          } else if (item === 'tags' && this.filterValue[item].length > 0) {
            result[item] = this.filterValue[item].join()
          } else {
            result[item + '_id'] = this.filterValue[item]
          }
        }
      })
      if (this.keyword) {
        result['search'] = this.keyword
      }
      result['only_superproject_issues'] = !!this.filterValue.project
      return result
    },
    async loadData() {
      if (this.listLoading) {
        this.cancelRequest()
      }
      if (this.selectedProjectId === -1) return
      this.initInfiniteScrollQuery()
      this.listData = []
      this.listData = await this.fetchData()
      this.$set(this.$refs['WBS'].resizeState, 'height', 0)
      this.$set(this.$refs['WBS'], 'isGroup', true)
      this.$set(this.$refs['WBS'], 'isGroup', false)

      if (this.issueMatrixDialog.row.id) {
        const issue = await getIssue(this.issueMatrixDialog.row.id)
        this.$nextTick(() => {
          this.issueMatrixDialog.row = issue.data
        })
      }
    },
    initInfiniteScrollQuery() {
      this.infiniteScrollDisabled = false
      this.pageQuery.current = 0
      this.pageQuery.pages = 0
    },
    async fetchData() {
      if (!this.selectedProjectId) return
      this.listLoading = true
      const res = await this.getProjectIssueList()
      if (res.hasOwnProperty('data')) {
        this.listLoading = false
        if (this.hasNoTagFilter) {
          return Promise.resolve(res.data.issue_list.map((item) => this.issueFormatter(item)))
        } else {
          return Promise.resolve(res.data.map((item) => this.issueFormatter(item)))
        }
      }
    },
    async fetchMoreData() {
      if (this.selectedProjectId === -1 ||
        this.infiniteScrollDisabled ||
        this.scrollLoading ||
        !this.hasNoTagFilter) return
      let data = []
      if (this.pageQuery.current <= this.pageQuery.pages) {
        data = await this.getProjectIssueList()
      }
      if (this.pageQuery.current !== 0 &&
        this.pageQuery.pages !== 0 &&
        this.pageQuery.current === this.pageQuery.pages
      ) {
        this.infiniteScrollDisabled = true
      }
      if (data.hasOwnProperty('data')) {
        const formatterData = data.data.issue_list.map((item) => this.issueFormatter(item))
        formatterData.forEach((item) => {
          if (this.listData && !this.listData.find((listDataItem) => listDataItem.id === item.id)) {
            this.listData = this.listData.concat(item)
          }
        })
      }
    },
    async getProjectIssueList() {
      this.scrollLoading = true
      return await getProjectIssueList(
        this.filterValue.project || this.selectedProjectId,
        this.getParams(),
        { cancelToken: this.cancelToken }
      )
        .then((res) => {
          if (this.hasNoTagFilter && res.data) {
            const { current, pages } = res.data.page
            this.pageQuery.current = current
            this.pageQuery.pages = pages
          }
          return res
        })
        .finally(() => {
          this.scrollLoading = false
        })
    },
    issueFormatter(issue) {
      if (Object.keys(issue.assigned_to).length <= 0) {
        issue.assigned_to = { id: null }
      }
      if (Object.keys(issue.fixed_version).length <= 0) {
        issue.fixed_version = { id: null }
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
    async treeDataArray(row, subLevel) {
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
        assigned_to: { id: '', name: '' },
        name: '',
        fixed_version: { id: '', name: '' },
        tracker: { id: findEpic ? findEpic.id : '', name: '' },
        status: { id: 1, name: '' },
        priority: { id: 3, name: '' },
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
          if (data === 'name') form[data] = `${prefill.name}(${this.$t('Issue.Copy')})`
          else form[data] = prefill[data]
        }
      }
      return form
    },
    async appendIssue(row, subLevel, prefill) {
      this.checkResetCreate()
      if (row) this.$set(this.$data, 'isParentExist', Object.prototype.hasOwnProperty.call(row, 'parent_object'))
      const { treeDataArray, updateNodeMap } = await this.treeDataArray(row, subLevel)
      const store = this.$refs.WBS.layout.store
      const { treeData, lazyTreeNodeMap } = store.states
      const timestamp = Math.floor(new Date().getTime() / 1000)
      const issueForm = this.issueForm(prefill, timestamp)
      if (subLevel) {
        // const row_index = treeDataArray.findIndex((issue) => issue.id === row.id)
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
          const row_index = this.listData.findIndex((issue) => issue.id === row.id) + 1
          this.listData.splice(row_index, 0, issueForm)
        } else {
          const { scrollHeight, scrollTop } = this.$refs.WBS.bodyWrapper
          let row_index = Math.round(this.listData.length * scrollTop / scrollHeight) + 2
          if (scrollTop === 0) row_index = 0
          else if (scrollTop === scrollHeight) row_index += 1
          this.listData.splice(row_index, 0, issueForm)
        }
      }
      this.existCreatedRow = issueForm
    },
    async removeIssue(row) {
      let row_index = this.listData.length
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
    async handleRemoveIssue(row, msg, force, detail) {
      const h = this.$createElement
      const issueName = { issueName: row.name }
      const messageList = [h('span', null, this.$t(`Issue.${msg}Issue`, issueName))]
      if (detail) {
        messageList.push(h('ul', null,
          detail.map(issue => {
            let tags = ''
            if (issue.tags && issue.tags.length > 0) {
              tags = issue.tags.map(tag => h('el-tag', { class: { 'mx-1': true }, props: { type: 'mini' }}, tag.name))
            }
            return h('li', null, [
              h('Status', { class: { 'mx-1': true }, props: { name: this.$t(`Issue.${issue.status.name}`), size: 'mini' }}, ''),
              h('Tracker', { props: { name: this.$t(`Issue.${issue.tracker.name}`), size: 'mini' }}, ''),
              h('span', null, [
                h('span', null, `#${issue.id} - `),
                ...tags,
                h('span', null, `${issue.name} ${(Object.keys(issue.assigned_to).length > 0 ? `(${this.$t(`Issue.assigned_to`)}: ${issue.assigned_to.name}
                  -  ${issue.assigned_to.login})` : '')}`)
              ])
            ])
          })
        ))
      }
      const message = h('p', null, messageList)
      const deleteRequest = await this.$confirm(message, this.$t('general.Delete'), {
        confirmButtonText: this.$t('general.Delete'),
        cancelButtonText: this.$t('general.Cancel'),
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }).catch(err => console.error(err))
      if (deleteRequest === 'confirm') {
        this.updateLoading = true
        this.$emit('update-loading', true)
        try {
          await this.deleteIssueAPI(force, row)
        } catch (err) {
          const errorRes = err.response.data
          if (errorRes && errorRes.error.code === 1013) {
            await this.handleRemoveIssue(row, 'ConfirmDelete', true, errorRes.error.details)
          } else {
            this.$emit('update-status', {
              error: err
            })
            this.$message({
              title: this.$t('general.Error').toString(),
              type: 'error',
              message: this.$t(`errorMessage.${err.response.data.error.code}`, err.response.data.error.details).toString()
            })
          }
        }
        this.updateLoading = false
      }
    },
    async deleteIssueAPI(force, row) {
      let params = {}
      if (force) {
        params = { force: force }
      }
      const res = await deleteIssue(row.id, params)
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
    handleCellClick(row, column) {
      if (row.create) return
      if (column.property === 'name' && row.id.toString().includes('new')) return
      if (column.property === 'name' && !row.editColumn) {
        this.$emit('onOpenIssueDetail', row.id)
        return
      }
      if (!this.isButtonDisabled && column['property']) {
        let columnName = column['property'].split('.')
        if (columnName.length >= 2) {
          columnName = columnName[0]
        } else {
          columnName = column['property']
        }
        this.$set(this.$data, 'editRowId', row.id)
        this.$set(this.$data, 'isParentExist', Object.prototype.hasOwnProperty.call(row, 'parent_object'))
        this.$set(row, 'originColumn', cloneDeep(row[columnName]))
        this.$set(row, 'editColumn', columnName)
      }
    },
    handleIssueNameCellClick(row, column) {
      if (!this.isButtonDisabled && column['property']) {
        let columnName = column['property'].split('.')
        if (columnName.length >= 2) {
          columnName = columnName[0]
        } else {
          columnName = column['property']
        }
        this.$set(this.$data, 'editRowId', row.id)
        this.$set(this.$data, 'isParentExist', Object.prototype.hasOwnProperty.call(row, 'parent_object'))
        this.$set(row, 'originColumn', cloneDeep(row[columnName]))
        this.$set(row, 'editColumn', columnName)
      }
    },
    handleResetEdit({ value, row }) {
      this.$set(this.$data, 'editRowId', null)
      this.$set(row, value, row.originColumn)
      this.$set(row, 'editColumn', false)
      this.$set(row, 'originColumn', null)
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
    getFormData(data) {
      const formData = new FormData()
      Object.keys(data).forEach((item) => {
        formData.append(item, data[item])
      })
      return formData
    },
    async handleUpdateIssue({ value, row }) {
      let checkUpdate = false
      if (value['tags']) {
        const tags = row['tags'].map((item) => item.id)
        const findTags = tags.findIndex((item) => item === value['tags'])
        if (findTags >= 0) {
          tags.splice(findTags, 1)
        } else {
          tags.push(value['tags'])
        }
        value = { tags: tags.join(',') }
        checkUpdate = true
      } else if (typeof row.originColumn === 'object' && row.originColumn instanceof Date) {
        if (isTimeValid(row.originColumn)) {
          checkUpdate = value[row.editColumn] !== getLocalTime(row.originColumn, 'YYYY-MM-DD')
        } else {
          checkUpdate = value[`${row.editColumn}_id`] !== row.originColumn.id
        }
      } else {
        checkUpdate = value[row.editColumn] !== row.originColumn
      }
      if (row.name.length <= 0) {
        return
      }
      if (checkUpdate) {
        if (!this.updateLoading) {
          this.updateLoading = true
          this.$emit('update-loading', true)
          try {
            Object.keys(value).forEach((key) => {
              if (value[key] === null) {
                value[key] = ''
              }
            })
            const formData = this.getFormData(value)
            const res = await updateIssue(row.id, formData)
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
              const findIssueIndex = treeDataArray.findIndex((issue) => issue === row.id)
              this.$set(updateNodeMap, findIssueIndex, {
                ...this.issueFormatter(res.data),
                parent_object: row.parent_object
              })
              store.$set(treeData[row.parent_object.id], 'children', treeDataArray)
              store.$set(lazyTreeNodeMap, row.parent_object.id, updateNodeMap)
            } else {
              const row_index = this.listData.findIndex((issue) => row.id === issue.id)
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
              message: this.$t(`errorMessage.${e.response.data.error.code}`, e.response.data.error.details).toString()
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
    async handleCreateIssue({ row }) {
      if (!this.updateLoading) {
        if (row.name.length <= 0) {
          return
        }
        const data = {}
        Object.keys(row).forEach((item) => {
          if (row[item] && typeof row[item] === 'object') {
            data[`${item}_id`] = row[item]['id'] ? row[item]['id'] : null
          } else {
            data[item] = row[item]
          }
        })
        this.updateLoading = true
        this.$emit('update-loading', true)
        try {
          const formData = this.getFormData({ ...data, project_id: this.selectedProjectId })
          const res = await addIssue(formData)
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
            message: this.$t(`errorMessage.${e.response.data.error.code}`, e.response.data.error.details).toString()
          })
        }
        this.existCreatedRow = {}
        this.updateLoading = false
        this.$emit('update-loading', false)
      }
    },
    async getIssueFamilyData(row, treeNode, resolve, treeData) {
      if (!this.hasNoTagFilter) {
        resolve(row.children && row.children.length > 0 ? row.children : [])
        return Promise.resolve()
      }
      try {
        const family = await getIssueFamily(row.id, { params: { with_point: true }})
        const data = family.data
        if (data.hasOwnProperty('children')) {
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
            store.$set(
              treeData[row.id],
              'children',
              data.children.map((item) => item.id)
            )
            store.$set(lazyTreeNodeMap, row.id, childrenData)
          } else {
            resolve(data.children.map((item) => ({ parent_object: { ...row, children: data.children }, ...item })))
          }
        } else {
          if (treeData) {
            const store = this.$refs.WBS.layout.store
            const { treeData, lazyTreeNodeMap } = store.states
            store.$set(treeData[row.id], 'children', [])
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
    handleInputContextMenu({ row, column, event }) {
      this.handleContextMenu(row, column, event)
    },
    handleContextMenu(row, column, event) {
      if (!this.isMobile) {
        this.$refs?.contextmenu.handleContextMenu(row, column, event)
      } else {
        this.$refs?.drawermenu.handleInputDrawerMenu(row)
      }
    },
    handleRelationDelete() {
      this.handleUpdated()
      this.onCloseRelationIssueDialog()
    },
    onSaveCheckRelationIssue() {
      this.$refs.settingRelationIssue.$refs.issueForm.validate((valid) => {
        if (valid) {
          this.onSaveRelationIssue()
        }
      })
    },
    async onSaveRelationIssue() {
      try {
        const getSettingRelationIssue = this.$refs['settingRelationIssue']
        const updateApi = []
        if (getSettingRelationIssue.target === 'Parent') {
          const formData = this.getFormData({ parent_id: getSettingRelationIssue.form.parent_id })
          updateApi.push(
            updateIssue(getSettingRelationIssue.row.id, formData)
          )
        } else if (getSettingRelationIssue.target === 'Children') {
          const appendFormData = this.getFormData({ parent_id: getSettingRelationIssue.row.id })
          const removeFormData = this.getFormData({ parent_id: '' })
          getSettingRelationIssue.children['append'].forEach((item) => {
            updateApi.push(updateIssue(item, appendFormData))
          })
          getSettingRelationIssue.children['remove'].forEach((item) => {
            updateApi.push(updateIssue(item, removeFormData))
          })
        }
        await Promise.all(updateApi)
        this.toggleRelationDialog(getSettingRelationIssue.target)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        this.loadData()
      } catch (e) {
        console.error(e)
      }
    },
    handleRelationUpdate() {
      this.loadData()
      this.$emit('update-selection-list')
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
    handleCellMouseLeave(row) {
      this.showIconRowId = null
    },
    rowStyle({ row }) {
      const style = {}
      if (row.id === this.issueDetailOpenedId) {
        style['background-color'] = '#e5e7eb'
        style['color'] = '#409eff'
      }
      return style
    },
    addToCalendar(type, row) {
      if (type) {
        const { id, name, start_date, due_date, tracker } = row
        if (name) {
          const title = `${tracker.name} #${id}: ${name}`
          const link = `${window.location.origin}/#/project/issues/${id}`
          const description = title.link(link)
          const data = {
            type: type,
            title: name,
            details: description,
            start: start_date,
            end: due_date
          }
          if (type === 'ics') {
            const cal = ics()
            cal.addEvent(name, description, '', getLocalTime(start_date), getLocalTime(due_date))
            cal.download('issue-' + (id || name))
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
    checkResetCreate(row) {
      if (
        Object.keys(this.existCreatedRow).length > 0 &&
        (!row || row.id === this.existCreatedRow.parent_id)
      ) {
        this.handleResetCreate({ row: this.existCreatedRow })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
$light-gray: #9ca3af;
$deep-gray: #333333;

.add-issue-inline {
  @apply pl-5;
  @apply py-3;
}

.table-css {
  height: 100% !important;

  .action {
    @apply flex cursor-pointer;
    width: 15px;
    height: 25px;

    .icon {
      @apply bg-gray-200 text-black rounded-md text-center align-middle px-1;
    }
  }

  ::v-deep table {
    th {
      padding: 5px;
    }

    td {
      padding: 5px;
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
		animation: wheel 2s infinite;
		-webkit-animation: wheel 2s infinite;
	}
}

@keyframes wheel {
	to {
		opacity: 0;
		top: 60px;
	}
}

@-webkit-keyframes wheel {
	to {
		opacity: 0;
		top: 60px;
	}
}

::v-deep .el-table__append-wrapper {
  position: sticky;
  position: -webkit-sticky;
  bottom: 0;
  z-index: 99;
}
</style>
