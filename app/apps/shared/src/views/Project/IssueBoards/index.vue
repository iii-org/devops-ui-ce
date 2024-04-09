<template>
  <div
    v-loading="isLoading || isFirstLoad"
    :element-loading-text="$t('Loading')"
    class="app-container"
  >
    <ProjectListSelector>
      <el-tooltip
        slot="button"
        :open-delay="100"
        :content="socket.connected ?
          $t('general.SocketConnected') :
        $t('general.ReconnectByReload')"
        placement="bottom"
      >
        <div style="float: left;">
          <el-button
            slot="button"
            :disabled="isLoading"
            :type="(socket.connected) ? 'success' : 'danger'"
            :size="isMobile ? 'mini' : 'medium'"
            @click="onSocketConnect"
          >
            <div
              :class="(socket.connected) ? 'bg-success' : 'bg-danger'"
              class="dot inline-block"
            />
            {{ (socket.connected) ? $t('general.Connected') : $t('general.Disconnected') }}
          </el-button>
        </div>
      </el-tooltip>
      <el-tooltip
        v-if="socket.disconnected"
        slot="button"
        :open-delay="100"
        :content="$t('general.Reload')"
        placement="bottom"
      >
        <el-button
          class="mx-2 button-primary-reverse"
          icon="el-icon-refresh"
          style="float:left;"
          size="small"
          circle
          @click="reloadPage"
        />
      </el-tooltip>
      <CustomFilter
        v-if="socket.connected"
        ref="customFilter"
        :group-by="groupBy"
        :selection-options="contextOptions"
        type="issue_board"
        @apply-filter="applyCustomFilter"
      />
      <el-popover
        v-if="socket.connected"
        popper-class="popper"
        placement="bottom"
        trigger="click"
        @hide="resetSaveFilterButtons"
      >
        <el-form v-loading="isLoading" label-position="top">
          <template v-for="dimension in filterOptionsWithProject">
            <el-form-item
              v-if="groupBy.dimension !== dimension.value"
              :key="dimension.id"
            >
              <div slot="label">
                {{ $t('Issue.' + dimension.value) }}
                <el-tag
                  v-if="dimension.value ==='fixed_version'"
                  type="info"
                  size="small"
                  class="flex-1"
                >
                  <el-checkbox v-model="fixed_version_closed">
                    <span class="text-xs">
                      {{ $t('Issue.DisplayClosedVersion') }}
                    </span>
                  </el-checkbox>
                </el-tag>
              </div>
              <el-select
                v-model="filterValue[dimension.value]"
                :placeholder="$t(`Issue.Select${dimension.placeholder}`)"
                :disabled="projectId === -1"
                :multiple="dimension.value === 'tags'"
                :collapse-tags="dimension.value === 'tags'"
                filterable
                clearable
                value-key="id"
                @change="onChangeFilter"
              >
                <el-option
                  v-for="item in (dimension.value === 'status') ? filterClosedStatus(getOptionsData(dimension.value)) : getOptionsData(dimension.value)"
                  :key="dimension.value === 'assigned_to' ? item.login : item.id"
                  :label="getSelectedLabel(item)"
                  :class="{[item.class]: item.class}"
                  :value="item.id"
                >
                  <component
                    v-if="dimension.tag"
                    :is="dimension.value"
                    :name="$t(`Issue.${item.name}`)"
                    :type="item.name"
                  />
                </el-option>
              </el-select>
            </el-form-item>
          </template>
          <el-form-item>
            <label class="el-form-item__label mr-3">
              {{ $t('Issue.DisplayClosedIssue') }}
            </label>
            <el-checkbox
              v-model="displayClosed"
              @change="onChangeFilter"
            />
          </el-form-item>
        </el-form>
        <SaveFilterButton
          ref="saveFilterButton"
          :filter-value="filterValueClone"
          :group-by="groupBy"
          type="issue_board"
          @update="onCustomFilterAdded"
        />
        <el-button
          slot="reference"
          :loading="isLoading"
          icon="el-icon-s-operation"
          class="header-text-color"
          type="text"
        >
          {{ displayFilterValue }}
          <em class="el-icon-arrow-down el-icon--right" />
        </el-button>
      </el-popover>
      <el-divider v-if="socket.connected" direction="vertical" />
      <el-popover
        v-if="socket.connected"
        placement="bottom"
        trigger="click"
      >
        <el-form v-loading="isLoading">
          <el-form-item :label="$t('Issue.FilterDimensions.label')">
            <el-select
              ref="groupByDimensionSelect"
              v-model="groupBy.dimension"
              :popper-append-to-body="true"
              class="mr-4"
              filterable
              popper-class="dimension"
              @change="onChangeGroupByDimension($event, true)"
            >
              <el-option-group :label="$t('Issue.FilterDimensions.default_dimension')">
                <template v-for="item in filterOptions">
                  <el-option
                    v-if="filterDimensionsList(item.value)"
                    :key="item.id"
                    :label="item.label"
                    :value="item.value"
                  />
                </template>
              </el-option-group>
              <el-option-group
                v-if="customOptions.length > 0 && !isLite"
                :label="$t('Issue.FilterDimensions.custom_dimension')"
              >
                <el-option
                  v-for="item in customOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.name"
                >
                  <span class="flex justify-between items-center">
                    {{ item.name }}
                    <span @click="(e) => { e.stopPropagation() }">
                      <el-popconfirm
                        :title="$t('Issue.RemoveCustomFilter')"
                        :confirm-button-text="$t('general.Remove')"
                        :cancel-button-text="$t('general.Cancel')"
                        icon="el-icon-info"
                        icon-color="red"
                        @confirm="deleteCustomBoardBySelect(item)"
                        @cancel="$refs.groupByDimensionSelect.visible = true"
                      >
                        <el-link
                          slot="reference"
                          icon="el-icon-delete"
                          type="danger"
                        />
                      </el-popconfirm>
                    </span>
                  </span>
                </el-option>
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item
            v-show="isSelectDefaultOption"
            :label="$t('Issue.Display')"
          >
            <ElSelectAll
              ref="groupByValue"
              :value="groupBy.value"
              :loading="isLoading"
              :options="groupByOptions"
              filterable
              multiple
              collapse-tags
              value-key="id"
              @change="onChangeGroupByValue($event, true)"
            />
          </el-form-item>
          <el-link
            v-if="!isLite"
            class="float-right"
            icon="ri-add-line"
            type="primary"
            @click="customBoardDialogVisible = true"
          >
            {{ $t('Issue.CustomBoard') }}
          </el-link>
        </el-form>
        <el-button
          slot="reference"
          :loading="isLoading"
          class="header-text-color"
          type="text"
        >
          <i18n path="Issue.GroupBy">
            <strong slot="filter">
              {{ showSelectedGroupByName }}
            </strong>
          </i18n>
          ({{ showSelectedGroupByLength }})
          <em class="el-icon-arrow-down el-icon--right" />
        </el-button>
      </el-popover>
      <el-divider v-if="socket.connected" direction="vertical" />
      <el-input
        v-if="searchVisible && socket.connected"
        id="input-search"
        v-model="keyword"
        :placeholder="$t('Issue.SearchNameOrAssignee')"
        :disabled="isLoading"
        prefix-icon="el-icon-search"
        style="width: 250px;"
        clearable
        @blur="searchVisible=!searchVisible"
        @change="onChangeFilter"
      />
      <el-button
        v-if="!searchVisible && socket.connected"
        :loading="isLoading"
        type="text"
        class="header-text-color"
        icon="el-icon-search"
        @click="searchVisible=!searchVisible"
      >
        {{ $t('general.Search') + ((keyword) ? ': ' + keyword : '') }}
      </el-button>
      <template v-if="isFilterChanged && socket.connected">
        <el-divider direction="vertical" />
        <el-button
          :loading="isLoading"
          size="small"
          icon="el-icon-close"
          class="button-secondary-reverse"
          @click="cleanFilter"
        >
          {{ $t('Issue.CleanFilter') }}
        </el-button>
      </template>
    </ProjectListSelector>
    <el-divider />
    <Boards
      :group-by="groupBy"
      :display-closed="displayClosed"
      :filter-options="filterOptions"
      :context-options="contextOptions"
      :relative-issue-list="relativeIssueList"
      :classify-issue-list="classifyIssueList"
      :project-issue-list="projectIssueList"
      :fixed_version="fixed_version"
      :assigned_to="assigned_to"
      :tags="tags"
      :element-ids="elementIds"
      :project-id="projectId"
      :filter-type="'board'"
      :get-status-sort="getStatusSort"
      :is-select-default-option="isSelectDefaultOption"
      :params="getParams"
      :board-id="boardId"
      :all-unassigned-issue-list="allUnassignedIssueList"
      @getRelativeList="getRelativeList"
      @updateIssueList="updateIssueList"
      @updateData="updateData"
      @loadData="loadData"
    />
    <el-dialog
      :visible.sync="customBoardDialogVisible"
      :show-close="false"
      :close-on-click-modal="false"
      :before-close="closeCustomBoardDialog"
      top="3vh"
      append-to-body
      destroy-on-close
    >
      <el-row slot="title">
        <span class="text-title">
          {{ $t('general.Add') + $t('Issue.CustomBoard') }}
        </span>
        <span class="float-right">
          <el-button
            :loading="isLoading"
            class="buttonSecondaryReverse"
            type="info"
            size="small"
            @click="closeCustomBoardDialog"
          >
            {{ $t('general.Cancel') }}
          </el-button>
          <el-button
            :loading="isLoading"
            class="buttonPrimary"
            type="success"
            size="small"
            @click="confirmCustomBoardDialog"
          >
            {{ $t('general.Save') }}
          </el-button>
        </span>
      </el-row>
      <div v-loading="isLoading" class="mb-3">
        <div class="input">
          <el-input
            v-model="customValueOnBoard.name"
            :placeholder="$t('RuleMsg.PleaseInput') + $t('Issue.BoardTitle')"
          />
        </div>
        <div id="customContainer" style="max-height: 30vh; overflow: auto;">
          <CustomItem
            v-loading="isLoading"
            v-for="(boardObject, index) in customValueOnBoard.list"
            :key="boardObject.id"
            :order="index"
            :class="customValueOnBoard.list.length !== index + 1 ? 'mb-2' : null"
            :board-object.sync="boardObject"
            :group-by-value-on-board="customValueOnBoard.list"
            @emitAddCustomBoard="(target) => addCustomBoard(target)"
          />
        </div>
      </div>
      <el-link
        :disabled="isLoading"
        :underline="false"
        icon="ri-add-line"
        type="primary"
        @click="() => addCustomBoard()"
      >
        {{ $t('general.Add') + $t('Issue.BoardItem') }}
      </el-link>
    </el-dialog>
    <Fab
      v-if="!isSelectDefaultOption"
      :actions="fabActions"
      position="bottom-right"
      bg-color="#409eff"
      icon-size="small"
      main-icon="more_vert"
      @addButton="customBoardDialogVisible = true"
      @deleteButton="deleteCustomBoard()"
    />
  </div>
</template>

//TODO: move dimension filter into SearchFilter.vue
<script>
import { mapGetters, mapActions } from 'vuex'
import {
  getProjectIssueList,
  getProjectIssueListFromRedmineDB,
  getProjectIssueListByTree,
  getProjectUserList,
  getProjectVersion,
  getTagsByProject
} from '@/api/projects'
import { getIssue } from '@/api_v2/issue'
import {
  getAllBoard,
  createNewBoard,
  removeBoard,
  getAllBoardItem,
  createBoardItem
} from '@/api_v2/issueBoard'
import { getHasSon, getProjectRelation } from '@/api_v2/projects'
import axios from 'axios'
import Fuse from 'fuse.js'
import { io } from 'socket.io-client'
import { ProjectListSelector, ElSelectAll } from '@shared/components'
import { Status, Tracker, Priority, CustomFilter } from '@/components/Issue'
import SaveFilterButton from '@/components/Issue/components/SaveFilterButton'
import Boards from './components/Boards'
import CustomItem from './components/CustomItem'

export default {
  name: 'IssueBoards',
  components: {
    CustomItem,
    Boards,
    ElSelectAll,
    ProjectListSelector,
    Status,
    Tracker,
    Priority,
    CustomFilter,
    SaveFilterButton,
    Fab: () => import('vue-fab')
  },
  data() {
    return {
      isLoading: false,
      groupBy: {
        dimension: 'status',
        value: []
      },
      filterValue: {},
      originFilterValue: {},
      displayClosed: false,
      fixed_version_closed: false,
      projectIssueList: [],
      projectIssueQueue: {},
      classifyIssueList: {},
      fixed_version: [],
      assigned_to: [],
      tags: [],
      relativeIssueList: [],
      searchVisible: false,
      keyword: null,
      elementIds: [],
      hasChildren: false,
      project: [],
      isFirstLoad: false,
      filterOptions: [{
        id: 1,
        label: this.$t('Issue.FilterDimensions.status'),
        value: 'status',
        placeholder: 'Status',
        tag: true
      },
      {
        id: 2,
        label: this.$t('Issue.FilterDimensions.tags'),
        value: 'tags',
        placeholder: 'Tag'
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
      }),
      // socket: io(`${process.env.VUE_APP_BASE_API}/issues/websocket`, { // development socket
      //   reconnectionAttempts: 5
      // })
      customBoardDialogVisible: false,
      customValueOnBoard: {
        name: '',
        list: [{
          id: null,
          name: '',
          color: '#409EFF'
        }]
      },
      customOptions: [],
      addIssueTemp: [],
      connectIssueTemp: [],
      allUnassignedIssueList: []
    }
  },
  computed: {
    ...mapGetters([
      'selectedProjectId',
      'userId',
      'tracker',
      'status',
      'priority',
      'fixedVersionShowClosed'
    ]),
    isMobile() {
      return this.device === 'mobile'
    },
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    filterDimensionsList() {
      return (value) => value !== 'tags' && value !== 'due_date_start' && value !== 'due_date_end'
    },
    contextOptions() {
      const result = {}
      const getOptions = ['assigned_to', 'fixed_version', 'tags']
      getOptions.forEach((item) => {
        result[item] = this[item]
      })
      return result
    },
    filterOptionsWithProject() {
      return this.hasChildren ? [{
        id: this.filterOptions.length + 1,
        value: 'project',
        placeholder: 'Project'
      }].concat(this.filterOptions) : this.filterOptions
    },
    groupByOptions() {
      return this.getStatusSort.map((item, idx) => ({
        id: idx,
        label: this.getTranslateHeader(item.name),
        value: item
      }))
    },
    groupByValueOnBoard() {
      if (this.groupBy.value.length <= 0) {
        return this.getStatusSort.map((item) => item)
      }
      return this.groupBy.dimension === 'assigned_to' ? this.filterMe(this.groupBy.value) : this.groupBy.value
    },
    getStatusSort() {
      const dimension = this.groupBy.dimension
      if (this.isSelectDefaultOption) {
        let sort = dimension === 'status' ? this.filterClosedStatus(this[dimension]) : this[dimension]
        sort = dimension === 'assigned_to' ? this.filterMe(sort) : sort
        return sort
      } else {
        const sort = this.customOptions.find((option) => option.name === dimension)?.items || []
        sort.unshift({ id: 'all', name: this.$t('Issue.Uncategorized'), color: '#409EFF' })
        return sort
      }
    },
    filterClosedStatus() {
      return function (statusList) {
        if (this.displayClosed) return statusList
        return statusList.filter((item) => item.is_closed === false)
      }
    },
    showSelectedGroupByName() {
      if (this.isSelectDefaultOption) {
        return this.filterOptions.find((item) => item.value === this.groupBy.dimension).label
      } else {
        return this.customOptions.find((item) => item.name === this.groupBy.dimension)?.name
      }
    },
    showSelectedGroupByLength() {
      if (this.groupByOptions.length === this.groupBy.value.length || this.groupBy.value.length === 0) {
        return this.$t('general.All')
      }
      return this.groupBy.value.length
    },
    displayFilterValue() {
      const selectedLabels = this.getSelectedLabels
      const colon = selectedLabels.length > 0 ? ': ' : ''
      const factor = selectedLabels.join(', ')
      return `${this.$t('general.Filter')}${colon}${factor}`
    },
    getSelectedLabels() {
      const selectedLabels = []
      Object.keys(this.filterValue).forEach((item) => {
        if (!this.filterValue[item]) return
        if (this.filterValue[item].length <= 0) {
          this.$delete(this.filterValue, item)
          return
        }
        const isArray = Array.isArray(this.filterValue[item]) && this.filterValue[item].length > 0
        isArray ? selectedLabels.push(this.handleArrayLabels(item)) : selectedLabels.push(this.handleLabels(item))
      })
      return selectedLabels
    },
    handleArrayLabels() {
      return function (item) {
        let label = ''
        const value = this.getOptionsData(item).filter((search) => this.filterValue[item].includes(search.id))
        if (value) {
          const joinedString = value.map((subItem) => this.getSelectedLabel(subItem)).join('/')
          label = `#${joinedString}`
        }
        return label
      }
    },
    handleLabels() {
      return function (item) {
        let label = ''
        const value = this.getOptionsData(item).find((search) => search.id === this.filterValue[item])
        if (value) label = this.getSelectedLabel(value)
        return label
      }
    },
    isFilterChanged() {
      return this.checkFilterValue('originFilterValue') || this.checkFilterValue('filterValue') || !!this.keyword || this.groupBy.dimension !== 'status'
    },
    getFilteredVersion() {
      return this.fixed_version.filter((item) => {
        const validDate = new Date(`${item.due_date}T23:59:59`) >= new Date()
        const closedStatus = item.status !== 'closed'
        return validDate && closedStatus
      })
    },
    checkInFilterValue() {
      return function (value) {
        if (this.groupBy.value.length <= 0) return true
        return this.groupBy.value.find((item) => item.id === value)
      }
    },
    filterValueClone() {
      return Object.assign({}, this.filterValue, {
        groupBy: this.groupBy,
        fixed_version_closed: this.fixed_version_closed,
        displayClosed: this.displayClosed
      })
    },
    isSelectDefaultOption() {
      const defaultStatus = ['tracker', 'status', 'priority', 'assigned_to', 'fixed_version']
      return defaultStatus.includes(this.groupBy.dimension)
    },
    getParams() {
      const result = {}
      if (!this.displayClosed && this.groupBy.dimension !== 'status') result['status_id'] = 'open'
      if (this.keyword) result['search'] = this.keyword
      Object.keys(this.filterValue).forEach((param) => {
        if (this.filterValue[param]) {
          const isArray = param === 'tags' && this.filterValue[param].length > 0
          if (isArray) {
            result[param] = this.filterValue[param].join(',')
          } else {
            result[`${param}_id`] = this.filterValue[param]
          }
        }
      })
      return result
    },
    boardId() {
      return this.customOptions.find((item) => item.name === this.groupBy.dimension)?.id
    },
    fabActions() {
      const actions = [
        {
          name: 'addButton',
          icon: 'add',
          tooltip: this.$t('general.Add') + this.$t('Issue.CustomBoard'),
          color: '#409eff'
        },
        {
          name: 'deleteButton',
          icon: 'delete',
          tooltip: this.$t('general.Delete') + this.$t('Issue.ThisBoard'),
          color: '#F56C6C'
        }
        // {
        //   name: 'copyButton',
        //   icon: 'content_copy',
        //   color: '#E6A23C'
        // }
      ]
      return this.selectedProjectId ? actions : actions.slice(1, 3)
    }
  },
  watch: {
    selectedProjectId: {
      async handler(newId, oldId) {
        this.socket.emit('leave', { project_id: oldId })
        this.socket.emit('join', { project_id: newId })
        await this.onCleanKeyWord()
        this.projectId = this.selectedProjectId
        this.filterValue = {}
        await this.fetchInitData()
      },
      immediate: true
    },
    isLoading(value) {
      if (!value) {
        this.updateData()
      }
    },
    fixed_version_closed(value) {
      this.setFixedVersionShowClosed({ board: value })
      this.loadVersionList(value)
    },
    async 'filterValue.project'(value) {
      if (value) this.projectId = value
      else this.projectId = this.selectedProjectId
      await this.onCleanKeyWord()
      if (value) this.filterValue.project = value
      await this.loadSelectionList()
      await this.getInitStoredData()
      await this.loadVersionList()
    }
  },
  async created() {
    this.isFirstLoad = true
    this.connectSocket()
    this.projectId = this.selectedProjectId
    this.intervalTimer = window.setInterval(() => this.connectSocket(), 30000)
    // await this.fetchInitData()
  },
  beforeDestroy() {
    this.socket.disconnect()
    window.clearInterval(this.intervalTimer)
    this.onSaveFilter()
  },
  methods: {
    ...mapActions('projects', [
      'getProjectUserList',
      'getGroupBy',
      'getIssueFilter',
      'getKeyword',
      'getDisplayClosed',
      'getFixedVersionShowClosed',
      'setGroupBy',
      'setIssueFilter',
      'setKeyword',
      'setDisplayClosed',
      'setFixedVersionShowClosed'
    ]),
    async loadData() {
      try {
        await this.fetchData()
      } catch (e) {
        // null
      }
    },
    async fetchData() {
      if (!this.isSelectDefaultOption && !this.isLite) await this.fetchCustomBoard()
      await this.resetClassifyIssue()
      this.projectIssueList = []
      await this.syncLoadFilterData()
      await this.getRelativeList()
      if (this.isSelectDefaultOption && !this.isLite) await this.fetchCustomBoard()
    },
    async fetchCustomBoard() {
      const boards = await getAllBoard(this.projectId)
      const boardId = boards.data.find((item) => item.name === this.groupBy.dimension)?.id
      if (boardId) {
        const params = { ...this.getParams }
        if (params.status_id === 'open') delete params.status_id
        const items = (await getAllBoardItem(this.projectId, boardId, params)).data
        this.customOptions = boards.data.map((board) => {
          if (board.id === boardId) board.items = items
          return board
        })
      } else {
        this.customOptions = boards.data
      }
    },
    async fetchInitData() {
      this.groupBy = await this.getGroupBy()
      await this.checkProjectHasChildren()
      await this.getInitStoredData()
      await this.loadSelectionList()
    },
    async checkProjectHasChildren() {
      this.hasChildren = (await getHasSon(this.projectId)).has_child
      if (this.hasChildren) {
        const res = (await getProjectRelation(this.projectId)).data
        this.project = res[0].child
        this.project.unshift(res[0].parent)
      }
    },
    async getInitStoredData() {
      const key = 'board'
      const storedData = await this.fetchStoredData()
      const { storedFilterValue, storedKeyword, storedDisplayClosed, storedVersionClosed } = storedData
      this.filterValue = storedFilterValue[key] ? storedFilterValue[key] : {}
      if (this.filterValue.hasOwnProperty('assigned_to')) {
        const findChangeIndex = this.assigned_to.findIndex(issue => parseInt(this.filterValue.assigned_to) === parseInt(issue.id))
        if (findChangeIndex < 0) this.$delete(this.filterValue, 'assigned_to')
      }
      this.$delete(this.filterValue, 'tags')
      this.keyword = storedKeyword[key] ? storedKeyword[key] : null
      this.displayClosed = storedDisplayClosed[key] ? storedDisplayClosed[key] : false
      this.fixed_version_closed = storedVersionClosed[key] ? storedVersionClosed[key] : false
      if (!this.filterValue.hasOwnProperty('fixed_version')) {
        const version = this.getFilteredVersion
        if (version.length > 0) {
          this.setFilterValue(version)
        }
      }
    },
    async fetchStoredData() {
      const res = await Promise.allSettled([
        this.getIssueFilter(),
        this.getKeyword(),
        this.getDisplayClosed(),
        this.getFixedVersionShowClosed()
      ])
      const [
        storedFilterValue,
        storedKeyword,
        storedDisplayClosed,
        storedVersionClosed
      ] = res.map((item) => item.value)
      return {
        storedFilterValue,
        storedKeyword,
        storedDisplayClosed,
        storedVersionClosed
      }
    },
    /**
     * if clicked to show closed issues, fetch the whole issues by tree in project
     * and then sort by status
     */
    async getRelativeList() {
      const hasClosed = this.groupByValueOnBoard.filter((item) => item.hasOwnProperty('is_closed') && item.is_closed)
      if (hasClosed.length > 0) {
        const projectIssueListRes = await getProjectIssueListByTree(this.projectId)
        this.relativeIssueList = this.createRelativeList(projectIssueListRes.data)
      }
    },
    async classifyIssue() {
      const issueList = this.projectIssueList
      this.checkGroupByValueOnBoard()
      if (!this.isSelectDefaultOption) {
        const params = { ...this.getParams }
        if (params.status_id === 'open') delete params.status_id
        const res = await getProjectIssueListFromRedmineDB(this.projectId, params)
        this.allUnassignedIssueList = res.data
        this.$set(this.classifyIssueList, 'all', this.allUnassignedIssueList.slice(0, 10))
      }
      issueList.forEach((issue) => {
        if (issue) {
          let dimensionName
          if (this.isSelectDefaultOption) {
            dimensionName = issue[this.groupBy.dimension].id
          } else {
            if (!issue.board) return
            dimensionName = issue.board.find((board) => board.id === this.boardId).item.id
          }
          if (!this.classifyIssueList[dimensionName]) return
          if (this.checkInFilterValue(dimensionName)) this.classifyIssueList[dimensionName].push(issue)
        }
      })
      this.sortIssue()
    },
    checkGroupByValueOnBoard() {
      this.groupByValueOnBoard.filter((item) => item.id !== 'all').forEach((dimension) => {
        if (!this.classifyIssueList.hasOwnProperty(dimension.id)) {
          this.classifyIssueList[dimension.id] = []
        }
      })
    },
    // getParams() {
    //   const result = {}
    //   if (!this.displayClosed && this.groupBy.dimension !== 'status') result['status_id'] = 'open'
    //   if (this.keyword) result['search'] = this.keyword
    //   Object.keys(this.filterValue).forEach((param) => {
    //     if (this.filterValue[param]) {
    //       const isArray = param === 'tags' && this.filterValue[param].length > 0
    //       if (isArray) {
    //         result[param] = this.filterValue[param].join(',')
    //       } else {
    //         result[`${param}_id`] = this.filterValue[param]
    //       }
    //     }
    //   })
    //   return result
    // },
    async syncLoadFilterData() {
      await this.cancelLoadFilterData()
      this.projectIssueQueue = {}
      this.isLoading = true
      const getIssueList = this.getIssueList()
      this.projectIssueList = []
      await this.setIssueList(getIssueList)
      // this.updateData()
      this.projectIssueQueue = {}
      this.isLoading = false
      this.isFirstLoad = false
    },
    getIssueList() {
      const issueList = []
      const issueIds = []
      this.groupByValueOnBoard.filter((item) => item.id !== 'all').forEach((item) => {
        const { CancelToken, config } = this.getCancelToken()
        this.$set(this.projectIssueQueue, item.id, CancelToken)
        if (this.isSelectDefaultOption) {
          const dimension = `${this.groupBy.dimension}_id`
          const params = { ...this.getParams, [dimension]: item.id }
          const getIssueList = getProjectIssueList(this.projectId, params, config)
          issueList.push(getIssueList)
        } else {
          item.issue_ids.forEach((issue_id) => {
            if (issueIds.includes(issue_id)) return
            const getIssueList = getIssue(issue_id)
            issueList.push(getIssueList)
            issueIds.push(issue_id)
          })
        }
      })
      return issueList
    },
    getCancelToken() {
      const CancelToken = axios.CancelToken.source()
      const config = { cancelToken: CancelToken.token }
      return { CancelToken, config }
    },
    async setIssueList(getIssueList) {
      await Promise.allSettled(getIssueList)
        .then((res) => {
          const issueList = res.map((item) => item?.value?.data)
          const list = [].concat(...issueList)
          this.$set(this.$data, 'projectIssueList', list)
        })
        .catch((e) => {
          console.error(e)
        })
    },
    updateIssueList(index, issue) {
      this.$set(this.projectIssueList, index, issue)
    },
    cancelLoadFilterData() {
      Object.values(this.projectIssueQueue).forEach((item) => {
        item.cancel()
      })
    },
    async loadVersionList(status) {
      const params = status ? { status: 'open,locked,closed' } : { status: 'open,locked' }
      const versionList = await this.fetchVersionList(params)
      this.fixed_version = [{ name: this.$t('Issue.VersionUndecided'), id: 'null' }, ...versionList]
      const version = this.getFilteredVersion
      if (version.length > 0) {
        this.setFilterValue(version)
      } else {
        this.$delete(this.originFilterValue, 'fixed_version')
        this.$delete(this.filterValue, 'fixed_version')
      }
      this.onChangeFilter()
    },
    setFilterValue(version) {
      this.$set(this.filterValue, 'fixed_version', version[0].id)
      this.$set(this.originFilterValue, 'fixed_version', version[0].id)
    },
    async fetchVersionList(params) {
      const res = await getProjectVersion(this.projectId, params)
      return res.data.versions
    },
    async loadSelectionList() {
      if (this.projectId === -1) return
      await Promise.allSettled([
        getProjectUserList(this.projectId),
        getTagsByProject(this.projectId)
      ]).then((res) => {
        const [assigneeList, tagsList] = res.map((item) => item.value.data)
        this.setAssignedToData(assigneeList)
        this.tags = tagsList.tags
      })
      await this.loadVersionList(this.fixed_version_closed)
    },
    setAssignedToData(list) {
      const unassigned = {
        name: this.$t('Issue.Unassigned'),
        id: 'null'
      }
      const me = {
        name: this.$t('Issue.me'),
        login: '-Me-',
        id: this.userId,
        class: 'bg-yellow-100'
      }
      const userList = list.user_list
      this.assigned_to = [unassigned, me, ...userList]
    },
    getOptionsData(option_name) {
      return this[option_name]
    },
    resetClassifyIssue() {
      this.classifyIssueList = {}
    },
    getTranslateHeader(value) {
      return this.$te('Issue.' + value) ? this.$t('Issue.' + value) : value
    },
    searchKanbanCard(value, searchBy) {
      if (!value || value === '') return true
      Object.keys(this.classifyIssueList).forEach((item) => {
        value === 'null'
          ? this.searchUnassignedOrNoVersionIssues(item, searchBy)
          : this.searchByKeys(item, value, searchBy)
      })
    },
    searchUnassignedOrNoVersionIssues(item, searchBy) {
      this.classifyIssueList[item] = this.classifyIssueList[item].filter((subItem) => {
        const findKey = searchBy['keys'][0].split('.')
        const findName = findKey.reduce((total, current) => total[current], subItem)
        return findName === undefined && findKey[0] !== ''
      })
    },
    searchByKeys(item, value, searchBy) {
      const fuse = new Fuse(this.classifyIssueList[item], searchBy)
      let pattern = `="${value}"`
      if (Array.isArray(value) && value.length > 0) {
        pattern = { $or: value.map((items) => ({ $path: [searchBy['keys']], $val: `="${items}"` })) }
      }
      const res = fuse.search(pattern)
      this.classifyIssueList[item] = res.map((items) => items.item)
    },
    updateData() {
      this.resetClassifyIssue()
      this.classifyIssue()
      Object.keys(this.filterValue).forEach((item) => {
        const searchOpt = {
          keys: [`${item}.id`],
          useExtendedSearch: true
        }
        this.searchKanbanCard(this.filterValue[item], searchOpt)
      })
    },
    sortIssue() {
      const sortUpdateOn = (a, b) => new Date(b.updated_on) - new Date(a.updated_on)
      Object.keys(this.classifyIssueList).forEach((item) => {
        this.$set(this.classifyIssueList, item, this.classifyIssueList[item].sort(sortUpdateOn))
      })
    },

    checkFilterValue(key) {
      const comparedKey = this.getComparedKey(key)
      for (const item of Object.keys(this[key])) {
        const checkFilterValue = this[key]
        if (checkFilterValue[item] === '') delete checkFilterValue[item]
        if (this[comparedKey][item] !== checkFilterValue[item]) return true
      }
    },
    getComparedKey(key) {
      return key === 'filterValue' ? 'originFilterValue' : 'filterValue'
    },
    createRelativeList(list) {
      const result = []
      function flatList(parent) {
        for (const item of parent) {
          result.push(item)
          const children = item.children
          if (item.children.length) flatList(children)
        }
      }
      flatList(list)
      return result
    },
    getSelectedLabel(item) {
      const visibleStatus = ['closed', 'locked']
      let result = this.getTranslateHeader(item.name)
      if (item.hasOwnProperty('status') && visibleStatus.includes(item.status)) {
        result += ` (${this.getTranslateHeader(item.status)})`
      }
      if (item.hasOwnProperty('login')) {
        result += ` (${item.login})`
      }
      return result
    },
    filterMe(userList) {
      return userList.filter((item) => item.login !== '-Me-')
    },
    async onCleanKeyWord() {
      this.keyword = ''
      const storedData = await this.fetchStoredData()
      storedData.storedKeyword['board'] = this.keyword
      await this.setKeyword(storedData.storedKeyword)
    },
    cleanFilter() {
      this.$emit('clean-filter')
      this.filterValue = Object.assign({}, this.originFilterValue)
      this.keyword = ''
      this.displayClosed = false
      this.onChangeGroupByDimension('status')
      this.onChangeFilter()
      this.fixed_version_closed = false
      this.$refs.customFilter.resetApplyFilter()
    },
    async onChangeFilter() {
      if (this.filterValue['tags'] && this.filterValue['tags'].length <= 0) {
        this.$delete(this.filterValue, 'tags')
      }
      if (Object.prototype.hasOwnProperty.call(this.filterValue, this.groupBy.dimension)) {
        this.$delete(this.filterValue, this.groupBy.dimension)
      }
      this.onSaveFilter()
      await this.loadData()
    },
    async onSaveFilter() {
      const storedData = await this.fetchStoredData()
      const { storedFilterValue, storedKeyword, storedDisplayClosed } = storedData
      storedFilterValue['board'] = this.filterValue
      storedKeyword['board'] = this.keyword
      storedDisplayClosed['board'] = this.displayClosed
      await this.setIssueFilter(storedFilterValue)
      await this.setKeyword(storedKeyword)
      await this.setDisplayClosed(storedDisplayClosed)
    },
    onChangeGroupByDimension(value) {
      this.$set(this.groupBy, 'dimension', value)
      this.$set(this.groupBy, 'value', [])
      this.$refs['groupByValue'].selected = []
      this.updatedByGroupBy()
      this.onChangeFilter()
    },
    onChangeGroupByValue(value, loadData) {
      this.$set(this.groupBy, 'value', value)
      this.updatedByGroupBy(loadData)
    },
    updatedByGroupBy(loadData) {
      this.setGroupBy(this.groupBy)
      if (loadData) this.loadData()
    },
    applyCustomFilter(filters) {
      const { result, displayClosed, fixed_version_closed, groupBy } = filters
      this.filterValue = result
      this.displayClosed = displayClosed
      this.fixed_version_closed = fixed_version_closed
      this.$set(this.groupBy, 'dimension', groupBy.dimension)
      this.$set(this.groupBy, 'value', groupBy.value)
      this.setGroupBy(groupBy)
      this.onChangeFilter()
    },
    onCustomFilterAdded() {
      this.$refs.customFilter.fetchCustomFilter()
    },
    resetSaveFilterButtons() {
      this.$refs.saveFilterButton.reset()
    },
    setSocketListener() {
      const _this = this
      this.socket.on('connect', () => {
        console.log('connect')
      })
      this.socket.on('update_issue', async (data) => {
        for (const idx in data) {
          data[idx] = _this.socketDataFormat(data[idx])
          if (this.isSelectDefaultOption) {
            const findChangeIndex = this.projectIssueList.findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
            this.$set(this.projectIssueList, findChangeIndex, data[idx])
            this.updateData()
          } else {
            Object.keys(this.classifyIssueList).forEach((key) => {
              const findChangeIndex = this.classifyIssueList[key].findIndex(obj => obj.id === data[idx].id)
              if (findChangeIndex === -1) return
              this.$set(this.classifyIssueList[key], findChangeIndex, data[idx])
            })
          }
          // this.showUpdateMessage(data[idx])
        }
        this.elementIds = data.map(s => s.id)
      })
      this.socket.on('delete_issue', async (data) => {
        if (this.isSelectDefaultOption) {
          const findChangeIndex = this.projectIssueList.findIndex(issue => parseInt(data.id) === parseInt(issue.id))
          this.$delete(this.projectIssueList, findChangeIndex)
          this.updateData()
          // this.showUpdateMessage(data)
        } else {
          const { id, item_ids } = data
          const boardItems = Object.keys(this.classifyIssueList).filter((item) => item !== 'all').map((item) => parseInt(item))
          const item_id = item_ids.filter((itemId) => boardItems.includes(itemId))[0]
          const existIds = this.classifyIssueList[item_id || 'all'].map((item) => item.id)
          if (!existIds.includes(id)) return
          const index = this.classifyIssueList[item_id || 'all'].findIndex(issue => parseInt(id) === parseInt(issue.id))
          this.classifyIssueList[item_id || 'all'].splice(index, 1)
        }
      })
      this.socket.on('add_issue', async (data) => {
        if (this.isSelectDefaultOption) {
          for (const idx in data) {
            if ((this.filterValue.project) && (this.filterValue.project === data[idx].project.id) || !this.filterValue.project) {
              data[idx] = _this.socketDataFormat(data[idx])
              const findChangeIndex = this.projectIssueList.findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
              if (findChangeIndex !== -1) {
                this.$set(this.projectIssueList, findChangeIndex, data[idx])
              } else {
                this.$set(this.projectIssueList, this.projectIssueList.length, data[idx])
              }
              this.updateData()
            // this.showUpdateMessage(data[idx])
            }
          }
        } else {
          if (this.addIssueTemp.includes(data[0].id)) return
          this.addIssueTemp.push(data[0].id)
          this.classifyIssueList['all'].unshift(data[0])
        }
        this.elementIds = data.map(s => s.id)
      })
      this.socket.on('disconnect_issue', async (data) => {
        const { id, item_id } = data
        const res = await getIssue(id)
        const findChangeIndex = this.classifyIssueList[item_id].findIndex(issue => parseInt(id) === parseInt(issue.id))
        if (findChangeIndex === -1) return
        this.classifyIssueList[item_id].splice(findChangeIndex, 1)
        this.classifyIssueList['all'].unshift(res.data)
      })
      this.socket.on('connect_issue', async (data) => {
        const { id, item_id } = data
        this.elementIds = [id]
        if (this.connectIssueTemp.includes(id)) return
        this.connectIssueTemp.push(id)
        const existIds = this.classifyIssueList[item_id].map((issue) => issue.id)
        if (existIds.includes(id)) return
        const res = await getIssue(id)
        const index = this.classifyIssueList['all'].findIndex(issue => parseInt(id) === parseInt(issue.id))
        this.classifyIssueList['all'].splice(index, 1)
        this.classifyIssueList[item_id].push(res.data)
      })
      this.socket.on('disconnect', (reason) => {
        if (reason !== 'io client disconnect') {
          this.connectSocket()
        }
      })
      this.socket.on('connect_error', () => {
        console.log('connection error')
      })
    },
    socketDataFormat(data) {
      Object.keys(data).forEach(key => {
        const splitKey = key.split('_id')
        if (splitKey.length > 1) {
          if (this[splitKey[0]]) {
            const findObject = this[splitKey[0]].find(item => item.id === parseInt(data[key]) && item.login !== '-Me-')
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
      await this.socket.emit('join', { project_id: this.projectId })
    },
    async onSocketConnect() {
      this.isLoading = true
      await this.connectSocket()
      this.isLoading = false
    },
    reloadPage() {
      window.location.reload()
    },
    addCustomBoard(target) {
      this.customValueOnBoard.list.push({
        id: null,
        name: '',
        color: '#409EFF'
      })

      this.$nextTick(() => {
        const customContainer = document.getElementById('customContainer')
        customContainer.scrollTop = customContainer.scrollHeight

        if (target) {
          this.focusOnNextInput(target)
        }
      })
    },
    focusOnNextInput(target) {
      const siblingElement = target?.parentElement?.parentElement?.parentElement?.nextElementSibling
      const inputElements = siblingElement.querySelectorAll('input')
      if (inputElements) {
        inputElements[0].focus()
      }
    },
    closeCustomBoardDialog() {
      this.customBoardDialogVisible = false
      this.customValueOnBoard = {
        name: '',
        list: [{
          id: null,
          name: '',
          color: '#409EFF'
        }]
      }
    },
    async confirmCustomBoardDialog() {
      if (this.customValueOnBoard.name === '') {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Issue.BoardName') + this.$t('Notify.NoEmpty'),
          type: 'warning'
        })
        return false
      }
      this.isLoading = true
      const boardName = this.customValueOnBoard.name
      const boardForm = new FormData()
      boardForm.append('board_name', boardName)
      let board_id
      try {
        board_id = (await createNewBoard(this.projectId, boardForm)).data.id
      } catch (error) {
        console.error(error)
        this.isLoading = false
        return false
      }
      const itemsArray = this.customValueOnBoard.list.map((item) => {
        if (!item.name) return
        const itemForm = new FormData()
        itemForm.append('item_name', item.name)
        itemForm.append('color', item.color)
        return createBoardItem(this.projectId, board_id, itemForm)
      })
      await Promise.allSettled(itemsArray).then(async () => {
        await this.fetchCustomBoard()
        this.customBoardDialogVisible = false
        this.customValueOnBoard.name = ''
        this.customValueOnBoard = {
          name: '',
          list: [{
            id: null,
            name: '',
            color: '#409EFF'
          }]
        }
      }).catch((error) => {
        console.error(error)
      }).finally(() => {
        this.onChangeGroupByDimension(boardName)
        this.isLoading = false
      })
    },
    deleteCustomBoard() {
      this.$confirm(this.$t('Issue.DeleteThisBoard'), this.$t('general.Warning'), {
        confirmButtonText: this.$t('general.Confirm'),
        cancelButtonText: this.$t('general.Cancel'),
        type: 'warning'
      }).then(async() => {
        const option = this.customOptions.find((option) => {
          return option.name === this.groupBy.dimension
        })
        await removeBoard(this.projectId, option.id)
        await this.fetchCustomBoard()
        if (this.groupBy.dimension === option.name) {
          this.onChangeGroupByDimension('status')
        }
      }).catch()
    },
    async deleteCustomBoardBySelect(item) {
      await removeBoard(this.projectId, item.id)
      await this.fetchCustomBoard()
      if (this.groupBy.dimension === item.name) {
        this.onChangeGroupByDimension('status')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .fab-main {
  padding: 1.25rem !important;
}

::v-deep .fab-wrapper {
  right: 2.5vh !important;
  bottom: 2.5vh !important;
}

::v-deep .el-dialog__body {
  padding: 0 1rem 1rem;
}

::v-deep .input {
  margin-bottom: 1rem;

  .el-input__inner {
    border-radius: 0;
    border-width: 0 0 1px 0;
    border-color: gray;
  }
}
</style>

<style lang="scss">
.dimension .el-select-dropdown__wrap {
  max-height: 20rem !important;
}
</style>
