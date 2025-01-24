<template>
  <div>
    <el-form
      ref="projectInformation"
      v-loading="isLoading"
      :model="form"
      :rules="rules"
      label-position="top"
      size="medium"
    >
      <el-row :gutter="10">
        <el-col :span="24">
          <el-col :sm="8" :span="24" :xl="4">
            <el-form-item :label="$t('Project.Identifier')">
              <el-input v-model="form.identifier" disabled />
            </el-form-item>
          </el-col>
          <el-col :sm="8" :span="24" :xl="4">
            <el-form-item :label="$t('Project.Name')" prop="display_name">
              <el-input
                v-model="form.display_name"
                :disabled="disabledEngineerRole"
              />
            </el-form-item>
          </el-col>
          <el-col :sm="8" :span="24" :xl="3">
            <el-form-item :label="$t('general.Active')">
              <el-switch
                v-model="form.is_disabled"
                :active-text="$t('general.Enable')"
                :active-value="false"
                :disabled="disabledEditOwner"
                :inactive-text="$t('general.Disable')"
                :inactive-value="true"
              />
            </el-form-item>
          </el-col>
          <el-col :sm="8" :span="24" :xl="5">
            <el-form-item :label="$t('Project.Owner')" prop="owner_id">
              <el-select
                v-model="form.owner_id"
                :disabled="disabledEditOwner"
                style="width: 100%"
              >
                <el-option
                  v-for="item in assignedList"
                  :key="item.id"
                  :disabled="item.disabled"
                  :label="item.full_name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :sm="8" :span="24" :xl="3">
            <el-form-item :label="$t('Project.StartDate')" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                :disabled="disabledEngineerRole"
                style="width: 100%"
                type="date"
                value-format="yyyy-MM-dd"
                @change="checkDueDate"
              />
            </el-form-item>
          </el-col>
          <el-col :sm="8" :span="24" :xl="3">
            <el-form-item :label="$t('general.DueDate')" prop="due_date">
              <el-date-picker
                v-model="form.due_date"
                :disabled="disabledEngineerRole"
                :picker-options="pickerOptions(form.start_date)"
                style="width: 100%"
                type="date"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('general.Description')" prop="description">
              <el-input
                v-model="form.description"
                :disabled="disabledEngineerRole"
                :placeholder="
                  $t('general.PleaseInput') + $t('RuleMsg.Description')
                "
                type="textarea"
              />
            </el-form-item>
          </el-col>
          <el-col
            v-if="
              !originProject.parent_id ||
                (originProject.parent_id &&
                  originProject.has_parent_project_permission)
            "
            :span="24"
          >
            <el-form-item :label="$t('Project.ParentProject')">
              <el-col :md="18" :sm="14" :xl="18" :xs="24">
                <ProjectList
                  :disabled-engineer-role="disabledEngineerRole"
                  :form="form"
                  @change="handleInheritanceMemberChange"
                />
                <div class="flex flex-col">
                  <el-checkbox
                    v-if="!isLite && services.harbor"
                    v-model="form.image_auto_del"
                    :disabled="disabledEngineerRole"
                    :label="$t('Project.ImageAutoDel')"
                  />
                  <el-checkbox
                    v-if="!isLite && services.gitlab"
                    v-model="form.should_update_pipeline"
                    :label="$t('Project.AutoUpgradeCIYaml')"
                  />
                </div>
              </el-col>
              <el-col :md="6" :sm="10" :xl="6" :xs="24">
                <el-switch
                  v-model="form.is_inheritance_member"
                  :active-text="$t('Project.InheritParentProjectMember')"
                  :disabled="isInheritanceMemberChange"
                />
              </el-col>
            </el-form-item>
          </el-col>
          <el-col
            v-if="
              form.base_example &&
                baseExampleDescription &&
                !projectData.is_empty
            "
            :span="24"
          >
            <el-form-item :label="$t('Project.OriginalTemplate')">
              <div class="font-bold">
                {{ baseExampleDisplay }}
              </div>
              <span v-html="baseExampleDescription"></span>
            </el-form-item>
          </el-col>
        </el-col>
      </el-row>
      <TemplateList
        v-if="projectData.is_empty && services.gitlab"
        :form="form"
        @clearTemplate="clearTemplate"
      />
    </el-form>
    <span v-if="!disabledEngineerRole" class="float-right">
      <el-button
        :loading="isLoading"
        :size="isMobile ? 'small' : 'medium'"
        @click="handleCancel"
      >
        {{ $t('general.Cancel') }}
      </el-button>
      <el-button
        :loading="isLoading"
        :size="isMobile ? 'small' : 'medium'"
        type="primary"
        @click="handleConfirm"
      >
        {{ $t('general.Confirm') }}
      </el-button>
    </span>
  </div>
</template>

<script>
import { getGitlabTemplateList } from '@/api_v3/gitlab'
import { getProjectUserList } from '@/api_v3/projects'
import i18n from '@/lang'
import ProjectList from '@shared/views/Overview/ProjectList/components/ProjectList'
import TemplateList from '@shared/views/Overview/ProjectList/components/TemplateList'
import { mapActions, mapGetters } from 'vuex'

const formTemplate = () => {
  const form = {
    id: '',
    identifier: '',
    display_name: '',
    description: '',
    start_date: '',
    due_date: '',
    owner_id: '',
    base_example: '',
    is_disabled: false,
    parent_id: '',
    is_inheritance_member: false,
    image_auto_del: false,
    should_update_pipeline: false,
    template_id: '',
    tag_name: '',
    argumentsForm: [],
    has_parent_project_permission: false
  }
  if (import.meta.env.VITE_APP_PROJECT !== 'LITE') form.image_auto_del = false
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
      isAutoUpgradeCIYaml: false,
      rules: {
        identifier: [
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
        display_name: [
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
        is_inheritance_member: false,
        has_parent_project_permission: false
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
      'selectedProject',
      'projectOptions',
      'completeSelectedProject',
      'roleList',
      'services'
    ]),
    isMobile() {
      return this.device === 'mobile'
    },
    assignedList() {
      const list = this.assignableList
        .filter((item) => item.role.name === 'Project Manager')
        .map(({ id, full_name, department }) => ({
          id,
          full_name,
          department
        }))
      if (!list.some((item) => item.id === this.projectData.owner.id)) {
        list.push({
          ...this.projectData.owner,
          disabled: true
        })
      }
      return list
    },
    disabledEditOwner() {
      if (
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      ) {
        return false
      }
      if (!this.projectData.owner) return
      return (
        this.userId !== this.projectData.owner.id ||
        this.userRole === 'Engineer'
      )
    },
    disabledEngineerRole() {
      return this.userRole === 'Engineer'
    },
    isInheritanceMemberChange() {
      return (
        (this.originProject.parent_id === this.form.parent_id &&
          this.originProject.is_inheritance_member) ||
        !this.form.parent_id
      )
    },
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    }
  },
  watch: {
    projectData() {
      const formItems = Object.keys(this.form)
      formItems.forEach((item) => {
        this.form[item] =
          this.projectData[item] === 'None'
            ? ''
            : this.projectData[item] || this.form[item]
      })
      this.fetchProjectAssignableList(this.projectData.id)
      this.getExampleInfo()
      this.form.owner_id = this.projectData.owner.id
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
  created() {
    this.isLoading = true
    this.setCompleteSelectedProject(this.selectedProject.id)
  },
  methods: {
    ...mapActions('projects', [
      'editProject',
      'setSelectedProject',
      'setCompleteSelectedProject'
    ]),
    setProjectData() {
      this.form = formTemplate()
      this.projectData = Object.assign({}, this.completeSelectedProject)
      this.isLoading = false
    },
    async fetchProjectAssignableList(projectId) {
      await getProjectUserList(projectId).then((res) => {
        this.assignableList = res.data
      })
    },
    async getExampleInfo() {
      if (this.userRole !== 'Engineer') {
        const {
          parent_id,
          is_inheritance_member,
          has_parent_project_permission
        } = this.projectData
        this.originProject.parent_id = parent_id
        this.originProject.is_inheritance_member = is_inheritance_member
        this.originProject.has_parent_project_permission =
          has_parent_project_permission
        await getGitlabTemplateList().then((res) => {
          res.data.forEach((item) => {
            item.options.forEach((element) => {
              if (element?.path === this.form.base_example) {
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
        this.form.is_inheritance_member =
          this.originProject.is_inheritance_member
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
      this.$refs.projectInformation.validate(async (valid) => {
        if (!valid) return
        this.handleConfirmEdit()
      })
    },
    async handleConfirmEdit() {
      const sendData = {
        pId: this.form.id,
        data: {
          description: this.form.description,
          display_name: this.form.display_name,
          owner_id: this.form.owner_id,
          start_date: this.form.start_date,
          due_date: this.form.due_date,
          is_disabled: this.form.is_disabled
        }
      }
      if (!this.isLite) {
        sendData.data.image_auto_del = this.form.image_auto_del
        sendData.data.should_update_pipeline = this.form.should_update_pipeline
      }
      if (this.form.parent_id === '') {
        sendData.data.parent_id = 'null'
        sendData.data.is_inheritance_member = false
      } else if (
        this.originProject.parent_id !== this.form.parent_id ||
        (!this.originProject.is_inheritance_member &&
          this.form.is_inheritance_member)
      ) {
        sendData.data.parent_id = this.form.parent_id
        sendData.data.is_inheritance_member = this.form.is_inheritance_member
      }
      if (this.projectData.is_empty && this.form.template_id) {
        sendData.data.template_id = this.form.template_id
        sendData.data.tag_name = this.form.tag_name
        if (this.form.argumentsForm.length > 0) {
          sendData.data.arguments = this.form.argumentsForm.reduce(
            (arr, cur) => Object.assign(arr, { [cur.key]: cur.value }),
            {}
          )
        }
        this.$confirm(
          this.$t('Notify.confirmEditProject'),
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }
        )
          .then(() => {
            this.handleEdit(sendData)
          })
          .catch(() => {})
      } else {
        this.handleEdit(sendData)
      }
    },
    async handleEdit(sendData) {
      this.isLoading = true
      await this.editProject(sendData)
        .then((res) => {
          this.updateSelectedProject(res.data)
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.$emit('update')
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    updateSelectedProject(project) {
      localStorage.setItem('projectId', project.id)
      this.setSelectedProject(project)
    },
    checkDueDate(startDate) {
      if (new Date(startDate).getTime() >= new Date(this.form.due_date)) {
        this.form.due_date = ''
      }
    }
  }
}
</script>
