<template>
  <section>
    <el-tooltip
      :open-delay="100"
      :content="socket.connected ?
        $t('general.SocketConnected') :
      $t('general.ReconnectByReload')"
      placement="left"
    >
      <transition name="el-fade-in">
        <div
          :style="{
            'right': '30px',
            'bottom': '30px'
          }"
          class="el-backtop"
        >
          <el-button
            slot="button"
            :type="(socket.connected)? 'success': 'danger'"
            icon="el-icon-connection"
            circle
            class="socket-button"
            @click="onSocketConnect"
          />
        </div>
      </transition>
    </el-tooltip>
    <el-tooltip
      v-if="socket.disconnected"
      :open-delay="100"
      :content="$t('general.Reload')"
      placement="left"
    >
      <transition name="el-fade-in">
        <div
          :style="{
            'right': '30px',
            'bottom': '90px'
          }"
          class="el-backtop"
        >
          <el-button
            slot="button"
            icon="el-icon-refresh"
            class="button-primary-reverse"
            circle
            @click="reloadPage"
          />
        </div>
      </transition>
    </el-tooltip>
    <div class="board">
      <div class="header fix-header">
        <div
          v-for="headerName in boardHeaderName"
          :id="'card' + headerName.id"
          :key="headerName.id"
        >
          <div
            :class="getHeaderBarClassName(headerName.name)"
            class="board-column"
            style="margin-top: 0"
          >
            <div class="board-column-header">
              <div class="header-bar" />
              <el-row class="flex">
                <el-col class="text-center">
                  {{ getTranslateHeader(headerName.name) }}
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>
      <div
        class="header"
      >
        <el-table
          v-loading="listLoading"
          v-if="groupBy.dimension === 'status'"
          ref="issueList"
          :element-loading-text="$t('Loading')"
          :data="listData"
          :tree-props="{ children: 'child' }"
          :row-class-name="setClassName"
          row-key="id"
          @row-contextmenu="handleContextMenu"
          @expand-change="getBoardData"
          @row-click="handleRowClick"
        >
          <el-table-column type="expand">
            <template slot-scope="{row}">
              <el-row
                v-loading="row.hasOwnProperty('isLoadingFamily')
                && row.isLoadingFamily"
              >
                <div class="header resizeHeight">
                  <Kanban
                    v-for="classObj in boardHeaderName"
                    :id="'card_' + row.id + '_' + classObj.id"
                    :key="classObj.id"
                    :board-object="{parent_id: row.id, ...classObj}"
                    :list="boardData[row.id] ? boardData[row.id].children[classObj.id] : []"
                    :status="status"
                    :group="group"
                    :dimension="'status'"
                    :from-wbs="true"
                    :element-ids="elementIds"
                    @relationIssueId="onRelationIssueDialog($event, row.id, classObj.id)"
                    @update="updateIssueStatus"
                    @contextmenu="handleContextMenu"
                  />
                </div>
              </el-row>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('Issue.name')"
            show-overflow-tooltip
            prop="id"
          >
            <template slot-scope="scope">
              <span class="text-success mr-2">#{{ scope.row.id }}</span>
              <el-link
                class="link-text-color"
                @click.stop="onRelationIssueDialog(scope.row)"
              >
                {{ scope.row.name }}
              </el-link>
              <Status
                v-if="scope.row.status.name"
                :name="$t(`Issue.${scope.row.status.name}`)"
                :type="scope.row.status.name"
                :size="'mini'"
              />
              <el-tag
                v-for="item in scope.row.tags"
                :key="item.id"
                size="mini"
                class="mr-1"
              >
                [{{ item.name }}]
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('Issue.assigned_to')"
            prop="assigned_to.name"
            width="200px"
            align="center"
          />
          <el-table-column
            :label="$t('Issue.EndDate')"
            width="120px"
            prop="due_date"
            align="center"
          >
            <template slot-scope="scope">
              {{ getLocalTime(scope.row.due_date,'YYYY-MM-DD') }}
            </template>
          </el-table-column>
          <el-table-column width="50px">
            <template slot-scope="{row}">
              <div class="action">
                <div
                  class="icon"
                  @click.stop="handleContextMenu(row, '', $event, true)"
                >
                  <em class="el-icon-more" />
                </div>
              </div>
            </template>
          </el-table-column>
          <template slot="empty">
            <el-empty
              :description="$t('general.NoData')"
              :image-size="100"
            />
          </template>
        </el-table>
        <el-table
          v-loading="listLoading"
          v-else
          ref="assigneeList"
          :key="tableKey"
          :element-loading-text="$t('Loading')"
          :data="assigneeVersionData"
          :tree-props="{ children: 'child' }"
          row-key="id"
          @expand-change="getAssigneeData"
          @row-click="handleRowClick"
        >
          <el-table-column type="expand">
            <template slot-scope="{row}">
              <el-row
                v-loading="row.hasOwnProperty('isLoadingFamily')
                && row.isLoadingFamily"
              >
                <div class="header resizeHeight">
                  <Kanban
                    v-for="classObj in boardHeaderName"
                    :id="'card_' + row.id + '_' + classObj.id"
                    :key="classObj.id"
                    :board-object="{[groupBy.dimension + '_id']: row.id, ...classObj}"
                    :list="boardAssigneeVersionData[row.id] ?
                      boardAssigneeVersionData[row.id].children[classObj.id] :
                      []
                    "
                    :status="status"
                    :group="group"
                    :dimension="'status'"
                    :from-wbs="true"
                    :element-ids="elementIds"
                    :fixed-version="fixedVersion"
                    @relationIssueId="onRelationIssueDialog($event, row.id, classObj.id)"
                    @update="updateIssueStatus"
                    @contextmenu="handleContextMenu"
                  />
                </div>
              </el-row>
            </template>
          </el-table-column>
          <el-table-column
            :label="groupBy.dimension === 'assigned_to' ?
            $t('Issue.assigned_to') : $t('Issue.fixed_version')"
            prop="name"
          >
            <template slot-scope="{row}">
              {{ groupBy.dimension === 'fixed_version'
                ? ( row.status === 'closed'
                  ? row.name + ' (' + $t('Version.closed') + ')'
                  : row.name)
                : row.name
              }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <ContextMenu
        ref="contextmenu"
        :visible="contextMenu.visible"
        :row="contextMenu.row"
        :filter-column-options="filterOptions"
        :selection-options="contextOptions"
      />
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectIssueList } from '@/api_v2/projects'
import { updateIssue, getIssueFamily } from '@/api/issue'
import { CancelRequest } from '@/mixins'
import { Tracker, Priority, Status, ContextMenu } from '@/components/Issue'
import { io } from 'socket.io-client'
import { isTimeValid, getLocalTime } from '@shared/utils/handleTime'

const contextMenu = {
  row: {
    fixed_version: { id: 'null' },
    assigned_to: { id: 'null' }
  },
  visible: false,
  left: 0,
  top: 0
}

export default {
  name: 'Board',
  components: {
    ContextMenu,
    Kanban: () => import('@shared/views/Project/IssueBoards/components/Kanban'),
    // eslint-disable-next-line vue/no-unused-components
    Tracker, Priority, Status
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
    groupBy: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      listLoading: false,
      originalListData: [],
      listData: [],
      rowList: [],
      assigneeVersionData: [],
      updateLoading: false,
      editRowId: null,
      contextMenu: contextMenu,
      isLoadingFamily: false,
      group: 'mission',
      boardData: {},
      boardAssigneeVersionData: {},
      originalChildren: {},
      newParentId: null,
      oldParentId: null,
      issueId: null,
      updatedData: {},
      elementIds: [],
      tableKey: 0,
      filterOptions: [{
        id: 1,
        label: this.$t('Issue.FilterDimensions.status'),
        value: 'status',
        placeholder: 'Status',
        tag: true
      },
      {
        id: 3,
        label: this.$t('Issue.FilterDimensions.tracker'),
        value: 'tracker',
        placeholder: 'Type',
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
      }],
      socket: io(`/issues/websocket`, { // production socket
        reconnectionAttempts: 5,
        forceNew: true
      })
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
      'strictTracker'
    ]),
    assigned_to() {
      return this.assignedTo
    },
    fixed_version() {
      return this.fixedVersion
    },
    boardHeaderName() {
      return this.displayClosed ? this.status
        : this.status.filter(row => row.id !== 6)
    },
    contextOptions() {
      const result = {}
      const getOptions = ['assigned_to', 'fixed_version', 'tags']
      getOptions.forEach((item) => {
        result[item] = this[item]
      })
      return result
    },
    getHeaderBarClassName() {
      return function (name) {
        return name.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      }
    },
    permission() {
      return ['Administrator', 'Project Manager', 'Engineer']
    }
  },
  watch: {
    'groupBy.dimension'() {
      this.originalChildren = {}
      this.assigneeVersionData = []
      this.tableKey += 1
    },
    'groupBy.value'() {
      this.groupByValue()
    },
    'groupBy.list'() {
      this.groupByList()
    },
    originalListData() {
      this.groupByValue()
      this.groupByList()
    },
    fixed_version() {
      this.groupByValue()
    }
  },
  mounted() {
    this.loadData()
    this.connectSocket()
    this.intervalTimer = window.setInterval(() => this.connectSocket(), 30000)
  },
  beforeDestroy() {
    this.socket.disconnect()
    window.clearInterval(this.intervalTimer)
  },
  methods: {
    getLocalTime(time, format) {
      return getLocalTime(time, format)
    },
    getParams() {
      const result = {
        parent_id: 'null',
        with_point: true,
        sort: 'subject:dec'
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
      this.listData = []
      this.listData = await this.fetchData()
    },
    async fetchData() {
      if (!this.selectedProjectId) return
      this.listLoading = true
      const res = await getProjectIssueList(
        this.filterValue.project || this.selectedProjectId,
        this.getParams(),
        { cancelToken: this.cancelToken }
      )
      if (res.hasOwnProperty('data')) {
        this.listLoading = false
        this.originalListData = res.data.map((item) => this.issueFormatter(item))
        return Promise.resolve(this.originalListData)
      }
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
    getContextMenuCurrentValue(column, item) {
      return this.contextMenu.row[column].map((subItem) => subItem.id).includes(item.id)
    },
    getTranslateHeader(value) {
      return this.$te('Issue.' + value) ? this.$t('Issue.' + value) : value
    },
    handleContextMenu(row, column, event, forceLeft) {
      if (parseInt(row.id)) {
        event.preventDefault()
        let eventX = event.pageX
        const eventY = event.pageY
        if (forceLeft) {
          eventX = eventX - 155
        }
        this.$refs.contextmenu.$refs.contextmenu.show()
        const contextmenu = this.$refs.contextmenu.$refs.contextmenu
        this.$nextTick(() => {
          const contextmenuPosition = {
            top: eventY,
            left: eventX
          }
          const contextmenuWidth = contextmenu.$el.clientWidth
          const contextmenuHeight = contextmenu.$el.clientHeight
          if (contextmenuWidth <= 50) {
            this.handleContextMenu({ row, column, event })
          }
          if (contextmenuHeight + eventY >= window.innerHeight) {
            contextmenuPosition.top -= contextmenuHeight
          }
          if (contextmenuWidth + eventX >= window.innerWidth) {
            contextmenuPosition.left -= contextmenuWidth
          }
          this.contextMenu.top = contextmenuPosition.top
          this.contextMenu.left = contextmenuPosition.left
          this.contextMenu.row = row
          this.contextMenu.visible = true
          contextmenu.style = {
            top: `${this.contextMenu.top}px`,
            left: `${this.contextMenu.left}px`
          }
          document.addEventListener('click', this.hideContextMenu)
        })
      }
    },
    hideContextMenu() {
      this.contextMenu.visible = false
      document.removeEventListener('click', this.hideContextMenu)
    },
    async getBoardData(row, expandedRows) {
      this.expandedRow = expandedRows
      if (expandedRows.find((item) => item.id === row.id)) {
        try {
          await this.$set(row, 'isLoadingFamily', true)
          const res = await getIssueFamily(row.id)
          if (res.data.children) {
            res.data.children.map((item) => { item.family = true })
            this.originalChildren[row.id] = res.data.children
          } else {
            this.originalChildren[row.id] = []
          }
          this.$set(row, 'children', this.classifyIssue(res.data.children))
          this.$set(row, 'isLoadingFamily', false)
          this.boardData[row.id] = row
        } catch (e) {
          console.error(e)
          return Promise.resolve()
        }
      }
      return Promise.resolve()
    },
    async getAssigneeData(row, expandedRows) {
      if (expandedRows.find((item) => item.id === row.id)) {
        try {
          await this.$set(row, 'isLoadingFamily', true)
          const params = {
            with_point: true,
            sort: 'subject:dec',
            [this.groupBy.dimension + '_id']: row.id
          }
          const res = await getProjectIssueList(
            this.filterValue.project || this.selectedProjectId,
            params,
            { cancelToken: this.cancelToken }
          )
          this.originalChildren[row.id] = res.data
          this.$set(row, 'children', this.classifyIssue(res.data))
          this.$set(row, 'isLoadingFamily', false)
          this.boardAssigneeVersionData[row.id] = row
        } catch (e) {
          console.error(e)
          return Promise.resolve()
        }
      }
      return Promise.resolve()
    },
    classifyIssue(children) {
      const data = this.checkGroupByValueOnBoard()
      if (children) {
        children.forEach((issue) => {
          if (issue) {
            const dimensionName = issue.status.id ? issue.status.id : 'null'
            if (!data[dimensionName]) return
            data[dimensionName].push(issue)
          }
        })
      }
      return this.sortIssue(data)
    },
    checkGroupByValueOnBoard() {
      const data = {}
      this.boardHeaderName.forEach((dimension) => {
        data[dimension.id] = []
      })
      return data
    },
    sortIssue(data) {
      const sortUpdateOn = (a, b) => new Date(b.updated_on) - new Date(a.updated_on)
      Object.keys(data).forEach((item) => {
        this.$set(data, item, data[item].sort(sortUpdateOn))
      })
      return data
    },
    async updateIssueStatus(evt) {
      if (evt.event.hasOwnProperty('added')) {
        if (this.groupBy.dimension === 'status') {
          this.newParentId = evt.boardObject.parent_id
        } else {
          this.newParentId = evt.boardObject[this.groupBy.dimension + '_id']
        }
        this.issueId = evt.event.added.element.id
        this.updatedData = { [`status_id`]: evt.boardObject.id }
      }
      if (evt.event.hasOwnProperty('removed')) {
        if (this.groupBy.dimension === 'status') {
          this.oldParentId = evt.boardObject.parent_id
        } else {
          this.oldParentId = evt.boardObject[this.groupBy.dimension + '_id']
        }
        if (this.updatedData.status_id === evt.boardObject.id) {
          delete this.updatedData.status_id
        }
      }

      if (this.newParentId !== null && this.oldParentId !== null) {
        try {
          if (this.newParentId !== this.oldParentId) {
            if (this.groupBy.dimension === 'status') {
              this.updatedData.parent_id = this.newParentId
            } else {
              this.updatedData[this.groupBy.dimension + '_id'] = this.newParentId
            }
          }
          await this.updatedIssue(this.issueId, this.updatedData)
        } catch (e) {
          console.error(e)
        } finally {
          this.newParentId = null
          this.oldParentId = null
          this.updatedData = {}
          this.issueId = null
        }
      }
    },
    getFormData(data) {
      const formData = new FormData()
      Object.keys(data).forEach((item) => {
        formData.append(item, data[item])
      })
      return formData
    },
    async updatedIssue(id, updatedData) {
      const formData = this.getFormData(updatedData)
      const res = await updateIssue(id, formData)
      return res.data
    },
    onRelationIssueDialog(issue, rowId, element) {
      this.$emit('relation-issue', issue.id)
      if (rowId) window.setTimeout(() => this.scrollTo(rowId, element), 1000)
    },
    scrollTo(rowId, target) {
      const element = document.getElementById('card_' + rowId + '_' + target)
      this.$nextTick(() => {
        element.scrollIntoView({ behavior: 'smooth' })
      })
    },
    setSocketListener() {
      const _this = this
      this.socket.on('connect', () => {
        console.info('Connect')
      })
      this.socket.on('update_issue', async (data) => {
        const elementId = []
        if (this.groupBy.dimension === 'status') {
          for (const idx in data) {
            const findOriParentId = this.originalListData
              .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
            if (findOriParentId >= 0) {
              this.$set(this.originalListData, findOriParentId, data[idx])
              const findParentId = this.listData
                .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
              if (findParentId >= 0) {
                this.$set(this.listData, findParentId, data[idx])
              }
              continue
            }

            data[idx] = _this.socketDataFormat(data[idx])
            if (data[idx].hasOwnProperty('origin_parent_id')) {
              const findChangeIndex = this.originalChildren[data[idx].origin_parent_id]
                .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
              this.$delete(this.originalChildren[data[idx].origin_parent_id], findChangeIndex)
              this.$set(
                this.boardData[data[idx].origin_parent_id],
                'children',
                this.classifyIssue(this.originalChildren[data[idx].origin_parent_id])
              )
              if (data[idx].hasOwnProperty('parent')) {
                const findIdx = this.originalChildren[data[idx].parent.id]
                  .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
                if (findIdx >= 0) {
                  this.$set(this.originalChildren[data[idx].parent.id], findIdx, data[idx])
                } else {
                  this.originalChildren[data[idx].parent.id].push(data[idx])
                }
              }
            } else {
              const findChangeIndex = this.originalChildren[data[idx].parent.id]
                .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
              this.$set(this.originalChildren[data[idx].parent.id], findChangeIndex, data[idx])
            }
            this.$set(
              this.boardData[data[idx].parent.id],
              'children',
              this.classifyIssue(this.originalChildren[data[idx].parent.id])
            )
            elementId.push(data[idx].id)
          }
        } else {
          const dimension = 'origin_' + this.groupBy.dimension + '_id'
          for (const idx in data) {
            data[idx] = _this.socketDataFormat(data[idx])
            if (data[idx].hasOwnProperty(dimension)) {
              const findChangeIndex = this.originalChildren[data[idx][dimension]]
                .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
              this.$delete(this.originalChildren[data[idx][dimension]], findChangeIndex)
              this.$set(
                this.boardAssigneeVersionData[data[idx][dimension]],
                'children',
                this.classifyIssue(this.originalChildren[data[idx][dimension]])
              )
            }
            if (Object.keys(data[idx][this.groupBy.dimension]).length === 0) {
              data[idx][this.groupBy.dimension].id = null
            }
            const findIndex = this.originalChildren[data[idx][this.groupBy.dimension].id]
              .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
            if (findIndex >= 0) {
              this.$set(this.originalChildren[data[idx][this.groupBy.dimension].id], findIndex, data[idx])
            } else {
              this.originalChildren[data[idx][this.groupBy.dimension].id].push(data[idx])
            }

            this.$set(
              this.boardAssigneeVersionData[data[idx][this.groupBy.dimension].id],
              'children',
              this.classifyIssue(this.originalChildren[data[idx][this.groupBy.dimension].id])
            )
            elementId.push(data[idx].id)
          }
        }
        this.elementIds = elementId
      })
      this.socket.on('delete_issue', async (data) => {
        let findOriParentId = -1
        if (this.groupBy.dimension === 'status') {
          findOriParentId = this.originalListData
            .findIndex(issue => parseInt(data.id) === parseInt(issue.id))
        }
        if (findOriParentId >= 0) { // if issue on the parent list
          this.$delete(this.originalListData, findOriParentId)
          const findParentIndex = this.listData
            .findIndex(issue => parseInt(data.id) === parseInt(issue.id))
          if (findParentIndex >= 0) {
            this.$delete(this.listData, findParentIndex)
            this.$delete(this.boardData, data.id)
          }
        } else {
          Object.keys(this.originalChildren).forEach((key) => {
            this.originalChildren[key].forEach((child, idx) => {
              if (parseInt(child.id) === parseInt(data.id)) {
                this.originalChildren[key].splice(idx, 1)
                this.$set(
                  this.boardData[key],
                  'children',
                  this.classifyIssue(this.originalChildren[key])
                )
              }
            })
          })
        }
      })
      this.socket.on('add_issue', async data => {
        const elementId = []
        for (const idx in data) {
          let findOriParentId = -1
          if (this.groupBy.dimension === 'status') {
            findOriParentId = this.originalListData
              .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
            if (findOriParentId >= 0) {
              this.$set(this.originalListData, findOriParentId, data[idx])
              const findParentIndex = this.listData
                .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
              if (findParentIndex >= 0) {
                this.$set(this.listData, findParentIndex, data[idx])
              }
              continue
            }
            data[idx] = _this.socketDataFormat(data[idx])
            if (data[idx].hasOwnProperty('parent')) { // if issue has parent
              if (this.originalChildren[data[idx].parent.id]) { // if issue's parent already on the expanded list
                const findChangeIndex = this.originalChildren[data[idx].parent.id]
                  .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
                if (findChangeIndex !== -1) {
                  this.$set(this.originalChildren[data[idx].parent.id], findChangeIndex, data[idx])
                } else {
                  this.originalChildren[data[idx].parent.id].push(data[idx])
                }
                elementId.push(data[idx].id)
              } else continue
            } else { // add issue to parent list
              this.originalListData.push(data[idx])
              continue
            }

            this.$set(
              this.boardData[data[idx].parent.id],
              'children',
              this.classifyIssue(this.originalChildren[data[idx].parent.id])
            )
          } else {
            data[idx] = _this.socketDataFormat(data[idx])
            if (this.originalChildren[data[idx][this.groupBy.dimension].id]) { // if issue's parent already on the expanded list
              const findChangeIndex = this.originalChildren[data[idx][this.groupBy.dimension].id]
                .findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
              if (findChangeIndex !== -1) {
                this.$set(this.originalChildren[data[idx][this.groupBy.dimension].id],
                  findChangeIndex, data[idx])
              } else {
                this.originalChildren[data[idx][this.groupBy.dimension].id].push(data[idx])
              }
              elementId.push(data[idx].id)
            } else continue

            this.$set(
              this.boardAssigneeVersionData[data[idx][this.groupBy.dimension].id],
              'children',
              this.classifyIssue(this.originalChildren[data[idx][this.groupBy.dimension].id])
            )
          }
          // this.showUpdateMessage(data[idx])
        }
        this.elementIds = elementId
      })
      this.socket.on('disconnect', (reason) => {
        if (reason !== 'io client disconnect') {
          this.connectSocket()
        }
      })
      this.socket.on('connect_error', () => {
        console.error('Connection Error')
      })
    },
    socketDataFormat(data) {
      Object.keys(data).forEach(key => {
        if (!key.includes('origin')) {
          const splitKey = key.split('_id')
          if (splitKey.length > 1 && splitKey !== 'origin_parent') {
            const findObject = this[splitKey[0]]
              .find(item => item.id === parseInt(data[key]) && item.login !== '-Me-')
            if (findObject) {
              data[splitKey[0]] = findObject
            }
          }
        }
      })
      return data
    },
    showUpdateMessage(data) {
      this.$message({
        message: this.$t('Notify.UpdateKanban', { issueName: data.name }),
        type: 'success'
      })
    },
    async connectSocket() {
      this.setSocketListener()
      await this.socket.connect()
      await this.socket.emit('join', { project_id: this.selectedProjectId })
    },
    async onSocketConnect() {
      if (this.socket.disconnect) {
        await this.connectSocket()
      }
    },
    reloadPage() {
      window.location.reload()
    },
    groupByValue() {
      if (this.groupBy.dimension === 'status') {
        this.rowList = []
        if (this.groupBy.value.length > 0) {
          for (const idx in this.groupBy.value) {
            const rowData = this.originalListData
              .filter(row => row.status.id === this.groupBy.value[idx].id)
            this.rowList = [...this.rowList, ...rowData]
          }
        } else {
          this.rowList = this.originalListData
        }
        this.listData = this.rowList
        this.$emit('row-list', this.rowList)
      } else {
        let list = []
        if (this.groupBy.value.length > 0) {
          for (const idx in this.groupBy.value) {
            const rowData = this[this.groupBy.dimension]
              .filter(row => row.id === this.groupBy.value[idx].id)
            rowData[0].isLoadingFamily = false
            list = [...list, ...rowData]
          }
        } else {
          list = this[this.groupBy.dimension]
        }
        if (this.groupBy.dimension === 'assigned_to') {
          list = list.filter((item) => item.login !== '-Me-')
        }
        this.assigneeVersionData = list
      }
    },
    groupByList() {
      const rowId = this.groupBy.list.map(a => a.id)
      if (rowId.length > 0) {
        this.listData = this.originalListData.filter(row => rowId.includes(row.id))
      } else if (rowId.length === 0 && this.groupBy.value.length === 0) {
        this.listData = this.originalListData
      } else {
        this.listData = this.rowList
      }
    },
    async handleRowClick(row) {
      if (this.groupBy.dimension === 'status') this.$refs.issueList.toggleRowExpansion(row)
      else this.$refs.assigneeList.toggleRowExpansion(row)
    },
    setClassName({ row }) {
      return row.has_children ? '' : 'expand'
    }
  }
}
</script>

<style lang="scss" scoped>
.board-column {
  width: 280px;
  margin: 0 5px;
  flex: 0 0 280px;
  // padding-bottom: 20px;
  @apply overflow-hidden bg-white rounded-md border-solid border border-gray-300;

  .board-column-header {
    height: 50px;
    line-height: 50px;
    @apply overflow-hidden;

    .header-bar {
      height: 3px;
      @apply bg-red-500;
    }
  }

  &.active {
    .board-column-header {
      .header-bar {
        @apply bg-active;
      }
    }
  }

  &.assigned {
    .board-column-header {
      .header-bar {
        @apply bg-assigned;
      }
    }
  }

  &.solved {
    .board-column-header {
      .header-bar {
        @apply bg-solved;
      }
    }
  }

  &.inprogress {
    .board-column-header {
      .header-bar {
        @apply bg-inProgress;
      }
    }
  }

  &.verified {
    .board-column-header {
      .header-bar {
        @apply bg-finished;
      }
    }
  }

  &.closed {
    .board-column-header {
      .header-bar {
        @apply bg-closed;
      }
    }
  }
}

.board {
  height: calc(100vh - 50px - 20px - 50px - 50px - 50px - 40px);
  overflow-x: auto;
  transition: width 1s;
  .header {
    display: flex;
    justify-content: flex-start;
    flex-wrap: nowrap;
    background: white;
  }
  .resizeHeight {
    max-height: 420px;
    resize: vertical;
    overflow: auto;
  }
  .resizeHeight[style*="height"] {
    max-height: unset;
}
}
.current {
  @apply text-success font-bold;
}

.menu-remove {
  @apply text-danger font-bold;
}

::v-deep .cursor-context-menu {
  cursor: context-menu;
}

.socket-button {
  height: 55px;
  width: 55px;
  padding: 12px 20px !important;
}

::v-deep .el-table .el-table__cell {
  padding-top: 6px;
  padding-bottom: 6px;
}

.action {
  @apply flex cursor-pointer;
  width: 15px;
  height: 25px;

  .icon {
    @apply bg-gray-200 text-black rounded-md text-center align-middle px-1;
  }
}
.fix-header {
  top: 0px;
  z-index: 2;
  position: sticky;
  position: -webkit-sticky;
}

::v-deep {
  .expand .el-table__expand-column .cell  {
    display: none;
  }
  .el-scrollbar__view {
    height: inherit !important;
  }
}
</style>
