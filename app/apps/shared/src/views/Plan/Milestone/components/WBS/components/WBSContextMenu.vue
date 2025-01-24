<template>
  <div>
    <contextmenu ref="contextmenu">
      <template v-if="Object.keys(contextMenu.row).length > 2">
        <contextmenu-item
          class="menu-title truncate"
          @click="onRelationIssueDialog(contextMenu.row)"
        >
          {{ contextMenu.row.subject }}
        </contextmenu-item>
        <contextmenu-item v-permission="permission" divider />
        <template v-for="contextMenuOption in contextMenuOptions">
          <contextmenu-submenu
            v-if="!hasColumn(contextMenuOption)"
            :key="contextMenuOption"
            v-permission="permission"
            :disabled="isContextSubmenuDisabled(contextMenuOption)"
          >
            <span slot="title">
              <em :class="mapTagType(contextMenuOption)" class="mr-2"></em>
              {{ $t(`Issue.FilterDimensions.${contextMenuOption}`) }}
            </span>
            <contextmenu-item
              v-for="contextMenuItem in getContextMenuItem(contextMenuOption)"
              :key="`${contextMenuOption}-${
                contextMenuItem.username || contextMenuItem.id
              }`"
              :class="{
                current: getCurrentSelectedValue(
                  contextMenuOption,
                  contextMenuItem
                ),
                [contextMenuItem.class]: contextMenuItem.class
              }"
              :disabled="
                contextMenuOption !== 'tags' && contextMenuItem.disabled
              "
              @click="
                handleUpdateIssue({
                  value: getUpdateValue(contextMenuOption, contextMenuItem.id),
                  row: contextMenu.row
                })
              "
            >
              <em
                v-if="
                  getCurrentSelectedValue(contextMenuOption, contextMenuItem)
                "
                class="el-icon-check"
              ></em>
              <em
                v-if="contextMenuItem.id === 'null'"
                class="el-icon-circle-close"
              ></em>
              <em
                :class="mapTagType(contextMenuItem.name)"
                class="point text-xs"
              ></em>
              <span>
                {{
                  hasNoI18n(contextMenuOption)
                    ? contextMenuItem.name
                    : getContextMenuI18nDisplay(contextMenuItem.name)
                }}&nbsp;
                {{ contextMenuItem.message }}
              </span>
            </contextmenu-item>
          </contextmenu-submenu>
        </template>
        <contextmenu-item v-permission="permission" divider />
        <contextmenu-item
          v-permission="permission"
          @click="appendIssue(contextMenu.row)"
        >
          <em class="ri-add-circle-fill mr-2"></em>{{ $t('Issue.AddIssue') }}
        </contextmenu-item>
        <contextmenu-submenu v-permission="permission">
          <span slot="title">
            <em class="ri-bring-forward mr-2"></em>{{ $t('Issue.ChildrenIssue') }}
          </span>
          <contextmenu-item
            v-permission="permission"
            @click="toggleRelationDialog('Children')"
          >
            <em class="ri-settings-5-fill mr-2"></em>{{ $t('general.Settings', { name: $t('Issue.ChildrenIssue') }) }}
          </contextmenu-item>
          <contextmenu-item
            v-permission="permission"
            @click="appendIssue(contextMenu.row, true)"
          >
            <em class="ri-add-circle-fill mr-2"></em>{{ $t('Issue.AddSubIssue') }}
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item @click="toggleIssueMatrixDialog(contextMenu.row)">
          <em class="ri-bar-chart-horizontal-fill mr-2"></em>{{ $t('Issue.TraceabilityMatrix') }}
        </contextmenu-item>
        <contextmenu-item v-permission="permission" divider />
        <contextmenu-item
          v-permission="permission"
          @click="handleIssueDetail(contextMenu.row)"
        >
          <em class="ri-external-link-fill mr-1"></em>
          {{ $t('route.IssueDetail') }}
        </contextmenu-item>
        <contextmenu-item
          v-permission="permission"
          @click="appendIssue(contextMenu.row, false, true)"
        >
          <em class="ri-file-copy-line mr-2"></em>{{ $t('Issue.CopyIssue') }}
        </contextmenu-item>
        <contextmenu-submenu>
          <span slot="title"><em class="ri-calendar-event-fill mr-1"></em>
            {{ $t('Issue.AddToCalendar') }}
          </span>
          <contextmenu-item
            v-for="option in contextMenuCalendarOptions"
            :key="option.id"
            v-permission="permission"
            @click="addToCalendar(option.id, contextMenu.row)"
          >
            <svg-icon :icon-class="option.id" class="text-md" />
            <span>{{ option.display }}</span>
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item v-permission="permission" divider />
        <contextmenu-item
          v-permission="permission"
          class="menu-remove"
          @click="handleRemoveIssue(contextMenu.row, false)"
        >
          <em class="ri-delete-bin-2-line mr-2"></em>{{ $t('general.Delete') }}
        </contextmenu-item>
      </template>
    </contextmenu>
    <el-dialog
      :before-close="handleRelationIssueDialogBeforeClose"
      :visible.sync="relationIssue.visible"
      append-to-body
      destroy-on-close
      top="3vh"
      width="90%"
    >
      <ProjectIssueDetail
        v-if="relationIssue.visible"
        ref="children"
        :is-in-dialog="true"
        :props-issue-id="relationIssue.id"
        @delete="handleRelationDelete"
        @update="handleRelationUpdate"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { cloneDeep } from 'lodash'
import { getIssueDetails } from '@/api_v3/issues'
import {
  Contextmenu,
  ContextmenuItem,
  ContextmenuSubmenu,
  directive
} from 'v-contextmenu'
import 'v-contextmenu/dist/index.css'

export default {
  name: 'WBSContextMenu',
  components: {
    Contextmenu,
    ContextmenuItem,
    ContextmenuSubmenu,
    ProjectIssueDetail: () => import('@/views/Project/IssueDetail')
  },
  directives: {
    contextmenu: directive
  },
  props: {
    columns: {
      type: Array,
      default: () => []
    },
    contextMenu: {
      type: Object,
      default: () => {}
    },
    tags: {
      type: Array,
      default: () => []
    },
    permission: {
      type: Array,
      default: () => []
    },
    editRowVersions: {
      type: Array,
      default: () => []
    },
    editRowAssignedTo: {
      type: Array,
      default: () => []
    }
  },
  data() {
    this.contextMenuCalendarOptions = [
      {
        id: 'google',
        display: 'Google'
      },
      {
        id: 'microsoft',
        display: 'Outlook.com'
      },
      {
        id: 'office365',
        display: 'Microsoft 365'
      },
      {
        id: 'ical',
        display: 'ICalendar'
      }
    ]
    return {
      relationIssue: {
        visible: false,
        id: null
      }
    }
  },
  computed: {
    ...mapGetters(['tracker', 'status', 'priority']),
    hasColumn() {
      return (checkColumn) =>
        !!this.columns.find((column) => column === checkColumn)
    },
    contextMenuOptions() {
      const defaultContextMenu = [
        'tracker',
        'status',
        'assigned',
        'version',
        'priority',
        'tags',
        'done_ratio'
      ]
      return defaultContextMenu.filter(
        (column) => this.columns.indexOf(column) === -1
      )
    },
    isContextSubmenuDisabled() {
      // Priority & Done Ratio couldn't been modified when the issue has children issues
      return (contextMenuOption) =>
        contextMenuOption === 'priority' || contextMenuOption === 'done_ratio'
          ? this.contextMenu.row.has_children
          : false
    },
    hasNoI18n() {
      // Tag & Fixed Version & Done Ratio don't have i18n
      return (contextMenuOption) =>
        contextMenuOption === 'tags' || contextMenuOption === 'done_ratio'
    },
    doneRatio() {
      const doneRatioList = []
      for (let num = 0; num <= 100; num += 10) {
        doneRatioList.push({ id: num, name: num + ' %' })
      }
      return doneRatioList
    },
    contextMenuAssignedTo() {
      return this.assignedTo.filter((item) => item.username !== '-Me-')
    },
    getDynamicStatus() {
      const option = cloneDeep({ status: this.status })
      return option['status'].map((item) => this.formatDynamicStatus(item))
    },
    checkIssueAssignedToStatus() {
      return (
        !this.contextMenu.row.assigned ||
        !this.contextMenu.row.assigned.id ||
        this.contextMenu.row.assigned.id === '' ||
        this.contextMenu.row.assigned.id === 'null'
      )
    },
    getUrl() {
      return (rowId) => {
        return `${window.location.origin}/#/project/issues/${rowId}`
      }
    }
  },
  methods: {
    mapTagType(category) {
      const map = {
        status: 'ri-focus-2-fill',
        priority: 'ri-arrow-up-double-line',
        tracker: 'ri-list-indefinite',
        assigned: 'ri-user-received-fill',
        version: 'ri-folder-zip-fill',
        tags: 'ri-bookmark-2-fill',
        done_ratio: 'ri-check-double-fill',
        Document: 'ri-file-fill bg-document',
        Research: 'ri-seo-line bg-research',
        Epic: 'ri-flashlight-fill bg-epic',
        Audit: 'ri-bookmark-2-fill bg-audit',
        Feature: 'ri-lightbulb-fill bg-feature',
        Bug: 'ri-bug-fill bg-bug',
        Issue: 'ri-circle-fill bg-issue',
        'Change Request': 'ri-repeat-2-fill bg-changeRequest',
        Risk: 'ri-close-circle-line bg-risk',
        'Test Plan': 'ri-check-double-fill bg-testPlan',
        'Fail Management': 'ri-alert-line bg-failManagement',
        Immediate: 'ri-arrow-up-double-line bg-danger',
        High: 'ri-arrow-up-double-line bg-warning',
        Normal: 'ri-equal-line bg-success',
        Low: 'ri-arrow-down-double-line bg-info',
        Active: 'ri-focus-2-line bg-active',
        Assigned: 'ri-user-follow-fill bg-assigned',
        InProgress: 'ri-contrast-line bg-inProgress',
        Solved: 'ri-check-line bg-solved',
        Verified: 'ri-check-double-line bg-finished',
        Closed: 'ri-close-line bg-closed'
      }
      return map[category] ? map[category] + ' mr-2' : ''
    },
    getContextMenuItem(key) {
      switch (key) {
        case 'status':
          return this.getDynamicStatus
        case 'assigned':
          return this.editRowAssignedTo
        case 'version':
          return this.editRowVersions
        case 'done_ratio':
          return this.doneRatio
        default:
          return this[key]
      }
    },
    getCurrentSelectedValue(column, item) {
      switch (column) {
        case 'tracker':
          return this.contextMenu.row[column].name === item.name
        case 'assigned':
        case 'version':
          return (
            this.contextMenu.row[column].id === item.id ||
            (this.contextMenu.row[column].id === null && item.id === 'null')
          )
        case 'tags':
          return this.contextMenu.row[column]
            .map((subItem) => subItem.id)
            .includes(item.id)
        case 'done_ratio':
          return this.contextMenu.row[column] === item.id
        default:
          return this.contextMenu.row[column].id === item.id
      }
    },
    getUpdateValue(key, value) {
      return key === 'tags' || key === 'done_ratio'
        ? { [key]: value }
        : { [`${key}_id`]: value }
    },
    formatDynamicStatus(item) {
      if (this.checkIssueAssignedToStatus && item.id > 1 && item.id < 6) {
        item.disabled = true
        item.message = `(${this.$t('Issue.NoAssignee')})`
      }
      if (!this.checkIssueAssignedToStatus && item.id === 1) {
        item.disabled = true
        item.message = `(${this.$t('Issue.HasAssignee')})`
      }
      return item
    },
    getContextMenuI18nDisplay(name) {
      return this.$te(`Issue.${name}`) ? this.$t(`Issue.${name}`) : name
    },
    onRelationIssueDialog(row) {
      this.$set(this.relationIssue, 'visible', true)
      this.$set(this.relationIssue, 'id', row.id)
    },
    onCloseRelationIssueDialog() {
      this.$set(this.relationIssue, 'visible', false)
      this.$set(this.relationIssue, 'id', null)
    },
    handleRelationIssueDialogBeforeClose(done) {
      if (this.$refs.children.hasUnsavedChanges()) {
        this.$confirm(
          this.$t('Notify.UnSavedChanges'),
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }
        )
          .then(() => {
            done()
          })
          .catch()
      } else {
        done()
      }
    },
    handleContextMenu(row, column, event) {
      if (parseInt(row.id)) {
        event.preventDefault()
        const eventX = event.pageX
        const eventY = event.pageY
        this.$refs.contextmenu.show()
        this.$nextTick(() => {
          const contextmenuPosition = {
            top: eventY,
            left: eventX
          }
          const contextmenuWidth = this.$refs.contextmenu.$el.clientWidth
          const contextmenuHeight = this.$refs.contextmenu.$el.clientHeight
          if (contextmenuWidth <= 50 && contextmenuHeight <= 50) {
            this.handleContextMenu(row, column, event)
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
          this.$refs.contextmenu.style = {
            top: this.contextMenu.top + 'px',
            left: this.contextMenu.left + 'px'
          }
          document.addEventListener('click', this.hideContextMenu)
        })
      }
    },
    hideContextMenu() {
      this.contextMenu.visible = false
      document.removeEventListener('click', this.hideContextMenu)
    },
    handleUpdateIssue({ value, row }) {
      this.$emit('handleUpdateIssue', { value, row })
    },
    toggleIssueMatrixDialog(row) {
      this.$emit('toggleIssueMatrixDialog', row)
    },
    async appendIssue(row, isSubIssue, isCopyIssue) {
      if (isCopyIssue) {
        await getIssueDetails(row.id).then((res) => {
          this.$emit('appendIssue', row, isSubIssue, res.data)
        })
      } else {
        this.$emit('appendIssue', row, isSubIssue)
      }
    },
    toggleRelationDialog(type) {
      this.$emit('toggleRelationDialog', type)
    },
    addToCalendar(type, row) {
      this.$emit('addToCalendar', type, row)
    },
    handleRemoveIssue(row, message, isSubIssue) {
      this.$emit('handleRemoveIssue', row, message, isSubIssue)
    },
    handleRelationUpdate() {
      this.$emit('handleRelationUpdate')
    },
    handleRelationDelete() {
      this.$emit('handleRelationDelete')
    },
    handleIssueDetail(row) {
      window.open(this.getUrl(row.id), '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
.menu-title {
  background: #ebebeb;
  max-width: 180px;
  font-weight: bold;
  margin: 0 5px;
  border-radius: 3px;
  padding: 5px 9px;

  &:hover {
    background: #ebebeb;
    color: #333 !important;
    cursor: initial;
  }
}

::v-deep .cursor-context-menu {
  cursor: context-menu;
}

.current.v-contextmenu-item {
  @apply text-success font-bold;
}

.menu-remove.v-contextmenu-item {
  @apply text-danger font-bold;
  &:hover {
    color: #ffffff;
  }
}

.slider-container {
  width: 200px;

  &.v-contextmenu-item--hover {
    background-color: #fff;
  }
}

.point {
  @apply rounded text-white;
  aspect-ratio: 1 / 1;
  width: 100%;
  max-height: 100%;
  padding: 3px;
}
</style>
