<template>
  <el-dialog
    :close-on-click-modal="false"
    :title="$t('Project.AddProject')"
    :visible.sync="showDialog"
    :width="isMobile ? '95%' : '70%'"
    top="3vh"
    @closed="onDialogClosed"
  >
    <el-form
      v-if="showDialog"
      ref="createProjectForm"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <el-row :gutter="10">
        <el-col :span="24">
          <el-divider content-position="left">
            {{ $t('Project.Info') }}
          </el-divider>
          <el-col :sm="12" :span="24" :xl="9">
            <el-form-item :label="$t('Project.Name')" prop="display_name">
              <el-input v-model="form.display_name" />
            </el-form-item>
          </el-col>
          <el-col :sm="12" :span="24" :xl="9">
            <el-form-item :label="$t('Project.Identifier')" prop="identifier">
              <el-input
                v-model="form.identifier"
                :maxlength="30"
                show-word-limit
              />
            </el-form-item>
            <span class="font-sm">
              {{ $t('Project.IdRule') }}
            </span>
          </el-col>
          <el-col :sm="12" :span="24" :xl="3">
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
          <el-col :sm="12" :span="24" :xl="3">
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
          <el-col v-if="userRole === 'sysadmin'" :span="24">
            <el-form-item label="Organization" prop="organization_id">
              <el-select
                v-model="form.organization_id"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="org in organizationList"
                  :key="org.id"
                  :label="org.name"
                  :value="org.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="checkOwnerRequired" :span="24">
            <el-form-item
              :label="$t('Project.Owner')"
              :prop="checkOwnerRequired ? 'owner_id' : ''"
            >
              <el-select v-model="form.owner_id" filterable style="width: 100%">
                <el-option
                  v-for="user in userList"
                  :key="user.id"
                  :label="user.full_name + ' (' + user.username + ')'"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('general.Description')" prop="description">
              <el-input
                v-model="form.description"
                :placeholder="
                  $t('general.PleaseInput') + $t('general.Description')
                "
                type="textarea"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('Project.ParentProject')">
              <el-col :md="18" :sm="14" :xl="18" :xs="24">
                <ProjectList :form="form" :is-create="true" />
              </el-col>
              <el-col :md="6" :sm="10" :xl="6" :xs="24">
                <el-switch
                  v-model="form.is_inheritance_member"
                  :active-text="$t('Project.InheritParentProjectMember')"
                  :disabled="!form.parent_id"
                />
              </el-col>
            </el-form-item>
          </el-col>
        </el-col>
      </el-row>
      <template v-if="showDialog && services.gitlab">
        <!--        <TemplateList-->
        <!--          v-if="isLite"-->
        <!--          :form="form"-->
        <!--          :is-create="showDialog"-->
        <!--          @clearTemplate="clearTemplate"-->
        <!--        />-->
        <TemplateList
          :form="form"
          :is-create="showDialog"
          @clearTemplate="clearTemplate"
          @resetTemplate="resetTemplate"
        />
      </template>
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
import { getOrganizationList } from '@/api_v3/organizations'
import { getUserList } from '@/api_v3/user'
import { getLocalTime } from '@shared/utils/handleTime'
import { mapActions, mapGetters } from 'vuex'
import ProjectList from './ProjectList'
import TemplateList from './TemplateList'

const formTemplate = () => {
  const form = {
    identifier: '',
    description: '',
    display_name: '',
    is_disabled: false,
    template_id: '',
    start_date: getLocalTime(Date.now(), 'YYYY-MM-DD'),
    should_update_pipeline: true,
    due_date: '',
    tag_name: '',
    argumentsForm: [],
    parent_id: '',
    is_inheritance_member: false
  }
  if (import.meta.env.VITE_APP_PROJECT !== 'LITE') form.image_auto_del = true
  return form
}

export default {
  name: 'CreateDialog',
  components: {
    ProjectList,
    TemplateList
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
            message:
              this.$t('general.PleaseInput') + this.$t('Project.Identifier'),
            trigger: 'blur'
          },
          {
            required: true,
            pattern: /^[a-z][a-z0-9-]{0,28}[a-z0-9]$/,
            message: this.$t('Project.IdInvalid'),
            trigger: 'blur'
          }
        ],
        display_name: [
          {
            required: true,
            message: this.$t('general.PleaseInput') + this.$t('Project.Name'),
            trigger: 'blur'
          },
          {
            required: true,
            pattern: /^[^<&]+$/,
            message: this.$t('Project.DisplayRule'),
            trigger: 'blur'
          }
        ],
        start_date: [
          {
            required: true,
            message:
              this.$t('general.PleaseInput') + this.$t('Project.StartDate'),
            trigger: 'blur'
          }
        ],
        due_date: [
          {
            required: true,
            message:
              this.$t('general.PleaseInput') + this.$t('general.DueDate'),
            trigger: 'blur'
          }
        ],
        organization_id: [
          {
            required: true,
            message: this.$t('general.PleaseInput') + 'Organization',
            trigger: 'blur'
          }
        ],
        owner_id: [
          {
            required: true,
            message:
              this.$t('general.PleaseInput') + this.$t('general.owner_name'),
            trigger: 'blur'
          }
        ],
        description: [
          {
            pattern: /^[^<&]+$/,
            message: this.$t('Project.DescriptionRule'),
            trigger: 'blur'
          }
        ]
      },
      userList: [],
      organizationList: [],
      pickerOptions(startDate) {
        return {
          disabledDate(time) {
            return time.getTime() < new Date(startDate).getTime()
          }
        }
      },
      loadingText: [
        'createRedmine',
        'createGitLab',
        'createHarbor',
        'integrationProject'
      ],
      loadingInstance: {},
      timer: ''
    }
  },
  computed: {
    ...mapGetters(['userRole', 'device', 'roleList', 'services']),
    checkOwnerRequired() {
      return (
        this.userRole === 'QA' ||
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      )
    },
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    isLoading(val) {
      if (val) {
        this.loadingInstance = this.$loading({
          text: this.$t('Loading'),
          lock: true,
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)',
          customClass: 'project-dialog-loading'
        })
        this.loadingText.forEach((text, index) => {
          this.timer = setTimeout(
            () => this.openFullLoading(text),
            3000 * index
          )
        })
      } else {
        this.$nextTick(() => {
          clearTimeout(this.timer)
          this.loadingInstance.close()
          this.$emit('update')
        })
      }
    },
    showDialog(val) {
      if (!val) {
        this.$nextTick(() => {
          this.form = formTemplate()
          this.clearTemplate()
        })
      }
    },
    'form.organization_id'(val) {
      if (val) {
        delete this.form.owner_id
        this.getUserOrganizationList(val)
      }
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    ...mapActions('projects', ['addNewProject']),
    async init() {
      if (this.checkOwnerRequired) {
        if (this.userRole === 'sysadmin') await this.getOrganizationList()
        await this.getUserOrganizationList()
      }
    },
    async getOrganizationList() {
      await getOrganizationList().then((res) => {
        this.organizationList = res.data
      })
    },
    async getUserOrganizationList(org_id) {
      if (this.checkOwnerRequired) {
        const role_id = this.roleList.find(
          (role) => role.name === 'Project Manager'
        ).id
        const params = {
          role_id: role_id,
          all: true
        }
        if (org_id) params.organization_id = org_id
        const res = await getUserList(params)
        this.userList = res.data
      }
    },
    onDialogClosed() {
      this.showDialog = false
    },
    handleConfirm() {
      this.$refs.createProjectForm.validate((valid) => {
        if (!valid) return
        this.isLoading = true
        const sendData = this.handleSendData()
        this.addNewProject(sendData)
          .then((res) => {
            this.$message({
              message: this.$t('Notify.Created'),
              type: 'success'
            })
          })
          .finally(() => {
            this.showDialog = false
            this.isLoading = false
          })
      })
    },
    openFullLoading(loadingText) {
      // handle i18n log warning when loadingText is undefined
      const text = loadingText
        ? this.$t(`LoadingText.${loadingText}`)
        : this.$t('LoadingText.integrationProject')
      // set loading text every 3 second
      this.loadingInstance.setText(text)
    },
    handleSendData() {
      const result = Object.assign({}, this.form)
      if (this.isLite) delete result.should_update_pipeline
      if (result.argumentsForm.length > 0) {
        result.arguments = result.argumentsForm.reduce(
          (arr, cur) => Object.assign(arr, { [cur.key]: cur.value }),
          {}
        )
      }
      if (result.description === '') delete result.description
      if (result.template_id === '') delete result.template_id
      if (result.tag_name === '') delete result.tag_name
      if (result.parent_id === '') {
        delete result.parent_id
        delete result.is_inheritance_member
      }
      delete result.argumentsForm
      return result
    },
    clearTemplate() {
      this.form.template_id = ''
      this.form.tag_name = ''
      this.form.argumentsForm = []
    },
    resetTemplate() {
      this.$refs.createProjectForm.clearValidate([
        'argumentsForm.0.value',
        'argumentsForm.1.value',
        'argumentsForm.2.value'
      ])
    },
    checkDueDate(startDate) {
      if (new Date(startDate).getTime() >= new Date(this.form.due_date)) {
        this.form.due_date = ''
      }
    }
  }
}
</script>
