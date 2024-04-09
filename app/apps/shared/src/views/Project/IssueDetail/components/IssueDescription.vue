<template>
  <el-row>
    <el-row v-loading="isLoading">
      <el-row
        :class="device === 'mobile' ? 'pb-1' : 'py-3'"
        :type="device === 'mobile' ? 'flex' : ''"
        :justify="device === 'mobile' ? 'space-between' : 'start'"
        class="flex justify-between"
      >
        <span
          :style="{ 'flex-basis': isShowZoom ? '75%' : '100%' }"
          class="flex items-center"
        >
          <span
            :class="device === 'mobile' ? 'flex' : ''"
            class="text-sm font-bold"
          >
            <em
              v-if="device === 'mobile'"
              class="ri-file-info-fill mr-1"
            />
            {{ $t('Issue.Description') }}
          </span>
          <span class="ml-1">
            <el-tooltip
              v-if="!edit && value !== ''"
              :value="dataLoaded && value === ''"
              :enterable="false"
              :content="$t('Issue.ClickToEdit')"
              placement="right"
            >
              <el-button
                class="edit-btn align-middle cursor-pointer text-xl p-0"
                icon="el-icon-edit-outline"
                @click="checkEnableEditor"
              />
            </el-tooltip>
            <span v-else-if="edit && device === 'desktop'">
              <el-button
                class="action"
                type="success"
                size="mini"
                icon="el-icon-check"
                @click="updateDescription"
              />
              <el-button
                class="action"
                type="danger"
                size="mini"
                icon="el-icon-close"
                @click="checkCancelInput"
              />
            </span>
          </span>
        </span>
        <span
          v-if="isShowZoom"
          class="flex w-1/4"
        >
          <el-link
            :underline="false"
            icon="el-icon-zoom-out"
            @click="zoomOut()"
          />
          <el-slider
            v-model="zoomSize"
            class="inline-block w-3/4 px-3"
            @change="zoom()"
          />
          <el-link
            :underline="false"
            icon="el-icon-zoom-in"
            @click="zoomIn()"
          />
        </span>
      </el-row>
      <el-divider v-if="device === 'mobile'" />
      <el-col v-if="edit && device === 'desktop'">
        <Editor
          id="descriptionEditor"
          ref="mdEditor"
          :height="viewerHeight"
          :initial-value="editorValue"
          :options="editorOptions"
          preview-style="tab"
          initial-edit-type="wysiwyg"
          @change="onChange"
          @keyup.native="onKeyEvent"
          @keydown.native="onKeyEvent"
        />
        <hr
          class="move-bar flex justify-center rounded-b-md w-1/4 mt-0"
          @mousedown="isMoving = true"
        >
      </el-col>
      <el-col v-else-if="!edit && value === '' && device !== 'mobile'">
        <el-tooltip
          :enterable="false"
          :content="$t('Issue.ClickToEdit')"
          placement="top"
        >
          <el-input
            :class="isButtonDisabled ? 'cursor-not-allowed' : 'cursor-text description'"
            :placeholder="$t('general.Input', { item: $t('Issue.Description') })"
            class="p-3 mr-1"
            @click.native="checkEnableEditor"
          />
        </el-tooltip>
      </el-col>
      <el-drawer
        v-loading="isLoading"
        v-else-if="edit && device === 'mobile'"
        :visible.sync="toggleDrawer"
        :show-close="false"
        direction="btt"
        class="drawer"
        size="99%"
        destroy-on-close
      >
        <div slot="title" class="title">
          <el-row
            class="font-bold items-center"
            type="flex"
            justify="space-between"
          >
            <span>
              <el-divider direction="vertical" />
              {{ $t('Issue.Description') }}
            </span>
            <span>
              <el-button
                class="action button-secondary align-middle rounded-md"
                size="small"
                @click="updateDescription"
              >
                {{ $t('general.Save') }}
              </el-button>
              <el-button
                class="el-drawer__close-btn"
                size="mini"
                icon="el-icon-close"
                @click="cancelInput"
              />
            </span>
          </el-row>
        </div>
        <Editor
          id="descriptionEditor"
          ref="mdEditor"
          :initial-value="editorValue"
          :options="editorOptions"
          height="auto"
          preview-style="tab"
          initial-edit-type="wysiwyg"
          @change="onChange"
          @keyup.native="onKeyEvent"
          @keydown.native="onKeyEvent"
        />
      </el-drawer>
      <el-col
        v-else-if="value !== ''"
        :class="device === 'mobile' ?
          'border-solid border-2 border-grey-500 rounded' :
        !edit ? 'description' : ''"
        :style="{ cursor: isButtonDisabled ? 'not-allowed' : 'text' }"
        @dblclick.native.capture="checkEnableEditor"
      >
        <el-tooltip
          :enterable="false"
          :content="$t('Issue.DoubleClickToEdit')"
          :offset="100"
          placement="top"
        >
          <Viewer
            id="descriptionViewer"
            ref="mdViewer"
            :key="componentKey"
            :initial-value="editorValue"
            :class="ellipsisStatus ? 'ellipsis truncate' : null"
            class="px-1"
            @load="addLinkTarget(); isFolded()"
          />
        </el-tooltip>
      </el-col>
      <div
        v-if="device === 'mobile' && value === ''"
        class="text-sm font-medium text-gray-400 "
      >
        {{ $t('general.NoData') }}
      </div>
    </el-row>
    <el-row v-if="value !== ''">
      <el-link
        v-if="isViewerFolded && !edit"
        :icon="ellipsisStatus ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
        :underline="false"
        class="table m-auto my-3"
        type="info"
        @click="ellipsisStatus = !ellipsisStatus"
      >
        {{ device === 'desktop' ? ellipsisStatus ? $t('general.Expand') : $t('general.Fold') : '' }}
      </el-link>
    </el-row>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { updateIssue } from '@/api/issue'
import { createMessage } from '@/api_v2/monitoring'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import '@toast-ui/editor/dist/i18n/zh-tw'
import { Editor, Viewer } from '@toast-ui/vue-editor'
import colorVariables from '@/styles/theme/variables.scss'

export default {
  name: 'IssueDescription',
  components: { Editor, Viewer },
  props: {
    value: {
      type: String,
      default: null
    },
    oldValue: {
      type: String,
      default: null
    },
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
    issueFormWidth: {
      type: Number,
      default: 80
    },
    dataLoaded: {
      type: Boolean,
      default: false
    },
    isIssueEdited: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isLoading: false,
      isChanged: false,
      isMoving: false,
      componentKey: 0,
      editorType: 'wysiwyg',
      mentionList: [],
      tagList: [],
      ellipsisStatus: true,
      isViewerFolded: true,
      viewerHeight: 0,
      toggleDrawer: false,
      keyStatus: {},
      zoomSize: 0
    }
  },
  computed: {
    ...mapGetters(['language', 'device']),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    isShowZoom() {
      return this.device === 'desktop' && !this.edit && this.value !== ''
    },
    editorValue() {
      return this.value.replaceAll(/\$\$/g, '').replaceAll(/widget\d+\s/g, '')
    },
    edit() {
      return this.isIssueEdited.description
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
  watch: {
    value() {
      this.componentKey += 1
    },
    toggleDrawer(val) {
      if (!val) this.cancelInput()
    }
    // oldValue() {
    //   this.edit = !this.issueId
    // }
  },
  methods: {
    initZoom() {
      this.zoomSize = 0
      this.$nextTick(() => { this.zoom() })
    },
    zoomIn() {
      this.zoomSize += 10
      this.zoom()
    },
    zoomOut() {
      this.zoomSize -= 10
      this.zoom()
    },
    zoom() {
      if (this.zoomSize > 100) this.zoomSize = 100
      else if (this.zoomSize < 0) this.zoomSize = 0
      const descriptionViewerObj = document.getElementById('descriptionViewer')
      const descriptionEditorObj = document.getElementsByClassName('ProseMirror toastui-editor-contents')[0]
      if (descriptionViewerObj) descriptionViewerObj.style.zoom = 100 + this.zoomSize + '%'
      if (descriptionEditorObj) descriptionEditorObj.style.zoom = 100 + this.zoomSize + '%'
    },
    addLinkTarget() {
      const links = document.querySelectorAll('.toastui-editor-contents a')
      for (let i = 0; i < links.length; i++) { links[i].target = '_blank' }
    },
    isFolded() {
      const el = this.$refs.mdViewer.$el
      this.$nextTick(() => {
        if (el.clientHeight !== el.scrollHeight) {
          this.isViewerFolded = el.clientHeight < el.scrollHeight
        } else {
          this.isViewerFolded = el.clientHeight > this.issueFormWidth
        }
      })
    },
    checkEnableEditor(event) {
      if (event.target.href) return
      if (this.isIssueEdited.notes) {
        this.$confirm(this.$t('Notify.UnSavedNotes'),
          this.$t('general.Warning'), {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          })
          .then(() => {
            this.isIssueEdited.notes = false
            this.enableEditor()
          })
          .catch()
      } else {
        this.enableEditor()
      }
    },
    calcViewerHeight() {
      if (!this.$refs.mdViewer) return '200px'
      const clientHeight = this.$refs.mdViewer.$el.clientHeight + 125
      switch (true) {
        case (clientHeight < 200):
          return '200px'
        case (clientHeight > 600):
          return '600px'
        default:
          return clientHeight + 'px'
      }
    },
    enableEditor() {
      this.viewerHeight = this.calcViewerHeight()
      this.isIssueEdited.description = !this.isButtonDisabled
      this.initZoom()
      if (this.device === 'mobile') {
        this.toggleDrawer = true
      }
    },
    onChange(editorType) {
      this.editorType = editorType
      this.isChanged = true
      const description = this.$refs.mdEditor.invoke('getMarkdown')
      this.tagList = this.tagList.filter((tag) => description.includes(tag.name))
      this.mentionList = this.tagList.map((tag) => tag.id)
      this.$emit('input', description)
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
    initTagList() {
      this.mentionList = []
      this.tagList = []
    },
    async updateDescription() {
      if (this.isChanged) {
        this.isLoading = true
        const sendForm = new FormData()
        const description = this.editorValue
        this.$emit('filterImage', [description, sendForm, true])
        sendForm.append('description', description)
        await updateIssue(this.issueId, sendForm).then(() => {
          this.$emit('update')
          this.isIssueEdited.description = false
          this.toggleDrawer = false
        })
        if (!this.isLite) {
          this.sendMentionMessage(this.mentionList)
        }
        this.initZoom()
        this.initTagList()
        this.isLoading = false
      } else {
        this.cancelInput()
      }
    },
    checkCancelInput() {
      if (this.isChanged) {
        this.$confirm(this.$t('Notify.UnSavedDescription'),
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
      this.$emit('input', this.oldValue)
      this.isIssueEdited.description = !this.issueId
      this.isChanged = false
      this.toggleDrawer = false
      this.initZoom()
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
@import 'src/styles/theme/mixin.scss';

.description:hover {
  @apply bg-gray-100 rounded;
}

.move-bar {
  height: 6px;
  cursor: row-resize;
  background-color: $info;
}

.edit-btn {
  border: none;
  background-color: transparent;
}

.edit-btn:hover {
  background-color: transparent;
}

.el-button--success{
  @include css-prefix(transition, all .6s ease);
  color: $success;
  border: 1px solid #989898;
  background: none;
  &:hover {
    color: #fff;
    border: 1px solid $success;
    background: $success;
  }
}

.el-button--danger{
  @include css-prefix(transition, all .6s ease);
  color: $danger;
  border: 1px solid #989898;
  background: none;
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
.drawer {
  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    padding: 10px;
  }
  ::v-deep .toastui-editor-defaultUI {
    border: none;
  }
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }
  ::v-deep .el-drawer__body::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }
  ::v-deep .el-drawer__body {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .title {
    ::v-deep .el-divider--vertical {
      width: 6px;
      margin: 0;
      border-radius: 3px 0 0 3px;
      height: 18px;
      background-color: $warning !important;
    }
    .el-button--text {
      padding: 0;
      color: $linkTextColor;
      &:hover {
        color: $linkTextColor;
      }
    }
  }
  // ::v-deep .toastui-editor-toolbar {
  //   position: sticky;
  //   top: -1px;
  //   z-index: 21;
  //   border-top: 1px solid #ebeef5;
  // }
  ::v-deep .toastui-editor-defaultUI-toolbar {
    padding: 0 6px;
  }
}
@include tablet {
  ::v-deep .toastui-editor-popup {
    max-width: 250px;
    margin-left: -60px;
  }
  ::v-deep .toastui-editor-toolbar {
    border-top: none !important;
  }
  ::v-deep .toastui-editor-popup-add-table .toastui-editor-table-cell {
    width: 30px;
    height: 30px;
  }
  ::v-deep .toastui-editor-defaultUI-toolbar button {
    margin: 7px -3px;
  }
}
.ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 1rem;
  line-height: 1.5rem;
  height: auto;
  line-break: auto;
}
@supports (-webkit-touch-callout: none) or (background: -webkit-named-image(i)) {
  .ellipsis { height: 6rem; }
}
</style>
