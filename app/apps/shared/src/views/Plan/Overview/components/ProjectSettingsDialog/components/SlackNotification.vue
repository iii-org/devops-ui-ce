<template>
  <div v-loading="isLoading" class="m-3">
    <div class="flex items-center justify-between mb-4">
      <span
        :class="isMobile ? '' : 'flex items-center'"
        :style="isMobile ? 'line-height: 24px' : ''"
      >
        <span class="font-bold mr-3">{{ $t('Project.TriggerNotification') }}</span>
        <br v-if="isMobile">
        <el-switch
          v-model="active"
          :active-text="$t('general.Enable')"
          :inactive-text="$t('general.Disable')"
        />
      </span>
      <el-link :href="slackLink" type="primary" target="_blank">
        <em
          v-if="isMobile"
          class="ri-slack-fill text-lg rounded text-white bg-primary p-1"
        />
        <span v-else>{{ $t('general.AdvancedSettings') }}</span>
      </el-link>
    </div>
    <el-form
      v-if="active && !is_locked"
      ref="slackNotification"
      :model="form"
      :rules="rules"
      :label-width="!isMobile ? '100px' : ''"
      :label-position="isMobile ? 'top' : 'right'"
      class="pt-2"
    >
      <el-divider content-position="left">{{ $t('Project.TriggerCondition') }}</el-divider>
      <el-row :class="isMobile ? '' : 'mx-3'" :gutter="10" class="py-3">
        <el-col :lg="10" :md="24" class="mb-5">
          <el-checkbox v-model="form.commit_events" class="flex">
            <div>Push</div>
            <div class="text-xs" style="color: #303133">Trigger event for pushes to the repository.</div>
          </el-checkbox>
        </el-col>
        <el-col :lg="14" :md="24" class="mb-5">
          <el-checkbox v-model="form.merge_requests_events" class="flex">
            <div>Merge request</div>
            <div class="text-xs" style="color: #303133">Trigger event when a merge request is created, updated, or merged.</div>
          </el-checkbox>
        </el-col>
        <el-col :lg="10" :md="24" class="mb-5">
          <el-checkbox v-model="form.note_events" class="flex">
            <div>Note</div>
            <div class="text-xs" style="color: #303133">Trigger event for new comments.</div>
          </el-checkbox>
        </el-col>
        <el-col :lg="14" :md="24" class="mb-5">
          <el-checkbox v-model="form.tag_push_events" class="flex">
            <div>Tag push</div>
            <div class="text-xs" style="color: #303133">Trigger event for new tags pushed to the repository.</div>
          </el-checkbox>
        </el-col>
        <el-col :lg="10" :md="24" class="mb-5">
          <el-checkbox v-model="form.pipeline_events" class="flex">
            <div>Pipeline</div>
            <div class="text-xs" style="color: #303133">Trigger event when a pipeline status changes.</div>
          </el-checkbox>
        </el-col>
        <el-col :lg="14" :md="24" class="mb-5">
          <el-checkbox v-model="form.notify_only_broken_pipelines" class="flex">
            <div>Notify only broken pipelines</div>
            <div class="text-xs" style="color: #303133">Do not send notifications for successful pipelines.</div>
          </el-checkbox>
        </el-col>
      </el-row>
      <el-divider content-position="left">{{ $t('ProjectSettings.GeneralSettings') }}</el-divider>
      <el-row :class="isMobile ? '' : 'mx-3'" class="py-2">
        <el-col>
          <el-form-item label="WebHook" prop="webhook" style="line-height: 24px;">
            <el-input v-model="form.webhook" />
            <span class="text-xs">
              * 請⾄Slack(
              <el-link :href="slackHookLink" type="primary" target="_blank" class="text-xs">{{ slackHookLink }}</el-link>
              )建立聊天Channel 並產⽣WebHook，並貼⾄上⽅輸入框
            </span>
          </el-form-item>
        </el-col>
        <el-col>
          <el-form-item label="Username" prop="username">
            <el-input v-model="form.username" />
          </el-form-item>
        </el-col>
        <el-col>
          <el-form-item label="Branches" prop="branches_to_be_notified">
            <el-select v-model="form.branches_to_be_notified" class="w-full">
              <el-option
                v-for="item in branchesOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <span class="float-right">
        <el-button
          :size="isMobile ? 'small' : 'medium'"
          :loading="isLoading"
          class="button-secondary-reverse"
          @click="handleCancel"
        >
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button
          :size="isMobile ? 'small' : 'medium'"
          :loading="isLoading"
          class="button-primary"
          @click="handleConfirm"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-form>
    <div v-else-if="active && is_locked">
      <div class="notification-warning">
        <span>
          Please goto
          <el-link :href="slackLink" type="primary" target="_blank">{{ $t('general.AdvancedSettings') }}</el-link>
          to modify the data
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getGitlabIntegrations, getSlackNotification, updateSlackNotification, disableSlackNotification } from '@/api_v2/projects'
import defaultSettings from '@/settings'

const defaultForm = () => {
  return {
    webhook: '',
    username: '',
    notify_only_broken_pipelines: true,
    branches_to_be_notified: 'default',
    commit_events: true,
    job_events: true,
    merge_requests_events: true,
    note_events: true,
    pipeline_events: true,
    push_events: true,
    tag_push_events: true
  }
}
export default {
  name: 'SlackNotification',
  data() {
    return {
      active: false,
      is_locked: false,
      isLoading: false,
      form: defaultForm(),
      branchesOptions: [
        {
          label: 'All Branches',
          value: 'all'
        },
        {
          label: 'Default Branch',
          value: 'default'
        },
        {
          label: 'Protected Branches',
          value: 'protected'
        },
        {
          label: 'Default Branch and Protected Branches',
          value: 'default_and_protected'
        }
      ],
      rules: {
        webhook: [{ required: true, message: 'WebHook is required', trigger: 'blur' }],
        username: [{ required: true, message: 'Username is required', trigger: 'blur' }]
      },
      propKey: ['username', 'notify_only_broken_pipelines', 'branches_to_be_notified', 'webhook'],
      slackHookLink: 'https://my.slack.com/services/new/incoming-webhook',
      defaultSettings
    }
  },
  computed: {
    ...mapGetters(['device', 'selectedProject']),
    isMobile() {
      return this.device === 'mobile'
    },
    isLite() {
      return this.defaultSettings.type === 'LITE'
    },
    slackLink() {
      // remove .git
      const link = this.selectedProject.git_url.split('.').slice(0, -1).join('.')
      if (this.isLite) return `${link}/-/services/slack/edit`
      return `${link}/-/settings/integrations/slack/edit`
    }
  },
  watch: {
    active(val) {
      if (!val) {
        this.handleDisable()
      }
    },
    'form.commit_events'(val) {
      this.form.push_events = val
    },
    'form.pipeline_events'(val) {
      this.form.job_events = val
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.isLoading = true
      await getGitlabIntegrations(this.selectedProject.repository_ids[0])
        .then(async (res) => {
          if (res.data.length > 0 && res.data.find(o => o.slug === 'slack')) {
            await getSlackNotification(this.selectedProject.repository_ids[0])
              .then(resData => {
                this.active = resData.data.active
                if (resData.data?.is_locked) {
                  this.is_locked = true
                  return
                }
                this.assignFormData(resData)
              })
          } else {
            this.form = defaultForm()
          }
        })
        .catch(e => {
          console.error(e)
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    assignFormData(res) {
      Object.keys(this.form).forEach(key => {
        if (this.propKey.includes(key)) {
          this.form[key] = res.data.properties[key]
        } else {
          this.form[key] = res.data[key]
        }
      })
    },
    async handleDisable() {
      this.isLoading = true
      await disableSlackNotification(this.selectedProject.repository_ids[0])
        .then(() => {
          this.form = defaultForm()
          this.active = false
          this.is_locked = false
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
        })
        .catch(() => {
          this.active = true
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    handleCancel() {
      this.$emit('handleCancel')
    },
    async handleConfirm() {
      this.$refs.slackNotification.validate(async valid => {
        if (!valid) return
        this.isLoading = true
        await updateSlackNotification(this.selectedProject.repository_ids[0], this.form)
          .then(res => {
            this.assignFormData(res)
            this.$message({
              title: this.$t('general.Success'),
              message: this.$t('Notify.Updated'),
              type: 'success'
            })
          })
          .finally(() => {
            this.isLoading = false
          })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-checkbox__input {
    margin-top: 2px;
  }
}
</style>
