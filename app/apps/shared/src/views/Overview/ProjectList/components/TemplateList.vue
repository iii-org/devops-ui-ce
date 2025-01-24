<template>
  <el-row v-loading="isLoadingTemplate" :gutter="10" class="loading-template">
    <el-col :span="24">
      <el-divider content-position="left">
        {{ $t('Project.Template') }}
        <el-button
          circle
          class="ml-2"
          icon="el-icon-refresh"
          plain
          size="mini"
          type="primary"
          @click="init(1)"
        />
      </el-divider>
    </el-col>
    <el-col :md="20" :sm="18" :xs="24">
      <el-form-item :label="$t('Project.TemplateName')">
        <div slot="label" class="flex items-center mb-2">
          <span class="mr-3">
            {{ $t('Project.TemplateName') }}
          </span>
          <el-radio-group v-model="focusSources" size="mini">
            <el-radio-button label="Public Templates"> Public</el-radio-button>
            <el-radio-button label="Local Templates"> Local</el-radio-button>
          </el-radio-group>
        </div>
        <el-select
          v-model="form.template_id"
          :placeholder="$t('Project.SelectTemplate')"
          clearable
          filterable
          style="width: 100%"
          @change="handleTemplateSelect"
        >
          <el-option
            v-for="item in activeTemplateList"
            :key="item.id"
            :label="item.display || item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-col>
    <el-col :md="4" :sm="6" :xs="24">
      <el-form-item :label="$t('Project.Version')">
        <div slot="label" class="mb-2">
          <span>
            {{ $t('Project.Version') }}
          </span>
        </div>
        <el-select
          v-model="form.tag_name"
          :disabled="!form.template_id"
          clearable
          style="width: 100%"
          @change="handleVersionSelect"
        >
          <el-option
            v-for="item in versionList"
            :key="item.name"
            :label="item.name"
            :value="item.name"
          >
            <span>
              {{ item.name }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-col>
    <el-col v-if="focusTemplate.description" :span="24">
      <el-form-item :label="$t('Project.TemplateDescription')">
        <span v-html="focusTemplate.description"></span>
      </el-form-item>
    </el-col>
    <el-col
      v-for="(argument, idx) in form.argumentsForm"
      :key="argument.key"
      :span="8"
    >
      <el-form-item
        :label="argument.display"
        :prop="'argumentsForm.' + idx + '.value'"
        :rules="databaseRules(argument)"
      >
        <el-input
          v-model="argument.value"
          :placeholder="$t('general.PleaseInput')"
          :show-password="argument.input_type === 'password'"
        />
      </el-form-item>
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { checkDBPolicyPassword, getDBPolicyList } from '@/api_v3/system'
import {
  getGitlabTemplateList,
  getTemplateDetail,
  syncGitlabTemplate
} from '@/api_v3/gitlab'

export default {
  name: 'TemplateList',
  props: {
    isCreate: {
      type: Boolean,
      default: false
    },
    form: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      templateList: [],
      databaseType: [],
      focusTemplate: {},
      isLoadingTemplate: false,
      isClickUpdateTemplate: false,
      loadingTemplateText: ['', '.', '..', '...'],
      templateLoadingInstance: {},
      focusSources: 'Public Templates',
      cachedTemplates: {}
    }
  },
  computed: {
    ...mapGetters(['userRole']),
    versionList() {
      return this.focusTemplate.version || []
    },
    activeTemplateList() {
      if (this.templateList.length === 0) return []
      const idx = this.templateList.findIndex(
        (item) => item.source === this.focusSources
      )
      return this.templateList[idx].options.filter((item) => item)
    },
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    }
  },
  watch: {
    isClickUpdateTemplate(val) {
      if (val) {
        const text = this.$t('LoadingText.loadingTemplateText')
        this.templateLoadingInstance = this.$loading({
          text,
          spinner: 'el-icon-loading',
          background: 'rgba(255, 255, 255, 0.9)',
          target: '.loading-template',
          customClass: 'project-dialog-template-loading'
        })
        // set 60secs for loading to show different words
        for (let sec = 1; sec < 60; sec++) {
          const templateText = `${text}${this.loadingTemplateText[sec % 4]}`
          this.timer = setTimeout(
            () => this.openTemplateFullLoading(templateText),
            1000 * sec
          )
        }
      } else {
        clearTimeout(this.timer)
        this.openTemplateFullLoading()
      }
    },
    focusSources(val) {
      this.$emit('clearTemplate')
      this.clearFocusTemplate()
      if (val === 'Public Templates' && this.cachedTemplates.publicPath) {
        this.form.template_id = this.getCachedTemplateId(
          this.cachedTemplates.publicPath
        )
        this.handleTemplateSelect()
      } else if (this.cachedTemplates.localPath) {
        this.form.template_id = this.getCachedTemplateId(
          this.cachedTemplates.localPath
        )
        this.handleTemplateSelect()
      }
    },
    templateList(val) {
      if (!this.isCreate) return
      const publicTemplates = val.find(
        (item) => item.source === 'Public Templates'
      )
      const defaultTemplate = publicTemplates.options.find((template) => {
        return template.path === 'ci-default-dev'
      })
      this.form.template_id = defaultTemplate.id
      this.handleTemplateSelect()
    }
  },
  mounted() {
    this.init()
  },
  beforeDestroy() {
    this.cachedTemplates = {}
    this.clearFocusTemplate()
  },
  methods: {
    async init(isForceUpdate) {
      if (!this.isLite) this.databaseType = (await getDBPolicyList()).data
      if (this.userRole !== 'Engineer') {
        await this.getTemplateList(isForceUpdate)
      }
    },
    databaseRules(argument) {
      const rules = [
        {
          required: true,
          message: `${this.$t('general.PleaseInput')} ${argument.display}`,
          trigger: 'blur'
        }
      ]
      if (argument.input_type === 'password' && !this.isLite) {
        rules[1] = {
          validator: this.validatePassword,
          trigger: 'blur'
        }
      }
      return rules
    },
    async validatePassword(rule, value, callback) {
      const data = { db_pwd: value }
      data.db_user =
        this.form.argumentsForm[0].input_type === 'password'
          ? null
          : this.form.argumentsForm[0].value
      data.db_type = this.databaseType.find((item) =>
        this.focusTemplate.name.includes(item)
      )
      if (!data.db_type) callback()
      else {
        await checkDBPolicyPassword(data)
          .then(() => {
            callback()
          })
          .catch((err) => {
            callback(new Error(err.response.data.error.detail))
          })
      }
    },
    getCachedTemplateId(path) {
      return this.activeTemplateList.find((item) => item.path === path).id
    },
    openTemplateFullLoading(loadingText) {
      if (loadingText) this.templateLoadingInstance.setText(loadingText)
      else this.templateLoadingInstance.close()
    },
    async getTemplateList(force_update) {
      this.isClickUpdateTemplate = true
      if (force_update) {
        await syncGitlabTemplate()
      }
      await getGitlabTemplateList().then((res) => {
        this.templateList = res.data
      })
      this.isClickUpdateTemplate = false
    },
    handleTemplateSelect() {
      if (this.form.template_id !== '') {
        const idx = this.activeTemplateList.findIndex(
          (item) => item.id === this.form.template_id
        )
        this.focusTemplate = this.activeTemplateList[idx]
        this.form.tag_name = this.versionList[0] ? this.versionList[0].name : ''
        this.setCachedTemplates()
        this.handleVersionSelect()
      } else {
        this.$emit('clearTemplate')
        this.clearFocusTemplate()
      }
    },
    setCachedTemplates() {
      if (this.focusSources === 'Public Templates') {
        this.cachedTemplates.publicPath = this.focusTemplate.path
      } else {
        this.cachedTemplates.localPath = this.focusTemplate.path
      }
    },
    handleVersionSelect() {
      this.fetchTemplateParamsByVersion()
      if (!this.isLite) this.$emit('resetTemplate')
    },
    fetchTemplateParamsByVersion() {
      this.isLoadingTemplate = true
      let params = {}
      if (this.form.tag_name) {
        params = { tag_name: this.form.tag_name }
      }
      getTemplateDetail(this.form.template_id, params)
        .then((res) => {
          if (res.data.arguments) {
            this.handleArguments(res.data.arguments)
          } else {
            this.form.argumentsForm = []
          }
        })
        .catch((err) => {
          this.form.template_id = ''
          this.$emit('clearTemplate')
          this.clearFocusTemplate()
          console.error(err)
        })
        .finally(() => {
          this.isLoadingTemplate = false
        })
    },
    handleArguments(data) {
      this.form.argumentsForm = data.map((item) => {
        const result = item
        result.value = item.default_value
        return result
      })
    },
    clearFocusTemplate() {
      this.focusTemplate = {}
    }
  }
}
</script>
