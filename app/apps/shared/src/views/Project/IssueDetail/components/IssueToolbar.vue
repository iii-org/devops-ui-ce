<template>
  <div class="mb-1">
    <div class="flex justify-between items-center">
      <div>
        <template v-if="issueId">
          <el-tooltip
            :content="$t('Issue.UploadFiles')"
            placement="bottom"
          >
            <el-button
              :disabled="isButtonDisabled"
              size="mini"
              class="px-2 py-1 m-0 icon"
              @click="uploadDialogVisible = true"
            >
              <em class="el-icon-upload content" />
            </el-button>
          </el-tooltip>
          <el-tooltip
            :content="$t('general.Settings', { name: $t('Issue.Issue') })"
            placement="bottom"
          >
            <el-button
              :disabled="isButtonDisabled"
              size="mini"
              class="px-2 py-1 m-0 icon"
              @click="$emit('add-sub-issue')"
            >
              <em class="el-icon-document-add content" />
            </el-button>
          </el-tooltip>
        </template>
        <el-tooltip
          v-if="isExcalidrawEnable"
          :content="$t('Excalidraw.CreateBoard')"
          placement="bottom"
        >
          <el-button
            :disabled="isButtonDisabled"
            size="mini"
            class="px-2 py-1 m-0 icon"
            @click="toggleExcalidrawDialog"
          >
            <em class="el-icon-monitor content" />
          </el-button>
        </el-tooltip>
        <el-tooltip
          v-if="issueTracker === 'Test Plan' && !isLite"
          :content="$t('Test.TestFile.ManageTestFile')"
          placement="bottom"
        >
          <el-button
            :disabled="isButtonDisabled"
            size="mini"
            class="px-2 py-1 m-0 icon"
            @click="handleCollectionDialog"
          >
            <em class="el-icon-folder content" />
          </el-button>
        </el-tooltip>
        <el-tooltip
          v-if="countRelationIssue > 0"
          :content="$t('Issue.TraceabilityMatrix')"
          placement="bottom"
        >
          <el-button
            :class="isOpenMatrix ? 'button-info' : ''"
            :disabled="isOpenMatrix || isButtonDisabled"
            size="mini"
            class="px-2 py-1 m-0 icon"
            @click="$emit('toggle-issue-matrix')"
          >
            <em class="el-icon-data-line content" />
          </el-button>
        </el-tooltip>
      </div>
      <div class="text-right">
        <el-tooltip
          v-if="!isFromBoard"
          :content="$t('Issue.IssueSetting')"
          :disabled="isIssueFormOpened"
          placement="bottom"
          class="ml-3 is-panel"
        >
          <div
            class="handle-button inline p-1"
            style="background-color: #85c1e9;"
            @click="$emit('changeIssueFormOpened')"
          >
            <em :class="isIssueFormOpened ? 'el-icon-d-arrow-right' : 'el-icon-setting'" />
          </div>
        </el-tooltip>
      </div>
    </div>

    <el-dialog
      :visible.sync="uploadDialogVisible"
      :title="$t('Issue.UploadFiles')"
      top="3vh"
      append-to-body
    >
      <IssueFileUploader
        v-loading="isLoading"
        ref="IssueFileUploader"
        :issue-id="issueId"
      />
      <div class="flex justify-between mt-2">
        <div
          class="text-xs"
          style="line-height: 40px;"
        >
          *{{ $t('File.UploadWarning') }}: {{ specialSymbols }}
        </div>
        <div>
          <el-button
            :loading="isLoading"
            class="button-primary"
            @click="handleUploadClose"
          >
            {{ $t('general.Save') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      :visible.sync="excalidrawDialogVisible"
      :title="$t('Excalidraw.CreateBoard')"
      top="3vh"
      width="30%"
      destroy-on-close
      append-to-body
    >
      <el-input
        v-loading="isLoading"
        v-model="excalidrawName"
        :placeholder="$t('RuleMsg.PleaseInput') + $t('Excalidraw.Name')"
      />
      <span slot="footer" class="dialog-footer">
        <el-button
          :loading="isLoading"
          class="button-secondary-reverse"
          @click="toggleExcalidrawDialog"
        >
          {{ $t('general.Close') }}
        </el-button>
        <el-button
          :loading="isLoading"
          :disabled="!excalidrawName"
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
import { mapGetters } from 'vuex'
import { updateIssue } from '@/api/issue'
import { createExcalidraw } from '@/api_v2/excalidraw'
import IssueFileUploader from './IssueFileUploader'

export default {
  name: 'IssueToolbar',
  components: { IssueFileUploader },
  props: {
    issueLink: {
      type: String,
      default: null
    },
    issueId: {
      type: [String, Number],
      default: null
    },
    // issueName: {
    //   type: [String, Number],
    //   default: null
    // },
    issueTracker: {
      type: String,
      default: null
    },
    // row: {
    //   type: Object,
    //   default: () => ({})
    // },
    isButtonDisabled: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: Number,
      default: null
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
    // isAddSubIssue: {
    //   type: Boolean,
    //   default: false
    // }
  },
  data() {
    return {
      isLoading: false,
      uploadDialogVisible: false,
      excalidrawDialogVisible: false,
      excalidrawName: '',
      specialSymbols: '\ / : * ? " < > | # { } % ~ &',
      form: {}
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'isExcalidrawEnable']),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
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
      this.$refs.IssueFileUploader.$refs.fileUploader.clearFiles()
      this.$refs.IssueFileUploader.uploadFileList = []
      this.isLoading = false
      this.uploadDialogVisible = false
    },
    async uploadFiles(sendForm, fileList) {
      // use one by one edit issue to upload file
      const { issueId } = this
      try {
        fileList.forEach((item) => {
          sendForm.append('upload_files', item.raw)
        })
        await updateIssue(issueId, sendForm)
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
  box-shadow: 0 0 10px rgba(33,33,33,.2);
}
</style>
