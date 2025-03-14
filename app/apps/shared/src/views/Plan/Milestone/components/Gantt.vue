<template>
  <div>
    <el-row :gutter="10" class="content">
      <el-col
        v-loading="listLoading || isExportGantt"
        :element-loading-text="$t('Loading')"
        :span="24"
      >
        <div v-if="listData.length > 0" class="gantt-chart">
          <el-button
            :disabled="isExportGantt"
            :icon="isExportGantt ? 'el-icon-loading' : 'el-icon-full-screen'"
            type="text"
            @click="downloadPng"
          >
            {{ $t('Milestone.PreviewGantt') }}
          </el-button>
          <gantt-elastic
            ref="gantt"
            :options="options"
            :tasks="listData"
            @chart-task-click="onTaskClick"
            @options-changed="styleUpdate"
          >
            <template #header>
              <gantt-header ref="header" :options="headerOptions" />
            </template>
          </gantt-elastic>
        </div>
        <div v-else class="align-middle">
          <el-alert type="warning">
            <h1>
              <em class="el-icon-warning"></em> {{ $t('general.NoData') }}
            </h1>
          </el-alert>
        </div>
      </el-col>
    </el-row>
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
        @delete="handleRelationUpdate"
        @update="handleRelationUpdate"
      />
    </el-dialog>
    <el-dialog
      :append-to-body="false"
      :visible.sync="isDownload"
      top="3vh"
      width="95%"
      @closed="isDownload = false"
    >
      <template slot="title">
        <el-button
          :disabled="isExportGantt"
          :icon="isExportGantt ? 'el-icon-loading' : 'el-icon-download'"
          type="text"
          @click="exportPdf"
        >
          {{ $t('File.Download') }} PNG
        </el-button>
      </template>
      <gantt-elastic
        ref="ganttDownload"
        v-loading="listLoading || isExportGantt"
        :options="optionsDownload"
        :tasks="listData"
      />
    </el-dialog>
  </div>
</template>

<script>
import { getIssueFamily } from '@/api_v3/issues'
import { getProjectIssueList } from '@/api_v3/projects'
import CancelRequest from '@/mixins/CancelRequest'
import { getLocalTime, isTimeValid } from '@shared/utils/handleTime'
import myConfig from '@tailwind'
import html2canvas from 'html2canvas'
import { camelCase } from 'lodash'
import resolveConfig from 'tailwindcss/resolveConfig'
import { mapGetters } from 'vuex'

const tailwindConfig = resolveConfig(myConfig)

export default {
  name: 'Gantt',
  components: {
    // AddIssue: () => import('@/components/Issue/AddIssue'),
    ProjectIssueDetail: () => import('@/views/Project/IssueDetail'),
    GanttElastic: () => import('gantt-elastic'),
    GanttHeader: () => import('./GanttHeader')
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
    assignedTo: {
      type: Array,
      default: () => []
    },
    fixedVersion: {
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
    }
  },
  data() {
    this.bg = Object.freeze(tailwindConfig.theme.backgroundColor)
    this.calLocale = {
      'zh-TW': {
        name: 'zh-tw',
        weekdays: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
        weekdaysShort: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
        weekdaysMin: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
        months: [
          '一月',
          '二月',
          '三月',
          '四月',
          '五月',
          '六月',
          ' 七月',
          '八月',
          '九月',
          '十月',
          '十一月',
          '十二月'
        ],
        monthsShort: [
          '一月',
          '二月',
          '三月',
          '四月',
          '五月',
          '六月',
          ' 七月',
          '八月',
          '九月',
          '十月',
          '十一月',
          '十二月'
        ]
      },
      en: {
        name: 'en',
        weekdays: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday'
        ],
        weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        weekdaysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        months: [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ],
        monthsShort: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec'
        ]
      }
    }
    return {
      listLoading: false,
      contentLoading: false,
      activeNames: '',
      searchVisible: false,
      status: [],
      priority: [],
      listData: [],
      // addTopicDialog: {
      //   visible: false,
      //   parentId: 0,
      //   parentSubject: null,
      //   LoadingConfirm: false
      // },
      relationIssue: {
        visible: false,
        id: null
      },
      headerOptions: {
        title: {
          label: ''
        },
        locale: {
          Now: this.$t('Gantt.Now'),
          'X-Scale': this.$t('Gantt.XScale'),
          'Y-Scale': this.$t('Gantt.YScale'),
          'Task list width': this.$t('Gantt.TaskListWidth'),
          'Before/After': this.$t('Gantt.TimelineLength'),
          'Display task list': this.$t('Gantt.DisplayTaskList')
        }
      },
      isDownload: false,
      optionsDownload: {},
      isExportGantt: false,
      options: {
        locale: this.calLocale[this.$i18n.locale],
        maxHeight: this.tableHeight - 150,
        title: {
          label: '',
          html: false
        },
        row: {
          height: 20
        },
        calendar: {
          hour: {
            display: false
          }
        },
        chart: {
          progress: {
            bar: false
          },
          expander: {
            display: true
          }
        },
        taskList: {
          expander: {
            straight: false
          },
          columns: [
            {
              id: 1,
              label: 'ID',
              value: 'id',
              width: 46,
              style: {
                'task-list-header-label': {
                  'text-align': 'center'
                },
                'task-list-item-value-wrapper': {
                  'justify-content': 'center'
                }
              }
            },
            {
              id: 2,
              label: this.$t('Issue.name'),
              value: (issue) => `<div class="flex items-center">${
                issue.has_children && issue.children.length === 0
                  ? `
                    <svg id="task-icon-${issue.id}" width="16" height="16" class="mr-3"
                        style="display: inline-flex; cursor: pointer; margin: auto 0px; box-sizing: border-box; user-select: none;">
                      <rect x="0.5" y="0.5" width="15" height="15" rx="2" ry="2" class="gantt-elastic__task-list-expander-border"
                        style="fill: rgba(255, 255, 255, 0.627); stroke: rgba(0, 0, 0, 0.627); stroke-width: 0.5;"></rect>
                      <line x1="5" y1="8" x2="11" y2="8" class="gantt-elastic__task-list-expander-line"
                        style="fill: transparent; stroke: rgb(0, 0, 0); stroke-width: 1; stroke-linecap: round;"></line>
                      <line x1="8" y1="5" x2="8" y2="11" class="gantt-elastic__task-list-expander-line"
                        style="fill: transparent; stroke: rgb(0, 0, 0); stroke-width: 1; stroke-linecap: round;"></line>
                    </svg>
                    `
                  : ''
              }
                <span
                  id="task-name-${issue.id}"
                  style="vertical-align: middle;"
                >
                  ${issue.subject}
                </span></div>`,
              width: 200,
              expander: true,
              html: true,
              style: {
                'task-list-item-value-container': {
                  cursor: 'pointer'
                }
              }
            },
            {
              id: 3,
              label: this.$t('Issue.StartDate'),
              value: (task) =>
                isTimeValid(task.start)
                  ? getLocalTime(task.start, 'YYYY-MM-DD')
                  : null,
              width: 78,
              style: {
                'task-list-header-label': {
                  'text-align': 'center'
                },
                'task-list-item-value-wrapper': {
                  'justify-content': 'center'
                }
              }
            },
            {
              id: 4,
              label: this.$t('Issue.EndDate'),
              value: (task) =>
                isTimeValid(task.end)
                  ? getLocalTime(task.end, 'YYYY-MM-DD')
                  : null,
              width: 78,
              style: {
                'task-list-header-label': {
                  'text-align': 'center'
                },
                'task-list-item-value-wrapper': {
                  'justify-content': 'center'
                }
              }
            }
          ]
        }
      }
    }
  },
  computed: {
    ...mapGetters([
      'userId',
      'selectedProject',
      'tracker',
      'fixedVersionShowClosed',
      'device'
    ]),
    selectedProjectId() {
      return this.selectedProject.id
    },
    displayFilterValue() {
      const result = []
      Object.keys(this.filterValue).forEach((item) => {
        if (this.filterValue[item]) {
          const value = this[item].find(
            (search) => search.id === this.filterValue[item]
          )
          if (value) {
            result.push(this.getSelectionLabel(value))
          }
        }
      })
      return (
        this.$t('general.Filter') +
        (result.length > 0 ? ': ' : '') +
        result.join(', ')
      )
    },
    isFilterChanged() {
      for (const item of Object.keys(this.originFilterValue)) {
        const checkFilterValue = this.originFilterValue
        if (checkFilterValue[item] === '') {
          delete checkFilterValue[item]
        }
        if (this.filterValue[item] !== checkFilterValue[item]) {
          return true
        }
      }
      for (const item of Object.keys(this.filterValue)) {
        const checkFilterValue = this.filterValue
        if (checkFilterValue[item] === '') {
          delete checkFilterValue[item]
        }
        if (this.originFilterValue[item] !== checkFilterValue[item]) {
          return true
        }
      }
      return !!this.keyword
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    tableHeight(value) {
      this.options.maxHeight = value - 150
    },
    dateRange: {
      deep: true,
      immediate: false,
      handler() {
        this.loadData()
      }
    },
    '$i18n.locale'() {
      this.setHeaders()
      this.options.locale = this.calLocale[this.$i18n.locale]
    }
  },
  created() {
    this.loadData()
  },
  beforeDestroy() {
    if (
      Object.keys(this.options).length !== 0 &&
      this.options.hasOwnProperty('times')
    ) {
      localStorage.setItem('gantt', JSON.stringify(this.options))
    }
  },
  methods: {
    async loadData() {
      await this.fetchData()
      await this.getOptionSaved()
      this.setEventListener()
    },
    setHeaders() {
      this.$refs.header.opts = {
        title: {
          label: ''
        },
        locale: {
          Now: this.$t('Gantt.Now'),
          'X-Scale': this.$t('Gantt.XScale'),
          'Y-Scale': this.$t('Gantt.YScale'),
          'Task list width': this.$t('Gantt.TaskListWidth'),
          'Before/After': this.$t('Gantt.TimelineLength'),
          'Display task list': this.$t('Gantt.DisplayTaskList')
        }
      }
      this.options.taskList.columns[1].label = this.$t('Issue.name')
      this.options.taskList.columns[2].label = this.$t('Issue.StartDate')
      this.options.taskList.columns[3].label = this.$t('Issue.EndDate')
    },
    getParams() {
      const result = {
        parent_id: 'null',
        sort: 'subject:asc',
        all: true
      }
      if (!this.displayClosed) {
        result['exclude_closed'] = true
      }
      Object.keys(this.filterValue).forEach((item) => {
        if (this.filterValue[item]) {
          if (item === 'due_date_start' || item === 'due_date_end') {
            result['due_date_start'] = isTimeValid(result['due_date_start'])
              ? getLocalTime(result['due_date_start'], 'YYYY-MM-DD')
              : null
            result['due_date_end'] = isTimeValid(result['due_date_end'])
              ? getLocalTime(result['due_date_end'], 'YYYY-MM-DD')
              : null
          } else if (item === 'tags' && this.filterValue[item].length > 0) {
            result[item] = this.filterValue[item].join()
          } else {
            result[`${item}_id`] = this.filterValue[item]
          }
        }
      })
      if (this.keyword) {
        result['search'] = this.keyword
      }
      return result
    },
    formatIssue(issue, parentId) {
      const name = this.$t(`Issue.${issue.status.name}`)
      issue.label = `${name}${
        issue.done_ratio > 0 ? `(${issue.done_ratio}%)` : ''
      } - ${issue.subject}`
      issue.start = issue.start_date || new Date()
      issue.end = issue.due_date || new Date()
      issue.progress = issue.done_ratio || 0
      issue.type = 'task'
      issue.style = {
        base: {
          fill: `${this.bg[camelCase(issue.status.name)]}75`,
          stroke: `${this.bg[camelCase(issue.status.name)]}75`,
          cursor: 'pointer'
        },
        'chart-row-progress-bar-pattern': {
          cursor: 'pointer'
        }
      }
      if (parentId) {
        issue.parentId = parentId
      }
      return issue
    },
    async fetchData() {
      if (this.selectedProjectId === -1) return
      let resProjectIssue = {}
      if (this.listLoading) {
        this.cancelRequest()
      }
      this.listLoading = true
      try {
        resProjectIssue = await getProjectIssueList(
          this.filterValue.project || this.selectedProjectId,
          this.getParams(),
          { cancelToken: this.cancelToken }
        )
      } catch (error) {
        console.error(error)
      } finally {
        if (resProjectIssue?.data) {
          this.listData = resProjectIssue.data.map((issue) =>
            this.formatIssue(issue)
          )
        }
        this.listLoading = false
      }
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
        result +=
          ' (' +
          (this.$te('Issue.' + item.status)
            ? this.$t('Issue.' + item.status)
            : item.status) +
          ')'
      }
      if (item.hasOwnProperty('login')) {
        result += ' (' + item.login + ')'
      }
      return result
    },
    async getIssueFamilyData(row) {
      if (row.id) {
        this.listLoading = true
        try {
          const family = await getIssueFamily(row.id)
          const data = family.data
          if (data.hasOwnProperty('children')) {
            data.children.forEach((issue) => {
              issue = this.formatIssue(issue, row.id)
              const oldIssueIndex = this.listData.findIndex(
                (subIssue) => subIssue.id === issue.id
              )
              if (oldIssueIndex > 0) {
                this.$set(this.listData, oldIssueIndex, issue)
              } else {
                this.listData.push(issue)
              }
              this.$nextTick(() => {
                data.children.forEach((issue) => {
                  this.addEvent(row)
                  this.addEvent(issue)
                })
              })
            })
          }
        } catch (e) {
          //   null
        }
        this.listLoading = false
      }
    },
    onChangeFilter() {
      this.loadData()
    },
    cleanFilter() {
      this.filterValue = Object.assign({}, this.originFilterValue)
      this.keyword = ''
      this.displayClosed = false
      this.onChangeFilter()
    },
    // handleSave() {
    //   this.$refs['issueForm'].validate(async (valid) => {
    //     if (valid) {
    //       // deep copy & remove field with empty value
    //       const data = JSON.parse(JSON.stringify(this.form))
    //       Object.keys(data).forEach((item) => {
    //         if (data[item] === '' || data[item] === 'null' || !data[item]) {
    //           delete data[item]
    //         }
    //       })
    //
    //       // because have file need upload so use formData object
    //       const form = new FormData()
    //       form.append('project_id', this.projectId)
    //       Object.keys(data).forEach((objKey) => {
    //         form.append(objKey, data[objKey])
    //       })
    //       this.LoadingConfirm = true
    //       await this.saveIssue(form)
    //       this.LoadingConfirm = false
    //       this.form.tracker_id = data.tracker_id
    //       return true
    //     } else {
    //       return false
    //     }
    //   })
    // },
    // async saveIssue(data) {
    //   await addIssue(data)
    //     .then((res) => {
    //       // noinspection JSCheckFunctionSignatures
    //       this.$message({
    //         title: this.$t('general.Success'),
    //         message: this.$t('Notify.Added'),
    //         type: 'success'
    //       })
    //       this.loadData()
    //       this.addTopicDialogVisible = false
    //       return res
    //     })
    //     .catch((error) => {
    //       return error
    //     })
    // },
    // handleClose() {
    //   this.$emit('close-dialog', false)
    // },
    // handleCloseDialog() {
    //   this.addTopicDialog.visible = false
    // },
    // handleAdvancedClose() {
    //   this.$refs['AddIssue'].handleClose()
    // },
    // handleAdvancedSave() {
    //   this.$refs['AddIssue'].handleSave()
    // },
    // addIssue(row) {
    //   this.addTopicDialog.visible = true
    //   this.addTopicDialog.parentId = row.id
    //   this.addTopicDialog.parentSubject = row.label
    // },
    loadingUpdate(value) {
      this.LoadingConfirm = value
    },
    onTaskClick({ data }) {
      if (!this.isMobile) this.onRelationIssueDialog(data.id)
      else {
        this.$router.push({
          name: 'IssueDetail',
          params: { issueId: data.id }
        })
      }
    },
    handleRelationUpdate() {
      this.onCloseRelationIssueDialog()
      this.loadData()
      this.$emit('update-issue')
    },
    onRelationIssueDialog(id) {
      this.$set(this.relationIssue, 'visible', true)
      this.$set(this.relationIssue, 'id', id)
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
        ).then(() => {
          done()
        })
      } else {
        done()
      }
    },
    getOptionSaved() {
      const target = JSON.parse(localStorage.getItem('gantt'))
      if (target) {
        if (target.times) {
          this.options.times = target.times
        } else {
          localStorage.removeItem('gantt')
          return
        }
        if (target.scope) this.options.scope = target.scope
        this.options.taskList.display = target.taskList.display
        this.options.taskList.percent = target.taskList.percent
        this.options.row = target.row
      }
    },
    styleUpdate(events) {
      if (
        events.hasOwnProperty('times') &&
        events.hasOwnProperty('scope') &&
        events.hasOwnProperty('taskList') &&
        events.hasOwnProperty('row')
      ) {
        this.options.times = events.times
        this.options.scope = events.scope
        this.options.taskList = events.taskList
        this.options.row = events.row
        localStorage.setItem('gantt', JSON.stringify(this.options))
      }
    },
    downloadPng() {
      this.isExportGantt = true
      this.optionsDownload = Object.assign({}, this.options)
      this.optionsDownload.maxHeight = 1000000
      this.optionsDownload.maxRows = 1000
      this.isDownload = true
      this.isExportGantt = false
    },
    async exportPdf() {
      this.isExportGantt = true
      const container = this.$refs.ganttDownload.$el
      const time = new Date().toLocaleString()
      const fileName = `${this.selectedProject.display_name} (${time}).png`
      await html2canvas(container).then(function (canvas) {
        const link = document.createElement('a')
        link.download = fileName
        link.href = canvas.toDataURL('image/png', 1.0)
        link.target = '_blank'
        link.click()
      })
      this.isExportGantt = false
    },
    setEventListener() {
      for (const data of this.listData) {
        this.addEvent(data)
      }
    },
    addEvent(data) {
      const elementName = document.getElementById(`task-name-${data.id}`)
      const elementIcon = document.getElementById(`task-icon-${data.id}`)
      if (elementName) {
        elementName.addEventListener('click', () => {
          this.onTaskClick({ data })
        })
      }
      if (elementIcon) {
        elementIcon.addEventListener('click', () => {
          this.getIssueFamilyData(data)
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.app-container {
  @apply h-screen overflow-hidden;
}

$max_height: calc(100vh - 50px - 20px - 50px - 50px - 50px - 80px);

.content {
  max-height: $max_height !important;
  //navbar, padding, project selector,divider
  .el-col {
    max-height: inherit;
  }
}

::v-deep {
  .gantt-elastic__task-list-expander-content {
    margin: auto 6px !important;
  }
}
</style>
