<template>
  <el-row v-loading="isLoading" :class="isMobile ? 'mobile' : ''">
    <el-col v-if="!isDrawer">
      <el-row class="text-sm font-bold py-3">
        {{ $t('Issue.Notes') }}
        <span v-if="edit">
          <el-button
            class="action"
            type="success"
            size="mini"
            icon="el-icon-check"
            @click="updateNotes"
          />
          <el-button
            class="action"
            type="danger"
            size="mini"
            icon="el-icon-close"
            @click="checkCancelInput"
          />
        </span>
      </el-row>
    </el-col>
    <el-col v-if="edit || isDrawer">
      <Editor
        ref="mdEditor"
        preview-style="tab"
        initial-edit-type="wysiwyg"
        :options="editorOptions"
        class="mx-3"
        :height="isDrawer ? '40vh' : '12rem'"
        @change="onChange"
        @keyup.native="onKeyEvent"
        @keydown.native="onKeyEvent"
      />
      <hr
        class="move-bar flex justify-center rounded-b-md w-1/4 mt-0"
        @mousedown="isMoving = true"
      >
    </el-col>
    <el-col v-else-if="!edit && !isDrawer">
      <el-tooltip
        :enterable="false"
        :content="$t('Issue.ClickToEdit')"
        placement="top"
      >
        <el-input
          class="p-3 mr-1"
          :class="isButtonDisabled ? 'cursor-not-allowed' : 'cursor-text notes'"
          :placeholder="$t('general.Input', { item: $t('Issue.Notes') })"
          @click.native="edit = !isButtonDisabled"
        />
      </el-tooltip>
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { updateIssue } from '@/api/issue'
import { createMessage } from '@/api_v2/monitoring'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/i18n/zh-tw'
import { Editor } from '@toast-ui/vue-editor'
import colorVariables from '@/styles/theme/variables.scss'

export default {
  name: 'IssueNotesEditor',
  components: { Editor },
  props: {
    issueId: {
      type: [String, Number],
      default: null
    },
    issueName: {
      type: String,
      default: ''
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    },
    assignedTo: {
      type: Array,
      default: () => []
    },
    isDrawer: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isLoading: false,
      isChanged: false,
      isMoving: false,
      edit: false,
      editorType: 'wysiwyg',
      mentionList: [],
      tagList: []
    }
  },
  computed: {
    ...mapGetters(['language', 'device']),
    isMobile() {
      return this.device === 'mobile'
    },
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    notes() {
      let notes = this.$refs.mdEditor
        ? this.$refs.mdEditor.invoke('getMarkdown')
        : ''
      notes = notes.replaceAll(/\$\$/g, '').replaceAll(/widget\d+\s/g, '')
      return notes
    },
    editorOptions() {
      const options = {
        minHeight: '100px',
        language: this.language,
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync']
        ]
      }
      if (!this.isLite) {
        options.widgetRules = [
          {
            rule: /@[^@$][\u4e00-\u9fa5~`!#$%^&*()_=+-\w\s]+\(#\w+\)/,
            toDOM(text) {
              const span = document.createElement('span')
              span.innerHTML = text
              span.style.color = colorVariables.active
              return span
            }
          }
        ]
      }
      return options
    }
  },
  methods: {
    onChange(editorType) {
      this.editorType = editorType
      this.isChanged = true
      this.tagList = this.tagList.filter((tag) => this.notes.includes(tag.name))
      this.mentionList = this.tagList.map((tag) => tag.id)
      this.$emit('input', this.notes)
    },
    onKeyEvent(event) {
      if (this.isLite) return
      if (event.type === 'keydown') {
        const { code, shiftKey } = event
        this.keyStatus = { code, shiftKey }
      } else {
        const { code, shiftKey } = this.keyStatus
        if (code === 'Digit2' && shiftKey) {
          const ul = document.createElement('ul')
          ul.addEventListener('mousedown', this.addTag)
          ul.setAttribute('class', 'cursor-pointer')
          ul.setAttribute('style', `
            z-index: 20;
            list-style: none;
            max-height: 5rem;
            overflow-y: auto;
            padding: 0.5rem;
            font-size: 14px;
            line-height: 1.2;
            border-radius: 4px;
            background-color: #ffffff;
            box-shadow: 0 2px 12px 0 rgba(0,0,0,.3);
          `)
          this.assignedTo.forEach((user, index) => {
            const li = document.createElement('li')
            if (index !== 0) li.setAttribute('class', 'mt-2')
            li.innerHTML = `${user.name}(#${user.login})`
            ul.appendChild(li)
          })
          this.$refs.mdEditor.editor.addWidget(ul, 'top')
        }
      }
    },
    addTag(event) {
      const editor = this.$refs.mdEditor.editor
      const text = event.target.textContent
      const [start, end] = editor.getSelection()
      if (!this.tagList.includes(text)) {
        const user = this.assignedTo.find((user) =>
          text === `${user.name}(#${user.login})`
        )
        this.tagList.push({ id: user.id, name: text })
      }
      editor.replaceSelection(`@${text}`,
        this.editorType === 'wysiwyg'
          ? start - 1
          : [start[0], start[1] - 1],
        end
      )
    },
    async updateNotes() {
      if (this.isChanged) {
        this.isLoading = true
        const sendForm = new FormData()
        this.$emit('filterImage', [this.notes, sendForm, true])
        sendForm.append('notes', this.notes)
        await updateIssue(this.issueId, sendForm).then(() => {
          this.$emit('update')
          this.edit = false
        })
        if (!this.isLite) {
          this.sendMentionMessage(this.mentionList)
        }
        this.isLoading = false
      } else {
        this.cancelInput()
      }
    },
    checkCancelInput() {
      if (this.isChanged) {
        this.$confirm(this.$t('Notify.UnSavedChanges'),
          this.$t('general.Warning'), {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          })
          .then(() => {
            this.cancelInput()
          })
          .catch()
      } else {
        this.cancelInput()
      }
    },
    cancelInput() {
      this.$refs.mdEditor.invoke('reset')
      this.edit = !this.issueId
      this.isChanged = false
    },
    async sendMentionMessage(mentionList) {
      mentionList = [...new Set(mentionList)]
      if (mentionList.length === 0) return
      const { protocol, host } = location
      const url = `${protocol}//${host}/#/project/issues/${this.issueId}`
      const link = `<a href="${url}" target="_blank">${url}</a>`
      const data = {
        title: this.$t('Inbox.MentionMessage', {
          name: this.userName,
          issue: `#${this.issueId} - ${this.issueName}`
        }),
        message: link,
        type_parameters: JSON.stringify({ user_ids: mentionList }),
        type_ids: '[3]',
        alert_level: '1'
      }
      await createMessage(data)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

.notes:hover {
  @apply bg-gray-100 rounded;
}

.move-bar {
  height: 6px;
  cursor: row-resize;
  background-color: gray;
}

.el-button--success{
  color: $success;
  border: 1px solid #989898;
  background: none;
  -webkit-transition: all .6s ease;
  transition: all .6s ease;
  &:hover {
    color: #fff;
    border: 1px solid $success;
    background: $success;
  }
}

.el-button--danger{
  color: $danger;
  border: 1px solid #989898;
  background: none;
  -webkit-transition: all .6s ease;
  transition: all .6s ease;
  &:hover {
    color: #fff;
    border: 1px solid $danger;
    background: $danger;
  }
}

.action {
  margin: 0;
  &.el-button--mini {
    padding: 5px;
  }
}
.mobile {
  ::v-deep .toastui-editor-popup {
    max-width: 250px;
    margin-left: 0px;
  }
  ::v-deep .toastui-editor-popup-add-table .toastui-editor-table-cell {
    width: 20px;
    height: 20px;
  }
  ::v-deep .toastui-editor-defaultUI-toolbar button {
    margin: 7px 0px;
  }
  ::v-deep .toastui-editor-defaultUI-toolbar {
    padding: 0 5px;
  }
  ::v-deep .toastui-editor-toolbar-divider {
    margin: 14px 0px;
  }
  ::v-deep .toastui-editor-dropdown-toolbar {
    right: 0px !important;
  }
}
</style>
