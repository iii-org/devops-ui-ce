<template>
  <el-row>
    <el-col>
      <el-form ref="issueForm" :model="form" :rules="formRules">
        <el-form-item prop="tracker_id">
          <el-select
            v-model="form.tracker_id"
            :placeholder="$t('Issue.SelectType')"
            style="width: 100%"
          >
            <el-option
              v-for="option in tracker"
              :key="option.id"
              :label="$t('Issue.' + option.name)"
              :value="option.id"
            >
              <Tracker :name="$t(`Issue.${option.name}`)" :type="option.name" />
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="subject">
          <el-input v-model="form.subject" :placeholder="$t('Issue.name')" />
        </el-form-item>
        <el-form-item prop="assigned_id">
          <el-select
            v-model="form.assigned_id"
            :placeholder="$t('Issue.SelectMember')"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in assigned"
              :key="item.username"
              :class="item.class"
              :label="`${item.username} (${item.first_name})`"
              :value="item.id"
            >
              {{ item.username }} ({{ item.first_name }})
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <span class="flex justify-between">
            <el-button
              :loading="LoadingConfirm"
              size="small"
              type="primary"
              @click="handleSave"
            >
              {{ $t('general.Save') }}
            </el-button>
            <el-button
              :disabled="LoadingConfirm"
              plain
              size="small"
              type="success"
              @click="advancedAddIssue"
            >
              {{ $t('general.AdvancedSettings') }}
            </el-button>
          </span>
        </el-form-item>
      </el-form>
    </el-col>
    <el-dialog
      :close-on-click-modal="false"
      :title="$t('Issue.AddIssue')"
      :visible.sync="addTopicDialogVisible"
      append-to-body
      destroy-on-close
      top="5px"
      width="50%"
      @close="handleClose"
    >
      <AddIssue
        ref="AddIssue"
        :is-create="true"
        :item-id="boardObject.id"
        :parent-id="parentId"
        :prefill="form"
        :project-id="projectId"
        :save-data="saveData"
        import-from="board"
        @loading="loadingUpdate"
        @add-topic-visible="handleCloseDialog"
      />
      <span slot="footer" class="dialog-footer">
        <el-button id="dialog-btn-cancel" @click="handleAdvancedClose">
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button
          id="dialog-btn-confirm"
          :loading="LoadingConfirm"
          type="primary"
          @click="handleAdvancedSave"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
  </el-row>
</template>

<script>
import { getProjectUserList } from '@/api_v3/projects'
import { mapGetters } from 'vuex'

export default {
  name: 'QuickAddIssueOnBoard',
  components: {
    AddIssue: () => import('@/components/Issue/AddIssue'),
    Tracker: () => import('@/components/Issue/Tracker')
  },

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: [String, Number],
      default: ''
    },
    saveData: {
      type: Function,
      default: () => ({})
    },
    boardObject: {
      type: Object,
      default: () => ({})
    },
    filterType: {
      type: String,
      default: 'board'
    },
    isSelectDefaultOption: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const validateAssignedTo = (rule, value, callback) => {
      if ((!value || value === '') && this.form.status_id >= 2) {
        callback(new Error('This Status need a assignee.'))
      } else {
        callback()
      }
    }
    return {
      addTopicDialogVisible: false,
      LoadingConfirm: false,
      assigned: [],
      parentId: 0,
      form: {
        tracker_id: null,
        subject: null,
        assigned_id: null,
        status_id: 1,
        priority_id: 2
      },
      advancedForm: {},
      formRules: {
        subject: [
          { required: true, message: 'Please input name', trigger: 'blur' }
        ],
        tracker_id: [
          { required: true, message: 'Please select type', trigger: 'blur' }
        ],
        assigned_id: [{ validator: validateAssignedTo, trigger: 'blur' }]
      }
    }
  },
  computed: {
    ...mapGetters([
      'selectedProjectId',
      'userId',
      'groupBy',
      'issueFilter',
      'tracker'
    ])
  },
  watch: {
    boardObject: {
      deep: true,
      handler() {
        this.setFilterValue()
      }
    },
    groupBy: {
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
    this.setFilterValue()
    this.fecthProjectUserList()
  },
  methods: {
    async fecthProjectUserList() {
      await getProjectUserList(this.projectId).then((res) => {
        this.assigned = [
          {
            username: this.$t('Issue.me'),
            first_name: '-Me-',
            id: this.userId,
            class: 'bg-yellow-100'
          },
          ...res.data
        ]
      })
    },
    setFilterValue() {
      this.form = {
        tracker_id: null,
        subject: null,
        assigned_id: null,
        status_id: 1,
        priority_id: 2,
        tags: this.isSelectDefaultOption ? [] : [this.boardObject.tag_id]
      }
      const dimensions = ['version', 'tracker', 'assigned', 'tag', 'priority']
      dimensions.forEach((item) => {
        if (
          this.issueFilter[this.filterType] &&
          this.issueFilter[this.filterType][item] !== 'null' &&
          !!this.issueFilter[this.filterType][item] &&
          this.issueFilter[this.filterType][item] !== ''
        ) {
          this.$set(
            this.form,
            item + '_id',
            this.issueFilter[this.filterType][item]
          )
        }
      })
      if (
        this.boardObject.id !== 'null' &&
        !!this.boardObject.id &&
        this.boardObject.id !== ''
      ) {
        if (this.isSelectDefaultOption) {
          this.$set(
            this.form,
            this.groupBy.dimension + '_id',
            this.boardObject.id
          )
        }
      }
    },
    handleSave() {
      this.$refs['issueForm'].validate(async (valid) => {
        if (valid) {
          this.LoadingConfirm = true
          // deep copy & remove field with empty value
          const data = this.cleanFormData()
          await this.sendSaveAction(data)
          this.$emit('after-add')
        }
        return valid
      })
    },
    cleanFormData() {
      const data = JSON.parse(JSON.stringify(this.form))
      Object.keys(data).forEach((item) => {
        if (data[item] === '' || data[item] === 'null' || !data[item]) {
          delete data[item]
        }
      })
      return data
    },
    async sendSaveAction(data) {
      if (data.subject && data.assigned_id && data.status_id === 1) {
        data.status_id = 2
      }
      const sendData = {
        project_id: this.projectId,
        ...data
      }
      if (sendData.tags.length === 0) {
        delete sendData.tags
      } else {
        sendData['tags_list'] = sendData['tags']
      }
      Object.keys(data).forEach((objKey) => {
        sendData[objKey] = data[objKey]
      })
      delete sendData.tags
      const itemId = this.boardObject.id
      await this.saveData(sendData, itemId)
      this.LoadingConfirm = false
      const tracker_id = data.tracker_id
      this.setFilterValue()
      this.form.tracker_id = tracker_id
    },
    handleClose() {
      this.$emit('close-dialog', false)
    },
    handleCloseDialog() {
      this.addTopicDialogVisible = false
    },
    handleAdvancedClose() {
      this.$refs['AddIssue'].handleClose()
      this.setFilterValue()
    },
    handleAdvancedSave() {
      const result = this.$refs['AddIssue'].handleSave()
      if (result) {
        this.setFilterValue()
      }
    },
    advancedAddIssue() {
      this.addTopicDialogVisible = true
      this.parentId = 0
      this.advancedForm = this.form
    },
    loadingUpdate(value) {
      this.LoadingConfirm = value
      if (value) this.$emit('after-add')
    }
  }
}
</script>

<style lang="scss" scoped>
.board-item {
  cursor: pointer;
  width: 95%;
  margin: 5px auto;
  background-color: #fff;
  text-align: left;
  line-height: 20px;
  padding: 5px 10px;
  box-sizing: border-box;
  border: 1px solid #e9e9e9;
  box-shadow: 1px 3px 3px 0 rgba(0, 0, 0, 0.2);
}

::v-deep .el-dialog__body {
  padding: 0 1rem;
}
</style>
