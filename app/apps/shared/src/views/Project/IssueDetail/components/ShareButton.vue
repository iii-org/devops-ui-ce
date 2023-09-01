<template>
  <el-popover
    v-model="isPopover"
    :title="$t('Issue.Issue') + $t('general.Share')"
    placement="bottom"
    trigger="click"
  >
    <el-form
      ref="form"
      v-loading="isLoading"
      :model="shareForm"
    >
      <el-form-item
        prop="user"
        :rules="{
          required: true,
          message: $t('Notify.NoEmpty'),
          trigger: 'blur'
        } "
      >
        <el-select
          v-model="shareForm.user"
          :placeholder="$t('RuleMsg.PleaseSelect') + $t('RuleMsg.Member')"
          clearable
          filterable
          multiple
          collapse-tags
        >
          <el-option
            v-for="user in assignedTo"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        prop="message"
        class="mb-3"
      >
        <el-input
          v-model="shareForm.message"
          type="textarea"
        />
      </el-form-item>
      <span class="flex justify-between">
        <el-link
          icon="el-icon-copy-document"
          size="mini"
          :underline="false"
          @click="$emit('copyUrl')"
        >
          {{ $t('general.CopyUrl') }}
        </el-link>
        <el-button
          type="primary"
          size="small"
          @click="sendMentionMessage()"
        >
          {{ $t('Inbox.Send') }}
          <em class="el-icon-s-promotion" />
        </el-button>
      </span>
    </el-form>
    <el-tooltip
      slot="reference"
      :disabled="isPopover"
      :content="$t('general.Share')"
      placement="bottom"
    >
      <el-button
        circle
        size="small"
        class="buttonInfoReverse"
        type="info"
        icon="el-icon-share"
      />
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
    assignedTo: {
      type: Array,
      default: () => ([])
    }
  },
  data() {
    return {
      isLoading: false,
      isPopover: false,
      shareForm: {
        user: [],
        message: ''
      }
    }
  },
  computed: {
    ...mapGetters(['userName'])
  },
  watch: {
    isPopover(value) {
      if (!value) this.resetShareForm()
    }
  },
  methods: {
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
            issue: `#${this.issue.id} - ${this.issue.name}`
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
