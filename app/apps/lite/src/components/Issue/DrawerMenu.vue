<template>
  <div>
    <div class="container">
      <el-card shadow="never">
        <template v-for="condition in filterColumnOptions">
          <div :key="condition.id">
            <div class="title">
              <span>
                <el-divider direction="vertical" />
                <span class="text">{{ $t('Issue.' + condition.value) }}</span>
              </span>
            </div>
            <el-radio-group
              v-model="conditionOption[condition.value]"
              class="radio-group"
              size="small"
              @change="
                onUpdate(
                  condition.value + '_id',
                  conditionOption[condition.value]
                )
              "
            >
              <el-col class="settings">
                <el-radio
                  v-for="option in getOptionsData(condition.value)"
                  :key="option.id"
                  v-permission="permission"
                  :disabled="
                    option.disabled ||
                      getContextMenuCurrentValue(condition, option)
                  "
                  :label="option.id"
                  :value="option.id"
                  border
                >
                  {{ getSelectionLabel(option) }} {{ option.message }}
                </el-radio>
              </el-col>
            </el-radio-group>
            <el-divider />
          </div>
        </template>
        <div v-if="!row.has_children">
          <div class="title">
            <span>
              <el-divider direction="vertical" />
              <span class="text">{{ $t('Issue.DoneRatio') }}</span>
            </span>
          </div>
          <el-slider
            v-model="conditionOption['done_ratio']"
            @change="
              onUpdate('done_ratio', { id: conditionOption['done_ratio'] })
            "
          />
        </div>
      </el-card>
      <el-button
        style="width: 100%; margin-top: 10px"
        type="primary"
        @click="advancedAddIssue(true)"
      >
        {{ $t('Issue.CopyIssue') }}
      </el-button>
    </div>
    <el-dialog
      v-if="row.project"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      :show-close="false"
      :top="device === 'desktop' ? '5px' : '0px'"
      :visible.sync="addTopicDialogVisible"
      :width="device === 'desktop' ? '50%' : '100%'"
      append-to-body
      destroy-on-close
    >
      <template slot="title">
        <el-row slot="title" align="middle" type="flex">
          <el-col :md="16" :xs="24">
            <span class="text-title">
              {{ $t('Issue.AddIssue') }}
            </span>
          </el-col>
          <el-col :md="8" :xs="24" class="text-right">
            <el-button
              v-if="parentId !== 0"
              type="primary"
              @click="handleAdvancedImport"
            >
              {{ $t('Issue.ImportParentIssueData') }}
            </el-button>
            <el-button @click="handleCloseDialog()">
              {{ $t('general.Close') }}
            </el-button>
          </el-col>
        </el-row>
      </template>
      <AddIssue
        v-if="addTopicDialogVisible"
        ref="AddIssue"
        :parent-id="parentId"
        :parent-subject="parentSubject"
        :prefill="form"
        :project-id="row.project.id"
        :save-data="saveIssue"
        @loading="loadingUpdate"
        @has-children="hasChildren"
        @add-topic-visible="handleCloseDialog"
      />
      <span slot="footer" class="dialog-footer">
        <el-button id="dialog-btn-cancel" @click="handleAdvancedClose">{{
          $t('general.Cancel')
        }}</el-button>
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
  </div>
</template>

<script>
import { checkIssueClosable, updateIssue } from '@/api_v3/issues'
import { createProjectIssue, getProjectUserList } from '@/api_v3/projects'
import { cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'

const getAPI = {
  assigned: [getProjectUserList]
}

const rowFormData = () => ({})

export default {
  name: 'DrawerMenu',
  components: {
    AddIssue: () => import('./AddIssue')
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
    }
  },
  data() {
    this.assignedError = {
      title: this.$t('Kanban.assignedErrorTitle'),
      content: this.$t('Kanban.assignedErrorContent')
    }
    this.filterColumnOptions = Object.freeze([
      {
        id: 1,
        label: this.$t('Issue.FilterDimensions.status'),
        value: 'status',
        placeholder: 'Status',
        tag: true
      },
      {
        id: 2,
        label: this.$t('Issue.FilterDimensions.assigned'),
        value: 'assigned',
        placeholder: 'Member'
      }
    ])
    return {
      checkClosable: false,
      assigned: [],
      addTopicDialogVisible: false,
      loadingConfirm: false,
      parentId: 0,
      parentSubject: null,
      form: {},
      originForm: {},
      showAlert: false,
      errorMsg: [],
      conditionOption: {
        status: null,
        assigned: null,
        done_ratio: null
      }
    }
  },
  computed: {
    ...mapGetters([
      'status',
      'fixedVersionShowClosed',
      'selectedProjectId',
      'device'
    ]),
    conditionOptions() {
      const result = {}
      const getOptions = ['assigned']
      getOptions.forEach((item) => {
        result[item] = this[item]
      })
      return result
    },
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
    }
  },
  watch: {
    row: {
      deep: true,
      async handler() {
        if (
          Object.keys(this.row).length > 2 &&
          this.conditionOptions['assigned']
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
      Object.keys(this.conditionOptions).length > 0
    ) {
      await this.initOptions()
      await this.loadProjectSelectionList(this.fixedVersionShowClosed)
    } else {
      await this.loadSelectionList()
    }
    Object.keys(this.conditionOption).forEach((item) => {
      if (item === 'done_ratio') {
        this.conditionOption[item] = this.row[item] || 0
      } else {
        this.conditionOption[item] = this.row[item]?.id
      }
    })
  },
  methods: {
    initOptions() {
      const option = JSON.parse(JSON.stringify(this.conditionOptions))
      Object.keys(option).forEach((item) => {
        this[item] = option[item]
      })
    },
    getOptionsData(option_name) {
      if (option_name === 'status') return this.getDynamicStatusList()
      return this[option_name]
    },
    async loadSelectionList() {
      await this.loadProjectSelectionList(this.fixedVersionShowClosed, true)
    },
    async loadProjectSelectionList(version) {
      Object.keys(getAPI).forEach((key) => {
        let params = {}
        if (key === 'version') {
          params = version
            ? { status: 'open,locked,closed' }
            : { status: 'open,locked' }
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
        if (projectId) {
          const res = await getAPI[column][0](projectId, params)
          switch (column) {
            case 'assigned':
              this[column] = [
                {
                  name: this.$t('Issue.Unassigned'),
                  id: 'null',
                  username: 'null'
                },
                ...res.data.map((item) => ({
                  name: item.full_name,
                  id: item.id,
                  username: item.username
                }))
              ]
              break
            default:
              this[column] = res.data[getAPI[column][1]]
          }
        }
      }
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
      if (this.conditionOptions['status']) {
        option = cloneDeep(this.conditionOptions)
      } else {
        option = cloneDeep({ status: this.status })
      }
      return option['status'].map((item) => this.formatDynamicStatusList(item))
    },
    formatDynamicStatusList(item) {
      if (!this.checkClosable && item.is_closed && this.row.has_children) {
        item.disabled = true
        item.message = '(' + this.$t('Issue.ChildrenNotClosed') + ')'
      }
      if (this.checkIssueAssignedToStatus && item.id !== 1 && item.id !== 6) {
        item.disabled = true
        item.message = '(' + this.$t('Issue.NoAssignee') + ')'
      }
      if (this.row.assigned?.id && item.id === 1) {
        item.disabled = true
        item.message = '(' + this.$t('Issue.HasAssignee') + ')'
      }
      return item
    },
    async onUpdate(column, item) {
      if (column !== 'done_ratio') {
        item = this[column.replace('_id', '')].find(
          (option) => option.id === item
        )
      }
      if (
        this.row.assigned &&
        this.row.assigned.name &&
        item.name === 'Active'
      ) {
        const error = 'assignedError'
        this.handleErrorAlert(error)
        this.showErrorAlert(this.errorMsg)
        return
      }
      try {
        let sendData = { [column]: item.id }
        if (column === 'assigned_id') {
          sendData = this.setStatusId(column, item.id, sendData)
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
    handleErrorAlert(key) {
      const { title, content } = this[key]
      this.errorMsg.push(this.getErrorAlert(title, content))
    },
    getErrorAlert(title, content) {
      const h = this.$createElement
      return h('li', [h('b', title), h('p', content)])
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
    setStatusId(column, id, data) {
      if (this.row.status.id === 1 && id) {
        // change status to assigned if user add assignee
        data = {
          [column]: id,
          status_id: 2
        }
      }
      return data
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
    advancedAddIssue(copy) {
      if (copy) {
        this.parentId = 0
        this.parentSubject = null
        this.setFormData(this.row, copy)
      } else {
        this.form = Object.assign({}, rowFormData())
        this.parentId = this.row.id
        this.parentSubject = this.row.subject
      }
      this.addTopicDialogVisible = true
      this.$emit('close')
    },
    loadingUpdate(value) {
      this.loadingConfirm = value
    },
    async saveIssue(data) {
      this.loadingConfirm = true
      const res = await createProjectIssue(data.project_id, data)
      this.$emit('backToFirstPage')
      this.$emit('update', Number(data.get('assigned_id')))
      this.addTopicDialogVisible = false
      this.loadingConfirm = false
      return res
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
@import 'src/styles/theme/mixin.scss';

.container {
  padding: 20px;
  max-width: 768px;

  ::v-deep .el-divider {
    background-color: #ebeef5;
  }

  ::v-deep .el-card__body,
  .el-main {
    padding: 10px;
  }

  .title {
    margin-bottom: 10px;

    ::v-deep .el-divider--vertical {
      width: 6px;
      margin: 0;
      border-radius: 3px 0 0 3px;
      height: 18px;
      background-color: $warning !important;
    }

    ::v-deep .el-tag--small {
      height: 25px;
    }

    ::v-deep .el-button--small {
      padding: 5px 10px;
    }

    ::v-deep .el-checkbox__label {
      font-size: 12px;
    }

    .text {
      font-size: 15px;
      font-weight: bold;
      color: #72767b;
      vertical-align: middle;
    }
  }

  .radio-group {
    display: grid;

    .settings::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera*/
    }

    .settings {
      max-width: 768px;
      margin: 0 auto;
      display: grid;
      gap: 6px;
      overflow-x: auto;
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
      ::v-deep .el-radio.is-bordered {
        margin-left: 0;
        margin-right: 0;
        // width: 140px;
      }

      ::v-deep .el-radio__label {
        padding-left: 2px;
      }
    }
  }

  .save {
    margin-top: 12px;
  }
}

@include mobile {
  .settings {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include tablet-1 {
  .settings {
    grid-template-columns: repeat(3, 1fr);
  }
}

@include tablet-2 {
  .settings {
    grid-template-columns: repeat(4, 1fr);
  }
}

@include tablet-3 {
  .settings {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
