<template>
  <div>
    <el-form
      ref="projectInformation"
      :model="form"
      :rules="rules"
      label-position="top"
      size="medium"
    >
      <el-row :gutter="10">
        <el-col :span="24">
          <el-col :span="24" :sm="8" :xl="4">
            <el-form-item :label="$t('Project.Identifier')">
              <el-input v-model="form.name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="8" :xl="4">
            <el-form-item :label="$t('Project.Name')" prop="display">
              <el-input v-model="form.display" :disabled="disabledEngineerRole" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="8" :xl="3">
            <el-form-item :label="$t('general.Active')">
              <el-switch
                v-model="form.disabled"
                :disabled="disabledEditOwner"
                :active-value="false"
                :inactive-value="true"
                :active-text="$t('general.Enable')"
                :inactive-text="$t('general.Disable')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="8" :xl="5">
            <el-form-item :label="$t('Project.Owner')" prop="owner_id">
              <el-select
                v-model="form.owner_id"
                style="width: 100%"
                :disabled="disabledEditOwner"
              >
                <el-option
                  v-for="item in assignedList"
                  :key="item.id"
                  :label="item.label"
                  :value="item.id"
                >
                  {{ item.label }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="8" :xl="3">
            <el-form-item :label="$t('Project.StartDate')" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                type="date"
                value-format="yyyy-MM-dd"
                style="width: 100%"
                :disabled="disabledEngineerRole"
                @change="checkDueDate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="8" :xl="3">
            <el-form-item :label="$t('general.DueDate')" prop="due_date">
              <el-date-picker
                v-model="form.due_date"
                type="date"
                value-format="yyyy-MM-dd"
                style="width: 100%"
                :disabled="disabledEngineerRole"
                :picker-options="pickerOptions(form.start_date)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('general.Description')" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :disabled="disabledEngineerRole"
                :placeholder="$t('general.PleaseInput') + $t('RuleMsg.Description')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('Project.ParentProject')">
              <el-col
                :xl="18"
                :md="18"
                :sm="14"
                :xs="24"
              >
                <ProjectList
                  :form="form"
                  :disabled-engineer-role="disabledEngineerRole"
                  @change="handleInheritanceMemberChange"
                />
                <el-checkbox
                  v-if="!isLite"
                  v-model="form.image_auto_del"
                  :disabled="disabledEngineerRole"
                  :label="$t('Project.ImageAutoDel')"
                />
              </el-col>
              <el-col
                :xl="6"
                :md="6"
                :sm="10"
                :xs="24"
              >
                <el-switch
                  v-model="form.is_inheritance_member"
                  :disabled="isInheritanceMemberChange"
                  :active-text="$t('Project.InheritParentProjectMember')"
                />
              </el-col>
            </el-form-item>
          </el-col>
          <el-col
            v-if="form.base_example && baseExampleDescription && !projectData.is_empty_project"
            :span="24"
          >
            <el-form-item :label="$t('Project.OriginalTemplate')">
              <div class="font-bold">
                {{ baseExampleDisplay }}
              </div>
              <span v-html="baseExampleDescription" />
            </el-form-item>
          </el-col>
        </el-col>
      </el-row>
      <TemplateList
        v-if="projectData.is_empty_project"
        :form="form"
        @clearTemplate="clearTemplate"
      />
    </el-form>
    <span v-if="!disabledEngineerRole" class="float-right">
      <el-button
        :size="isMobile ? 'small' : 'medium'"
        class="button-secondary-reverse"
        :loading="isLoading"
        @click="handleCancel"
      >
        {{ $t('general.Cancel') }}
      </el-button>
      <el-button
        :size="isMobile ? 'small' : 'medium'"
        class="button-primary"
        :loading="isLoading"
        @click="handleConfirm"
      >
        {{ $t('general.Confirm') }}
      </el-button>
    </span>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { getProjectAssignable } from '@/api/projects'
import { getTemplateList } from '@/api/template'
import ProjectList from '@shared/views/Overview/ProjectList/components/ProjectList'
import TemplateList from '@shared/views/Overview/ProjectList/components/TemplateList'
import i18n from '@/lang'

const formTemplate = () => {
  const form = {
    id: '',
    name: '',
    display: '',
    description: '',
    start_date: '',
    due_date: '',
    owner_id: '',
    base_example: '',
    disabled: false,
    parent_id: '',
    is_inheritance_member: false,
    template_id: '',
    tag_name: '',
    argumentsForm: []
  }
  if (process.env.VUE_APP_PROJECT !== 'LITE') form.image_auto_del = false
  return form
}

export default {
  name: 'ProjectInformation',
  components: {
    ProjectList,
    TemplateList
  },
  data() {
    return {
      projectData: {},
      isLoading: false,
      form: formTemplate(),
      rules: {
        name: [
          {
            required: true,
            message: 'Project Identifier is required',
            trigger: 'blur'
          },
          {
            required: true,
            pattern: /^[a-z][a-z0-9-]{0,28}[a-z0-9]$/,
            message: 'Identifier is invalid.',
            trigger: 'blur'
          }
        ],
        display: [
          {
            required: true,
            message: 'Project Name is required',
            trigger: 'blur'
          }
        ],
        start_date: [
          {
            required: true,
            message: 'Start Date is required',
            trigger: 'blur'
          }
        ],
        due_date: [
          {
            required: true,
            message: 'Due Date is required',
            trigger: 'blur'
          }
        ],
        owner_id: [
          {
            required: true,
            message: 'Project Owner is required',
            trigger: 'blur'
          }
        ],
        description: [
          {
            pattern: /^[^<&]+$/,
            message: i18n.t('Project.DescriptionRule'),
            trigger: 'blur'
          }
        ]
      },
      assignableList: [],
      baseExampleDisplay: '',
      baseExampleDescription: '',
      originProject: {
        parent_id: '',
        is_inheritance_member: false
      },
      pickerOptions(startDate) {
        return {
          disabledDate(time) {
            return time.getTime() < new Date(startDate).getTime()
          }
        }
      }
    }
  },
  computed: {
    ...mapGetters([
      'userId',
      'userRole',
      'projectOptions',
      'completeSelectedProject'
    ]),
    isMobile() {
      return this.device === 'mobile'
    },
    assignedList() {
      return this.assignableList.filter(item => item.role_id !== 1).map(item => ({ id: item.id, label: item.name }))
    },
    disabledEditOwner() {
      if (this.userRole === 'Administrator') return false
      return this.userId !== this.projectData.owner_id || this.userRole === 'Engineer'
    },
    disabledEngineerRole() {
      return this.userRole === 'Engineer'
    },
    isInheritanceMemberChange() {
      return (this.originProject.parent_id === this.form.parent_id &&
      this.originProject.is_inheritance_member) || !this.form.parent_id
    },
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    }
  },
  watch: {
    projectData() {
      const formItems = Object.keys(this.form)
      formItems.forEach((item) => {
        this.form[item] = this.projectData[item] === 'None' ? ''
          : this.projectData[item] || this.form[item]
      })
      this.fetchProjectAssignableList(this.projectData.id)
      this.getExampleInfo()
      this.form.owner_id = this.projectData.owner_id
    },
    completeSelectedProject: {
      async handler(project) {
        const { id } = project
        if (id) {
          this.setProjectData()
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    ...mapActions('projects', ['editProject']),
    setProjectData() {
      this.form = formTemplate()
      this.projectData = Object.assign({}, this.completeSelectedProject)
    },
    fetchProjectAssignableList(projectId) {
      getProjectAssignable(projectId).then(res => (this.assignableList = res.data.user_list))
    },
    async getExampleInfo() {
      if (this.userRole !== 'Engineer') {
        this.originProject.parent_id = this.projectData.parent_id
        this.originProject.is_inheritance_member = this.projectData.is_inheritance_member
        await getTemplateList().then((res) => {
          res.data.forEach((item) => {
            item.options.forEach((element) => {
              if (element.path === this.form.base_example) {
                this.baseExampleDisplay = element.display
                this.baseExampleDescription = element.description
              }
            })
          })
        })
      }
    },
    handleInheritanceMemberChange() {
      if (this.originProject.parent_id === this.form.parent_id) {
        this.form.is_inheritance_member = this.originProject.is_inheritance_member
      }
    },
    handleCancel() {
      this.$emit('handleCancel')
    },
    onDialogClosed() {
      this.$nextTick(() => {
        this.$refs.projectInformation.resetFields()
        this.form = formTemplate()
        this.baseExampleDisplay = ''
        this.baseExampleDescription = ''
        this.clearTemplate()
      })
    },
    clearTemplate() {
      this.form.template_id = ''
      this.form.tag_name = ''
      this.form.argumentsForm = []
    },
    async handleConfirm() {
      this.$refs.projectInformation.validate(async valid => {
        if (!valid) return
        this.handleConfirmEdit()
      })
    },
    async handleConfirmEdit() {
      const sendData = {
        pId: this.form.id,
        data: {
          description: this.form.description,
          display: this.form.display,
          owner_id: this.form.owner_id,
          start_date: this.form.start_date,
          due_date: this.form.due_date,
          disabled: this.form.disabled
        }
      }
      if (!this.isLite) sendData.data.image_auto_del = this.form.image_auto_del
      if (!this.form.parent_id) {
        sendData.data.parent_id = ''
        sendData.data.is_inheritance_member = false
      } else if (
        (this.originProject.parent_id !== this.form.parent_id) ||
        (!this.originProject.is_inheritance_member && this.form.is_inheritance_member)
      ) {
        sendData.data.parent_id = this.form.parent_id
        sendData.data.is_inheritance_member = this.form.is_inheritance_member
      }
      if (this.projectData.is_empty_project && this.form.template_id) {
        sendData.data.template_id = this.form.template_id
        sendData.data.tag_name = this.form.tag_name
        if (this.form.argumentsForm.length > 0) {
          sendData.data.arguments = this.form.argumentsForm.reduce((arr, cur) =>
            Object.assign(arr, { [cur.key]: cur.value })
          , {})
        }
        this.$confirm(this.$t('Notify.confirmEditProject'), this.$t('general.Warning'), {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        }).then(() => {
          this.handleEdit(sendData)
        }).catch(() => {})
      } else {
        this.handleEdit(sendData)
      }
    },
    async handleEdit(sendData) {
      this.isLoading = true
      await this.editProject(sendData).then(res => {
        this.isLoading = false
        if (res.message === 'success') {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.$emit('update')
        } else {
          this.$message({
            title: this.$t('general.Warning'),
            message: res.error.message,
            type: 'warning'
          })
        }
      })
      this.isLoading = false
    },
    checkDueDate(startDate) {
      if (new Date(startDate).getTime() >= new Date(this.form.due_date)) this.form.due_date = ''
    }
  }
}
</script>
