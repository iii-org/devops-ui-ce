<template>
  <div>
    <div v-if="device === 'desktop'">
      <el-form
        v-loading="isLoading"
        ref="form"
        :element-loading-text="$t('Loading')"
        :model="form"
        :rules="issueFormRules"
        :disabled="isButtonDisabled"
        label-position="top"
      >
        <el-row :gutter="10">
          <el-col v-if="hasRelations" :span="isFromBoard ? 8 : 24">
            <el-form-item :label="$t('Project.Project')">
              <el-select
                v-model="form.project_id"
                style="width: 100%"
                @change="updateSelect('project_id')"
              >
                <el-option
                  v-for="(project, index) in allRelation"
                  :key="index"
                  :label="project.display"
                  :value="project.id"
                >
                  <div>
                    {{ project.display }}
                  </div>
                  <div
                    v-if="project.type === 'father'"
                    class="round father"
                  >
                    {{ $t('general.Parent') }}
                  </div>
                  <div
                    v-if="project.type === 'son'"
                    class="round son"
                  >
                    {{ $t('general.Child') }}
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <Tags
              ref="tags"
              :issue-id="issueId"
              :loading.sync="isLoading"
              :form.sync="form"
              :data-loaded="dataLoaded"
              :is-form-collapse-open="isFormCollapseOpen"
              @update="$emit('update')"
            />
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item
              :label="$t('Issue.fixed_version')"
              prop="fixed_version_id"
            >
              <el-select
                v-model="form.fixed_version_id"
                :placeholder="$t('RuleMsg.PleaseSelect')"
                style="width: 100%"
                clearable
                @change="updateSelect('fixed_version_id')"
              >
                <el-option
                  v-for="item in fixed_version"
                  :key="item.id"
                  :label="getSelectionLabel(item)"
                  :value="item.id"
                  :disabled="item.status !== 'open'"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item
              :label="$t('general.Status')"
              prop="status_id"
            >
              <el-select
                v-model="form.status_id"
                :disabled="isParentIssueClosed"
                style="width: 100%"
                @change="updateSelect('status_id')"
              >
                <el-option
                  v-for="option in dynamicStatusList"
                  :key="option.id"
                  :label="$t('Issue.' + option.name)"
                  :value="option.id"
                >
                  <Status
                    :name="$t(`Issue.${option.name}`)"
                    :type="option.name"
                    size="small"
                  />
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item
              :label="$t('Issue.tracker')"
              prop="tracker_id"
            >
              <el-select
                v-model="form.tracker_id"
                style="width: 100%"
                @change="updateSelect('tracker_id')"
              >
                <el-option
                  v-for="option in tracker"
                  :key="option.id"
                  :label="$t('Issue.' + option.name)"
                  :value="option.id"
                >
                  <Tracker
                    :name="$t(`Issue.${option.name}`)"
                    :type="option.name"
                  />
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item
              :label="$t('Issue.assigned_to')"
              prop="assigned_to_id"
            >
              <el-select
                v-model="form.assigned_to_id"
                :placeholder="$t('RuleMsg.PleaseSelect')"
                style="width: 100%"
                clearable
                filterable
                @change="updateSelect('assigned_to_id')"
              >
                <el-option
                  v-for="item in dynamicAssigneeList"
                  :key="item.login"
                  :class="item.class"
                  :label="item.name+' ('+item.login+')'"
                  :value="item.id"
                >
                  {{ item.name }} ({{ item.login }})
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="!isLite" :span="isFromBoard ? 8 : 24">
            <el-form-item
              :label="$t('Issue.CustomBoard')"
              prop="board"
            >
              <el-select
                v-model="form.board"
                :placeholder="$t('general.NoData')"
                class="tagStyle"
                style="width: 100%"
                filterable
                multiple
                collapse-tags
                @remove-tag="removeCustomBoard"
              >
                <el-option
                  v-for="item in form.boardList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                  disabled
                >
                  {{ item.name }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item
              :label="$t('Issue.priority')"
              prop="priority_id"
            >
              <el-select
                v-model="form.priority_id"
                :disabled="childrenIssue.length > 0"
                style="width: 100%"
                @change="updateSelect('priority_id')"
              >
                <el-option
                  v-for="option in priority"
                  :key="option.id"
                  :label="$t('Issue.' + option.name)"
                  :value="option.id"
                >
                  <Priority
                    :name="$t(`Issue.${option.name}`)"
                    :type="option.name"
                  />
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item prop="estimated_hours">
              <template slot="label">
                {{ $t('Issue.Estimate') }}
                <span v-if="isIssueStatusChange('estimated_hours')">
                  <el-button
                    class="action"
                    type="success"
                    size="mini"
                    icon="el-icon-check"
                    @click="updateSelect('estimated_hours')"
                  />
                  <el-button
                    class="action"
                    type="danger"
                    size="mini"
                    icon="el-icon-close"
                    @click="handleCancelCloseIssue('estimated_hours')"
                  />
                </span>
              </template>
              <el-input-number
                v-model="form.estimated_hours"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item prop="done_ratio">
              <template slot="label">
                {{ $t('Issue.DoneRatio') }}
                <span v-if="isIssueStatusChange('done_ratio')">
                  <el-button
                    class="action"
                    type="success"
                    size="mini"
                    icon="el-icon-check"
                    @click="updateSelect('done_ratio')"
                  />
                  <el-button
                    class="action"
                    type="danger"
                    size="mini"
                    icon="el-icon-close"
                    @click="handleCancelCloseIssue('done_ratio')"
                  />
                </span>
              </template>
              <el-input-number
                v-model="form.done_ratio"
                :min="0"
                :max="100"
                :disabled="childrenIssue.length > 0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item
              :label="$t('Issue.StartDate')"
              prop="start_date"
            >
              <el-date-picker
                v-model="form.start_date"
                :disabled="childrenIssue.length > 0"
                :placeholder="$t('RuleMsg.PleaseSelect')"
                :picker-options="startDateOptions(form.due_date)"
                type="date"
                value-format="yyyy-MM-dd"
                style="width: 100%"
                @change="checkStartDate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item
              :label="$t('Issue.EndDate')"
              prop="due_date"
            >
              <el-date-picker
                v-model="form.due_date"
                :disabled="childrenIssue.length > 0"
                :placeholder="$t('RuleMsg.PleaseSelect')"
                :picker-options="dueDateOptions(form.start_date)"
                type="date"
                value-format="yyyy-MM-dd"
                style="width: 100%"
                @change="checkDueDate"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div v-else class="mobile">
      <el-card @click.native="handleClickFormMenu('status_id')">
        <el-row type="flex" justify="space-between">
          <span>
            <em class="ri-notification-badge-fill align-middle" />
            <span class="text-sm font-bold">{{ $t('general.Status') }}</span>
          </span>
          <span>
            <Status
              v-if="currentStatus?.name"
              :name="$t(`Issue.${currentStatus?.name}`)"
              :type="currentStatus?.name"
              class="mx-1"
              size="mini"
            />
            <em class="el-icon-arrow-right align-middle" />
          </span>
        </el-row>
      </el-card>
      <el-card @click.native="handleClickFormMenu('assigned_to_id')">
        <el-row type="flex" justify="space-between">
          <span>
            <em class="ri-user-fill align-middle" />
            <span class="text-sm font-bold">{{ $t('Issue.assigned_to') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">{{ currentAssignee?.name }}</span>
            <em class="el-icon-arrow-right align-middle" />
          </span>
        </el-row>
      </el-card>
      <el-card @click.native="handleClickFormMenu('fixed_version_id')">
        <el-row type="flex" justify="space-between">
          <span>
            <em class="ri-rocket-2-fill align-middle" />
            <span class="text-sm font-bold">{{ $t('Issue.fixed_version') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">
              {{ currentVersion ? getSelectionLabel(currentVersion) : $t('Issue.VersionUndecided') }}
            </span>
            <em class="el-icon-arrow-right align-middle" />
          </span>
        </el-row>
      </el-card>
      <el-card
        v-if="childrenIssue.length === 0"
        @click.native="handleClickFormMenu('done_ratio')"
      >
        <el-row type="flex" justify="space-between">
          <span>
            <em class="ri-percent-fill align-middle" />
            <span class="text-sm font-bold">{{ $t('Issue.DoneRatio') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">{{ form.done_ratio }}%</span>
            <em class="el-icon-arrow-right align-middle" />
          </span>
        </el-row>
      </el-card>
      <el-card
        v-if="childrenIssue.length === 0"
        @click.native="handleClickFormMenu('start_date')"
      >
        <el-row type="flex" justify="space-between">
          <span>
            <em class="ri-calendar-event-fill align-middle" />
            <span class="text-sm font-bold">{{ $t('Issue.StartDate') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">{{ form.start_date }}</span>
            <em class="el-icon-arrow-right align-middle" />
          </span>
        </el-row>
      </el-card>
      <el-card
        v-if="childrenIssue.length === 0"
        @click.native="handleClickFormMenu('due_date')"
      >
        <el-row type="flex" justify="space-between">
          <span>
            <em class="ri-calendar-event-fill align-middle" />
            <span class="text-sm font-bold">{{ $t('Issue.EndDate') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">{{ form.due_date }}</span>
            <em class="el-icon-arrow-right align-middle" />
          </span>
        </el-row>
      </el-card>
      <el-drawer
        v-loading="isLoading"
        :visible.sync="isDrawerVisible"
        direction="btt"
        class="drawer"
        size="auto"
        destroy-on-close
        @close="handleCancelCloseIssue(formType)"
      >
        <div slot="title" class="title">
          <span>
            <el-divider direction="vertical" />
            <span class="text">{{ $t(selectionOptions[formType]?.title) }}</span>
          </span>
        </div>
        <div class="container">
          <el-card shadow="never">
            <IssueFormDrawer
              :form.sync="form"
              :is-button-disabled="isButtonDisabled"
              :issue-form-rules="issueFormRules"
              :options="selectionOptions"
              :form-type="formType"
            />
          </el-card>
        </div>
      </el-drawer>
    </div>
    <el-dialog
      :visible.sync="isAssignDialog"
      :title="$t('Issue.IssueNeedAssigneeWarning')"
      append-to-body
      destroy-on-close
      width="30%"
      @close="handleCancelAssignDialog()"
    >
      <el-select
        v-model="form.assigned_to_id"
        :placeholder="$t('RuleMsg.PleaseSelect')"
        style="width: 100%"
        clearable
        filterable
        @change="updateAssignDialog()"
      >
        <el-option
          v-for="item in dynamicAssigneeList"
          :key="item.login"
          :class="item.class"
          :label="item.name+' ('+item.login+')'"
          :value="item.id"
        >
          {{ item.name }} ({{ item.login }})
        </el-option>
      </el-select>
    </el-dialog>
    <SubIssueDialog
      :is-issue-dialog.sync="isCloseIssueDialog"
      :issue="issue"
      @handleClose="handleCloseAllIssue"
      @handleCancel="handleCancelCloseIssue('status_id')"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectAssignable, getProjectVersion } from '@/api/projects'
import { getAllRelation, getHasRelation } from '@/api_v2/projects'
import { getCheckIssueClosable, updateIssue } from '@/api/issue'
import { removeBoardItemIssue } from '@/api_v2/issueBoard'
import { cloneDeep } from 'lodash'
import { Priority, Tracker, Status, Tags } from '@/components/Issue'
import variables from '@/styles/theme/variables.scss'

export default {
  name: 'IssueForm',
  components: {
    Status,
    Tracker,
    Priority,
    Tags,
    SubIssueDialog: () => import('./SubIssueDialog'),
    IssueFormDrawer: () => import('./IssueFormDrawer')
  },
  props: {
    issue: {
      type: Object,
      default: () => ({})
    },
    issueId: {
      type: Number,
      default: 0
    },
    form: {
      type: Object,
      default: () => ({})
    },
    parent: {
      type: Object,
      default: () => ({})
    },
    childrenIssue: {
      type: Array,
      default: () => []
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    },
    issueProject: {
      type: Object,
      default: () => ({
        display: '',
        id: '',
        name: ''
      })
    },
    isFromBoard: {
      type: Boolean,
      default: false
    },
    isIssueEdited: {
      type: Object,
      default: () => ({})
    },
    dataLoaded: {
      type: Boolean,
      default: false
    },
    isFormCollapseOpen: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      issueFormRules: {
        name: [{ required: true, message: 'Please input name', trigger: 'blur' }],
        // parent_id: [{ validator: validateParentId, trigger: 'blur' }],
        // assigned_to_id: [{ validator: validateAssignedTo, trigger: 'blur' }],
        tracker_id: [{ required: true, message: 'Please select type', trigger: 'blur' }],
        status_id: [{ required: true, message: 'Please select status', trigger: 'blur' }],
        priority_id: [{ required: true, message: 'Please select priority', trigger: 'blur' }]
      },
      assigned_to: [],
      fixed_version: [],
      isLoading: false,
      checkClosable: false,
      dynamicStatusList: [],
      startDateOptions(dueDate) {
        return {
          disabledDate(time) {
            if (!dueDate) return false
            const due_date = new Date(dueDate).setHours(0)
            return time.getTime() > new Date(due_date).getTime()
          }
        }
      },
      dueDateOptions(startDate) {
        return {
          disabledDate(time) {
            const start_date = new Date(startDate).setHours(0)
            return time.getTime() < new Date(start_date).getTime()
          }
        }
      },
      allRelation: [],
      hasRelations: false,
      originForm: {
        status_id: '',
        assigned_to_id: '',
        fixed_version_id: '',
        estimated_hours: 0,
        done_ratio: 0,
        start_date: '',
        due_date: ''
      },
      isIssueClosable: true,
      isCloseIssueDialog: false,
      isDrawerVisible: false,
      drawerKey: 0,
      formType: '',
      isAssignDialog: false,
      boardList: [],
      customBoardStyle: ''
    }
  },
  computed: {
    ...mapGetters([
      'userId',
      'tracker',
      'status',
      'priority',
      'forceTracker',
      'enableForceTracker',
      'selectedProject',
      'device'
      // 'selectedProjectId'
    ]),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    isParentIssueClosed() {
      if (Object.keys(this.parent).length <= 0) return false
      return this.parent.status.name === 'Closed'
    },
    dynamicAssigneeList() {
      const hasInactiveAssignee =
        this.form.assigned_to_id !== '' &&
        this.assigned_to.findIndex(item => item.id === this.form.assigned_to_id) === -1
      if (hasInactiveAssignee) {
        const inactiveAssignee = {
          name: `Disabled User (${this.form.assigned_to_id})`,
          id: this.form.assigned_to_id
        }
        const result = Object.assign([], this.assigned_to)
        result.push(inactiveAssignee)
        return result
      } else {
        return this.assigned_to
      }
    },
    unclosedChildrenIssue() {
      return this.childrenIssue.filter((item) => item.status.id !== 6)
    },
    currentStatus() {
      return this.dynamicStatusList.find(item => item.id === this.form.status_id)
    },
    currentAssignee() {
      return this.dynamicAssigneeList.find(item => item.id === this.form.assigned_to_id)
    },
    currentVersion() {
      return this.fixed_version.find(item => item.id === this.form.fixed_version_id)
    },
    selectionOptions() {
      return {
        assigned_to_id: { value: this.dynamicAssigneeList, title: 'Issue.assigned_to' },
        fixed_version_id: { value: this.fixed_version, title: 'Issue.fixed_version' },
        status_id: { value: this.dynamicStatusList, title: 'general.Status' },
        done_ratio: { title: 'Issue.DoneRatio' },
        start_date: { title: 'Issue.StartDate' },
        due_date: { title: 'Issue.EndDate' }
      }
    }
  },
  watch: {
    issueId(value) {
      if (value > 0) {
        this.getClosable()
      }
    },
    'form.project_id': {
      handler(newPId, oldPId) {
        if (newPId > 0) {
          this.onChangePId()
          this.getHasRelation()
        }
      }
    },
    'form.tags'() {
      if (this.form.project_id > 0 && this.$refs.tags) this.$refs.tags.getSearchTags()
    },
    isDrawerVisible() {
      this.drawerKey++
    }
  },
  created() {
    this.customBoardStyle = window.document.head.appendChild(
      document.createElement('style')
    )
  },
  mounted() {
    if (this.form.project_id > 0) {
      this.onChangePId()
    }
    this.watchForm()
  },
  methods: {
    watchForm() {
      const unwatchForm = this.$watch('form', (value) => {
        this.originForm.status_id = value.status_id
        this.originForm.assigned_to_id = value.assigned_to_id
        this.originForm.fixed_version_id = value.fixed_version_id
        this.originForm.estimated_hours = value.estimated_hours
        this.originForm.done_ratio = value.done_ratio
        this.originForm.start_date = value.start_date
        this.originForm.due_date = value.due_date
        unwatchForm()
      }, { deep: true })
    },
    async fetchData(pId) {
      this.isLoading = true
      const projectId = pId || this.form.project_id
      if (projectId) {
        await Promise.allSettled([
          getProjectAssignable(projectId)
        ]).then(res => {
          this.getAssignedTo(res)
        })
        await this.loadVersionList(pId)
      }
      if (this.issueId > 0) {
        await this.getClosable()
      } else {
        this.$set(this.$data, 'dynamicStatusList', this.status)
      }

      this.customBoardStyle.innerHTML = this.form.board.map(() =>
        `.tagStyle .el-tag {
          padding: 10px;
          color: #ffffff;
          background-color: ${variables['secondary']};
          border-radius: 12px;
        }`).join('')

      this.isLoading = false
    },
    getAssignedTo(res) {
      const [assigned_to] = res.map(item => item.value.data)
      this.assigned_to = [
        {
          name: this.$t('Issue.me'),
          login: '-Me-',
          id: this.userId,
          class: 'bg-yellow-100'
        }, ...assigned_to.user_list
      ]
    },
    async loadVersionList(pId) {
      const projectId = pId || this.form.project_id
      const params = { status: 'open,locked' }
      if (this.form.fixed_version_id) {
        params['force_id'] = this.form.fixed_version_id
      }
      const versionList = await getProjectVersion(projectId, params)
      this.fixed_version = versionList.data.versions
    },
    async getClosable() {
      let result = true
      try {
        if (this.issueId) {
          const checkClosable = await getCheckIssueClosable(this.issueId)
          result = checkClosable.data
          this.isIssueClosable = result
        }
      } catch (e) {
        // log
      }
      await this.getDynamicStatusList()
    },
    checkStartDate() {
      if (!this.form.start_date && this.form.due_date) {
        this.$confirm(
          this.$t('Issue.DueDateAloneWarning'),
          this.$t('general.Warning'), {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          })
          .then(() => {
            this.clearStartAndEndDate()
          })
          .catch(() => {
            this.form.start_date = this.originForm.start_date
            this.form.due_date = this.originForm.due_date
          })
        return
      }
      this.updateSelect('start_date')
    },
    checkDueDate() {
      if (!this.form.start_date) {
        this.form.due_date = this.originForm.due_date
        this.$message({
          type: 'warning',
          message: this.$t('Issue.DueDateWarning')
        })
        return
      }
      this.updateSelect('due_date')
    },
    getDynamicStatusList() {
      const deepStatus = cloneDeep(this.status)
      this.$set(this.$data, 'dynamicStatusList', deepStatus)
    },
    getSelectionLabel(item) {
      const visibleStatus = ['closed', 'locked']
      let result = (this.$te('Issue.' + item.name) ? this.$t('Issue.' + item.name) : item.name)
      if (item.hasOwnProperty('status') && visibleStatus.includes(item.status)) {
        result += ' (' + (this.$te('Issue.' + item.status) ? this.$t('Issue.' + item.status) : item.status) + ')'
      }
      return result
    },
    async getHasRelation() {
      await getHasRelation(this.form.project_id)
        .then((res) => {
          if (res.has_relations) {
            const selectedProject = this.allRelation.find((project) => project.id === this.form.project_id)
            if (selectedProject) delete selectedProject.type
            this.allRelation = []
            this.getAllRelation(selectedProject)
          }
          this.hasRelations = res.has_relations
        })
    },
    async getAllRelation(project) {
      const { display, id, name } = this.getIssueDetailSelectedProject(project)
      const selectedProject = { display, id, name }
      let allRelation = []
      await getAllRelation(this.form.project_id)
        .then((res) => {
          allRelation = res.data
          allRelation.unshift(selectedProject)
          this.allRelation = allRelation
        })
    },
    getIssueDetailSelectedProject(project) {
      if (project && this.hasSelectedProject(project)) return project
      return this.hasSelectedProject(this.issueProject)
        ? this.issueProject
        : this.selectedProject
    },
    hasSelectedProject(project) {
      return !(!project.id || !project.display || !project.name)
    },
    isIssueStatusChange(type) {
      this.isIssueEdited[type] = this.form[type] !== this.originForm[type]
      return this.isIssueEdited[type]
    },
    validateParentId() {
      const { parent_id, tracker_id } = this.form
      // const changeRequest = this.tracker.find((item) => (item.name === 'Change Request'))
      // if (this.form.tracker_id === changeRequest.id && !parent_id) {
      //   this.$message({
      //     type: 'warning',
      //     message: '尚未設定本變更議題之原由議題單(父議題），請先行設定後再存檔'
      //   })
      // } else
      const foundTracker = this.forceTracker.find((tracker) => tracker.id === tracker_id)
      if (this.enableForceTracker && foundTracker && !parent_id) {
        const tracker_name = this.$t(`Issue.${foundTracker.name}`)
        this.$message({
          type: 'warning',
          message: this.$t('Notify.NoParentIssueWarning', { tracker_name })
        })
        return false
      } else if (parent_id && this.issueId && parent_id === this.issueId) {
        this.$message({
          type: 'warning',
          message: 'The parent issue is the same issue.'
        })
        return false
      }
      return true
    },
    async clearStartAndEndDate() {
      this.isLoading = true
      this.form.start_date = ''
      this.form.due_date = ''
      const sendForm = new FormData()
      sendForm.append('start_date', this.form.start_date)
      sendForm.append('due_date', this.form.due_date)
      await updateIssue(this.issueId, sendForm).then(() => {
        this.$emit('update')
        this.originForm.start_date = this.form.start_date
        this.originForm.due_date = this.form.due_date
      })
      this.isLoading = false
    },
    updateSelect(type, forceClose = false) {
      if (type === 'project_id') return
      this.$refs.form.validate((valid) => {
        if (!valid) return
        this.updateIssue(type, forceClose)
      })
    },
    async updateIssue(type, forceClose) {
      if (type === 'tracker_id' && !this.validateParentId()) return
      this.isLoading = true
      const sendForm = new FormData()
      if (type === 'status_id') {
        if (this.form[type] === 6 && !this.isIssueClosable) {
          if (!forceClose) {
            this.isCloseIssueDialog = true
            return
          } else sendForm.append('close_all', true)
        } else if (this.form[type] === 1 && this.form.assigned_to_id && this.form.assigned_to_id !== '') {
          const confirm = await this.$confirm(this.$t('Issue.IssueHasAssigneeWarning'), this.$t('general.Warning'), {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }).then(() => {
            sendForm.append('assigned_to_id', '')
            return true
          }).catch(() => {
            this.handleCancelCloseIssue(type)
            this.isLoading = false
            return false
          })
          if (!confirm) return
        } else if (this.form[type] > 1 && this.form[type] < 6 && this.form.assigned_to_id === '') {
          this.isAssignDialog = true
          return
        }
      }
      if (!this.form[type]) {
        if (type === 'estimated_hours' || type === 'done_ratio') this.form[type] = 0
        if (type === 'start_date' || type === 'due_date') this.form[type] = ''
      }
      sendForm.append(type, this.form[type])
      if (type === 'assigned_to_id' && this.form[type] && this.form[type] !== '' && this.form.status_id === 1) {
        this.form.status_id = 2
        sendForm.append('status_id', this.form.status_id)
      }
      if (type === 'assigned_to_id' &&
        (!this.form[type] || this.form[type] === '') &&
        this.form.status_id > 1 && this.form.status_id !== 6
      ) {
        this.form.status_id = 1
        sendForm.append('status_id', this.form.status_id)
      }
      await updateIssue(this.issueId, sendForm).then(() => {
        this.$emit('update')
        this.originForm[type] = this.form[type]
      })
      this.isLoading = false
    },
    async updateAssignDialog() {
      const sendForm = new FormData()
      sendForm.append('status_id', this.form.status_id)
      sendForm.append('assigned_to_id', this.form.assigned_to_id)
      this.isAssignDialog = false
      await updateIssue(this.issueId, sendForm).then(() => {
        this.$emit('update')
        this.originForm.status_id = this.form.status_id
        this.originForm.assigned_to_id = this.form.assigned_to_id
        this.isLoading = false
      })
    },
    handleCancelAssignDialog() {
      this.form.status_id = this.originForm.status_id
      this.form.assigned_to_id = this.originForm.assigned_to_id
      this.isLoading = false
    },
    onChangePId() {
      this.fetchData()
      if (this.$refs.tags) this.$refs.tags.getSearchTags()
    },
    handleCloseAllIssue() {
      this.updateSelect('status_id', true)
    },
    handleCancelCloseIssue(formType) {
      this.form[formType] = this.originForm[formType]
      this.isLoading = false
    },
    handleClickFormMenu(item) {
      this.isDrawerVisible = !this.isDrawerVisible
      this.formType = item
    },
    async removeCustomBoard(boardId) {
      const itemId = this.issue.board.find((item) => item.id === boardId).item.id
      await removeBoardItemIssue(this.form.project_id, boardId, itemId, this.issueId)
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('Notify.Deleted'),
        type: 'success'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
@import 'src/styles/theme/mixin.scss';

::v-deep .el-form-item {
  margin-bottom: 10px;
}

.el-select-dropdown__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.round {
  width: 20px;
  height: 20px;
  line-height: 20px;
  border-radius: 50%;
  text-align: center;
  font-size: 8px;
  &.father {
    background-color: $danger;
  }
  &.son {
    background-color: #409eff;
  }
}

.el-button--success{
  @include css-prefix(transition, all .6s ease);
  color: $success;
  border: 1px solid #989898;
  background: none;
  &:hover {
    color: #fff;
    border: 1px solid $success;
    background: $success;
  }
}

.el-button--danger{
  @include css-prefix(transition, all .6s ease);
  color: $danger;
  border: 1px solid #989898;
  background: none;
  &:hover {
    color: #fff;
    border: 1px solid $danger;
    background: $danger;
  }
}

.action {
  margin: 0;
  &.el-button--mini {
    padding: 5px;
  }
}
.drawer {
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }
  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    padding: 10px;
  }
  .title {
    ::v-deep .el-divider--vertical {
      width: 6px;
      margin: 0;
      border-radius: 3px 0 0 3px;
      height: 18px;
      background-color: $warning !important;
    }
    .text {
      font-size: 15px;
      font-weight: bold;
      color: #72767b;
      vertical-align: middle;
    }
  }

  .container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }
  .container {
    padding: 10px;
    max-width: 768px;
    max-height: 80vh;
    overflow-y: auto;
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    ::v-deep .el-divider {
      background-color: #EBEEF5;
    }
    ::v-deep .el-card__body, .el-main {
      padding: 10px;
    }
  }
}
</style>
