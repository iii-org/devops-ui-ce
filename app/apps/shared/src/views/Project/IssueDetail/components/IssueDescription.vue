<template>
  <el-row>
    <el-row
      v-loading="isLoading"
      :class="!edit ? 'description' : ''"
      :style="{ cursor: isButtonDisabled ? 'not-allowed' : 'text' }"
      @dblclick.native.capture="enableEditor"
    >
      <el-row
        class="text-sm font-bold items-center"
        :class="device === 'mobile' ? 'pb-1' : 'py-3'"
        :type="device === 'mobile' ? 'flex' : ''"
        :justify="device === 'mobile' ? 'space-between' : 'start'"
      >
        <span :class="device === 'mobile' ? 'flex' : ''">
          <em v-if="device === 'mobile'" class="ri-file-info-fill mr-1" />
          {{ $t('Issue.Description') }}
        </span>
        <em
          v-if="!edit"
          class="el-icon-edit-outline cursor-pointer align-middle text-xl"
          @click="enableEditor"
        />
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
            @click="cancelInput"
          />
        </span>
      </el-row>
      <el-divider v-if="device === 'mobile'" />
      <el-col v-if="edit && device === 'desktop'">
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
              v-for="(user, index) in assignedTo"
              :key="user.id"
              :class="{ 'mt-2': index !== 0}"
              class="cursor-pointer"
              @click="addTag"
            >
              {{ user.name }}
            </li>
          </ul>
          <Editor
            id="descriptionEditor"
            slot="reference"
            ref="mdEditor"
            initial-edit-type="wysiwyg"
            :initial-value="editorValue"
            :options="editorOptions"
            height="15rem"
            @change="onChange"
            @keydown.native="onKeydown"
          />
        </el-popover>
        <hr
          class="move-bar flex justify-center rounded-b-md w-1/4 mt-0"
          @mousedown="isMoving = true"
        >
      </el-col>
      <el-drawer
        v-else-if="edit && device === 'mobile'"
        v-loading="isLoading"
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
                class="action buttonSecondary align-middle rounded-md"
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
            @scroll="cancelInput"
          >
            <li
              v-for="(user, index) in assignedTo"
              :key="user.id"
              :class="{ 'mt-2': index !== 0}"
              class="cursor-pointer"
              @click="addTag"
            >
              {{ user.name }}
            </li>
          </ul>
          <Editor
            id="descriptionEditor"
            slot="reference"
            ref="mdEditor"
            initial-edit-type="wysiwyg"
            :initial-value="editorValue"
            :options="editorOptions"
            height="auto"
            @change="onChange"
            @keydown.native="onKeydown"
          />
        </el-popover>
      </el-drawer>
      <el-col
        v-else-if="value && value !== '<p><br></p>'"
        :class="device === 'mobile' ? 'border-solid border-2 border-grey-500 rounded' : ''"
      >
        <Viewer
          id="descriptionViewer"
          ref="mdViewer"
          :key="componentKey"
          :initial-value="editorValue"
          class="px-1"
          :class="ellipsisStatus ? 'ellipsis' : null"
          @load="addLinkTarget(); isFolded()"
        />
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
        class="table m-auto my-3"
        type="info"
        :underline="false"
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
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import '@toast-ui/editor/dist/i18n/zh-tw'
import { Editor, Viewer } from '@toast-ui/vue-editor'

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
    }
  },
  data() {
    return {
      isLoading: false,
      edit: false,
      componentKey: 0,
      editorType: 'wysiwyg',
      mentionList: [],
      tagList: [],
      tagListVisible: false,
      ellipsisStatus: false,
      isViewerFolded: true,
      isMoving: false,
      toggleDrawer: false
    }
  },
  computed: {
    ...mapGetters(['language', 'device']),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    editorValue() {
      return this.value.replaceAll(/\$\$widget\d+\s/g, '').replaceAll(/\s\$\$/g, '')
    },
    editorOptions() {
      const options = {
        minHeight: '100px',
        language: this.language,
        hideModeSwitch: true,
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
            rule: /@[\u4e00-\u9fa5~`!@#$%^&*()_\-+=\w\s]*\s/,
            toDOM(text) {
              const span = document.createElement('span')
              span.style.color = '#4b96e6'
              span.innerHTML = text
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
      this.ellipsisStatus = true
    },
    toggleDrawer(val) {
      if (!val) this.cancelInput()
    }
    // oldValue() {
    //   this.edit = !this.issueId
    // }
  },
  methods: {
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
    onChange(editorType) {
      this.editorType = editorType
      const description = this.$refs.mdEditor.invoke('getMarkdown')
      this.tagList = this.tagList.filter((tag) => description.includes(tag.name))
      this.mentionList = this.tagList.map((tag) => tag.id)
      this.$emit('input', description)
    },
    onKeydown(event) {
      if (this.isLite) return
      const { code, shiftKey } = event
      if (code === 'Digit2' && shiftKey) this.tagListVisible = true
      else this.tagListVisible = false
    },
    addTag(event) {
      const editor = this.$refs.mdEditor.editor
      const text = event.target.outerText
      const outputText = `@${text} `
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
    async updateDescription() {
      this.isLoading = true
      const sendForm = new FormData()
      const value = this.editorValue
      this.$emit('filterImage', [value, sendForm, true])
      sendForm.append('description', value)
      await updateIssue(this.issueId, sendForm).then(() => {
        this.$emit('update')
        this.edit = false
        this.toggleDrawer = false
      })
      if (!this.isLite) this.$emit('sendMentionMessage', this.mentionList)
      this.initTagList()
      this.isLoading = false
    },
    initTagList() {
      this.mentionList = []
      this.tagList = []
    },
    enableEditor(event) {
      if (event.target.href) return
      this.edit = !this.isButtonDisabled
      this.initZoom()
      if (this.device === 'mobile') {
        this.toggleDrawer = true
      }
    },
    cancelInput() {
      this.$emit('input', this.oldValue)
      this.edit = !this.issueId
      this.toggleDrawer = false
      this.initZoom()
    },
    initZoom() {
      this.$nextTick(() => { this.$emit('zoom') })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
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
@media only screen and (max-width: 768px) {
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
  @apply whitespace-normal overflow-hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  font-size: 1rem;
  line-height: 1.5rem;
  height: auto;
  line-break: auto;
}
@supports (-webkit-touch-callout: none) or (background: -webkit-named-image(i)) {
  .ellipsis { height: 6rem; }
}
</style>
