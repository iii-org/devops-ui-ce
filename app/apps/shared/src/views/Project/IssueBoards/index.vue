<template>
  <div
    v-loading="isLoading || isFirstLoad"
    :element-loading-text="$t('Loading')"
    class="app-container"
  >
    <ProjectListSelector>
      <el-tooltip
        slot="button"
        :content="
          socket.connected
            ? $t('general.SocketConnected')
            : $t('general.ReconnectByReload')
        "
        :open-delay="100"
        placement="bottom"
      >
        <div style="float: left">
          <el-button
            slot="button"
            :disabled="isLoading"
            :size="isMobile ? 'mini' : 'medium'"
            :type="socket.connected ? 'success' : 'danger'"
            @click="onSocketConnect"
          >
            <div
              :class="socket.connected ? 'bg-success' : 'bg-danger'"
              class="dot inline-block"
            ></div>
            {{
              socket.connected
                ? $t('general.Connected')
                : $t('general.Disconnected')
            }}
          </el-button>
        </div>
      </el-tooltip>
      <el-tooltip
        v-if="socket.disconnected"
        slot="button"
        :content="$t('general.Reload')"
        :open-delay="100"
        placement="bottom"
      >
        <el-button
          circle
          class="mx-2"
          icon="el-icon-refresh"
          plain
          size="small"
          style="float: left"
          type="primary"
          @click="reloadPage"
        />
      </el-tooltip>
      <CustomFilter
        ref="customFilter"
        :group-by="groupBy"
        :selection-options="contextOptions"
        type="issue_board"
        @apply-filter="applyCustomFilter"
      />
      <el-popover
        placement="bottom"
        popper-class="popper"
        trigger="click"
        @hide="resetSaveFilterButtons"
      >
        <el-form v-loading="isLoading" label-position="top">
          <template v-for="dimension in filterOptions">
            <el-form-item
              v-if="groupBy.dimension !== dimension.value"
              :key="dimension.id"
            >
              <div slot="label">
                {{ $t('Issue.' + dimension.value) }}
                <el-tag
                  v-if="dimension.value === 'version'"
                  class="flex-1"
                  size="small"
                  type="info"
                >
                  <el-checkbox v-model="version_closed">
                    <span class="text-xs">
                      {{ $t('Issue.DisplayClosedVersion') }}
                    </span>
                  </el-checkbox>
                </el-tag>
              </div>
              <el-select
                v-model="filterValue[dimension.value]"
                :collapse-tags="dimension.value === 'tags'"
                :disabled="projectId === -1"
                :multiple="dimension.value === 'tags'"
                :placeholder="$t(`Issue.Select${dimension.placeholder}`)"
                clearable
                filterable
                value-key="id"
                @change="onChangeFilter"
              >
                <el-option
                  v-for="item in dimension.value === 'status'
                    ? filterClosedStatus(getOptionsData(dimension.value))
                    : getOptionsData(dimension.value)"
                  :key="
                    dimension.value === 'assigned' ? item.username : item.id
                  "
                  :class="{ [item.class]: item.class }"
                  :label="getSelectedLabel(item)"
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
          <el-form-item>
            <label class="el-form-item__label mr-3">
              {{ $t('Issue.DisplayClosedIssue') }}
            </label>
            <el-checkbox v-model="displayClosed" @change="onChangeFilter" />
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
          class="header-text-color"
          icon="el-icon-s-operation"
          type="text"
        >
          {{ displayFilterValue }}
          <em class="el-icon-arrow-down el-icon--right"></em>
        </el-button>
      </el-popover>
      <el-divider direction="vertical" />
      <el-popover placement="bottom" trigger="click">
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
              <el-option-group
                :label="$t('Issue.FilterDimensions.default_dimension')"
              >
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
                    <span
                      @click="
                        (e) => {
                          e.stopPropagation()
                        }
                      "
                    >
                      <el-popconfirm
                        :cancel-button-text="$t('general.Cancel')"
                        :confirm-button-text="$t('general.Remove')"
                        :title="$t('Issue.RemoveCustomFilter')"
                        icon="el-icon-info"
                        icon-color="red"
                        @cancel="$refs.groupByDimensionSelect.visible = true"
                        @confirm="deleteCustomBoardBySelect(item)"
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
              :loading="isLoading"
              :options="groupByOptions"
              :value="groupBy.value"
              collapse-tags
              filterable
              multiple
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
          <em class="el-icon-arrow-down el-icon--right"></em>
        </el-button>
      </el-popover>
      <el-divider direction="vertical" />
      <el-input
        v-if="searchVisible"
        id="input-search"
        v-model="keyword"
        :disabled="isLoading"
        :placeholder="$t('Issue.SearchNameOrAssignee')"
        clearable
        prefix-icon="el-icon-search"
        style="width: 250px"
        @blur="searchVisible = !searchVisible"
        @change="onChangeFilter"
      />
      <el-button
        v-if="!searchVisible"
        :loading="isLoading"
        class="header-text-color"
        icon="el-icon-search"
        type="text"
        @click="searchVisible = !searchVisible"
      >
        {{ $t('general.Search') + (keyword ? ': ' + keyword : '') }}
      </el-button>
      <template v-if="isFilterChanged">
        <el-divider direction="vertical" />
        <el-button
          :loading="isLoading"
          icon="el-icon-close"
          plain
          size="small"
          type="warning"
          @click="cleanFilter"
        >
          {{ $t('Issue.CleanFilter') }}
        </el-button>
      </template>
    </ProjectListSelector>
    <el-divider />
    <Boards
      :all-unassigned-issue-list="allUnassignedIssueList"
      :assigned="assigned"
      :board-id="boardId"
      :classify-issue-list="classifyIssueList"
      :context-options="contextOptions"
      :display-closed="displayClosed"
      :element-ids="elementIds"
      :filter-options="filterOptions"
      :filter-type="'board'"
      :get-status-sort="getStatusSort"
      :group-by="groupBy"
      :is-select-default-option="isSelectDefaultOption"
      :params="getParams"
      :project-id="projectId"
      :project-issue-list="projectIssueList"
      :relative-issue-list="relativeIssueList"
      :tags="tags"
      :version="version"
      @getRelativeList="getRelativeList"
      @loadData="loadData"
      @updateData="updateData"
      @updateIssueList="updateIssueList"
    />
    <el-dialog
      :before-close="closeCustomBoardDialog"
      :close-on-click-modal="false"
      :show-close="false"
      :visible.sync="customBoardDialogVisible"
      append-to-body
      destroy-on-close
      top="3vh"
    >
      <el-row slot="title">
        <span class="text-title">
          {{ $t('general.Add') + $t('Issue.CustomBoard') }}
        </span>
        <span class="float-right">
          <el-button
            :loading="isLoading"
            class="buttonSecondaryReverse"
            size="small"
            @click="closeCustomBoardDialog"
          >
            {{ $t('general.Cancel') }}
          </el-button>
          <el-button
            :loading="isLoading"
            class="buttonPrimary"
            size="small"
            type="success"
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
        <div id="customContainer" style="max-height: 30vh; overflow: auto">
          <CustomItem
            v-for="(boardObject, index) in customValueOnBoard.list"
            :key="boardObject.id"
            v-loading="isLoading"
            :board-object.sync="boardObject"
            :class="
              customValueOnBoard.list.length !== index + 1 ? 'mb-2' : null
            "
            :group-by-value-on-board="customValueOnBoard.list"
            :order="index"
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
      bg-color="#409eff"
      icon-size="small"
      main-icon="ri-more-2-fill"
      position="bottom-right"
      @addButton="customBoardDialogVisible = true"
      @deleteButton="deleteCustomBoard()"
    />
  </div>
</template>

//TODO: move dimension filter into SearchFilter.vue
<script>
import {
  getProjectIssueListByTree,
  getProjectIssueListFromRedmineDB
} from '@/api/projects'
import { getIssue } from '@/api_v2/issue'
import {
  createBoard,
  createBoardItem,
  deleteBoard,
  getBoardItemList,
  getBoardList
} from '@/api_v3/issueBoard'
import {
  getProjectIssueList,
  getProjectUserList,
  getProjectVersion,
  getTagList
} from '@/api_v3/projects'
import SaveFilterButton from '@/components/Issue/components/SaveFilterButton'
import axios from 'axios'
import Fuse from 'fuse.js'
import { io } from 'socket.io-client'
import { mapActions, mapGetters } from 'vuex'
import Boards from './components/Boards'
import CustomItem from './components/CustomItem'

export default {
  name: 'IssueBoards',
  components: {
    CustomItem,
    Boards,
    ElSelectAll: () => import('@shared/components/ElSelectAll'),
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker'),
    Priority: () => import('@/components/Issue/Priority'),
    CustomFilter: () => import('@/components/Issue/CustomFilter'),
    SaveFilterButton,
    Fab: () => import('@shared/components/Fab')
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
      version_closed: false,
      projectIssueList: [],
      projectIssueQueue: {},
      classifyIssueList: {},
      version: [],
      assigned: [],
      tags: [],
      relativeIssueList: [],
      searchVisible: false,
      keyword: null,
      elementIds: [],
      projectId: null,
      isFirstLoad: false,
      filterOptions: [
        {
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
          label: this.$t('Issue.FilterDimensions.assigned'),
          value: 'assigned',
          placeholder: 'Member'
        },
        {
          id: 5,
          label: this.$t('Issue.FilterDimensions.version'),
          value: 'version',
          placeholder: 'Version'
        },
        {
          id: 6,
          label: this.$t('Issue.FilterDimensions.priority'),
          value: 'priority',
          placeholder: 'Priority',
          tag: true
        }
      ],
      socket: io(`/issues`, {
        // production socket
        reconnectionAttempts: 5,
        forceNew: true
      }),
      // socket: io(`${import.meta.env.VITE_APP_BASE_API}/issues/websocket`, { // development socket
      //   reconnectionAttempts: 5
      // })
      customBoardDialogVisible: false,
      customValueOnBoard: {
        name: '',
        list: [
          {
            id: null,
            name: '',
            color: '#409EFF'
          }
        ]
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
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    filterDimensionsList() {
      return (value) =>
        value !== 'tags' &&
        value !== 'due_date_start' &&
        value !== 'due_date_end'
    },
    contextOptions() {
      const result = {}
      const getOptions = ['assigned', 'version', 'tags']
      getOptions.forEach((item) => {
        result[item] = this[item]
      })
      return result
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
      return this.groupBy.dimension === 'assigned'
        ? this.filterMe(this.groupBy.value)
        : this.groupBy.value
    },
    getStatusSort() {
      const dimension = this.groupBy.dimension
      if (this.isSelectDefaultOption) {
        let sort =
          dimension === 'status'
            ? this.filterClosedStatus(this[dimension])
            : this[dimension]
        sort = dimension === 'assigned' ? this.filterMe(sort) : sort
        return sort
      } else {
        const sort =
          this.customOptions.find((option) => option.name === dimension)
            ?.items || []
        sort.unshift({
          id: 'all',
          name: this.$t('Issue.Uncategorized'),
          color: '#409EFF'
        })
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
        return this.filterOptions.find(
          (item) => item.value === this.groupBy.dimension
        ).label
      } else {
        return this.customOptions.find(
          (item) => item.name === this.groupBy.dimension
        )?.name
      }
    },
    showSelectedGroupByLength() {
      if (
        this.groupByOptions.length === this.groupBy.value.length ||
        this.groupBy.value.length === 0
      ) {
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
        const isArray =
          Array.isArray(this.filterValue[item]) &&
          this.filterValue[item].length > 0
        isArray
          ? selectedLabels.push(this.handleArrayLabels(item))
          : selectedLabels.push(this.handleLabels(item))
      })
      return selectedLabels
    },
    handleArrayLabels() {
      return function (item) {
        let label = ''
        const value = this.getOptionsData(item).filter((search) =>
          this.filterValue[item].includes(search.id)
        )
        if (value) {
          const joinedString = value
            .map((subItem) => this.getSelectedLabel(subItem))
            .join('/')
          label = `#${joinedString}`
        }
        return label
      }
    },
    handleLabels() {
      return function (item) {
        let label = ''
        const value = this.getOptionsData(item).find(
          (search) => search.id === this.filterValue[item]
        )
        if (value) label = this.getSelectedLabel(value)
        return label
      }
    },
    isFilterChanged() {
      return (
        this.checkFilterValue('originFilterValue') ||
        this.checkFilterValue('filterValue') ||
        !!this.keyword ||
        this.groupBy.dimension !== 'status'
      )
    },
    getFilteredVersion() {
      return this.version.filter((item) => {
        const validDate =
          new Date(`${item.effective_date}T23:59:59`) >= new Date()
        const closedStatus = item.status !== 'closed'
        return validDate && closedStatus
      })
    },
    checkInFilterValue() {
      return function (value) {
        if (this.groupByValueOnBoard.length <= 0) return true
        return this.groupByValueOnBoard.find((item) => item.id === value)
      }
    },
    filterValueClone() {
      return Object.assign({}, this.filterValue, {
        groupBy: this.groupBy,
        version_closed: this.version_closed,
        displayClosed: this.displayClosed
      })
    },
    isSelectDefaultOption() {
      const defaultStatus = [
        'tracker',
        'status',
        'priority',
        'assigned',
        'version'
      ]
      return defaultStatus.includes(this.groupBy.dimension)
    },
    getParams() {
      const result = {}
      if (!this.displayClosed && this.groupBy.dimension !== 'status') {
        result['exclude_closed'] = true
      }
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
      return this.customOptions.find(
        (item) => item.name === this.groupBy.dimension
      )?.id
    },
    fabActions() {
      const actions = [
        {
          name: 'addButton',
          icon: 'ri-add-large-line',
          color: '#409eff'
        },
        {
          name: 'deleteButton',
          icon: 'ri-delete-bin-line',
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
    version_closed(value) {
      this.setFixedVersionShowClosed({ board: value })
      this.loadVersionList(value)
    }
  },
  async created() {
    this.isFirstLoad = true
    this.projectId = this.selectedProjectId
    await this.connectSocket()
    this.setSocketListener() // Only need register once
    // await this.fetchInitData()
  },
  beforeDestroy() {
    this.socket.disconnect()
    this.onSaveFilter()
  },
  methods: {
    ...mapActions('projects', [
      // 'getProjectUserList',
      'getGroupBy',
      'getIssueFilter',
      'getKeyword',
      'getDisplayClosed',
      'getFixedVersionShowClosed',
      'setGroupBy',
      'setIssueFilter',
      'setKeyword',
      'setDisplayClosed',
      'setFixedVersionShowClosed',
      'isProjectHasChildren'
    ]),
    async loadData() {
      try {
        await this.fetchData()
      } catch (e) {
        // null
      }
    },
    async fetchData() {
      if (!this.isSelectDefaultOption && !this.isLite) {
        await this.fetchCustomBoard()
      }
      await this.resetClassifyIssue()
      this.projectIssueList = []
      await this.syncLoadFilterData()
      await this.getRelativeList()
      if (this.isSelectDefaultOption && !this.isLite) {
        await this.fetchCustomBoard()
      }
    },
    async fetchCustomBoard() {
      const boards = await getBoardList(this.projectId)
      const boardId = boards.data.find(
        (item) => item.name === this.groupBy.dimension
      )?.id
      if (boardId) {
        const items = (await getBoardItemList(boardId)).data
        this.customOptions = boards.data.map((board) => {
          if (board.id === boardId) board.items = items
          return board
        })
      } else {
        this.customOptions = boards.data
      }
    },
    async fetchInitData() {
      if (this.projectId === -1) {
        this.isLoading = false
        return
      }
      this.groupBy = await this.getGroupBy()
      await this.getInitStoredData()
      await this.loadSelectionList()
    },
    async getInitStoredData() {
      const key = 'board'
      const storedData = await this.fetchStoredData()
      const {
        storedFilterValue,
        storedKeyword,
        storedDisplayClosed,
        storedVersionClosed
      } = storedData
      this.filterValue = storedFilterValue[key] ? storedFilterValue[key] : {}
      if (this.filterValue.hasOwnProperty('assigned')) {
        const findChangeIndex = this.assigned.findIndex(
          (issue) => parseInt(this.filterValue.assigned) === parseInt(issue.id)
        )
        if (findChangeIndex < 0) this.$delete(this.filterValue, 'assigned')
      }
      this.$delete(this.filterValue, 'tags')
      this.keyword = storedKeyword[key] ? storedKeyword[key] : null
      this.displayClosed = storedDisplayClosed[key]
        ? storedDisplayClosed[key]
        : false
      this.version_closed = storedVersionClosed[key]
        ? storedVersionClosed[key]
        : false
      if (!this.filterValue.hasOwnProperty('version')) {
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
      const hasClosed = this.groupByValueOnBoard.filter(
        (item) => item.hasOwnProperty('is_closed') && item.is_closed
      )
      if (hasClosed.length > 0) {
        const projectIssueListRes = await getProjectIssueListByTree(
          this.projectId
        )
        this.relativeIssueList = this.createRelativeList(
          projectIssueListRes.data
        )
      }
    },
    async classifyIssue() {
      const issueList = this.projectIssueList
      this.checkGroupByValueOnBoard()
      if (!this.isSelectDefaultOption) {
        const params = { ...this.getParams }
        // if (params.status_id === 'open') delete params.status_id
        const res = await getProjectIssueListFromRedmineDB(
          this.projectId,
          params
        )
        this.allUnassignedIssueList = res.data
        this.$set(
          this.classifyIssueList,
          'all',
          this.allUnassignedIssueList.slice(0, 10)
        )
      }
      issueList.forEach((issue) => {
        if (issue) {
          let dimensionName
          if (this.isSelectDefaultOption) {
            dimensionName = issue[this.groupBy.dimension]?.id || 'null'
          } else {
            if (!issue.board) return
            dimensionName = issue.board.find(
              (board) => board.id === this.boardId
            ).item.id
          }
          if (!this.classifyIssueList[dimensionName]) return
          if (this.checkInFilterValue(dimensionName)) {
            this.classifyIssueList[dimensionName].push(issue)
          }
        }
      })
      this.sortIssue()
    },
    checkGroupByValueOnBoard() {
      this.groupByValueOnBoard
        .filter((item) => item.id !== 'all')
        .forEach((dimension) => {
          if (!this.classifyIssueList.hasOwnProperty(dimension.id)) {
            this.classifyIssueList[dimension.id] = []
          }
        })
    },
    async syncLoadFilterData() {
      await this.cancelLoadFilterData()
      this.projectIssueQueue = {}
      this.isLoading = true
      const getIssueList = this.getIssueList()
      this.projectIssueList = []
      await this.setIssueList(getIssueList)
      this.projectIssueQueue = {}
      this.isLoading = false
      this.isFirstLoad = false
    },
    getIssueList() {
      const issueList = []
      const issueIds = []
      this.groupByValueOnBoard
        .filter((item) => item.id !== 'all')
        .forEach((item) => {
          const { CancelToken, config } = this.getCancelToken()
          this.$set(this.projectIssueQueue, item.id, CancelToken)
          if (this.isSelectDefaultOption) {
            const dimension = `${this.groupBy.dimension}_id`
            const params = {
              ...this.getParams,
              [dimension]: item.id,
              all: true
            }
            const getIssueList = getProjectIssueList(
              this.projectId,
              params,
              config
            )
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
      const params = status
        ? { all: true, status: 'open,locked,closed' }
        : { all: true, status: 'open,locked' }
      const versionList = await this.fetchVersionList(params)
      this.version = [
        { name: this.$t('Issue.VersionUndecided'), id: 'null' },
        ...versionList
      ]
      const version = this.getFilteredVersion
      if (version.length > 0) {
        this.setFilterValue(version)
        if (
          this.groupBy.dimension === 'version' &&
          this.groupBy.value.length === 0
        ) {
          this.setDefaultFixedVersion()
        }
      } else {
        this.$delete(this.originFilterValue, 'version')
        this.$delete(this.filterValue, 'version')
      }
      this.onChangeFilter()
    },
    setDefaultFixedVersion() {
      const defaultFixedVersion = [this.version[0]]
      if (this.getFilteredVersion.length > 0) {
        defaultFixedVersion.push(this.getFilteredVersion[0])
      }
      this.$set(this.groupBy, 'value', defaultFixedVersion)
    },
    setFilterValue(version) {
      this.$set(this.filterValue, 'version', version[0].id)
      this.$set(this.originFilterValue, 'version', version[0].id)
    },
    async fetchVersionList(params) {
      const res = await getProjectVersion(this.projectId, params)
      return res.data
    },
    async loadSelectionList() {
      if (this.projectId === -1) {
        this.isLoading = false
        return
      }
      await Promise.allSettled([
        getProjectUserList(this.projectId),
        getTagList(this.projectId)
      ]).then((res) => {
        const [assigneeList, tagsList] = res.map((item) => item.value.data)
        this.setAssignedToData(assigneeList)
        this.tags = tagsList
      })
      await this.loadVersionList(this.version_closed)
    },
    setAssignedToData(list) {
      const unassigned = {
        name: this.$t('Issue.Unassigned'),
        id: 'null'
      }
      const me = {
        name: this.$t('Issue.me'),
        username: '-Me-',
        id: this.userId,
        class: 'bg-yellow-100'
      }
      const userList = list.map((item) => ({
        name: item.full_name,
        username: item.username,
        id: item.id
      }))
      this.assigned = [unassigned, me, ...userList]
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
      this.classifyIssueList[item] = this.classifyIssueList[item].filter(
        (subItem) => {
          const findKey = searchBy['keys'][0].split('.')
          const findName = findKey.reduce(
            (total, current) => total[current],
            subItem
          )
          return findName === undefined && findKey[0] !== ''
        }
      )
    },
    searchByKeys(item, value, searchBy) {
      const fuse = new Fuse(this.classifyIssueList[item], searchBy)
      let pattern = `="${value}"`
      if (Array.isArray(value) && value.length > 0) {
        pattern = {
          $or: value.map((items) => ({
            $path: [searchBy['keys']],
            $val: `="${items}"`
          }))
        }
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
      const sortUpdateOn = (a, b) =>
        new Date(b.updated_on) - new Date(a.updated_on)
      Object.keys(this.classifyIssueList).forEach((item) => {
        this.$set(
          this.classifyIssueList,
          item,
          this.classifyIssueList[item].sort(sortUpdateOn)
        )
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
      if (
        item.hasOwnProperty('status') &&
        visibleStatus.includes(item.status)
      ) {
        result += ` (${this.getTranslateHeader(item.status)})`
      }
      if (item.hasOwnProperty('username')) {
        result += ` (${item.username})`
      }
      return result
    },
    filterMe(userList) {
      return userList.filter((item) => item.username !== '-Me-')
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
      this.version_closed = false
      this.$refs.customFilter.resetApplyFilter()
    },
    async onChangeFilter() {
      if (this.filterValue['tags'] && this.filterValue['tags'].length <= 0) {
        this.$delete(this.filterValue, 'tags')
      }
      if (
        Object.prototype.hasOwnProperty.call(
          this.filterValue,
          this.groupBy.dimension
        )
      ) {
        this.$delete(this.filterValue, this.groupBy.dimension)
      }
      this.onSaveFilter()
      await this.loadData()
    },
    async onSaveFilter() {
      const storedData = await this.fetchStoredData()
      const { storedFilterValue, storedKeyword, storedDisplayClosed } =
        storedData
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
      if (
        this.groupBy.dimension === 'version' &&
        this.groupBy.value.length === 0
      ) {
        this.setDefaultFixedVersion()
      }
      if (loadData) this.loadData()
    },
    applyCustomFilter(filters) {
      const { result, displayClosed, version_closed, groupBy } = filters
      this.filterValue = result
      this.displayClosed = displayClosed
      this.version_closed = version_closed
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
        console.log(this.socket.id)
      })
      this.socket.on('connect_error', (error) => {
        if (!this.socket.active) {
          // In this is what we care, other cases will auto reconnect
          console.error(error.message)
        }
      })
      this.socket.on('disconnect', (reason) => {
        if (!this.socket.active) {
          console.log(reason)
          if (reason !== 'io client disconnect') {
            this.connectSocket()
          }
        }
      })
      // Custom events
      this.socket.on('update_issue', async (data) => {
        for (const idx in data) {
          data[idx] = _this.socketDataFormat(data[idx])
          if (this.isSelectDefaultOption) {
            const findChangeIndex = this.projectIssueList.findIndex(
              (issue) => parseInt(data[idx].id) === parseInt(issue.id)
            )
            this.$set(this.projectIssueList, findChangeIndex, data[idx])
            this.updateData()
          } else {
            Object.keys(this.classifyIssueList).forEach((key) => {
              const findChangeIndex = this.classifyIssueList[key].findIndex(
                (obj) => obj.id === data[idx].id
              )
              if (findChangeIndex === -1) return
              this.$set(this.classifyIssueList[key], findChangeIndex, data[idx])
            })
          }
        }
        this.elementIds = data.map((s) => s.id)
      })
      this.socket.on('delete_issue', async (data) => {
        if (this.isSelectDefaultOption) {
          const findChangeIndex = this.projectIssueList.findIndex(
            (issue) => parseInt(data.id) === parseInt(issue.id)
          )
          this.$delete(this.projectIssueList, findChangeIndex)
          this.updateData()
        } else {
          const { id, item_ids } = data
          const boardItems = Object.keys(this.classifyIssueList)
            .filter((item) => item !== 'all')
            .map((item) => parseInt(item))
          const item_id = item_ids.filter((itemId) =>
            boardItems.includes(itemId)
          )[0]
          const existIds = this.classifyIssueList[item_id || 'all'].map(
            (item) => item.id
          )
          if (!existIds.includes(id)) return
          const index = this.classifyIssueList[item_id || 'all'].findIndex(
            (issue) => parseInt(id) === parseInt(issue.id)
          )
          this.classifyIssueList[item_id || 'all'].splice(index, 1)
        }
      })
      this.socket.on('add_issue', async (data) => {
        if (this.isSelectDefaultOption) {
          for (const idx in data) {
            data[idx] = _this.socketDataFormat(data[idx])
            const findChangeIndex = this.projectIssueList.findIndex(
              (issue) => parseInt(data[idx].id) === parseInt(issue.id)
            )
            if (findChangeIndex !== -1) {
              this.$set(this.projectIssueList, findChangeIndex, data[idx])
            } else {
              this.$set(
                this.projectIssueList,
                this.projectIssueList.length,
                data[idx]
              )
            }
            this.updateData()
          }
        } else {
          if (this.addIssueTemp.includes(data[0].id)) return
          this.addIssueTemp.push(data[0].id)
          this.classifyIssueList['all'].unshift(data[0])
        }
        this.elementIds = data.map((s) => s.id)
      })
      this.socket.on('disconnect_issue', async (data) => {
        const { id, item_id } = data
        const res = await getIssue(id)
        const findChangeIndex = this.classifyIssueList[item_id].findIndex(
          (issue) => parseInt(id) === parseInt(issue.id)
        )
        if (findChangeIndex === -1) return
        this.classifyIssueList[item_id].splice(findChangeIndex, 1)
        this.classifyIssueList['all'].unshift(res.data)
      })
      this.socket.on('connect_issue', async (data) => {
        const { id, item_id } = data
        this.elementIds = [id]
        if (this.connectIssueTemp.includes(id)) return
        this.connectIssueTemp.push(id)
        const existIds = this.classifyIssueList[item_id].map(
          (issue) => issue.id
        )
        if (existIds.includes(id)) return
        const res = await getIssue(id)
        const index = this.classifyIssueList['all'].findIndex(
          (issue) => parseInt(id) === parseInt(issue.id)
        )
        this.classifyIssueList['all'].splice(index, 1)
        this.classifyIssueList[item_id].push(res.data)
      })
    },
    socketDataFormat(data) {
      Object.keys(data).forEach((key) => {
        const splitKey = key.split('_id')
        if (splitKey.length > 1) {
          if (this[splitKey[0]]) {
            const findObject = this[splitKey[0]].find(
              (item) =>
                item.id === parseInt(data[key]) && item.username !== '-Me-'
            )
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
        message: this.$t('Notify.UpdateKanban', { issueName: data.subject }),
        type: 'success'
      })
    },
    async connectSocket() {
      if (!this.socket.connected) {
        this.socket.connect()
        // Change to different project room if switch to another
        this.socket.emit('join', { project_id: this.projectId })
      }
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
      const siblingElement =
        target?.parentElement?.parentElement?.parentElement?.nextElementSibling
      const inputElements = siblingElement.querySelectorAll('input')
      if (inputElements) {
        inputElements[0].focus()
      }
    },
    closeCustomBoardDialog() {
      this.customBoardDialogVisible = false
      this.customValueOnBoard = {
        name: '',
        list: [
          {
            id: null,
            name: '',
            color: '#409EFF'
          }
        ]
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
      const sendData = {
        name: this.customValueOnBoard.name
      }
      let board_id
      try {
        board_id = (await createBoard(this.projectId, sendData)).data.id
      } catch (error) {
        console.error(error)
        this.isLoading = false
        return false
      }
      const itemsArray = this.customValueOnBoard.list.map((item) => {
        if (!item.name) return
        const sendData = {
          name: item.name,
          color: item.color
        }
        return createBoardItem(board_id, sendData)
      })
      await Promise.allSettled(itemsArray)
        .then(async () => {
          await this.fetchCustomBoard()
          this.customBoardDialogVisible = false
          this.onChangeGroupByDimension(this.customValueOnBoard.name)
          this.customValueOnBoard = {
            name: '',
            list: [
              {
                id: null,
                name: '',
                color: '#409EFF'
              }
            ]
          }
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    deleteCustomBoard() {
      this.$confirm(
        this.$t('Issue.DeleteThisBoard'),
        this.$t('general.Warning'),
        {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        }
      )
        .then(async () => {
          const option = this.customOptions.find((option) => {
            return option.name === this.groupBy.dimension
          })
          await deleteBoard(option.id)
          await this.fetchCustomBoard()
          if (this.groupBy.dimension === option.name) {
            this.onChangeGroupByDimension('status')
          }
        })
        .catch()
    },
    async deleteCustomBoardBySelect(item) {
      await deleteBoard(item.id)
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
