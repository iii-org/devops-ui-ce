<template>
  <div>
    <contextmenu ref="contextmenu">
      <template v-if="Object.keys(contextMenu.row).length > 2">
        <contextmenu-item
          class="menu-title truncate"
          @click="onRelationIssueDialog(contextMenu.row)"
        >
          {{ contextMenu.row.name }}
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
              <em :class="mapTagType(contextMenuOption)" class="mr-2" />
              {{ $t(`Issue.FilterDimensions.${contextMenuOption}`) }}
            </span>
            <contextmenu-item
              v-for="contextMenuItem in getContextMenuItem(contextMenuOption)"
              :key="`${contextMenuOption}-${contextMenuItem.id}`"
              :disabled="contextMenuOption !== 'tags' && contextMenuItem.disabled"
              :class="{
                current: getCurrentSelectedValue(contextMenuOption, contextMenuItem),
                [contextMenuItem.class]: contextMenuItem.class
              }"
              @click="
                handleUpdateIssue({
                  value: getUpdateValue(contextMenuOption, contextMenuItem.id),
                  row: contextMenu.row
                })
              "
            >
              <em v-if="getCurrentSelectedValue(contextMenuOption, contextMenuItem)" class="el-icon-check" />
              <em v-if="contextMenuItem.id === 'null'" class="el-icon-circle-close" />
              <em :class="mapTagType(contextMenuItem.name)" class="point text-xs" />
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
          <em class="ri-add-circle-fill mr-2" />{{ $t("Issue.AddIssue") }}
        </contextmenu-item>
        <contextmenu-submenu v-permission="permission">
          <span slot="title">
            <em class="ri-bring-forward mr-2" />{{ $t('Issue.ChildrenIssue') }}
          </span>
          <contextmenu-item
            v-permission="permission"
            @click="toggleRelationDialog('Children')"
          >
            <em class="ri-settings-5-fill mr-2" />{{ $t("general.Settings", { name: $t("Issue.ChildrenIssue") }) }}
          </contextmenu-item>
          <contextmenu-item
            v-permission="permission"
            @click="appendIssue(contextMenu.row, true)"
          >
            <em class="ri-add-circle-fill mr-2" />{{ $t("Issue.AddSubIssue") }}
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item @click="toggleIssueMatrixDialog(contextMenu.row)">
          <em class="ri-bar-chart-horizontal-fill mr-2" />{{ $t("Issue.TraceabilityMatrix") }}
        </contextmenu-item>
        <contextmenu-item v-permission="permission" divider />
        <contextmenu-item
          v-permission="permission"
          @click="appendIssue(contextMenu.row, false, contextMenu.row)"
        >
          <em class="ri-file-copy-line mr-2" />{{ $t("Issue.CopyIssue") }}
        </contextmenu-item>
        <contextmenu-submenu>
          <span slot="title"><em class="ri-calendar-event-fill mr-2" />
            {{ $t('Issue.AddToCalendar') }}
          </span>
          <contextmenu-item
            v-for="contextMenuCalendarOption in contextMenuCalendarOptions"
            :key="contextMenuCalendarOption.id"
            v-permission="permission"
            @click="addToCalendar(contextMenuCalendarOption.id, contextMenu.row)"
          >
            <svg-icon :icon-class="contextMenuCalendarOption.id" class="text-md" />
            <span>{{ contextMenuCalendarOption.display }}</span>
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item v-permission="permission" divider />
        <contextmenu-item
          v-permission="permission"
          class="menu-remove"
          @click="handleRemoveIssue(contextMenu.row, 'ConfirmDelete', false)"
        >
          <em class="ri-delete-bin-2-line mr-2" />{{ $t('general.Delete') }}
        </contextmenu-item>
      </template>
    </contextmenu>
    <el-dialog
      :visible.sync="relationIssue.visible"
      width="90%"
      top="3vh"
      append-to-body
      destroy-on-close
      :before-close="handleRelationIssueDialogBeforeClose"
    >
      <ProjectIssueDetail
        v-if="relationIssue.visible"
        ref="children"
        :props-issue-id="relationIssue.id"
        :is-in-dialog="true"
        @update="handleRelationUpdate"
        @delete="handleRelationDelete"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { cloneDeep } from 'lodash'
import {
  directive,
  Contextmenu,
  ContextmenuItem,
  ContextmenuSubmenu
} from 'v-contextmenu'

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
    fixedVersion: {
      type: Array,
      default: () => {}
    },
    assignedTo: {
      type: Array,
      default: () => []
    },
    permission: {
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
    ...mapGetters([
      'tracker',
      'status',
      'priority'
    ]),
    hasColumn() {
      return checkColumn => !!this.columns.find(column => column === checkColumn)
    },
    contextMenuOptions() {
      const defaultContextMenu = [
        'tracker',
        'status',
        'assigned_to',
        'fixed_version',
        'priority',
        'tags',
        'done_ratio'
      ]
      return defaultContextMenu.filter(column => this.columns.indexOf(column) === -1)
    },
    isContextSubmenuDisabled() {
      // Priority & Done Ratio couldn't been modified when the issue has children issues
      return contextMenuOption => contextMenuOption === 'priority' ||
        contextMenuOption === 'done_ratio'
        ? this.contextMenu.row.has_children
        : false
    },
    hasNoI18n() {
      // Tag & Fixed Version & Done Ratio don't have i18n
      return contextMenuOption => contextMenuOption === 'tags' ||
        contextMenuOption === 'done_ratio'
    },
    doneRatio() {
      const doneRatioList = []
      for (let num = 0; num <= 100; num += 10) {
        doneRatioList.push({ id: num, name: num + ' %' })
      }
      return doneRatioList
    },
    contextMenuAssignedTo() {
      return this.assignedTo.filter((item) => item.login !== '-Me-')
    },
    getDynamicStatus() {
      const option = cloneDeep({ status: this.status })
      return option['status'].map((item) => this.formatDynamicStatus(item))
    },
    checkIssueAssignedToStatus() {
      return (
        !this.contextMenu.row.assigned_to ||
        !this.contextMenu.row.assigned_to.id ||
        this.contextMenu.row.assigned_to.id === '' ||
        this.contextMenu.row.assigned_to.id === 'null'
      )
    }
  },
  methods: {
    mapTagType(category) {
      const map = {
        status: 'ri-focus-2-fill',
        priority: 'ri-arrow-up-double-line',
        tracker: 'ri-list-indefinite',
        assigned_to: 'ri-user-received-fill',
        fixed_version: 'ri-folder-zip-fill',
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
        case 'assigned_to':
          return this.contextMenuAssignedTo
        case 'fixed_version':
          return this.fixedVersion
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
        case 'assigned_to':
          return this.contextMenu.row[column].id === item.id ||
            this.contextMenu.row[column].id === null && item.id === 'null'
        case 'fixed_version':
          return this.contextMenu.row[column].id === item.id ||
            this.contextMenu.row[column].id === null && item.id === 'null'
        case 'tags':
          return this.contextMenu.row[column]
            .map(subItem => subItem.id)
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
          if (contextmenuWidth <= 50) {
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
    appendIssue(row, isSubIssue, copyIssue) {
      this.$emit('appendIssue', row, isSubIssue, copyIssue)
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
    color: #333;
    cursor: initial;
  }
}
.current {
  @apply text-success font-bold;
}
::v-deep .cursor-context-menu {
  cursor: context-menu;
}
.menu-remove {
  @apply text-danger font-bold;
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
