<template>
  <el-row>
    <el-row v-loading="isLoading">
      <el-row
        :class="isMobile ? 'pb-1' : 'py-3'"
        :justify="isMobile ? 'space-between' : 'start'"
        :type="isMobile ? 'flex' : ''"
        class="flex justify-between"
      >
        <span
          :style="{ 'flex-basis': isShowZoom ? '75%' : '100%' }"
          class="flex items-center"
        >
          <span :class="isMobile ? 'flex' : ''" class="text-sm font-bold">
            <em v-if="isMobile" class="ri-file-info-fill mr-1"></em>
            {{ $t('Issue.Description') }}
          </span>
          <span class="ml-1">
            <el-tooltip
              v-if="(!edit && value !== '') || isMobile"
              :content="$t('Issue.ClickToEdit')"
              :enterable="false"
              :value="dataLoaded && value === ''"
              placement="right"
            >
              <el-button
                class="edit-btn align-middle cursor-pointer text-xl p-0"
                icon="el-icon-edit-outline"
                @click="checkEnableEditor"
              />
            </el-tooltip>
            <span v-else-if="edit && !isMobile">
              <el-button
                class="action"
                icon="el-icon-check"
                size="mini"
                type="success"
                @click="updateDescription"
              />
              <el-button
                class="action"
                icon="el-icon-close"
                size="mini"
                type="danger"
                @click="checkCancelInput"
              />
            </span>
          </span>
        </span>
        <span v-if="isShowZoom" class="flex w-1/4">
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
      <el-divider v-if="isMobile" />
      <el-col v-if="edit && !isMobile">
        <Editor
          id="descriptionEditor"
          ref="mdEditor"
          :height="viewerHeight"
          :initial-value="editorValue"
          :options="editorOptions"
          initial-edit-type="wysiwyg"
          preview-style="tab"
          @change="onChange"
          @keyup.native="onKeyEvent"
          @keydown.native="onKeyEvent"
        />
        <hr
          class="move-bar flex justify-center rounded-b-md w-1/4 mt-0"
          @mousedown="isMoving = true"
        />
      </el-col>
      <el-col v-else-if="!edit && value === '' && !isMobile">
        <el-tooltip
          :content="$t('Issue.ClickToEdit')"
          :enterable="false"
          placement="top"
        >
          <el-input
            :class="
              isButtonDisabled
                ? 'cursor-not-allowed'
                : 'cursor-text description'
            "
            :placeholder="
              $t('general.Input', { item: $t('Issue.Description') })
            "
            class="p-3 mr-1"
            @click.native="checkEnableEditor"
          />
        </el-tooltip>
      </el-col>
      <el-drawer
        v-else-if="edit && isMobile"
        v-loading="isLoading"
        :show-close="false"
        :visible.sync="toggleDrawer"
        class="drawer"
        destroy-on-close
        direction="btt"
        size="99%"
      >
        <div slot="title" class="title">
          <el-row
            class="font-bold items-center"
            justify="space-between"
            type="flex"
          >
            <span>
              <el-divider direction="vertical" />
              {{ $t('Issue.Description') }}
            </span>
            <span>
              <el-button
                class="action align-middle rounded-md"
                size="small"
                type="success"
                @click="updateDescription"
              >
                {{ $t('general.Save') }}
              </el-button>
              <el-button
                class="el-drawer__close-btn"
                icon="el-icon-close"
                size="mini"
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
          initial-edit-type="wysiwyg"
          preview-style="tab"
          @change="onChange"
          @keyup.native="onKeyEvent"
          @keydown.native="onKeyEvent"
        />
      </el-drawer>
      <el-col
        v-else-if="value !== ''"
        :class="
          isMobile
            ? 'border-solid border-2 border-grey-500 rounded'
            : !edit
              ? 'description'
              : ''
        "
        :style="{ cursor: isButtonDisabled ? 'not-allowed' : 'text' }"
        @dblclick.native.capture="checkEnableEditor"
      >
        <el-tooltip
          :content="$t('Issue.DoubleClickToEdit')"
          :enterable="false"
          :offset="100"
          placement="top"
        >
          <Viewer
            id="descriptionViewer"
            :key="componentKey"
            ref="mdViewer"
            :class="ellipsisStatus ? 'ellipsis truncate' : null"
            :initial-value="editorValue"
            class="px-1"
            @load="
              addLinkTarget()
              isFolded()
              addImageClickListener()
            "
          />
        </el-tooltip>
      </el-col>
      <div
        v-if="isMobile && value === ''"
        class="text-sm font-medium text-gray-400"
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
        {{
          !isMobile
            ? ellipsisStatus
              ? $t('general.Expand')
              : $t('general.Fold')
            : ''
        }}
      </el-link>
    </el-row>
  </el-row>
</template>

<script>
import { createMessage } from '@/api_v2/monitoring'
import { createPlainAttachment } from '@/api_v3/attachments'
import { updateIssue } from '@/api_v3/issues'
import colorVariables from '@/styles/theme/variables.module.scss'
import '@toast-ui/editor/dist/i18n/zh-tw'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import '@toast-ui/editor/dist/toastui-editor.css'
import { mapGetters } from 'vuex'

export default {
  name: 'IssueDescription',
  components: {
    Editor: () => import('@toast-ui/vue-editor').then(({ Editor }) => Editor),
    Viewer: () => import('@toast-ui/vue-editor').then(({ Viewer }) => Viewer)
  },
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
    issueSubject: {
      type: String,
      default: ''
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    },
    assigned: {
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
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    isShowZoom() {
      return !this.isMobile && !this.edit && this.value !== ''
    },
    isMobile() {
      return this.device === 'mobile'
    },
    editorValue() {
      return this.value.replaceAll(/\$\$/g, '').replaceAll(/widget\d+\s/g, '')
    },
    edit() {
      return this.isIssueEdited.description
    },
    editorOptions() {
      const options = {
        usageStatistics: false,
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
        hooks: {
          addImageBlobHook: async (blob, callback) => {
            const formData = new FormData()
            formData.append('file', blob)
            const response = await createPlainAttachment(formData)
            if (response.data && response.data.content_url) {
              const link = response.data.content_url
              callback(link, 'image in description')
            }
            return false
          }
        }
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
  },
  methods: {
    initZoom() {
      this.zoomSize = 0
      this.$nextTick(() => {
        this.zoom()
      })
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
      const descriptionEditorObj = document.getElementsByClassName(
        'ProseMirror toastui-editor-contents'
      )[0]
      if (descriptionViewerObj) {
        descriptionViewerObj.style.zoom = 100 + this.zoomSize + '%'
      }
      if (descriptionEditorObj) {
        descriptionEditorObj.style.zoom = 100 + this.zoomSize + '%'
      }
    },
    addLinkTarget() {
      const links = document.querySelectorAll('.toastui-editor-contents a')
      for (let i = 0; i < links.length; i++) {
        links[i].target = '_blank'
      }
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
        this.$confirm(
          this.$t('Notify.UnSavedNotes'),
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }
        )
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
        case clientHeight < 200:
          return '200px'
        case clientHeight > 600:
          return '600px'
        default:
          return clientHeight + 'px'
      }
    },
    enableEditor() {
      this.viewerHeight = this.calcViewerHeight()
      this.isIssueEdited.description = !this.isButtonDisabled
      this.initZoom()
      if (this.isMobile) {
        this.toggleDrawer = true
      }
    },
    async onChange(editorType) {
      this.editorType = editorType
      this.isChanged = true
      const description = this.$refs.mdEditor.invoke('getMarkdown')
      this.tagList = this.tagList.filter((tag) =>
        description.includes(tag.name)
      )
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
          ul.setAttribute(
            'style',
            `
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
          `
          )
          this.assigned.forEach((user, index) => {
            const li = document.createElement('li')
            if (index !== 0) li.setAttribute('class', 'mt-2')
            li.innerHTML = `${user.full_name}(#${user.username})`
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
        const user = this.assigned.find(
          (user) => text === `${user.full_name}(#${user.username})`
        )
        this.tagList.push({ id: user.id, name: text })
      }
      editor.replaceSelection(
        `@${text}`,
        this.editorType === 'wysiwyg' ? start - 1 : [start[0], start[1] - 1],
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
        const description = this.editorValue
        // this.$emit('filterImage', { value: description, sendForm })
        const sendData = { description }
        await updateIssue(this.issueId, sendData).then(() => {
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
        this.$confirm(
          this.$t('Notify.UnSavedDescription'),
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }
        )
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
          issue: `#${this.issueId} - ${this.issueSubject}`
        }),
        message: link,
        type_parameters: JSON.stringify({ user_ids: mentionList }),
        type_ids: '[3]',
        alert_level: '1'
      }
      await createMessage(data)
    },
    addImageClickListener() {
      const el = document.getElementById('descriptionViewer')
      if (!el) return
      const images = el.querySelectorAll('.toastui-editor-contents img')
      images.forEach((image) => {
        image.className = 'cursor-pointer'
        image.addEventListener('click', () => {
          window.open(image.src, '_blank')
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
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

.el-button--success {
  @include css-prefix(transition, all 0.6s ease);
  color: $success;
  border: 1px solid #989898;
  background: none;

  &:hover {
    color: #fff;
    border: 1px solid $success;
    background: $success;
  }
}

.el-button--danger {
  @include css-prefix(transition, all 0.6s ease);
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
    -ms-overflow-style: none; /* IE and Edge */
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
  .ellipsis {
    height: 6rem;
  }
}
</style>
