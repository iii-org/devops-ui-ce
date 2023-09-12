<template>
  <el-popover
    v-model="isPopover"
    :title="$t('Excalidraw.Whiteboard') + $t('general.Share')"
    placement="right"
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
        }"
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
          @click="copyUrl"
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
      <em
        class="el-icon-share info operate-button"
        @click="$emit('loadData')"
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
    row: {
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
    ...mapGetters(['userName', 'selectedProject', 'selectedProjectId']),
    url() {
      const { protocol, host } = location
      return `${protocol}//${host}/#/project/${this.selectedProject.name}/whiteboard/${this.row.id}`
    }
  },
  watch: {
    isPopover(value) {
      if (!value) this.resetShareForm()
    }
  },
  methods: {
    copyUrl() {
      const message = this.$t('Notify.Copied')
      const input = document.createElement('input')
      input.value = this.url
      document.body.appendChild(input)
      input.select()
      document.execCommand('Copy')
      input.remove()
      this.showSuccessMessage(message)
    },
    sendMentionMessage() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        this.isLoading = true
        const mentionList = [...new Set(this.shareForm.user)]
        if (mentionList.length === 0) return
        const link = `<a href="${this.url}" target="_blank">${this.url}</a>`
        const message = this.shareForm.message
        const data = {
          title: this.$t('Inbox.SharedWhiteBoardMessage', {
            name: this.userName,
            whiteboard: this.row.name
          }),
          message: message ? message + '<br/>' + link : link,
          type_parameters: JSON.stringify({ user_ids: mentionList }),
          type_ids: '[3]',
          alert_level: '1'
        }
        await createMessage(data)
        this.resetShareForm()
        this.isLoading = false
      })
    },
    resetShareForm() {
      this.shareForm.user = []
      this.shareForm.message = ''
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    }
  }
}
</script>
