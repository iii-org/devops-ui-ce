<template>
  <el-popover
    v-model="isPopover"
    :title="$t('Issue.Issue') + $t('general.Share')"
    placement="bottom"
    trigger="click"
  >
    <el-form ref="form" v-loading="isLoading" :model="shareForm">
      <el-form-item
        :rules="{
          required: true,
          message: $t('Notify.NoEmpty'),
          trigger: 'blur'
        }"
        prop="user"
      >
        <el-select
          v-model="shareForm.user"
          :filter-method="setAssignTo"
          :placeholder="$t('RuleMsg.PleaseSelect') + $t('RuleMsg.Member')"
          clearable
          collapse-tags
          filterable
          multiple
        >
          <el-option
            v-for="user in assigned_to"
            :key="user.id"
            :label="user.full_name"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="mb-3" prop="message">
        <el-input v-model="shareForm.message" type="textarea" />
      </el-form-item>
      <span class="flex justify-between">
        <el-link
          :underline="false"
          icon="el-icon-copy-document"
          size="mini"
          @click="$emit('copyUrl')"
        >
          {{ $t('general.CopyUrl') }}
        </el-link>
        <el-button size="small" type="primary" @click="sendMentionMessage()">
          {{ $t('Inbox.Send') }}
          <em class="el-icon-s-promotion"></em>
        </el-button>
      </span>
    </el-form>
    <el-tooltip
      slot="reference"
      :content="$t('general.Share')"
      :disabled="isPopover"
      placement="bottom"
    >
      <el-button circle icon="el-icon-share" plain size="small" type="info" />
    </el-tooltip>
  </el-popover>
</template>

<script>
import { mapGetters } from 'vuex'
import { createMessage } from '@/api_v2/monitoring'

export default {
  name: 'ShareButton',
  props: {
    issue: {
      type: Object,
      default: () => ({})
    },
    assigned: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      isLoading: false,
      isPopover: false,
      shareForm: {
        user: [],
        message: ''
      },
      assigned_to: []
    }
  },
  computed: {
    ...mapGetters(['userName'])
  },
  watch: {
    isPopover(value) {
      if (value) this.assigned_to = [...this.assigned]
      else this.resetShareForm()
    }
  },
  methods: {
    setAssignTo(value) {
      const keyword = value.toLowerCase()
      this.assigned_to = this.assigned.filter((item) => {
        const { full_name, username } = item
        return (
          full_name.toLowerCase().indexOf(keyword) > -1 ||
          username.toLowerCase().indexOf(keyword) > -1
        )
      })
    },
    sendMentionMessage() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        this.isLoading = true
        const mentionList = [...new Set(this.shareForm.user)]
        if (mentionList.length === 0) return
        const { protocol, host } = location
        const url = `${protocol}//${host}/#/project/issues/${this.issue.id}`
        const link = `<a href="${url}" target="_blank">${url}</a>`
        const message = this.shareForm.message
        const data = {
          title: this.$t('Inbox.SharedIssueMessage', {
            name: this.userName,
            issue: `#${this.issue.id} - ${this.issue.subject}`
          }),
          message: message ? message + '<br/>' + link : link,
          type_parameters: JSON.stringify({ user_ids: mentionList }),
          type_ids: '[3]',
          alert_level: '1'
        }
        await createMessage(data)
          .then(() => {
            this.$message({
              title: this.$t('general.Success'),
              message: this.$t('Inbox.Sended'),
              type: 'success'
            })
          })
          .catch((err) => console.error(err))
          .finally(() => {
            this.resetShareForm()
            this.isLoading = false
            this.isPopover = false
          })
      })
    },
    resetShareForm() {
      this.shareForm.user = []
      this.shareForm.message = ''
    }
  }
}
</script>
