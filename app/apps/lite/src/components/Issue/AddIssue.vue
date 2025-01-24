<template>
  <el-form
    ref="issueForm"
    :loading="isLoading"
    :model="issueForm"
    :rules="issueFormRules"
    class="custom-list"
  >
    <div v-if="!isCreate" class="text-base font-bold text-center">
      {{ $t('Issue.ParentIssue') }}
      <el-tooltip
        :content="$t('Issue.ImportParentIssueData')"
        placement="bottom"
      >
        <em
          class="el-icon-document-copy success table-button"
          @click="$emit('import')"
        ></em>
      </el-tooltip>
      : {{ parentSubject }}
    </div>
    <el-row>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('Issue.name')" prop="subject">
          <el-input
            id="input-name"
            v-model="issueForm.subject"
            :placeholder="$t('general.PleaseInput')"
          />
        </el-form-item>
      </el-col>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('Issue.assigned')" prop="assigned_id">
          <el-select
            id="input-assignee"
            v-model="issueForm.assigned_id"
            clearable
            filterable
            style="width: 100%"
            @change="handleAssigneeChange"
          >
            <el-option
              v-for="item in assigned"
              :key="item.username"
              :class="item.class"
              :label="`${item.full_name}（${item.username}）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('Issue.version')" prop="version_id">
          <el-select
            id="input-version"
            v-model="issueForm.version_id"
            clearable
            filterable
            style="width: 100%"
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
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('Issue.tracker')" prop="tracker_id">
          <el-select
            id="input-type"
            v-model="issueForm.tracker_id"
            style="width: 100%"
          >
            <el-option
              v-for="item in getTracker"
              :key="item.id"
              :label="$t('Issue.' + item.name)"
              :value="item.id"
            >
              <Tracker :name="$t(`Issue.${item.name}`)" :type="item.name" />
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('general.Status')" prop="status_id">
          <el-select v-model="issueForm.status_id" style="width: 100%">
            <el-option
              v-for="item in status"
              :key="item.id"
              :label="$t('Issue.' + item.name)"
              :value="item.id"
            >
              <Status :name="$t(`Issue.${item.name}`)" :type="item.name" />
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('Issue.Priority')" prop="priority_id">
          <el-select v-model="issueForm.priority_id" style="width: 100%">
            <el-option
              v-for="item in priority"
              :key="item.id"
              :label="$t('Issue.' + item.name)"
              :value="item.id"
            >
              <Priority :name="$t(`Issue.${item.name}`)" :type="item.name" />
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :md="12" :span="24">
        <Tags :form.sync="issueForm" />
      </el-col>
      <el-col :md="6" :span="24">
        <el-form-item :label="$t('Issue.Estimate')" prop="estimated_hours">
          <el-input-number
            id="input-estimate"
            v-model="issueForm.estimated_hours"
            label="please input hours"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :md="6" :span="24">
        <el-form-item :label="$t('Issue.DoneRatio')" prop="done_ratio">
          <el-input-number
            id="input-done-ratio"
            v-model="issueForm.done_ratio"
            :max="100"
            :min="0"
            label="please input numbers"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('Issue.StartDate')" prop="start_date">
          <el-date-picker
            id="input-start-date"
            v-model="issueForm.start_date"
            :placeholder="$t('Issue.SelectDate')"
            style="width: 100%"
            type="date"
            value-format="yyyy-MM-dd"
            @change="checkDueDate"
          />
        </el-form-item>
      </el-col>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('Issue.EndDate')" prop="due_date">
          <el-date-picker
            id="input-end-date"
            v-model="issueForm.due_date"
            :picker-options="pickerOptions(issueForm.start_date)"
            :placeholder="$t('Issue.SelectDate')"
            style="width: 100%"
            type="date"
            value-format="yyyy-MM-dd"
            @change="clearDueDate"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('File.Upload')" prop="upload">
          <el-upload
            ref="upload"
            :auto-upload="false"
            :on-change="handleChange"
            action=""
            drag
            multiple
          >
            <div>
              <el-button class="mb-2" size="small" plain>
                {{ $t('File.ChooseFile') }}
              </el-button>
              <div class="el-upload__text">
                {{ $t('File.DragFilesHere') }}
              </div>
              <div class="text-xs text-gray-400 px-12">
                <div>{{ $t('File.MaxFileSize') }}: {{ fileSizeLimit }}</div>
                <div>
                  {{ $t('File.AllowedFileTypes') }}: {{ fileTypeLimit }}
                </div>
              </div>
            </div>
          </el-upload>
          <div class="text-xs mt-2">
            *{{ $t('File.UploadWarning') }}: {{ specialSymbols }}
          </div>
        </el-form-item>
      </el-col>
      <el-col :md="12" :span="24">
        <el-form-item :label="$t('general.Description')" prop="description">
          <Editor
            ref="mdEditor"
            :options="{
              hideModeSwitch: true,
              language: language,
              toolbarItems: [
                ['heading', 'bold', 'italic', 'strike'],
                ['image', 'link']
              ]
            }"
            height="150px"
            initial-edit-type="wysiwyg"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script>
import {
  createTag,
  getProjectUserList,
  getProjectVersion
} from '@/api_v3/projects'
import {
  containSpecialChar,
  fileSizeToMB,
  isAllowedTypes
} from '@/utils/extension'
import { getLocalTime } from '@shared/utils/handleTime'
import '@toast-ui/editor/dist/i18n/zh-tw'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import '@toast-ui/editor/dist/toastui-editor.css'
import { Editor } from '@toast-ui/vue-editor'
import { mapGetters } from 'vuex'
import Priority from './Priority'
import Status from './Status'
import Tags from './Tags'
import Tracker from './Tracker'

const getFormTemplate = () => ({
  subject: '',
  description: '',
  priority_id: 2,
  tracker_id: '',
  status_id: 1,
  version_id: '',
  assigned_id: '',
  start_date: getLocalTime(Date.now(), 'YYYY-MM-DD'),
  due_date: '',
  done_ratio: '',
  estimated_hours: '',
  parent_id: '',
  tags: []
})

export default {
  name: 'AddIssue',
  components: {
    Tracker,
    Status,
    Priority,
    Tags,
    Editor
  },
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: [Number, String],
      default: 0
    },
    parentSubject: {
      type: String,
      default: ''
    },
    parentId: {
      type: Number,
      default: 0
    },
    prefill: {
      type: Object,
      default: () => ({})
    },
    saveData: {
      type: Function,
      default: () => ({})
    },
    importFrom: {
      type: String,
      default: null
    },
    isCreate: {
      type: Boolean,
      default: false
    },
    trackerList: {
      type: Array,
      default: () => []
    },
    itemId: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    const validateAssignedTo = (_rule, value, callback) => {
      if ((!value || value === '') && this.issueForm.status_id >= 2) {
        callback(new Error('This Status need a assignee.'))
      } else {
        callback()
      }
    }
    return {
      isLoading: false,
      assigned: [],
      version: [],
      issueForm: getFormTemplate(),
      issueFormRules: {
        subject: [
          {
            required: true,
            message: 'Please input subject',
            trigger: 'blur'
          }
        ],
        assigned_id: [{ validator: validateAssignedTo, trigger: 'blur' }],
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
      uploadFileList: [],
      pickerOptions(startDate) {
        return {
          disabledDate(time) {
            const start_date = new Date(startDate).setHours(0)
            return time.getTime() < new Date(start_date).getTime()
          }
        }
      },
      specialSymbols: '\ / : * ? " < > | # { } % ~ &',
      tagsString: ''
    }
  },
  computed: {
    ...mapGetters([
      'language',
      'userId',
      'status',
      'priority',
      'groupBy',
      'issueFilter',
      'strictTracker',
      'tracker',
      'selectedProject',
      'fileSizeLimit',
      'fileTypeLimit'
    ]),
    getTracker() {
      if (this.trackerList.length > 0) return this.trackerList
      else return this.tracker
      // else if (this.parentId) return this.tracker
      // else return this.strictTracker
    }
  },
  watch: {
    projectId() {
      this.fetchData()
    },
    prefill: {
      deep: true,
      handler() {
        this.setFilterValue()
      }
    },
    issueFilter: {
      deep: true,
      handler() {
        this.setFilterValue()
      }
    }
  },
  mounted() {
    this.fetchData()
    this.setFilterValue()
  },
  methods: {
    async fetchData() {
      this.isLoading = true
      if (this.projectId) {
        await Promise.allSettled([
          getProjectUserList(this.projectId),
          getProjectVersion(this.projectId, {
            all: true,
            status: 'open,locked'
          })
        ]).then((res) => {
          const [assigned, version] = res.map((item) => item.value.data)
          this.assigned = [
            {
              full_name: this.$t('Issue.me'),
              username: '-Me-',
              id: this.userId,
              class: 'bg-yellow-100'
            },
            ...assigned
          ]
          this.version = version
        })
      }
      if (this.issueId > 0) {
        await this.getClosable()
      }
      this.isLoading = false
    },
    setFilterValue() {
      if (this.importFrom && this.issueFilter[this.importFrom]) {
        Object.keys(this.issueFilter[this.importFrom]).forEach((item) => {
          if (
            this.issueFilter[this.importFrom][item] !== 'null' &&
            !!this.issueFilter[this.importFrom][item] &&
            this.issueFilter[this.importFrom][item] !== ''
          ) {
            if (
              item === 'tags' ||
              item === 'start_date' ||
              item === 'due_date'
            ) {
              this.$set(
                this.issueForm,
                item,
                this.issueFilter[this.importFrom][item]
              )
            } else {
              this.$set(
                this.issueForm,
                item + '_id',
                this.issueFilter[this.importFrom][item]
              )
            }
          }
        })
        let checkQuickAddIssueForm = ['tracker_id', 'subject']
        if (this.importFrom === 'board') {
          checkQuickAddIssueForm = ['tracker_id', 'subject', 'assigned_id']
          checkQuickAddIssueForm.push(this.groupBy.dimension + '_id')
        }
        checkQuickAddIssueForm.forEach((item) => {
          this.issueForm[item] = this.prefill[item]
        })
      } else {
        this.handleImport()
      }
    },
    isReplaceTrackerId() {
      const trackerIds = this.getTracker.map((item) => item.id)
      const isHasTracker = trackerIds.includes(this.issueForm.tracker_id)
      if (!isHasTracker) {
        this.issueForm.tracker_id = trackerIds[0]
      }
    },
    handleImport() {
      Object.keys(this.prefill).forEach((item) => {
        this.issueForm[item] = this.prefill[item]
      })
      if (this.issueForm.tracker_id) this.isReplaceTrackerId()
      if (this.issueForm.description && this.$refs.mdEditor) {
        this.$nextTick(() => {
          this.$refs.mdEditor.invoke('setMarkdown', this.issueForm.description)
        })
      }
    },
    handleClose() {
      if (this.dialogVisible) {
        this.uploadFileList = []
        this.$nextTick(() => {
          this.$refs['upload'].clearFiles()
          this.$refs['issueForm'].resetFields()
        })
      }
      this.$emit('loading', false)
      this.$emit('add-topic-visible', false)
    },
    handleSave() {
      this.handleUpdateTags()
    },
    async handleUpdateTags() {
      const tags = this.issueForm.tags
      const tagsLength = tags.length
      const addTags = []
      const originTags = []
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          if (typeof tag === 'string') addTags.push(tag)
          else if (typeof tag === 'number') originTags.push(tag)
        })
      }
      if (addTags.length > 0) {
        await this.handleAddProjectTags(addTags, originTags, tagsLength)
      } else this.tagsArrayToString(originTags, tagsLength)
    },
    async handleAddProjectTags(addTags, originTags, tagsLength) {
      addTags.map(async (tag) => {
        const tagValue = tag.split('__')[1]
        const sendData = {
          name: tagValue
        }
        await this.createTag(sendData, originTags, tagsLength)
      })
    },
    async createTag(sendData, originTags, tagsLength) {
      await createTag(this.projectId, sendData).then(async (res) => {
        const id = res.data.id
        originTags.push(id)
        this.tagsArrayToString(originTags, tagsLength)
      })
    },
    tagsArrayToString(tags, tagsLength) {
      this.tagsString = tags.length > 0 ? tags.join() : null
      if (this.tagsString === null) this.issueForm.tags = ''
      else this.issueForm.tags = this.tagsString
      if (tags.length === tagsLength) this.save()
    },
    save() {
      let result = false
      this.$refs['issueForm'].validate(async (valid) => {
        if (valid) {
          this.$emit('loading', true)
          // deep copy & remove field with empty value
          const data = JSON.parse(JSON.stringify(this.issueForm))
          Object.keys(data).forEach((item) => {
            if (data[item] === '' || data[item] === 'null' || !data[item]) {
              delete data[item]
            }
          })

          const form = {}
          form['tags_list'] = data.tags
          delete data.tags
          form['project_id'] = this.projectId
          if (this.$refs.mdEditor.invoke('getMarkdown')) {
            form['description'] = this.$refs.mdEditor.invoke('getMarkdown')
          }
          if (this.parentId) form['parent_id'] = this.parentId
          Object.keys(data).forEach((objKey) => {
            form[objKey] = data[objKey]
          })
          if (this.uploadFileList.length > 0) {
            this.uploadFileList.forEach((list) => {
              form['upload_files'] = list.raw
            })
          }
          if (this.itemId) {
            await this.saveData(form, this.itemId)
          } else {
            await this.saveData(form)
          }
          result = true
          this.handleClose()
        } else {
          return false
        }
      })
      if (this.parentId) this.$emit('has-children')
      return result
    },
    async handleChange(file, fileList) {
      const { raw, size, name } = file
      if (!isAllowedTypes(raw.type)) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.UnsupportedFileFormat'),
          type: 'warning'
        })
        this.$refs['upload'].clearFiles()
      } else if (
        fileSizeToMB(size) > Number(this.fileSizeLimit.replace(/\D/g, ''))
      ) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.FileSizeLimit', {
            size: this.fileSizeLimit
          }),
          type: 'warning'
        })
        this.$refs['upload'].clearFiles()
      } else if (containSpecialChar(name)) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.FileNameLimit'),
          type: 'warning'
        })
        this.$refs['upload'].clearFiles()
      } else {
        this.uploadFileList = fileList
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
      return result
    },
    clearDueDate(dueDate) {
      if (dueDate === null) this.issueForm.due_date = ''
    },
    checkDueDate(startDate) {
      if (startDate === null) this.issueForm.start_date = ''
      if (new Date(startDate).getTime() >= new Date(this.issueForm.due_date)) {
        this.issueForm.due_date = ''
      }
    },
    handleAssigneeChange() {
      const activeStatusId = this.status.find(
        (status) => status.name === 'Active'
      ).id
      const assignedStatusId = this.status.find(
        (status) => status.name === 'Assigned'
      ).id
      if (this.issueForm.status_id === 1) {
        this.issueForm.status_id = assignedStatusId
      }
      if (
        this.issueForm.status_id === assignedStatusId &&
        this.issueForm.assigned_id === ''
      ) {
        this.issueForm.status_id = activeStatusId
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

::v-deep .el-row {
  font-size: 0;
}

::v-deep .el-col {
  float: none;
  padding: 0 10px;
  vertical-align: top;
  display: inline-block;

  @include tablet {
    width: 100%;
    display: block;
  }
}

::v-deep .el-form-item__label {
  float: none;
  text-align: left;
}
</style>
