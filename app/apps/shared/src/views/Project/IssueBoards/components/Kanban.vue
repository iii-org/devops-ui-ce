<template>
  <div
    :class="getHeaderBarClassName(boardObject.name)"
    :style="fromWbs ? 'background: transparent' : ''"
    class="board-column"
  >
    <div :style="!fromWbs ? '' : 'height: 10px'" class="board-column-header">
      <div
        :style="{
          backgroundColor: !isSelectDefaultOption ? boardObject.color : ''
        }"
        class="header-bar"
      ></div>
      <div
        v-if="!isSelectDefaultOption && boardObject.id !== 'all' && !fromWbs"
        class="flex items-start float-right p-1"
        @mouseenter="$emit('update:isDraggable', false)"
        @mouseleave="$emit('update:isDraggable', true)"
      >
        <el-tooltip
          :content="isEdited ? $t('general.Save') : $t('general.Edit')"
          placement="bottom"
        >
          <em
            :class="isEdited ? 'el-icon-check' : 'el-icon-edit-outline'"
            class="primary table-button"
            style="font-size: 14px"
            @click="handleEdit()"
          ></em>
        </el-tooltip>
        <el-tooltip
          :content="isEdited ? $t('general.Cancel') : $t('general.Delete')"
          placement="bottom"
        >
          <em
            :class="isEdited ? 'el-icon-close' : 'el-icon-delete'"
            class="danger table-button"
            style="font-size: 14px"
            @click="handleClose()"
          ></em>
        </el-tooltip>
      </div>
      <el-row v-if="!fromWbs" class="flex">
        <el-col class="text-center">
          <span
            v-if="!isEdited"
            :style="{
              'padding-left': boardObject.id !== 'all' ? '1.5rem' : ''
            }"
          >
            {{ getTranslateHeader(boardObject.name) }}
            <strong v-if="boardObject.id !== 'all'">
              ({{ list.length }})
            </strong>
          </span>
          <CustomItem
            v-else
            :board-id="boardId"
            :board-object="boardObject"
            :group-by-value-on-board="groupByValueOnBoard"
            :is-edited="isEdited"
            @loadData="$emit('loadData')"
            @mouseenter.native="$emit('update:isDraggable', false)"
            @mouseleave.native="$emit('update:isDraggable', true)"
          />
        </el-col>
      </el-row>
    </div>
    <div class="overflow-auto el-scrollbar__view">
      <ul
        v-infinite-scroll="loadMoreIssueList"
        :class="
          boardObject.id !== 'all' || list < 10 ? 'el-scrollbar__view' : ''
        "
        :infinite-scroll-disabled="isScrollDisabled"
        :infinite-scroll-immediate="false"
        class="p-0 m-0"
      >
        <Draggable
          :animation="120"
          :class="boardObject.name"
          :disabled="disabled"
          :draggable="'.item'"
          :force-fallback="true"
          :list="list"
          :move="canIssueMoved"
          :style="fromWbs ? 'border: 1px solid transparent' : ''"
          class="board-column-content"
          drag-class="dragClass"
          ghost-class="ghostClass"
          v-bind="$attrs"
          @change="end(boardObject, $event)"
        >
          <div
            v-for="(element, idx) in list"
            :id="element.id"
            :key="element.id"
            :ref="element.id"
            class="board-item item"
            @dragover="allowDrop($event, idx)"
            @drop="dropPanelLabels($event, idx, element.id)"
            @touchstart="disabled ? longPress(element, '', $event) : ''"
            @contextmenu.capture="handleContextMenu(element, '', $event)"
          >
            <el-tooltip
              :content="`${element.done_ratio}%`"
              :disabled="element.done_ratio === 0"
              placement="right"
            >
              <el-progress
                v-if="element.done_ratio > 0"
                :percentage="element.done_ratio"
                :show-text="false"
                :status="getStatus(element)"
                :stroke-width="4"
                class="progress-bar"
              />
            </el-tooltip>
            <div>
              <div :class="fromWbs ? 'cardTitle' : ''" class="title">
                <span
                  :class="fromWbs ? 'msg-text truncate' : ''"
                  class="text link-text-color"
                  @click="handleClick(element)"
                >
                  <el-tooltip
                    v-if="fromWbs"
                    :content="element.subject"
                    :open-delay="100"
                    placement="bottom-start"
                  >
                    <span>
                      {{ element.subject }}
                    </span>
                  </el-tooltip>
                  <span v-else>
                    {{ element.subject }}
                  </span>
                  <el-tag
                    v-for="item in element.tags"
                    :key="item.id"
                    class="tags"
                    effect="plain"
                    size="mini"
                  >
                    {{ item.name }}
                  </el-tag>
                </span>
                <div class="action">
                  <div
                    class="icon"
                    @click.stop="handleContextMenu(element, '', $event)"
                  >
                    <em class="el-icon-more"></em>
                  </div>
                </div>
              </div>
              <div class="issue-status-tags">
                <span v-if="dimension !== 'status'">
                  <Status
                    v-if="element.status.name"
                    :name="$t(`Issue.${element.status.name}`)"
                    :type="element.status.name"
                    class="status"
                    size="mini"
                  />
                </span>
                <span v-if="dimension !== 'priority'">
                  <Priority
                    v-if="element.priority.name"
                    :name="$t(`Issue.${element.priority.name}`)"
                    :type="element.priority.name"
                    class="priority"
                    icon
                    size="mini"
                  />
                </span>
                <span v-if="dimension !== 'tracker'">
                  <Tracker
                    :name="$t(`Issue.${element.tracker.name}`)"
                    :style="
                      fromWbs ? 'max-width: 80px; display: inline-block;' : ''
                    "
                    :type="element.tracker.name"
                    class="tracker"
                    is-hide-name
                  />
                </span>
                <el-tooltip
                  v-if="element.assigned"
                  :content="element.assigned.username"
                  :disabled="!element.assigned.username"
                  placement="right-start"
                >
                  <span v-if="fromWbs" style="float: right">
                    <span class="detail user">
                      <em class="el-icon-user-solid"></em>
                      <span
                        class="text"
                        style="
                          font-size: 14px;
                          max-width: 120px;
                          display: inline-block;
                        "
                      >
                        {{ element.assigned.full_name }}
                      </span>
                    </span>
                  </span>
                </el-tooltip>
              </div>
            </div>
            <div v-if="element.has_family" class="relation">
              <el-collapse
                v-model="element.show"
                @change="onCollapseChange(element)"
              >
                <el-collapse-item name="relation">
                  <template #title>
                    <em class="el-icon-caret-right"></em>
                    {{ $t('Issue.RelatedIssue') }} {{ element | lengthFilter }}
                  </template>
                  <div v-if="element.has_family" class="parent">
                    <div
                      v-if="element.parent"
                      @contextmenu="
                        handleContextMenu(element.parent, '', $event)
                      "
                    >
                      <strong>{{ $t('Issue.ParentIssue') }}：</strong>
                      <Status
                        :name="$t(`Issue.${element.parent.status.name}`)"
                        :type="element.parent.status.name"
                        size="mini"
                        tooltip
                      />
                      <el-link
                        :underline="false"
                        class="link-text-color"
                        @click="handleClick(element.parent)"
                      >
                        {{ element.parent.subject }}
                        <el-tag
                          v-for="item in element.parent.tags"
                          :key="item.id"
                          class="tags"
                          effect="plain"
                          size="mini"
                        >
                          {{ item.name }}
                        </el-tag>
                      </el-link>
                    </div>
                    <div v-if="element.children && element.children.length > 0">
                      <strong>{{ $t('Issue.ChildrenIssue') }}：</strong>
                      <ol class="children_list">
                        <li
                          v-for="(subElement, index) in element.children"
                          :key="index"
                          @contextmenu="
                            handleContextMenu(subElement, '', $event)
                          "
                        >
                          <Status
                            :name="$t(`Issue.${subElement.status.name}`)"
                            :type="subElement.status.name"
                            size="mini"
                            tooltip
                          />
                          <el-link
                            :underline="false"
                            class="link-text-color"
                            @click="handleClick(subElement)"
                          >
                            {{ subElement.subject }}
                            <el-tag
                              v-for="item in subElement.tags"
                              :key="item.id"
                              class="tags"
                              effect="plain"
                              size="mini"
                            >
                              {{ item.name }}
                            </el-tag>
                          </el-link>
                        </li>
                      </ol>
                    </div>
                    <div
                      v-if="element.relations && element.relations.length > 0"
                    >
                      <strong>{{ $t('Issue.RelatedIssue') }}：</strong>
                      <ol class="children_list">
                        <li
                          v-for="(subElement, index) in element.relations"
                          :key="index"
                          @contextmenu="
                            handleContextMenu(subElement, '', $event)
                          "
                        >
                          <Status
                            :name="$t(`Issue.${subElement.status.name}`)"
                            :type="subElement.status.name"
                            size="mini"
                            tooltip
                          />
                          <el-link
                            :underline="false"
                            class="link-text-color"
                            @click="handleClick(subElement)"
                          >
                            {{ subElement.subject }}
                            <el-tag
                              v-for="item in subElement.tags"
                              :key="item.id"
                              class="tags"
                              effect="plain"
                              size="mini"
                            >
                              {{ item.name }}
                            </el-tag>
                          </el-link>
                        </li>
                      </ol>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            <div
              v-if="(element.due_date || element.assigned) && !fromWbs"
              class="info"
            >
              <div
                v-if="element.due_date"
                :class="getDateStatus(element)"
                class="detail due_date"
              >
                <em class="el-icon-date"></em>
                <div :class="getDateStatus(element)" class="text">
                  {{ element.due_date }}
                </div>
              </div>
              <div v-else class="detail due_date">
                <em class="el-icon-date"></em>
              </div>
              <el-tooltip
                v-if="element.assigned"
                :content="element.assigned.username"
                :disabled="!element.assigned.username"
                placement="right-start"
              >
                <div class="detail user">
                  <em class="el-icon-user-solid"></em>
                  <div class="text">
                    {{ element.assigned.full_name }}
                  </div>
                </div>
              </el-tooltip>
              <div v-else class="detail user">
                <em class="el-icon-user-solid"></em>
              </div>
            </div>
            <div v-else class="no-info"></div>
          </div>
          <div
            v-if="!fromWbs"
            slot="header"
            @mouseenter="$emit('update:isDraggable', false)"
            @mouseleave="$emit('update:isDraggable', true)"
          >
            <div
              :class="
                selectedProjectId === -1 ? 'board-item-ban' : 'board-item'
              "
              class="title board-item select-none"
              @click="showDialog = !showDialog"
            >
              <em
                :class="{ rotate: showDialog }"
                class="el-icon-plus ml-4 mr-5 add-button"
              ></em>
              {{ $t('Issue.AddIssue') }}
            </div>
            <transition name="slide-down">
              <QuickAddIssueOnBoard
                v-if="showDialog"
                :board-object="boardObject"
                :filter-type="filterType"
                :is-select-default-option="isSelectDefaultOption"
                :project-id="projectId"
                :save-data="addIssue"
                class="board-item quick-add"
                @after-add="showDialog = !showDialog"
              />
            </transition>
          </div>
          <p v-if="loading && !noMore" v-loading="loading" class="py-3"></p>
        </Draggable>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getIssueFamily } from '@/api_v3/issues'
import { deleteBoardItem, updateBoardItem } from '@/api_v3/issueBoard'
import QuickAddIssueOnBoard from './QuickAddIssueOnBoard'
import colorVariables from '@/styles/theme/variables.module.scss'
import CustomItem from './CustomItem'

export default {
  name: 'Kanban',
  components: {
    QuickAddIssueOnBoard,
    Tracker: () => import('@/components/Issue/Tracker'),
    Priority: () => import('@/components/Issue/Priority'),
    Status: () => import('@/components/Issue/Status'),
    Draggable: () => import('vuedraggable'),
    CustomItem
  },
  filters: {
    lengthFilter(value) {
      if (
        !value.hasOwnProperty('parent') &&
        !value.hasOwnProperty('children') &&
        !value.hasOwnProperty('relations')
      ) {
        return null
      }
      const parent = value.hasOwnProperty('parent') ? 1 : 0
      const children = value.hasOwnProperty('children')
        ? value.children.length
        : 0
      const relations = value.hasOwnProperty('relations')
        ? value.relations.length
        : 0
      const total = parent + children + relations
      return `(${total})`
    }
  },
  props: {
    dimension: {
      type: String,
      default: null
    },
    boardObject: {
      type: Object,
      default: () => ({})
    },
    list: {
      type: Array,
      default: () => []
    },
    relativeList: {
      type: Array,
      default: () => []
    },
    status: {
      type: Array,
      default: () => []
    },
    addIssue: {
      type: Function,
      default: () => ({})
    },
    elementIds: {
      type: Array,
      default: () => []
    },
    fromWbs: {
      type: Boolean,
      default: false
    },
    fixedVersion: {
      type: Array,
      default: () => []
    },
    projectId: {
      type: [Number, String],
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    fromTab: {
      type: String,
      default: 'assigned_to'
    },
    filterType: {
      type: String,
      default: 'board'
    },
    groupByValueOnBoard: {
      type: Array,
      default: () => []
    },
    isSelectDefaultOption: {
      type: Boolean,
      default: false
    },
    boardId: {
      type: Number,
      default: null
    },
    params: {
      type: Object,
      default: () => ({})
    },
    classifyIssueList: {
      type: Object,
      default: () => ({})
    },
    isDraggable: {
      type: Boolean,
      default: true
    },
    allUnassignedIssueList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    this.unassignedError = {
      title: this.$t('Kanban.unassignedErrorTitle'),
      content: this.$t('Kanban.unassignedErrorContent')
    }
    this.assignedError = {
      title: this.$t('Kanban.assignedErrorTitle'),
      content: this.$t('Kanban.assignedErrorContent')
    }
    this.childrenStatusError = {
      title: this.$t('Kanban.childrenStatusErrorTitle'),
      content: this.$t('Kanban.childrenStatusErrorContent')
    }
    this.priorityError = {
      title: this.$t('Kanban.priorityErrorTitle'),
      content: this.$t('Kanban.priorityErrorContent')
    }
    this.trackerError = {
      title: this.$t('Kanban.trackerErrorTitle'),
      content: this.$t('Kanban.trackerErrorContent')
    }
    this.closedVersionError = {
      title: this.$t('Kanban.closedVersionErrorTitle'),
      content: this.$t('Kanban.closedVersionErrorContent')
    }
    return {
      showDialog: false,
      showAlert: false,
      errorMsg: [],
      timeoutId: -1,
      timeoutIdx: -1,
      toClosedVersionError: {},
      loading: false,
      noMore: false,
      isEdited: false,
      originObject: {
        name: '',
        color: ''
      },
      scrollTimes: 10
    }
  },
  computed: {
    ...mapGetters([
      'selectedProjectId',
      'forceTracker',
      'enableForceTracker',
      'device'
    ]),
    getHeaderBarClassName() {
      return function (name) {
        if (!this.isSelectDefaultOption) return
        return name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
      }
    },
    differentInDays() {
      return function (a, b) {
        const day = 1000 * 3600 * 24
        const Difference_In_Time = a.getTime() - b.getTime()
        return Difference_In_Time / day
      }
    },
    getPanelLabelParams() {
      return function (data, element) {
        const key = Object.keys(data)[0]
        const value = Object.values(data)[0]
        let params = { [key]: value }
        if (key === 'tags') {
          params = this.getPanelLabelParamsByTags(element, key, value)
        }
        return params
      }
    },
    getPanelLabelParamsByTags() {
      return function (element, key, value) {
        const result = element.tags
        const findTagIndex = element.tags.findIndex(
          (item) => item.id === value.id
        )
        findTagIndex >= 0 ? result.splice(findTagIndex, 1) : result.push(value)
        return { [key]: result }
      }
    },
    checkChildrenIssuesClosed() {
      return function (element) {
        const checkedIssue =
          this.relativeList.length > 0
            ? this.findCompleteIssues(element)
            : element
        if (!checkedIssue.children || checkedIssue.children.length === 0) {
          return true
        }
        return checkedIssue.children
          .map((issue) => issue.is_closed === true)
          .reduce((issue_status, all) => issue_status && all)
      }
    },
    findCompleteIssues() {
      return function (element) {
        return this.relativeList.find((list) => list.id === element.id)
      }
    },
    isMobile() {
      return this.device === 'mobile'
    },
    isScrollDisabled() {
      return this.boardObject.id !== 'all' || this.loading || this.noMore
    }
  },
  watch: {
    async elementIds() {
      this.$nextTick(() => {
        this.updateAnimation()
      })
    },
    isMobile(val) {
      if (!val) {
        document.oncontextmenu = () => {
          return true
        }
      }
    },
    'classifyIssueList.all.length': {
      handler() {
        if (
          this.allUnassignedIssueList.length > 10 &&
          this.classifyIssueList.all.length < 10
        ) {
          this.loadMoreIssueList()
        }
      },
      deep: true
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timeoutId)
    window.clearTimeout(this.timeoutIdx)
    document.oncontextmenu = () => {
      return true
    }
  },
  methods: {
    /**
     * issues can be dragged to another status if returning true to property "move", while returning false can't
     * check if dragged issue can be moved to another issue status
     * three items to check:
     *  1. if the issue is assigned - isAssigned()
     *  2. if the children issues of dragged issue are closed - isChildrenIssuesClosed()
     *  3. the priority status of the issue - isPriorityUnchanged()
     * @Param {Object} evt - drag event
     */
    canIssueMoved(evt) {
      const toName = evt.to.classList[1]
      const fromName = evt.from.classList[1]
      const toClassObj = this.status.find((item) => item.name === toName)
      const fromClassObj = this.status.find((item) => item.name === fromName)
      return this.isIssueNormal(toClassObj, fromClassObj, evt)
    },
    isIssueNormal(toClassObj, fromClassObj, evt) {
      const element = evt.draggedContext.element
      switch (this.dimension) {
        case 'status':
          return this.isStatusNormal(toClassObj, fromClassObj, evt)
        case 'priority':
          return this.isPriorityNormal(element)
      }
    },
    isStatusNormal(toClassObj, fromClassObj, evt) {
      const element = evt.draggedContext.element
      const isAssigned = this.isAssigned(toClassObj, fromClassObj, element)
      const isChildrenIssuesClosed =
        toClassObj.is_closed === true
          ? this.isChildrenIssuesClosed(element)
          : true
      const isForceTracker = this.isTrackerStrict(element)
      const isVersionClosed = this.isClosedVersion(toClassObj, element, evt)
      if (this.errorMsg.length > 0) this.showErrorAlert(this.errorMsg)
      return (
        isAssigned &&
        isChildrenIssuesClosed &&
        isForceTracker &&
        isVersionClosed
      )
    },
    isClosedVersion(toClassObj, element, evt) {
      const version_id = element.version
      const version = this.fixedVersion.find(
        (issue) => parseInt(version_id) === parseInt(issue.id)
      )
      if (version) {
        if (version.status === 'closed') {
          const error = 'closedVersionError'
          this.handleErrorAlert(error)
          return false
        }
      }
      if (this.boardObject.hasOwnProperty('fixed_version_id')) {
        const version_board_id = evt.to.id.substring(
          evt.to.id.indexOf('_') + 1,
          evt.to.id.lastIndexOf('_')
        )
        const version_board = this.fixedVersion.find(
          (issue) => parseInt(version_board_id) === parseInt(issue.id)
        )
        if (version_board) {
          if (version_board.status === 'closed') {
            const error = 'toClosedVersionError'
            this.handleErrorAlert(error, version_board)
            return false
          }
          return true
        }
      }
      return true
    },
    isPriorityNormal(element, value) {
      const isPriorityUnchanged = this.isPriorityUnchanged(element, value)
      if (this.errorMsg.length > 0) this.showErrorAlert(this.errorMsg)
      return isPriorityUnchanged
    },
    isAssigned(toClassObj, fromClassObj, element) {
      const isAssigned = this.checkAssigned(toClassObj, element)
      let isAllow = isAssigned
      if (toClassObj.id === fromClassObj.id) isAllow = true
      if (!isAllow) {
        const error = 'unassignedError'
        this.handleErrorAlert(error)
      }
      // else if (isAssigned && toClassObj.name === 'Active') {
      //   if (fromClassObj === null || fromClassObj.name !== 'Active') {
      //     const error = 'assignedError'
      //     this.handleErrorAlert(error)
      //     isAssigned = !isAssigned
      //   }
      // }
      return isAllow
    },
    isChildrenIssuesClosed(element) {
      const isChildrenIssuesClosed = this.checkChildrenIssuesClosed(element)
      if (!isChildrenIssuesClosed) {
        const error = 'childrenStatusError'
        this.handleErrorAlert(error)
      }
      return isChildrenIssuesClosed
    },
    isTrackerStrict(element) {
      if (this.enableForceTracker) {
        const hasForceTacker = this.forceTracker.find(
          (x) => x.id === element.tracker.id
        )
        if (hasForceTacker) {
          if (element.has_father) return true
          else {
            const error = 'trackerError'
            this.handleErrorAlert(error)
            return false
          }
        }
      }
      return true
    },
    isPriorityUnchanged(element) {
      const isPriorityUnchanged = this.checkPriority(element)
      if (!isPriorityUnchanged) {
        const error = 'priorityError'
        this.handleErrorAlert(error)
      }
      return isPriorityUnchanged
    },
    dropPanelLabels(e, idx, elementId) {
      e.preventDefault()
      if (e.dataTransfer.getData('json')) {
        const data = JSON.parse(e.dataTransfer.getData('json'))
        const element = this.list[idx]
        this.handleDropUpdate(data, element)
      }
    },
    handleDropUpdate(data, element) {
      const key = Object.keys(data)[0]
      const toClassObj = Object.values(data)[0]
      let params = { [key]: toClassObj }
      if (key === 'status') {
        const isStatusNormal = this.isStatusNormal(toClassObj, null, element)
        if (isStatusNormal) this.emitDragUpdate(element.id, params)
      } else if (key === 'priority') {
        const isPriorityNormal = this.isPriorityNormal(element, params)
        if (isPriorityNormal) this.emitDragUpdate(element.id, params)
      } else {
        params = this.getPanelLabelParams(data, element)
        this.emitDragUpdate(element.id, params)
      }
    },
    checkAssigned(to, element) {
      // return !(Object.keys(element.assigned).length < 3 && to.id > 1)
      return !(element.assigned === null && to.id > 1)
    },
    handleErrorAlert(key, version) {
      if (version) {
        this.toClosedVersionError = {
          title: this.$t('Kanban.closedVersionErrorTitle'),
          content: this.$t('Kanban.toClosedVersionErrorContent', {
            version: version.name
          })
        }
      }
      const { title, content } = this[key]
      this.errorMsg.push(this.getErrorAlert(title, content))
    },
    getErrorAlert(title, content) {
      const h = this.$createElement
      return h('li', [h('b', title), h('p', content)])
    },
    checkPriority(element) {
      return !element.has_children
    },
    end(boardObject, event) {
      const updateData = { boardObject, event }
      this.$emit('update', updateData)
      this.$forceUpdate()
    },
    handleClick(element) {
      // this.$router.push({ name: 'IssueDetail', params: { issueId: id }})
      this.$emit('relationIssueId', element)
    },
    showErrorAlert(errorMsg) {
      const h = this.$createElement
      if (!this.showAlert) {
        this.showAlert = true
        this.$msgbox({
          message: h('ul', errorMsg),
          title: this.$t('Kanban.ChangeIssueError')
        }).then(() => {
          this.showAlert = false
        })
      }
      this.errorMsg = []
    },
    emitDragUpdate(id, params) {
      const update = { id, params }
      this.$emit('update-drag', update)
    },
    allowDrop(e) {
      e.dataTransfer.dropEffect = 'copy'
      e.dataTransfer.clearData()
      e.preventDefault()
    },
    getStatus(element) {
      if (element.done_ratio === 100) {
        return 'success'
      } else if (element.done_ratio >= 30 && element.done_ratio < 60) {
        return 'warning'
      } else if (element.done_ratio < 30) {
        return 'exception'
      }
    },
    getDateStatus(element) {
      const dueDate = new Date(element.due_date)
      const today = new Date()
      const notClosed = element.status.name !== 'Closed'
      if (notClosed && today > dueDate) {
        return 'danger'
      } else if (notClosed && this.differentInDays(dueDate, today) <= 3) {
        return 'warning'
      } else {
        return 'success'
      }
    },
    getTranslateHeader(value) {
      return this.$te('Issue.' + value) ? this.$t('Issue.' + value) : value
    },
    async onCollapseChange(element) {
      this.$set(element, 'loadingRelation', true)
      const family = await getIssueFamily(element.id)
      this.setRelativeIssue(element, family.data)
      this.$forceUpdate()
      this.$set(element, 'loadingRelation', false)
    },
    setRelativeIssue(element, data) {
      const relations = ['parent', 'children', 'relations']
      relations.forEach(async (relation) => {
        const hasOwnProperty = data.hasOwnProperty(relation)
        if (hasOwnProperty) await this.$set(element, relation, data[relation])
      })
    },
    handleContextMenu(row, context, event) {
      this.fromWbs
        ? this.$emit('contextmenu', row, context, event)
        : this.$emit('contextmenu', { row, context, event })
    },
    updateAnimation() {
      const opacity = 0.3
      const hexOpacity = Math.floor(opacity * 255).toString(16)
      for (const elementId of this.elementIds) {
        setTimeout(() => {
          const element = document.getElementById(elementId)
          if (element) {
            this.scrollTo(element)
            element.style.boxShadow = `0px 0px 10px 2px ${
              colorVariables.danger + hexOpacity
            }`
            element.style.background = colorVariables.danger + hexOpacity
            element.style.transition = 'all 0.3s ease-in-out'
            this.$nextTick(() => {
              window.setTimeout(() => {
                element.style.boxShadow = ''
                element.style.background = 'rgba(255, 255, 255, 1)'
              }, 500)
            })
          }
        }, 100)
      }
    },
    scrollTo(element) {
      this.$nextTick(() => {
        element.parentNode.scrollTo({ top: 0, behavior: 'smooth' })
      })
    },
    async longPress(element, column, event) {
      // Define variable
      let pressTimer = null
      const el = document.getElementById(`kanban-work_${this.fromTab}`)
      // Define funtion handlers
      // Create timeout ( run function after 1s )
      const start = (e) => {
        if (e.type === 'click' && e.button !== 0) {
          return
        }
        if (pressTimer === null) {
          pressTimer = setTimeout(() => {
            // Run function
            document.oncontextmenu = () => {
              return false
            }
            this.handleContextMenu(element, column, event)
          }, 1000)
        }
      }
      // Cancel Timeout
      const cancel = (e) => {
        // Check if timer has a value or not
        if (pressTimer !== null) {
          clearTimeout(pressTimer)
          pressTimer = null
        }
      }
      this.$nextTick(() => {
        el.addEventListener('mousedown', start)
        el.addEventListener('touchstart', start)
        el.addEventListener('touchmove', cancel)
        el.addEventListener('click', cancel)
        el.addEventListener('mouseout', cancel)
        el.addEventListener('touchend', cancel)
        el.addEventListener('touchcancel', cancel)
      })
    },
    async handleEdit() {
      if (!this.isEdited) {
        this.originObject.name = this.boardObject.name
        this.originObject.color = this.boardObject.color
        this.isEdited = true
        return
      }
      const { id, name, color } = this.boardObject
      if (name) {
        const sendData = {
          name,
          color
        }
        try {
          await updateBoardItem(this.boardId, id, sendData).then((res) => {
            this.boardObject.name = res.data.name
            this.boardObject.color = res.data.color
            this.isEdited = false
          })
        } catch (error) {
          console.error(error)
          this.handleClose()
        }
      } else {
        this.$message({
          message: this.$t('Validation.Input', [this.$t('Issue.BoardName')]),
          type: 'warning'
        })
      }
    },
    handleClose() {
      if (this.isEdited) {
        this.boardObject.name = this.originObject.name
        this.boardObject.color = this.originObject.color
        this.isEdited = false
      } else {
        this.removeKanban()
      }
    },
    removeKanban() {
      this.$confirm(
        this.$t('Notify.confirmDeleteSth', { name: this.boardObject.name }),
        this.$t('general.Warning'),
        {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        }
      )
        .then(async () => {
          await deleteBoardItem(this.boardId, this.boardObject.id)
          this.$emit('loadData')
        })
        .catch()
    },
    async loadMoreIssueList() {
      if (this.scrollTimes >= this.allUnassignedIssueList.length) return
      this.loading = true
      const nextData = this.allUnassignedIssueList.slice(
        this.scrollTimes,
        this.scrollTimes + 10
      )
      this.$set(this.classifyIssueList, 'all', this.list.concat(...nextData))
      this.scrollTimes += 10
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

.board-column {
  width: 280px;
  margin: 0px 5px 0px 5px;
  flex: 0 0 280px;
  padding-bottom: 60px;
  @apply overflow-hidden bg-white rounded-md border-solid border border-gray-300;

  .board-column-header {
    height: 50px;
    line-height: 50px;
    @apply overflow-hidden;

    .header-bar {
      height: 3px;
      @apply bg-assigned;
    }
  }

  ::v-deep {
    .el-scrollbar {
      height: 95%;

      .el-scrollbar__wrap {
        overflow-x: hidden;
      }
    }

    .el-collapse-item__header,
    .el-collapse-item__wrap {
      background-color: transparent;
    }
  }

  .board-column-content {
    @apply space-y-4;
    @include css-prefix(user-select, none);
    border: 4px solid transparent;
    min-height: 140px;
    -webkit-touch-callout: none; /* Safari */
    margin-bottom: 10px;
    height: inherit;

    .quick-add {
      padding: 10px 10px 0 10px;
    }

    .board-item {
      cursor: pointer;
      width: 95%;
      height: auto;
      text-align: left;
      line-height: 20px;
      box-sizing: border-box;
      border: 1px solid #e9e9e9;
      @apply shadow-md bg-white rounded-md border-solid border border-gray-300 mx-auto;
      font-size: 14px;

      &-ban {
        pointer-events: none;
        opacity: 0.4;
      }

      .tags {
        @apply mr-1;
      }

      .add-button {
        transition: transform 0.6s;
        @apply m-3;
        &.rotate {
          transform: rotate(225deg);
        }
      }

      &.item {
        cursor: move;
      }

      .progress-bar {
        ::v-deep {
          .el-progress-bar__outer {
            border-radius: 9999px 9999px 0 0;
            background-color: #f3f3f3 !important;
          }
        }
      }

      .title {
        @apply m-3 flex justify-between content-start;

        .text {
          @apply cursor-pointer text-left text-primary font-bold break-all;
        }

        .action {
          @apply flex cursor-pointer w-5 h-5;
          .icon {
            @apply bg-gray-200 text-black rounded-md text-center align-middle px-1;
          }
        }
      }

      .relation {
        background-color: transparent;

        .parent {
          @apply m-3;
          font-size: 0.75em;

          .el-tag {
            font-size: 1em;
            min-width: 20px;
            text-align: center;
          }
        }

        .children_list {
          margin: 0;
          padding-left: 16px;
        }

        ::v-deep .el-collapse-item {
          &__header {
            height: 2.5em;
          }

          &__content {
            padding-bottom: 0;
          }
        }
      }

      .issue-status-tags {
        font-size: 1em;
        @apply mx-3 mb-1;

        .tracker {
          font-size: 0.8em;
        }
      }

      .info {
        @apply flex border-0 border-t border-solid border-gray-200 divide-x divide-solid divide-gray-200 rounded-b-md;
        .detail {
          min-width: 0;
          font-size: 1em;
          line-height: 1em;
          padding: 0 3px;
          @apply ml-1 flex flex-1 py-2 border-0;
          .text {
            @apply truncate;
          }

          em {
            @apply mr-1 text-gray-400;
          }
        }

        .due_date {
          .danger {
            font-weight: 900;
            @apply text-danger;
          }

          .warning {
            font-weight: 500;
            @apply text-warning;
          }
        }
      }

      .no-info {
        @apply mb-3;
      }
    }
  }

  &.active {
    ::v-deep .header-bar {
      @apply bg-active;
    }
  }

  &.assigned {
    ::v-deep .header-bar {
      @apply bg-assigned;
    }
  }

  &.solved {
    ::v-deep .header-bar {
      @apply bg-solved;
    }
  }

  &.inprogress {
    ::v-deep .header-bar {
      @apply bg-inProgress;
    }
  }

  &.verified {
    ::v-deep .header-bar {
      @apply bg-finished;
    }
  }

  &.closed {
    ::v-deep .header-bar {
      @apply bg-closed;
    }
  }

  &.document {
    ::v-deep .header-bar {
      @apply bg-document;
    }
  }

  &.research {
    ::v-deep .header-bar {
      @apply bg-research;
    }
  }

  &.epic {
    ::v-deep .header-bar {
      @apply bg-epic;
    }
  }

  &.audit {
    ::v-deep .header-bar {
      @apply bg-audit;
    }
  }

  &.feature {
    ::v-deep .header-bar {
      @apply bg-feature;
    }
  }

  &.bug {
    ::v-deep .header-bar {
      @apply bg-bug;
    }
  }

  &.issue {
    ::v-deep .header-bar {
      @apply bg-issue;
    }
  }

  &.changeRequest {
    ::v-deep .header-bar {
      @apply bg-changeRequest;
    }
  }

  &.risk {
    ::v-deep .header-bar {
      @apply bg-risk;
    }
  }

  &.testPlan {
    ::v-deep .header-bar {
      @apply bg-testPlan;
    }
  }

  &.failManagement {
    ::v-deep .header-bar {
      @apply bg-failManagement;
    }
  }

  &.immediate {
    ::v-deep .header-bar {
      @apply bg-danger;
    }
  }

  &.high {
    ::v-deep .header-bar {
      @apply bg-warning;
    }
  }

  &.normal {
    ::v-deep .header-bar {
      @apply bg-success;
    }
  }

  &.low {
    ::v-deep .header-bar {
      @apply bg-info;
    }
  }
}

.cardTitle {
  margin-top: 3px;
  margin-bottom: 3px;
}

.msg-text {
  width: 220px;
  font-weight: bold;
}

@include tablet {
  ::v-deep {
    .el-scrollbar__wrap {
      margin-right: 0 !important;
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }

    .el-scrollbar__wrap::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera*/
    }

    .el-scrollbar__view {
      height: auto;
    }
  }
}

@include desktop {
  ::v-deep {
    .el-scrollbar__view {
      height: -webkit-fill-available;
    }
  }
}

.dragClass {
  opacity: 1 !important;
  transform: rotate(4deg);
  box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px,
    rgba(0, 0, 0, 0.3) 0px 8px 16px -8px !important;
}

.ghostClass {
  opacity: 0.2 !important;
  border: 2px solid rgb(100, 100, 100) !important;
  background-color: rgb(204, 204, 204) !important;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px,
    rgba(0, 0, 0, 0.3) 0px 8px 16px -8px !important;
}
</style>
