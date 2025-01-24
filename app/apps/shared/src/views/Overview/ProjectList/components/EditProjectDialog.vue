<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="showDialog"
    top="3vh"
    width="70vw"
    @closed="onDialogClosed"
  >
    <div slot="title">
      <span style="font-size: 18px">
        {{ $t('Project.EditProject') }}
      </span>
      <div class="float-right mr-8">
        <span class="mr-3">
          {{ $t('general.Active') }}
        </span>
        <el-switch
          v-model="form.is_disabled"
          :active-text="$t('general.Enable')"
          :active-value="false"
          :disabled="disabledEditOwner"
          :inactive-text="$t('general.Disable')"
          :inactive-value="true"
        />
      </div>
    </div>
    <el-form
      ref="editProjectForm"
      :model="form"
      :rules="rules"
      label-position="top"
      size="medium"
    >
      <el-row :gutter="10">
        <el-col :span="24">
          <el-divider content-position="left">
            {{ $t('Project.Info') }}
          </el-divider>
          <el-col :sm="12" :span="24" :xl="6">
            <el-form-item :label="$t('Project.Identifier')">
              <el-input v-model="form.identifier" disabled />
            </el-form-item>
          </el-col>
          <el-col :sm="12" :span="24" :xl="7">
            <el-form-item :label="$t('Project.Name')" prop="display_name">
              <el-input v-model="form.display_name" />
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
                  :label="item.label"
                  :value="item.id"
                >
                  {{ item.label }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :sm="8" :span="24" :xl="3">
            <el-form-item :label="$t('Project.StartDate')" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
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
                :placeholder="
                  $t('general.PleaseInput') + $t('RuleMsg.Description')
                "
                type="textarea"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('Project.ParentProject')">
              <el-col :md="18" :sm="14" :xl="18" :xs="24">
                <ProjectList
                  :form="form"
                  @change="handleInheritanceMemberChange"
                />
                <el-checkbox
                  v-if="!isLite"
                  v-model="form.image_auto_del"
                  :label="$t('Project.ImageAutoDel')"
                />
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
                !editProjectObj.is_empty_project
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
        v-if="editProjectObj.is_empty_project && showDialog"
        :form="form"
        @clearTemplate="clearTemplate"
      />
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button :loading="isLoading" @click="onDialogClosed">
        {{ $t('general.Cancel') }}
      </el-button>
      <el-button :loading="isLoading" type="primary" @click="handleConfirm">
        {{ $t('general.Confirm') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getProjectAssignable } from '@/api/projects'
import { getTemplateList } from '@/api/template'
import i18n from '@/lang'
import { mapActions, mapGetters } from 'vuex'
import ProjectList from './ProjectList'
import TemplateList from './TemplateList'

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
    template_id: '',
    tag_name: '',
    argumentsForm: []
  }
  if (import.meta.env.VITE_APP_PROJECT !== 'LITE') form.image_auto_del = false
  return form
}

export default {
  name: 'EditProjectDialog',
  components: {
    ProjectList,
    TemplateList
  },
  props: {
    editProjectObj: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      showDialog: false,
      isLoading: false,
      form: formTemplate(),
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
    ...mapGetters(['userId', 'userRole', 'projectOptions']),
    assignedList() {
      return this.assignableList
        .filter((item) => item.role_id !== 1)
        .map((item) => ({
          id: item.id,
          label: item.name
        }))
    },
    disabledEditOwner() {
      if (
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      ) {
        return false
      }
      return this.userId !== this.editProjectObj.owner_id
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
    editProjectObj() {
      const formItems = Object.keys(this.form)
      formItems.forEach((item) => {
        this.form[item] =
          this.editProjectObj[item] === 'None'
            ? ''
            : this.editProjectObj[item] || this.form[item]
      })
      this.fetchProjectAssignableList(this.editProjectObj.id)
      this.getExampleInfo()
      this.form.owner_id = this.editProjectObj.owner_id
    }
  },
  methods: {
    ...mapActions('projects', ['editProject']),
    fetchProjectAssignableList(projectId) {
      getProjectAssignable(projectId).then(
        (res) => (this.assignableList = res.data.user_list)
      )
    },
    async getExampleInfo() {
      if (this.userRole !== 'Engineer') {
        this.originProject.parent_id = this.editProjectObj.parent_id
        this.originProject.is_inheritance_member =
          this.editProjectObj.is_inheritance_member
        await getTemplateList().then((res) => {
          res.data.forEach((item) => {
            item.options.forEach((element) => {
              if (element.path === this.form.base_example) {
                this.baseExampleDisplay = element.display_name
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
    onDialogClosed() {
      this.showDialog = false
      this.$nextTick(() => {
        this.$refs.editProjectForm.resetFields()
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
      this.$refs.editProjectForm.validate(async (valid) => {
        if (!valid) return
        await this.handleConfirmEdit()
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
      if (!this.isLite) sendData.data.image_auto_del = this.form.image_auto_del
      if (!this.form.parent_id) {
        sendData.data.parent_id = ''
        sendData.data.is_inheritance_member = false
      } else if (
        this.originProject.parent_id !== this.form.parent_id ||
        (!this.originProject.is_inheritance_member &&
          this.form.is_inheritance_member)
      ) {
        sendData.data.parent_id = this.form.parent_id
        sendData.data.is_inheritance_member = this.form.is_inheritance_member
      }
      if (this.editProjectObj.is_empty_project && this.form.template_id) {
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
        await this.handleEdit(sendData)
      }
    },
    async handleEdit(sendData) {
      this.isLoading = true
      await this.editProject(sendData).then((res) => {
        this.isLoading = false
        if (res.message === 'success') {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.showDialog = false
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
      if (new Date(startDate).getTime() >= new Date(this.form.due_date)) {
        this.form.due_date = ''
      }
    }
  }
}
</script>
