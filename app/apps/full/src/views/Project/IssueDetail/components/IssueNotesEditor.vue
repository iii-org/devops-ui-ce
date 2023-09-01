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
            @click="cancelInput"
          />
        </span>
      </el-row>
    </el-col>
    <el-col v-if="edit || isDrawer">
      <el-popover
        v-model="tagListVisible"
        :trigger="tagListVisible ? 'focus' : 'manual'"
        placement="top"
        width="auto"
        popper-class="p-0"
      >
        <ul
          class="my-0 py-3"
          style="overflow-y: auto; max-height: 6rem;"
          @scroll="tagListVisible = true"
        >
          <li
            v-for="(user,index) in assignedTo"
            :key="user.id"
            :class="{ 'mt-2': index !== 0}"
            class="cursor-pointer"
            @click="addTag"
          >
            {{ user.name }}
          </li>
        </ul>
        <Editor
          slot="reference"
          ref="mdEditor"
          initial-edit-type="wysiwyg"
          :options="editorOptions"
          class="mx-3"
          :height="isDrawer ? '40vh' : '12rem'"
          @change="onChange"
          @keydown.native="onKeydown"
        />
      </el-popover>
      <hr
        class="move-bar flex justify-center rounded-b-md w-1/4 mt-0"
        @mousedown="isMoving = true"
      >
    </el-col>
    <el-col v-else-if="!edit && !isDrawer">
      <div
        class="p-3 mr-1"
        :class="isButtonDisabled ? 'cursor-not-allowed' : 'cursor-text notes'"
      >
        <el-input
          :placeholder="$t('general.Input', { item: $t('Issue.Notes') })"
          @click.native="edit = !isButtonDisabled"
        />
      </div>
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { updateIssue } from '@/api/issue'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/i18n/zh-tw'
import { Editor } from '@toast-ui/vue-editor'

export default {
  name: 'IssueNotesEditor',
  components: { Editor },
  props: {
    issueId: {
      type: [String, Number],
      default: null
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
      edit: false,
      editorType: 'wysiwyg',
      mentionList: [],
      tagList: [],
      tagListVisible: false,
      isMoving: false
    }
  },
  computed: {
    ...mapGetters(['language', 'device']),
    isMobile() {
      return this.device === 'mobile'
    },
    editorOptions() {
      return {
        minHeight: '100px',
        language: this.language,
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync']
        ],
        widgetRules: [
          {
            rule: /@[\u4e00-\u9fa5~`!@#$%^&*()_\-+=\w\s]*&nbsp/,
            toDOM(text) {
              text = text.replace(/\$\$widget\d+\s/, '').replace(/\s\$\$/, '&nbsp')
              const span = document.createElement('span')
              span.innerHTML = `<a style="text-decoration: none; cursor: default; color: #4b96e6;">${text}</a>`
              return span
            }
          }
        ]
      }
    }
  },
  methods: {
    onChange(editorType) {
      this.editorType = editorType
      const notes = this.$refs.mdEditor.invoke('getMarkdown')
      this.tagList = this.tagList.filter((tag) => notes.includes(tag.name))
      this.mentionList = this.tagList.map((tag) => tag.id)
      this.$emit('input', this.$refs.mdEditor.invoke('getHTML'))
    },
    onKeydown(event) {
      const { code, shiftKey } = event
      if (code === 'Digit2' && shiftKey) this.tagListVisible = true
      else this.tagListVisible = false
    },
    addTag(event) {
      const editor = this.$refs.mdEditor.editor
      const text = event.target.outerText
      const outputText = `@${text}&nbsp`
      const [start, end] = editor.getSelection()
      if (!this.tagList.includes(outputText)) {
        this.tagList.push({
          id: this.assignedTo.find((user) => user.name === text).id,
          name: outputText
        })
      }
      this.tagListVisible = false
      if (this.editorType === 'wysiwyg') {
        editor.replaceSelection(outputText, start - 1, end)
      } else {
        editor.replaceSelection(outputText, [start[0], start[1] - 1], end)
      }
    },
    async updateNotes() {
      this.isLoading = true
      const sendForm = new FormData()
      let value = this.$refs.mdEditor.invoke('getHTML')
      if (value === '<p><br></p>') value = ''
      else if (value !== '') {
        this.$emit('filterImage', [value, sendForm, true])
        value = value.replace(/<a/g, '<a target="_blank"')
      }
      sendForm.append('notes', value)
      await updateIssue(this.issueId, sendForm).then(() => {
        this.$emit('update')
        this.edit = false
      })
      this.$emit('sendMentionMessage', this.mentionList)
      this.isLoading = false
    },
    cancelInput() {
      this.$refs.mdEditor.invoke('reset')
      this.edit = !this.issueId
    }
  }
}
</script>

<style lang="scss" scoped>
.notes:hover {
  @apply bg-gray-100 rounded;
}

.move-bar {
  height: 6px;
  cursor: row-resize;
  background-color: gray;
}

.el-button--success {
  color: #85ce61;
  border: 1px solid #989898;
  background: none;
  -webkit-transition: all .6s ease;
  transition: all .6s ease;
  &:hover {
    color: #fff;
    border: 1px solid #67c23a;
    background: #67c23a;
  }
}

.el-button--danger {
  color: #F56C6C;
  border: 1px solid #989898;
  background: none;
  -webkit-transition: all .6s ease;
  transition: all .6s ease;
  &:hover {
    color: #fff;
    border: 1px solid #F56C6C;
    background: #F56C6C;
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
