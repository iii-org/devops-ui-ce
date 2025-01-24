<template>
  <div>
    <contextmenu ref="contextmenu">
      <template v-if="Object.keys(row).length > 2">
        <contextmenu-item class="menu-title truncate">
          {{ row.subject }}
        </contextmenu-item>
        <contextmenu-item v-permission="permission" divider />
        <contextmenu-submenu
          v-for="column in filterColumnOptions"
          :key="column.id"
          v-permission="permission"
          :disabled="column.value === 'priority' ? row.has_children : false"
        >
          <span slot="title"><em :class="mapTagType(column.value)" class="mr-2"></em>{{ column.label }}</span>
          <contextmenu-item
            v-for="item in getOptionsData(column.value)"
            :key="getId(column.value, item)"
            :class="{
              current: getContextMenuCurrentValue(column, item),
              [item.class]: item.class
            }"
            :disabled="
              column.value !== 'tags' &&
                (item.disabled || getContextMenuCurrentValue(column, item))
            "
            @click="onUpdate(column.value + '_id', item)"
          >
            <em
              v-if="getContextMenuCurrentValue(column, item)"
              class="ri-check-line"
            ></em>
            <em v-if="item.id === 'null'" class="ri-close-circle-line"></em>
            <em :class="mapTagType(item.name)" class="point text-xs"></em>
            {{ getSelectionLabel(item) }} {{ item.message }}
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-submenu v-permission="permission">
          <span slot="title"><em class="ri-bookmark-2-fill mr-2"></em>{{ $t('Issue.FilterDimensions.tags') }}</span>
          <contextmenu-item class="tag-contextmenu-item">
            <el-select
              v-model="searchTag"
              :placeholder="$t('general.SearchTag')"
              :remote-method="remoteMethod"
              clearable
              filterable
              multiple
              remote
              size="mini"
              @click.stop.native="
                () => {
                  return 'Just try to keep the contextmenu'
                }
              "
            />
            <ul
              v-for="tag in tagOptions"
              :key="tag.id"
              :class="{
                current: getContextMenuCurrentValue(
                  tagFilterColumnOptions,
                  tag
                ),
                [tag.class]: tag.class
              }"
              style="padding-left: 0; color: #333"
            >
              <li class="tag" @click="onUpdate(`tags_id`, tag)">
                <em
                  v-if="getContextMenuCurrentValue(tagFilterColumnOptions, tag)"
                  class="ri-check-line"
                ></em>
                <em v-if="tag.id === 'null'" class="ri-close-circle-line"></em>
                {{ tag.name }}
              </li>
            </ul>
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-submenu
          v-permission="permission"
          :disabled="row.has_children"
        >
          <span slot="title"><em class="ri-check-double-fill mr-2"></em>{{ $t('Issue.DoneRatio') }}</span>
          <contextmenu-item
            v-for="item in done_ratio"
            :key="item.id"
            :class="{ current: getContextMenuCurrentValue('done_ratio', item) }"
            :disabled="getContextMenuCurrentValue('done_ratio', item)"
            @click="onUpdate('done_ratio', item)"
          >
            <em
              v-if="getContextMenuCurrentValue('done_ratio', item)"
              class="ri-check-line"
            ></em>
            {{ getSelectionLabel(item) }}
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item v-permission="permission" divider />
        <contextmenu-item
          v-permission="permission"
          @click="toggleRelationDialog('Parent')"
        >
          <em class="ri-send-backward mr-2"></em>{{ $t('Issue.ParentIssue') }}
        </contextmenu-item>
        <contextmenu-submenu v-permission="permission">
          <span slot="title"><em class="ri-bring-forward mr-2"></em>{{ $t('Issue.ChildrenIssue') }}</span>
          <contextmenu-item @click="toggleRelationDialog('Children')">
            <em class="ri-settings-5-fill mr-2"></em>{{ $t('general.Settings', { name: $t('Issue.ChildrenIssue') }) }}
          </contextmenu-item>
          <contextmenu-item @click="advancedAddIssue(false)">
            <em class="ri-add-circle-fill mr-2"></em>{{ $t('Issue.AddSubIssue') }}
          </contextmenu-item>
        </contextmenu-submenu>
        <contextmenu-item @click="toggleIssueMatrixDialog">
          <em class="ri-bar-chart-horizontal-fill mr-2"></em>{{ $t('Issue.TraceabilityMatrix') }}
        </contextmenu-item>
        <contextmenu-item v-permission="permission" divider />
        <contextmenu-item
          v-permission="permission"
          @click="handleIssueDetail(row)"
        >
          <em class="ri-external-link-fill mr-1"></em>
          {{ $t('route.IssueDetail') }}
        </contextmenu-item>
        <contextmenu-item
          v-permission="permission"
          @click="advancedAddIssue(true)"
        >
          <em class="ri-file-copy-2-fill mr-2"></em>{{ $t('Issue.CopyIssue') }}
        </contextmenu-item>
        <contextmenu-submenu>
          <span slot="title"><em class="ri-calendar-event-fill mr-1"></em>
            {{ $t('Issue.AddToCalendar') }}
          </span>
          <contextmenu-item
            v-permission="permission"
            @click="addToCalendar('google')"
          >
            <svg-icon class="text-md mr-2" icon-class="google" />
            <span>Google</span>
          </contextmenu-item>
          <contextmenu-item
            v-permission="permission"
            @click="addToCalendar('microsoft')"
          >
            <svg-icon class="text-md mr-2" icon-class="microsoft" />
            <span>Outlook.com</span>
          </contextmenu-item>
          <contextmenu-item
            v-permission="permission"
            @click="addToCalendar('office365')"
          >
            <svg-icon class="text-md mr-2" icon-class="office365" />
            <span>Microsoft 365</span>
          </contextmenu-item>
          <contextmenu-item
            v-permission="permission"
            @click="addToCalendar('ics')"
          >
            <svg-icon class="text-md mr-2" icon-class="ical" />
            <span>ICalendar</span>
          </contextmenu-item>
        </contextmenu-submenu>
      </template>
    </contextmenu>
    <el-dialog
      :close-on-click-modal="false"
      :show-close="false"
      :visible.sync="relationDialog.visible"
      append-to-body
      width="80%"
    >
      <div slot="title">
        <el-row slot="title" align="middle" type="flex">
          <el-col :md="16" :xs="24">
            <span class="text-title">
              {{
                $t('general.Settings', {
                  name: $t('Issue.' + relationDialog.target + 'Issue')
                })
              }}
            </span>
          </el-col>
          <el-col :md="8" :xs="24" class="text-right">
            <el-button type="primary" @click="onSaveCheckRelationIssue">
              {{ $t('general.Save') }}
            </el-button>
            <el-button @click="toggleRelationDialog(relationDialog.target)">
              {{ $t('general.Close') }}
            </el-button>
          </el-col>
        </el-row>
      </div>
      <SettingRelationIssue
        v-if="relationDialog.visible"
        ref="settingRelationIssue"
        :row.sync="row"
        :target.sync="relationDialog.target"
      />
    </el-dialog>
    <el-dialog
      :close-on-click-modal="false"
      :title="$t('Issue.TraceabilityMatrix') + `(#${row.id} - ${row.subject})`"
      :visible.sync="issueMatrixDialog.visible"
      append-to-body
      destroy-on-close
      top="20px"
      width="80%"
    >
      <IssueMatrix
        v-if="issueMatrixDialog.visible"
        :row.sync="row"
        :status="status"
        :tracker="tracker"
        @onCloseIssueMatrix="onCloseIssueMatrix"
        @update-issue="handleUpdateIssue"
      />
    </el-dialog>
    <el-dialog
      v-if="row.project || row.project_id"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      :top="device === 'desktop' ? '5px' : '0px'"
      :visible.sync="addTopicDialogVisible"
      :width="device === 'desktop' ? '50%' : '100%'"
      append-to-body
      destroy-on-close
    >
      <template slot="title">
        <el-row slot="title" align="middle" type="flex">
          <el-col :lg="8" :md="24">
            <span class="text-title">
              {{ $t('Issue.AddIssue') }}
            </span>
          </el-col>
          <el-col :lg="8" :md="24" class="text-center">
            {{ $t('general.project_name') }} :
            {{ selectedProject.display_name }}
          </el-col>
        </el-row>
      </template>
      <AddIssue
        v-if="addTopicDialogVisible"
        ref="AddIssue"
        :parent-id="parentId"
        :parent-subject="parentSubject"
        :prefill.sync="form"
        :project-id="row?.project?.id || row.project_id"
        :save-data="saveIssue"
        @import="handleAdvancedImport"
        @loading="loadingUpdate"
        @has-children="hasChildren"
        @add-topic-visible="handleCloseDialog"
      />
      <span slot="footer" class="dialog-footer">
        <el-button
          id="dialog-btn-cancel"
          type="primary"
          @click="handleAdvancedClose"
        >
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button
          id="dialog-btn-confirm"
          :loading="loadingConfirm"
          type="primary"
          @click="handleAdvancedSave"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
    <SubIssueDialog
      :changed-status="changedStatus"
      :is-issue-dialog.sync="isCloseIssueDialog"
      :issue="row"
      @handleClose="handleUpdate"
    />
  </div>
</template>

<script>
import {
  checkIssueClosable,
  getIssueDetails,
  updateIssue
} from '@/api_v3/issues'
import {
  createProjectIssue,
  getProjectUserList,
  getProjectVersion,
  getTagList
} from '@/api_v3/projects'
import { calendarUrl } from '@shared/utils/addToCalendar'
import { ics } from '@shared/utils/ics'
import { cloneDeep } from 'lodash'
import {
  Contextmenu,
  ContextmenuItem,
  ContextmenuSubmenu,
  directive
} from 'v-contextmenu'
import 'v-contextmenu/dist/index.css'
import { mapGetters } from 'vuex'

const getAPI = {
  version: [getProjectVersion],
  assigned: [getProjectUserList],
  tags: [getTagList]
}

const rowFormData = () => ({})

export default {
  name: 'ContextMenu',
  components: {
    AddIssue: () => import('./AddIssue'),
    SettingRelationIssue: () =>
      import('@shared/views/Project/IssueList/components/SettingRelationIssue'),
    SubIssueDialog: () =>
      import('@shared/views/Project/IssueDetail/components/SubIssueDialog'),
    IssueMatrix: () =>
      import('@shared/views/Project/IssueDetail/components/IssueMatrix'),
    Contextmenu,
    ContextmenuItem,
    ContextmenuSubmenu
  },
  directives: {
    contextmenu: directive
  },
  props: {
    row: {
      type: Object,
      default: () => ({
        version: { id: 'null' },
        assigned: { id: 'null' }
      })
    },
    visible: {
      type: Boolean,
      default: false
    },
    filterColumnOptions: {
      type: Array,
      default: () => []
    },
    selectionOptions: {
      type: Object,
      default: () => ({})
    },
    simpleAddIssue: {
      type: Boolean,
      default: false
    }
  },
  data() {
    this.assignedError = {
      title: this.$t('Kanban.assignedErrorTitle'),
      content: this.$t('Kanban.assignedErrorContent')
    }
    this.tagFilterColumnOptions = {
      id: 9,
      label: this.$t('Issue.FilterDimensions.tags'),
      value: 'tags',
      placeholder: 'Tag'
    }
    return {
      relationDialog: {
        visible: false,
        target: 'Parent'
      },
      issueMatrixDialog: {
        visible: false
      },
      checkClosable: false,
      assigned: [],
      version: [],
      tags: [],
      addTopicDialogVisible: false,
      loadingConfirm: false,
      parentId: 0,
      parentSubject: null,
      form: {},
      originForm: {},
      searchTag: '',
      tagOptions: [],
      isCloseIssueDialog: false,
      changedStatus: {}
    }
  },
  computed: {
    ...mapGetters([
      'tracker',
      'status',
      'priority',
      'fixedVersionShowClosed',
      'selectedProject',
      'selectedProjectId',
      'device'
    ]),
    done_ratio() {
      const result = []
      for (let num = 0; num <= 100; num += 10) {
        result.push({ id: num, name: num + ' %' })
      }
      return result
    },
    checkIssueAssignedToStatus() {
      return (
        !this.row.assigned ||
        !this.row.assigned.id ||
        this.row.assigned.id === '' ||
        this.row.assigned.id === 'null'
      )
    },
    permission() {
      return ['sysadmin', 'Organization Owner', 'Project Manager', 'Engineer']
    },
    getUrl() {
      return (rowId) => {
        return `${window.location.origin}/#/project/issues/${rowId}`
      }
    }
  },
  watch: {
    row: {
      deep: true,
      async handler() {
        if (
          Object.keys(this.row).length > 2 &&
          this.selectionOptions['assigned']
        ) {
          await this.initOptions()
          await this.loadProjectSelectionList(this.fixedVersionShowClosed)
        } else {
          await this.loadSelectionList()
        }
        if (Object.keys(this.row).length > 2) {
          await this.getClosable()
        }
      }
    }
  },
  async mounted() {
    if (
      Object.keys(this.row).length > 2 &&
      Object.keys(this.selectionOptions).length > 0
    ) {
      await this.initOptions()
      await this.loadProjectSelectionList(this.fixedVersionShowClosed)
    } else {
      await this.loadSelectionList()
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
    initOptions() {
      const option = JSON.parse(JSON.stringify(this.selectionOptions))
      Object.keys(option).forEach((item) => {
        this[item] = option[item]
      })
    },
    getOptionsData(option_name) {
      if (option_name === 'status') return this.getDynamicStatusList()
      return this[option_name]
    },
    async loadSelectionList() {
      await this.loadProjectSelectionList(
        this.fixedVersionShowClosed,
        true,
        true
      )
    },
    async loadProjectSelectionList(version) {
      Object.keys(getAPI).forEach((key) => {
        let params = {}
        if (key === 'version') {
          params = version
            ? { all: true, status: 'open,locked,closed' }
            : { all: true, status: 'open,locked' }
        }
        this.loadSelection(key, params, [key])
      })
    },
    async loadSelection(column, params, lazyLoad) {
      if (lazyLoad) {
        const projectId = Object.prototype.hasOwnProperty.call(
          this.row,
          'project'
        )
          ? this.row.project.id
          : this.selectedProjectId

        if (projectId === -1) return
        if (projectId) {
          const res = await getAPI[column][0](projectId, params)
          switch (column) {
            case 'version':
              this[column] = [
                {
                  name: this.$t('Issue.VersionUndecided'),
                  id: 'null'
                },
                ...res.data
              ]
              break
            case 'assigned':
              this[column] = [
                {
                  name: this.$t('Issue.Unassigned'),
                  id: 'null',
                  username: 'null'
                },
                ...res.data.map((item) => {
                  return {
                    name: item.full_name,
                    id: item.id,
                    username: item.username
                  }
                })
              ]
              break
            default:
              this[column] = res.data
          }
        }
      }
      this.setDefaultTagOptions()
    },
    async getClosable() {
      const closable = await checkIssueClosable(this.row.id)
      this.$set(this, 'checkClosable', closable.data)
    },
    getId(option, item) {
      if (option === 'assigned') return item.username
      return item.id
    },
    getDynamicStatusList() {
      let option
      if (this.selectionOptions['status']) {
        option = cloneDeep(this.selectionOptions)
      } else {
        option = cloneDeep({ status: this.status })
      }
      return option['status'].map((item) => this.formatDynamicStatusList(item))
    },
    formatDynamicStatusList(item) {
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
          const sendData = { parent_id: getSettingRelationIssue.form.parent_id }
          updateApi.push(updateIssue(getSettingRelationIssue.row.id, sendData))
        } else if (getSettingRelationIssue.target === 'Children') {
          const appendSendData = { parent_id: getSettingRelationIssue.row.id }
          const removeSendData = { parent_id: '' }
          getSettingRelationIssue.children['append'].forEach((item) => {
            updateApi.push(updateIssue(item, appendSendData))
          })
          getSettingRelationIssue.children['remove'].forEach((item) => {
            updateApi.push(updateIssue(item, removeSendData))
          })
        }
        await Promise.allSettled(updateApi)
        this.toggleRelationDialog(getSettingRelationIssue.target)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        this.$emit('update')
        this.$emit('update-card', this.row.id)
      } catch (e) {
        console.error(e)
      }
    },
    onUpdate(column, item) {
      const { id, is_closed } = item
      if (column === 'status_id' && is_closed) {
        this.changedStatus = item
        this.isCloseIssueDialog = true
        return
      }
      this.handleUpdate({ column, id, close_all: false })
    },
    async handleUpdate(item) {
      const { column, id, close_all } = item
      try {
        let sendData = { [column]: id }
        if (column === 'tags_id') {
          sendData = this.setTags(id)
        } else if (column === 'assigned_id') {
          sendData = this.setStatusId(column, id, sendData)
        }
        if (column === 'status_id' && close_all) {
          sendData.close_all = true
        }
        const res = await updateIssue(this.row.id, sendData)
        this.row[column.replace('_id', '')] =
          res.data[column.replace('_id', '')]
        this.$emit('update')
        this.$emit('update-card', this.row.id)
      } catch (e) {
        console.error(e)
      }
    },
    hasChildren() {
      this.row.has_children = true
    },
    setTags(value) {
      const tags = this.row.tags ? this.row.tags.map((item) => item.id) : []
      const findTags = tags.findIndex((item) => item === value)
      if (findTags >= 0) {
        tags.splice(findTags, 1)
      } else {
        tags.push(value)
      }
      return { tags_list: tags.join(',') }
    },
    setStatusId(column, id, data) {
      if (this.row.status.id === 1 && id !== 'null') {
        // change status to assigned if user add assignee
        data = {
          [column]: id,
          status_id: 2
        }
      } else if (this.row.status.id !== 1 && id === 'null') {
        // change status to active if user remove assignee
        data = {
          [column]: id,
          status_id: 1
        }
      }
      return data
    },
    toggleRelationDialog(target) {
      this.relationDialog.visible = !this.relationDialog.visible
      this.relationDialog.target = target
    },
    toggleIssueMatrixDialog() {
      this.issueMatrixDialog.visible = !this.issueMatrixDialog.visible
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
        result += ` (${
          this.$te('Issue.' + item.status)
            ? this.$t('Issue.' + item.status)
            : item.status
        })`
      }
      return result
    },
    getContextMenuCurrentValue(column, item) {
      if (typeof column === 'string') {
        return this.row[column] ? this.row[column] === item.id : item.id === 0
      }
      if (!this.row[column.value]) return item.id === 'null'
      if (Array.isArray(this.row[column.value])) {
        return this.row[column.value]
          .map((subItem) => subItem.id)
          .includes(item.id)
      }
      if (!this.row[column.value].id) {
        return item.id ? item.id === 'null' : false
      }
      return this.row[column.value].id === item.id
    },
    handleUpdateIssue() {
      this.$emit('update')
      this.$emit('update-row', this.row.id)
      this.$emit('update-card', this.row.id)
    },
    handleAdvancedImport() {
      this.setFormData(this.row, true)
      this.$refs['AddIssue'].handleImport()
    },
    handleAdvancedClose() {
      this.$refs['AddIssue'].handleClose()
    },
    handleAdvancedSave() {
      this.$refs['AddIssue'].handleSave()
    },
    handleCloseDialog() {
      this.addTopicDialogVisible = false
    },
    setFormData(data, copy) {
      const {
        project,
        assigned,
        version,
        subject,
        tracker,
        status,
        priority,
        estimated_hours,
        done_ratio,
        start_date,
        due_date,
        description
      } = data
      this.form = {}
      this.form.project_id = project ? project.id : ''
      this.form.assigned_id = assigned ? assigned.id : ''
      this.form.subject =
        copy && this.parentId === 0
          ? subject + ' (' + this.$t('Issue.Copy') + ')'
          : subject
      this.form.version_id = version ? version.id : ''
      this.form.tracker_id = tracker.id
      this.form.status_id = status.id
      this.form.priority_id = priority.id
      this.form.estimated_hours = estimated_hours
      this.form.done_ratio = done_ratio
      this.form.start_date = start_date === null ? '' : start_date
      this.form.due_date = due_date === null ? '' : due_date
      this.form.description = description === null ? '' : description
      this.originForm = Object.assign({}, this.form)
    },
    async advancedAddIssue(copy) {
      if (copy) {
        this.parentId = 0
        this.parentSubject = null
        await getIssueDetails(this.row.id).then((res) => {
          this.setFormData(res.data, copy)
        })
      } else {
        this.form = Object.assign({}, rowFormData())
        this.parentId = this.row?.id
        this.parentSubject = this.row?.subject
      }

      if (!this.simpleAddIssue || copy) {
        this.addTopicDialogVisible = true
        return
      }

      const store = this.$parent.$refs['Desktop']
        ? this.$parent.$refs['Desktop'].$refs['issueList'].layout.store
        : this.$parent.$refs['issueList'].layout.store
      const { expandRows } = store.states
      const expandIndex = expandRows.findIndex((x) => x.id === this.row.id)
      if (expandIndex === -1) {
        store.toggleRowExpansion(this.row)
      }
      this.row.showQuickAddIssue = true
    },
    loadingUpdate(value) {
      this.loadingConfirm = value
    },
    async saveIssue(data) {
      this.loadingConfirm = true
      const res = await createProjectIssue(data.project_id, data)
      // this.$message({
      //   title: this.$t('general.Success'),
      //   message: this.$t('Notify.Added'),
      //   type: 'success'
      // })
      this.$emit('backToFirstPage')
      this.$emit('update', data.assigned_id)
      this.addTopicDialogVisible = false
      // this.$refs['quickAddIssue'].form.name = ''
      this.loadingConfirm = false
      return res
    },
    addToCalendar(type) {
      if (type) {
        const { id, subject, start_date, due_date, tracker } = this.row
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
          if (type === 'ics') {
            ics({
              id,
              subject: subject,
              description,
              begin: start_date,
              stop: due_date,
              location: ''
            })
            return
          }
          window.open(calendarUrl(data))
        }
      }
    },
    remoteMethod(query) {
      if (query !== '') {
        this.tagOptions = this.tags.filter((tag) => {
          return tag.name.toLowerCase().indexOf(query.toLowerCase()) > -1
        })
      } else {
        this.setDefaultTagOptions()
      }
    },
    setDefaultTagOptions() {
      this.tagOptions = this.tags.slice(0, 5)
    },
    onCloseIssueMatrix() {
      this.issueMatrixDialog.visible = false
      this.$emit('update')
    },
    handleIssueDetail(row) {
      window.open(this.getUrl(row.id), '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

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
  font-weight: bold !important;
  color: $success !important;
}

.tag-contextmenu-item {
  width: 200px;
  background-color: #ffffff;
  color: #333;
}

.tag {
  list-style: none;
  text-align: left;
  padding: 5px 14px;
  font-size: 14px;

  &:hover {
    background: #46a0fc;
  }
}

::v-deep {
  .v-contextmenu {
    max-height: 40vh;
    overflow: auto;
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
