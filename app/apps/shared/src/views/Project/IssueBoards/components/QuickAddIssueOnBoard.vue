<template>
  <el-row>
    <el-col>
      <el-form
        ref="issueForm"
        :model="form"
        :rules="formRules"
      >
        <el-form-item prop="tracker_id">
          <el-select
            v-model="form.tracker_id"
            :placeholder="$t('Issue.SelectType')"
            style="width: 100%"
          >
            <el-option
              v-for="option in strictTracker"
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
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            :placeholder="$t('Issue.name')"
          />
        </el-form-item>
        <el-form-item prop="assigned_to_id">
          <el-select
            v-model="form.assigned_to_id"
            :placeholder="$t('Issue.SelectMember')"
            style="width: 100%"
            clearable
            filterable
          >
            <el-option
              v-for="item in assigned_to"
              :key="item.login"
              :class="item.class"
              :label="item.name + ' (' + item.login + ')'"
              :value="item.id"
            >
              {{ item.name }} ({{ item.login }})
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <span class="flex justify-between">
            <el-button
              :loading="LoadingConfirm"
              class="button-primary"
              size="small"
              @click="handleSave"
            >
              {{ $t('general.Save') }}
            </el-button>
            <el-button
              :disabled="LoadingConfirm"
              class="button-secondary-reverse"
              size="small"
              @click="advancedAddIssue"
            >
              {{ $t('general.AdvancedSettings') }}
            </el-button>
          </span>
        </el-form-item>
      </el-form>
    </el-col>
    <el-dialog
      :title="$t('Issue.AddIssue')"
      :visible.sync="addTopicDialogVisible"
      :close-on-click-modal="false"
      width="50%"
      top="5px"
      destroy-on-close
      append-to-body
      @close="handleClose"
    >
      <AddIssue
        ref="AddIssue"
        :project-id="projectId"
        :parent-id="parentId"
        :prefill="form"
        :save-data="saveData"
        :is-create="true"
        :item-id="boardObject.id"
        import-from="board"
        @loading="loadingUpdate"
        @add-topic-visible="handleCloseDialog"
      />
      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button
          id="dialog-btn-cancel"
          class="button-secondary-reverse"
          @click="handleAdvancedClose"
        >
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button
          id="dialog-btn-confirm"
          :loading="LoadingConfirm"
          class="button-primary"
          @click="handleAdvancedSave"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectAssignable } from '@/api/projects'
import { AddIssue, Tracker } from '@/components/Issue'

export default {
  name: 'QuickAddIssueOnBoard',
  components: { AddIssue, Tracker },

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: Number,
      default: null
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
      assigned_to: [],
      parentId: 0,
      form: {
        tracker_id: null,
        name: null,
        assigned_to_id: null,
        status_id: 1,
        priority_id: 3
      },
      advancedForm: {},
      formRules: {
        name: [{ required: true, message: 'Please input name', trigger: 'blur' }],
        tracker_id: [{ required: true, message: 'Please select type', trigger: 'blur' }],
        assigned_to_id: [{ validator: validateAssignedTo, trigger: 'blur' }]
      }
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'userId', 'groupBy', 'issueFilter', 'strictTracker'])
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
    this.fetchSelection()
  },
  methods: {
    async fetchSelection() {
      await Promise.allSettled([getProjectAssignable(this.projectId)]).then((res) => {
        const [assigned_to] = res.map((item) => item.value.data)
        this.assigned_to = [
          {
            name: this.$t('Issue.me'),
            login: '-Me-',
            id: this.userId,
            class: 'bg-yellow-100'
          },
          ...assigned_to.user_list
        ]
      })
    },
    setFilterValue() {
      this.form = {
        tracker_id: null,
        name: null,
        assigned_to_id: null,
        status_id: 1,
        priority_id: 3,
        tags: this.isSelectDefaultOption ? [] : [this.boardObject.tag_id]
      }
      const dimensions = ['fixed_version', 'tracker', 'assigned_to', 'tag', 'priority']
      dimensions.forEach((item) => {
        if (
          this.issueFilter[this.filterType] &&
          this.issueFilter[this.filterType][item] !== 'null' &&
          !!this.issueFilter[this.filterType][item] &&
          this.issueFilter[this.filterType][item] !== ''
        ) {
          this.$set(this.form, item + '_id', this.issueFilter[this.filterType][item])
        }
      })
      if (this.boardObject.id !== 'null' && !!this.boardObject.id && this.boardObject.id !== '') {
        if (this.isSelectDefaultOption) this.$set(this.form, this.groupBy.dimension + '_id', this.boardObject.id)
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
        if (data[item] === '' || data[item] === 'null' || !data[item]) delete data[item]
      })
      return data
    },
    async sendSaveAction(data) {
      if (data.name && data.assigned_to_id && data.status_id === 1) data.status_id = 2
      const form = new FormData()
      form.append('project_id', this.projectId)
      Object.keys(data).forEach((objKey) => {
        form.append(objKey, data[objKey])
      })
      const itemId = this.boardObject.id
      await this.saveData(form, itemId)
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
