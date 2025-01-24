<template>
  <div>
    <div v-if="device === 'desktop'">
      <el-form
        ref="form"
        v-loading="isLoading"
        :disabled="isButtonDisabled"
        :element-loading-text="$t('Loading')"
        :model="form"
        :rules="issueFormRules"
        label-position="top"
      >
        <el-row :gutter="10">
          <el-col v-if="hasRelations" :span="isFromBoard ? 8 : 24">
            <el-form-item :label="$t('Project.Project')">
              <el-select-tree
                v-model="form.project_id"
                :data="allRelation"
                :default-expanded-keys="[form.project_id]"
                :props="{
                  value: 'id',
                  label: 'display_name',
                  children: 'child'
                }"
                check-strictly
                filterable
                node-key="id"
                placeholder="Please select"
                popper-class="max-w-[100px]"
                style="width: 100%"
                @change="updateSelect('project_id')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <Tags
              ref="tags"
              :data-loaded="dataLoaded"
              :form.sync="form"
              :is-form-collapse-open="isFormCollapseOpen"
              :issue-id="issueId"
              :loading.sync="isLoading"
              @update="$emit('update')"
            />
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item :label="$t('Issue.version')" prop="version_id">
              <el-select
                v-model="form.version_id"
                :placeholder="$t('RuleMsg.PleaseSelect')"
                clearable
                style="width: 100%"
                @change="updateSelect('version_id')"
              >
                <el-option
                  v-for="item in version"
                  :key="item.id"
                  :disabled="item.status !== 'open'"
                  :label="getSelectionLabel(item)"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item :label="$t('general.Status')" prop="status_id">
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
            <el-form-item :label="$t('Issue.tracker')" prop="tracker_id">
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
            <el-form-item :label="$t('Issue.assigned')" prop="assigned_id">
              <el-select
                v-model="form.assigned_id"
                :placeholder="$t('RuleMsg.PleaseSelect')"
                clearable
                filterable
                style="width: 100%"
                @change="updateSelect('assigned_id')"
              >
                <el-option
                  v-for="item in dynamicAssigneeList"
                  :key="`${item.id}_${item.full_name}`"
                  :class="item.class"
                  :label="item.full_name + ' (' + item.username + ')'"
                  :value="item.id"
                >
                  {{ item.full_name }} ({{ item.username }})
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="!isLite" :span="isFromBoard ? 8 : 24">
            <el-form-item :label="$t('Issue.CustomBoard')" prop="board">
              <el-select
                v-model="form.boards"
                :placeholder="$t('general.NoData')"
                class="tagStyle"
                collapse-tags
                filterable
                multiple
                style="width: 100%"
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
            <el-form-item :label="$t('Issue.priority')" prop="priority_id">
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
            <el-form-item prop="total_spent_hours">
              <template slot="label">
                <span>{{ $t('Issue.TotalSpentHours') }}</span>
                <el-tooltip content="Add Spent Time" placement="top">
                  <el-button
                    class="action"
                    icon="el-icon-plus"
                    size="mini"
                    type="success"
                    @click="isSpentTimeVisible = true"
                  />
                </el-tooltip>
              </template>
              <el-input
                v-model="form.total_spent_hours"
                disabled
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item prop="estimated_hours">
              <template slot="label">
                {{ $t('Issue.Estimate') }}
                <span v-if="isIssueStatusChange('estimated_hours')">
                  <el-button
                    class="action"
                    icon="el-icon-check"
                    size="mini"
                    type="success"
                    @click="updateSelect('estimated_hours')"
                  />
                  <el-button
                    class="action"
                    icon="el-icon-close"
                    size="mini"
                    type="danger"
                    @click="handleCancelCloseIssue('estimated_hours')"
                  />
                </span>
              </template>
              <el-input-number
                v-model="form.estimated_hours"
                :max="100"
                :min="0"
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
                    icon="el-icon-check"
                    size="mini"
                    type="success"
                    @click="updateSelect('done_ratio')"
                  />
                  <el-button
                    class="action"
                    icon="el-icon-close"
                    size="mini"
                    type="danger"
                    @click="handleCancelCloseIssue('done_ratio')"
                  />
                </span>
              </template>
              <el-input-number
                v-model="form.done_ratio"
                :disabled="childrenIssue.length > 0"
                :max="100"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item :label="$t('Issue.StartDate')" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                :disabled="childrenIssue.length > 0"
                :picker-options="startDateOptions(form.due_date)"
                :placeholder="$t('RuleMsg.PleaseSelect')"
                style="width: 100%"
                type="date"
                value-format="yyyy-MM-dd"
                @change="checkStartDate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="isFromBoard ? 8 : 24">
            <el-form-item :label="$t('Issue.EndDate')" prop="due_date">
              <el-date-picker
                v-model="form.due_date"
                :disabled="childrenIssue.length > 0"
                :picker-options="dueDateOptions(form.start_date)"
                :placeholder="$t('RuleMsg.PleaseSelect')"
                style="width: 100%"
                type="date"
                value-format="yyyy-MM-dd"
                @change="checkDueDate"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div v-else class="mobile">
      <el-card @click.native="handleClickFormMenu('status_id')">
        <el-row justify="space-between" type="flex">
          <span>
            <em class="ri-notification-badge-fill align-middle"></em>
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
            <em class="el-icon-arrow-right align-middle"></em>
          </span>
        </el-row>
      </el-card>
      <el-card @click.native="handleClickFormMenu('assigned_id')">
        <el-row justify="space-between" type="flex">
          <span>
            <em class="ri-user-fill align-middle"></em>
            <span class="text-sm font-bold">{{ $t('Issue.assigned') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">{{
              currentAssignee?.full_name
            }}</span>
            <em class="el-icon-arrow-right align-middle"></em>
          </span>
        </el-row>
      </el-card>
      <el-card @click.native="handleClickFormMenu('version_id')">
        <el-row justify="space-between" type="flex">
          <span>
            <em class="ri-rocket-2-fill align-middle"></em>
            <span class="text-sm font-bold">{{ $t('Issue.version') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">
              {{
                currentVersion
                  ? getSelectionLabel(currentVersion)
                  : $t('Issue.VersionUndecided')
              }}
            </span>
            <em class="el-icon-arrow-right align-middle"></em>
          </span>
        </el-row>
      </el-card>
      <el-card
        v-if="!isLite"
        @click.native="handleClickFormMenu('spent_hours')"
      >
        <el-row justify="space-between" type="flex">
          <span>
            <em class="ri-time-line align-middle"></em>
            <span class="text-sm font-bold">{{
              $t('Issue.TotalSpentHours')
            }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">
              {{ form.total_spent_hours || '-' }} {{ $t('Issue.Hours') }}
            </span>
            <em class="el-icon-arrow-right align-middle"></em>
          </span>
        </el-row>
      </el-card>
      <el-card
        v-if="childrenIssue.length === 0"
        @click.native="handleClickFormMenu('done_ratio')"
      >
        <el-row justify="space-between" type="flex">
          <span>
            <em class="ri-percent-fill align-middle"></em>
            <span class="text-sm font-bold">{{ $t('Issue.DoneRatio') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">{{ form.done_ratio }}%</span>
            <em class="el-icon-arrow-right align-middle"></em>
          </span>
        </el-row>
      </el-card>
      <el-card
        v-if="childrenIssue.length === 0"
        @click.native="handleClickFormMenu('start_date')"
      >
        <el-row justify="space-between" type="flex">
          <span>
            <em class="ri-calendar-event-fill align-middle"></em>
            <span class="text-sm font-bold">{{ $t('Issue.StartDate') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">{{ form.start_date }}</span>
            <em class="el-icon-arrow-right align-middle"></em>
          </span>
        </el-row>
      </el-card>
      <el-card
        v-if="childrenIssue.length === 0"
        @click.native="handleClickFormMenu('due_date')"
      >
        <el-row justify="space-between" type="flex">
          <span>
            <em class="ri-calendar-event-fill align-middle"></em>
            <span class="text-sm font-bold">{{ $t('Issue.EndDate') }}</span>
          </span>
          <span>
            <span class="text-sm align-middle mx-1">{{ form.due_date }}</span>
            <em class="el-icon-arrow-right align-middle"></em>
          </span>
        </el-row>
      </el-card>
      <el-drawer
        v-loading="isLoading"
        :visible.sync="isDrawerVisible"
        class="drawer"
        destroy-on-close
        direction="btt"
        size="auto"
        @close="handleCancelCloseIssue(formType)"
      >
        <div slot="title" class="title">
          <span>
            <el-divider direction="vertical" />
            <span class="text">{{
              $t(selectionOptions[formType]?.title)
            }}</span>
          </span>
        </div>
        <div class="container">
          <el-card shadow="never">
            <IssueFormDrawer
              :form-type="formType"
              :form.sync="form"
              :is-button-disabled="isButtonDisabled"
              :issue-form-rules="issueFormRules"
              :options="selectionOptions"
            />
          </el-card>
        </div>
      </el-drawer>
    </div>
    <el-dialog
      :title="$t('Issue.IssueNeedAssigneeWarning')"
      :visible.sync="isAssignDialog"
      append-to-body
      destroy-on-close
      width="30%"
      @close="handleCancelAssignDialog()"
    >
      <el-select
        v-model="form.assigned_id"
        :placeholder="$t('RuleMsg.PleaseSelect')"
        clearable
        filterable
        style="width: 100%"
        @change="updateAssignDialog()"
      >
        <el-option
          v-for="item in dynamicAssigneeList"
          :key="item.username"
          :class="item.class"
          :label="item.full_name + ' (' + item.username + ')'"
          :value="item.id"
        >
          {{ item.full_name }} ({{ item.username }})
        </el-option>
      </el-select>
    </el-dialog>
    <SubIssueDialog
      :is-issue-dialog.sync="isCloseIssueDialog"
      :issue="issue"
      @handleCancel="handleCancelCloseIssue('status_id')"
      @handleClose="handleCloseAllIssue"
    />
    <SpendingTimeDialog
      :activity-list="activityList"
      :is-spent-time-visible.sync="isSpentTimeVisible"
      :issue.sync="issue"
      @update="handleSpendHoursUpdate"
    />
  </div>
</template>

<script>
import { removeBoardItemIssue } from '@/api_v2/issueBoard'
import variables from '@/styles/theme/variables.module.scss'
import {
  getHasProjectRelation,
  getProjectAllRelation,
  getProjectUserList,
  getProjectVersion
} from '@/api_v3/projects'
import { checkIssueClosable, updateIssue } from '@/api_v3/issues'
import { cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'
import ElSelectTree from 'el-select-tree'

export default {
  name: 'IssueForm',
  components: {
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker'),
    Priority: () => import('@/components/Issue/Priority'),
    Tags: () => import('@/components/Issue/Tags'),
    SubIssueDialog: () => import('./SubIssueDialog'),
    IssueFormDrawer: () => import('./IssueFormDrawer'),
    SpendingTimeDialog: () => import('./SpentTimeDialog'),
    ElSelectTree
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
        display_name: '',
        id: ''
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
    },
    activityList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      issueFormRules: {
        subject: [
          {
            required: true,
            message: 'Please input subject',
            trigger: 'blur'
          }
        ],
        // parent_id: [{ validator: validateParentId, trigger: 'blur' }],
        // assigned_id: [{ validator: validateAssignedTo, trigger: 'blur' }],
        tracker_id: [
          {
            required: true,
            message: 'Please select type',
            trigger: 'blur'
          }
        ],
        status_id: [
          {
            required: true,
            message: 'Please select status',
            trigger: 'blur'
          }
        ],
        priority_id: [
          {
            required: true,
            message: 'Please select priority',
            trigger: 'blur'
          }
        ]
      },
      assigned: [],
      version: [],
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
        assigned_id: '',
        version_id: '',
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
      customBoardStyle: '',
      isSpentTimeVisible: false
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
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    isParentIssueClosed() {
      if (Object.keys(this.parent).length <= 0) return false
      return this.parent.status.name === 'Closed'
    },
    dynamicAssigneeList() {
      const hasInactiveAssignee =
        this.form.assigned_id !== '' &&
        this.assigned.findIndex((item) => item.id === this.form.assigned_id) ===
          -1
      if (hasInactiveAssignee) {
        const inactiveAssignee = {
          name: `Disabled User (${this.form.assigned_id})`,
          id: this.form.assigned_id
        }
        const result = Object.assign([], this.assigned)
        result.push(inactiveAssignee)
        return result
      } else {
        return this.assigned
      }
    },
    unclosedChildrenIssue() {
      return this.childrenIssue.filter((item) => item.status.id !== 6)
    },
    currentStatus() {
      return this.dynamicStatusList.find(
        (item) => item.id === this.form.status_id
      )
    },
    currentAssignee() {
      return this.dynamicAssigneeList.find(
        (item) => item.id === this.form.assigned_id
      )
    },
    currentVersion() {
      return this.version.find((item) => item.id === this.form.version_id)
    },
    selectionOptions() {
      return {
        assigned_id: {
          value: this.dynamicAssigneeList,
          title: 'Issue.assigned'
        },
        version_id: {
          value: this.version,
          title: 'Issue.version'
        },
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
      handler(newPId) {
        if (newPId) {
          this.onChangePId()
          this.getHasRelation()
        }
      }
    },

    'form.tags'() {
      if (this.form.project_id > 0 && this.$refs.tags) {
        this.$refs.tags.getSearchTags()
      }
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
    if (this.form.project_id) {
      this.onChangePId()
    }
    this.watchForm()
  },
  methods: {
    watchForm() {
      const unwatchForm = this.$watch(
        'form',
        (value) => {
          this.originForm.status_id = value.status_id
          this.originForm.assigned_id = value.assigned_id
          this.originForm.version_id = value.version_id
          this.originForm.estimated_hours = value.estimated_hours
          this.originForm.done_ratio = value.done_ratio
          this.originForm.start_date = value.start_date
          this.originForm.due_date = value.due_date
          unwatchForm()
        },
        { deep: true }
      )
    },
    async fetchData(pId) {
      this.isLoading = true
      const projectId = pId || this.form.project_id
      if (projectId) {
        await Promise.allSettled([getProjectUserList(projectId)]).then(
          (res) => {
            this.getAssignedTo(res)
          }
        )
        await this.loadVersionList(pId)
      }
      if (this.issueId > 0) {
        await this.getClosable()
      } else {
        this.$set(this.$data, 'dynamicStatusList', this.status)
      }

      this.customBoardStyle.innerHTML = this.form.boards
        .map(
          () =>
            `.tagStyle .el-tag {
          padding: 10px;
          color: #ffffff;
          background-color: ${variables['secondary']};
          border-radius: 12px;
        }`
        )
        .join('')

      this.isLoading = false
    },
    getAssignedTo(res) {
      const [assigned] = res.map((item) => item.value.data)
      this.assigned = [
        {
          full_name: this.$t('Issue.me'),
          username: '-Me-',
          id: this.userId,
          class: 'bg-yellow-100'
        },
        ...assigned
      ]
    },
    async loadVersionList(pId) {
      const projectId = pId || this.form.project_id
      const params = { all: true, status: 'open,locked' }
      if (this.form.version_id) {
        params['force_id'] = this.form.version_id
      }
      const versionList = await getProjectVersion(projectId, params)
      this.version = versionList.data
    },
    async getClosable() {
      let result = true
      try {
        if (this.issueId) {
          const checkClosable = await checkIssueClosable(this.issueId)
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
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }
        )
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
      return result
    },
    async getHasRelation() {
      await getHasProjectRelation(this.form.project_id).then(async (res) => {
        if (res.data.has_relations) {
          this.allRelation = []
          await this.getAllRelation()
        }
        this.hasRelations = res.data.has_relations
      })
    },
    async getAllRelation() {
      let allRelation = []
      await getProjectAllRelation(this.form.project_id).then((res) => {
        allRelation = res.data
        this.allRelation = [allRelation]
      })
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
      const foundTracker = this.forceTracker.find(
        (tracker) => tracker.id === tracker_id
      )
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
      const sendData = {}
      sendData['start_date'] = this.form.start_date
      sendData['due_date'] = this.form.due_date
      await updateIssue(this.issueId, sendData).then(() => {
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
      const sendData = {}
      if (type === 'status_id') {
        if (this.form[type] === 6 && !this.isIssueClosable) {
          if (!forceClose) {
            this.isCloseIssueDialog = true
            return
          } else {
            // sendForm.append('close_all', true)
          }
        } else if (
          this.form[type] === 1 &&
          this.form.assigned_id &&
          this.form.assigned_id !== ''
        ) {
          const confirm = await this.$confirm(
            this.$t('Issue.IssueHasAssigneeWarning'),
            this.$t('general.Warning'),
            {
              confirmButtonText: this.$t('general.Confirm'),
              cancelButtonText: this.$t('general.Cancel'),
              type: 'warning'
            }
          )
            .then(() => {
              sendData['assigned_id'] = ''
              return true
            })
            .catch(() => {
              this.handleCancelCloseIssue(type)
              this.isLoading = false
              return false
            })
          if (!confirm) return
        } else if (
          this.form[type] > 1 &&
          this.form[type] < 6 &&
          this.form.assigned_id === ''
        ) {
          this.isAssignDialog = true
          return
        }
      }
      if (!this.form[type]) {
        if (type === 'estimated_hours' || type === 'done_ratio') {
          this.form[type] = 0
        }
        if (type === 'start_date' || type === 'due_date') this.form[type] = ''
      }
      sendData[type] = this.form[type]
      if (
        type === 'assigned_id' &&
        this.form[type] &&
        this.form[type] !== '' &&
        this.form.status_id === 1
      ) {
        this.form.status_id = 2
        sendData['status_id'] = this.form.status_id
      }
      if (
        type === 'assigned_id' &&
        (!this.form[type] || this.form[type] === '') &&
        this.form.status_id > 1 &&
        this.form.status_id !== 6
      ) {
        this.form.status_id = 1
        sendData['status_id'] = this.form.status_id
      }
      if (
        (type === 'version_id' || type === 'assigned_id') &&
        !this.form[type]
      ) {
        sendData[type] = 'null'
      }
      await updateIssue(this.issueId, sendData).then(() => {
        this.$emit('update')
        this.originForm[type] = this.form[type]
      })
      this.isLoading = false
    },
    async updateAssignDialog() {
      const sendData = {}
      sendData['status_id'] = this.form.status_id
      sendData['assigned_id'] = this.form.assigned_id
      this.isAssignDialog = false
      await updateIssue(this.issueId, sendData).then(() => {
        this.$emit('update')
        this.originForm.status_id = this.form.status_id
        this.originForm.assigned_id = this.form.assigned_id
        this.isLoading = false
      })
    },
    handleCancelAssignDialog() {
      this.form.status_id = this.originForm.status_id
      this.form.assigned_id = this.originForm.assigned_id
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
      if (item === 'spent_hours') {
        this.isSpentTimeVisible = true
        return
      }
      this.isDrawerVisible = !this.isDrawerVisible
      this.formType = item
    },
    async removeCustomBoard(boardId) {
      const itemId = this.issue.board.find((item) => item.id === boardId).item
        .id
      await removeBoardItemIssue(
        this.form.project_id,
        boardId,
        itemId,
        this.issueId
      )
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('Notify.Deleted'),
        type: 'success'
      })
    },
    handleSpendHoursUpdate() {
      this.$nextTick(() => {
        this.$emit('update-spent-time')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
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

.el-button--success {
  @include css-prefix(transition, all 0.6s ease);
  color: $success;
  border: 1px solid #989898;
  background: none;

  &:hover {
    color: #fff;
    border: 1px solid $success;
    background: $success;
  }
}

.el-button--danger {
  @include css-prefix(transition, all 0.6s ease);
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
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    ::v-deep .el-divider {
      background-color: #ebeef5;
    }

    ::v-deep .el-card__body,
    .el-main {
      padding: 10px;
    }
  }
}
</style>
