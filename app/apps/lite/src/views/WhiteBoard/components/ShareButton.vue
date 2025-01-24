<template>
  <el-popover
    v-model="isPopover"
    :title="$t('Plugins.excalidraw.Whiteboard') + $t('general.Share')"
    placement="right"
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
          :placeholder="$t('RuleMsg.PleaseSelect') + $t('RuleMsg.Member')"
          clearable
          collapse-tags
          filterable
          multiple
        >
          <el-option
            v-for="user in assignedTo"
            :key="user.id"
            :label="user.name"
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
          @click="copyUrl"
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
      <em
        class="el-icon-share info table-button"
        @click="$emit('loadData')"
      ></em>
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
      this.$copyText(this.url).then(() => {
        const message = this.$t('Notify.Copied')
        this.showSuccessMessage(message)
      })
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
