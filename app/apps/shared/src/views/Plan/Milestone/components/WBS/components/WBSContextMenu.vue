<template>
  <div>
    <contextmenu ref="contextmenu">
      <template v-if="Object.keys(contextMenu.row).length > 2">
        <contextmenu-item
          class="menu-title"
          @click="onRelationIssueDialog(contextMenu.row)"
        >
          {{ contextMenu.row.name }}
        </contextmenu-item>
        <contextmenu-submenu
          v-permission="permission"
          :title="$t('Issue.tags')"
        >
          <contextmenu-item
            v-for="item in tags"
            :key="item.id"
            :class="{ current : getContextMenuCurrentValue('tags', item), [item.class]:item.class }"
            @click="handleUpdateIssue({value:{'tags':item.id}, row:contextMenu.row})"
          >
            <em
              v-if="getContextMenuCurrentValue('tags', item)"
              class="el-icon-check"
            />
            <em
              v-if="item.id==='null'"
              class="el-icon-circle-close"
            />
            {{ item.name }} {{ item.message }}
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item
          v-permission="permission"
          divider
        />
        <contextmenu-item @click="onRelationIssueDialog(contextMenu.row)">
          {{ $t('route.IssueDetail') }}
        </contextmenu-item>
        <contextmenu-item @click="toggleIssueMatrixDialog(contextMenu.row)">
          {{ $t('Issue.TraceabilityMatrix') }}
        </contextmenu-item>
        <contextmenu-item
          v-permission="permission"
          divider
        />
        <contextmenu-item
          v-permission="permission"
          @click="appendIssue(contextMenu.row)"
        >
          {{ $t('Issue.AddIssue') }}
        </contextmenu-item>
        <contextmenu-submenu
          v-permission="permission"
          :title="$t('Issue.ChildrenIssue')"
        >
          <contextmenu-item
            v-permission="permission"
            @click="toggleRelationDialog('Children')"
          >
            {{ $t('general.Settings', { name: $t('Issue.ChildrenIssue') }) }}
          </contextmenu-item>
          <contextmenu-item
            v-permission="permission"
            @click="appendIssue(contextMenu.row, true)"
          >
            {{ $t('Issue.AddSubIssue') }}
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item
          v-permission="permission"
          @click="appendIssue(contextMenu.row, false, contextMenu.row)"
        >
          {{ $t('Issue.CopyIssue') }}
        </contextmenu-item>
        <contextmenu-submenu :title="$t('Issue.AddToCalendar')">
          <contextmenu-item v-permission="permission" @click="addToCalendar('google', contextMenu.row)">
            <svg-icon icon-class="google" class="text-md" />
            <span>Google</span>
          </contextmenu-item>
          <contextmenu-item v-permission="permission" @click="addToCalendar('microsoft', contextMenu.row)">
            <svg-icon icon-class="microsoft" class="text-md" />
            <span>Outlook.com</span>
          </contextmenu-item>
          <contextmenu-item v-permission="permission" @click="addToCalendar('office365', contextMenu.row)">
            <svg-icon icon-class="office365" class="text-md" />
            <span>Microsoft 365</span>
          </contextmenu-item>
          <contextmenu-item v-permission="permission" @click="addToCalendar('ics', contextMenu.row)">
            <svg-icon icon-class="ical" class="text-md" />
            <span>ICalendar</span>
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item
          v-permission="permission"
          divider
        />
        <contextmenu-item
          v-permission="permission"
          class="menu-remove"
          @click="handleRemoveIssue(contextMenu.row, 'ConfirmDelete', false)"
        >
          <em class="el-icon-delete">{{ $t('general.Delete') }}</em>
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
import { directive, Contextmenu, ContextmenuItem, ContextmenuSubmenu } from 'v-contextmenu'

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
    contextMenu: {
      type: Object,
      default: () => ({})
    },
    tags: {
      type: Array,
      default: () => []
    },
    permission: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      relationIssue: {
        visible: false,
        id: null
      }
    }
  },
  methods: {
    getContextMenuCurrentValue(column, item) {
      return this.contextMenu.row[column].map((subItem) => subItem.id).includes(item.id)
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
        this.$confirm(this.$t('Notify.UnSavedChanges'), this.$t('general.Warning'), {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        })
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
  background: #d2d2d2;
  max-width: 150px;
  height: 25px;
  line-height: 1.25;
  padding: 3px 3px 3px 5px;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
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
</style>
