<template>
  <div class="mb-1">
    <div class="flex justify-between items-center">
      <div>
        <template v-if="issueId">
          <el-tooltip :content="$t('Issue.UploadFiles')" placement="bottom">
            <el-button
              :disabled="isButtonDisabled"
              class="px-2 py-1 m-0 icon"
              size="mini"
              @click="uploadDialogVisible = true"
            >
              <em class="el-icon-upload content"></em>
            </el-button>
          </el-tooltip>
          <el-tooltip
            :content="$t('general.Settings', { name: $t('Issue.Issue') })"
            placement="bottom"
          >
            <el-button
              :disabled="isButtonDisabled"
              class="px-2 py-1 m-0 icon"
              size="mini"
              @click="$emit('add-sub-issue')"
            >
              <em class="el-icon-document-add content"></em>
            </el-button>
          </el-tooltip>
        </template>
        <el-tooltip
          v-if="isExcalidrawEnable"
          :content="$t('Plugins.excalidraw.CreateBoard')"
          placement="bottom"
        >
          <el-button
            :disabled="isButtonDisabled"
            class="px-2 py-1 m-0 icon"
            size="mini"
            @click="toggleExcalidrawDialog"
          >
            <em class="el-icon-monitor content"></em>
          </el-button>
        </el-tooltip>
        <el-tooltip
          v-if="issue?.tracker?.name === 'Test Plan' && !isLite"
          :content="$t('Test.TestFile.ManageTestFile')"
          placement="bottom"
        >
          <el-button
            :disabled="isButtonDisabled"
            class="px-2 py-1 m-0 icon"
            size="mini"
            @click="handleCollectionDialog"
          >
            <em class="el-icon-folder content"></em>
          </el-button>
        </el-tooltip>
        <el-tooltip
          v-if="countRelationIssue > 0"
          :content="$t('Issue.TraceabilityMatrix')"
          placement="bottom"
        >
          <el-button
            :disabled="isOpenMatrix || isButtonDisabled"
            class="px-2 py-1 m-0 icon"
            size="mini"
            @click="$emit('toggle-issue-matrix')"
          >
            <em class="el-icon-data-line content"></em>
          </el-button>
        </el-tooltip>
      </div>
      <div class="text-right">
        <el-tooltip
          v-if="!isFromBoard"
          :content="$t('Issue.IssueSetting')"
          :disabled="isIssueFormOpened"
          class="ml-3 is-panel"
          placement="bottom"
        >
          <div
            class="handle-button inline p-1"
            style="background-color: #85c1e9"
            @click="$emit('changeIssueFormOpened')"
          >
            <em
              :class="
                isIssueFormOpened ? 'el-icon-d-arrow-right' : 'el-icon-setting'
              "
            ></em>
          </div>
        </el-tooltip>
      </div>
    </div>

    <el-dialog
      :title="$t('File.AddFile')"
      :visible.sync="uploadDialogVisible"
      append-to-body
      destroy-on-close
      top="10vh"
      width="50%"
    >
      <IssueFileUploader
        ref="IssueFileUploader"
        v-loading="isLoading"
        :is-upload-loading="isLoading"
        :issue="issue"
        :issue-id="issueId"
        @link="handleLinkClose"
        @upload="handleUploadClose"
      />
    </el-dialog>
    <el-dialog
      :title="$t('Plugins.excalidraw.CreateBoard')"
      :visible.sync="excalidrawDialogVisible"
      append-to-body
      destroy-on-close
      top="3vh"
      width="30%"
    >
      <el-input
        v-model="excalidrawName"
        v-loading="isLoading"
        :placeholder="$t('RuleMsg.PleaseInput') + $t('Plugins.excalidraw.Name')"
      />
      <span slot="footer" class="dialog-footer">
        <el-button :loading="isLoading" @click="toggleExcalidrawDialog">
          {{ $t('general.Close') }}
        </el-button>
        <el-button
          :disabled="!excalidrawName"
          :loading="isLoading"
          type="primary"
          @click="handleCreateExcalidraw"
        >
          {{ $t('general.Add') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { createExcalidraw } from '@/api_v2/excalidraw'
import { createIssueAttachment } from '@/api_v3/attachments'
import { mapGetters } from 'vuex'
import IssueFileUploader from './IssueFileUploader'

export default {
  name: 'IssueToolbar',
  components: { IssueFileUploader },
  props: {
    issue: {
      type: Object,
      default: () => {}
    },
    issueId: {
      type: [String, Number],
      default: null
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: String,
      default: ''
    },
    countRelationIssue: {
      type: Number,
      default: null
    },
    isOpenMatrix: {
      type: Boolean,
      default: false
    },
    isFromBoard: {
      type: Boolean,
      default: false
    },
    isIssueFormOpened: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoading: false,
      uploadDialogVisible: false,
      excalidrawDialogVisible: false,
      excalidrawName: '',
      form: {}
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'services']),
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    isExcalidrawEnable() {
      return this.services.excalidraw
    }
  },
  methods: {
    async handleUploadClose() {
      this.isLoading = true
      const sendForm = new FormData()
      const uploadFileList = this.$refs.IssueFileUploader.uploadFileList
      if (uploadFileList.length > 0) {
        await this.uploadFiles(sendForm, uploadFileList)
      }
      this.isLoading = false
      this.$refs.IssueFileUploader.cleanData()
      this.uploadDialogVisible = false
    },
    async uploadFiles(sendForm, fileList) {
      // use one by one edit issue to upload file
      const { issueId } = this
      try {
        fileList.forEach((item) => {
          sendForm.append('file', item.raw)
        })
        await createIssueAttachment(issueId, sendForm)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
      } catch (err) {
        console.error(err)
        this.$message({
          title: this.$t('general.Error'),
          message: err.message,
          type: 'error'
        })
      }
      this.loadingUpdate(false, true)
    },
    handleCollectionDialog() {
      this.$emit('related-collection', 'relatedCollection')
    },
    toggleExcalidrawDialog() {
      this.excalidrawDialogVisible = !this.excalidrawDialogVisible
      this.excalidrawName = ''
    },
    async handleCreateExcalidraw() {
      this.isLoading = true
      try {
        const sendData = new FormData()
        sendData.append('project_id', this.projectId)
        sendData.append('issue_ids', this.issueId)
        sendData.append('name', this.excalidrawName.trim())
        await createExcalidraw(sendData)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Added'),
          type: 'success'
        })
        this.$emit('updateWhiteBoard', this.excalidrawName.trim())
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoading = false
        this.toggleExcalidrawDialog()
      }
    },
    loadingUpdate(value, upload) {
      this.isLoading = value
      this.$emit('is-loading', { status: value, upload: upload })
    },
    handleLinkClose() {
      this.$refs.IssueFileUploader.cleanData()
      this.uploadDialogVisible = false
      this.loadingUpdate(false, true)
    }
  }
}
</script>

<style lang="scss" scoped>
.handle-button {
  text-align: center;
  font-size: 24px;
  border-radius: 6px 0 0 6px !important;
  z-index: 0;
  pointer-events: auto;
  cursor: pointer;
  color: #fff;
  line-height: 50px;

  i {
    font-size: 24px;
    line-height: 50px;
  }
}

.icon {
  background-color: #85c1e9;

  .content {
    color: white;
    font-size: 1.25rem;
  }
}

.icon:hover {
  box-shadow: 0 0 10px rgba(33, 33, 33, 0.2);
}
</style>
