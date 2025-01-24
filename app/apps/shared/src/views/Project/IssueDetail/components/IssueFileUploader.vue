<template>
  <el-tabs class="shadow-none" type="border-card">
    <el-tab-pane label="Upload File">
      <el-upload
        ref="fileUploader"
        :accept="Object.keys(allowedFileType).join(', ')"
        :auto-upload="false"
        :on-change="handleChange"
        action=""
        drag
        multiple
      >
        <div>
          <el-button size="small" type="success">
            {{ $t('File.ChooseFile') }}
          </el-button>
          <div class="el-upload__text">
            {{ $t('File.DragFilesHere') }}
          </div>
          <div class="text-xs text-gray-400">
            <div>{{ $t('File.MaxFileSize') }}: {{ fileSizeLimit }}</div>
            <div>{{ $t('File.AllowedFileTypes') }}: {{ fileTypeLimit }}</div>
          </div>
        </div>
      </el-upload>
      <div class="flex justify-between mt-2">
        <div class="text-xs" style="line-height: 40px">
          *{{ $t('File.UploadWarning') }}: {{ specialSymbols }}
        </div>
        <div>
          <el-button
            :loading="isUploadLoading"
            type="primary"
            @click="handleUpload"
          >
            {{ $t('general.Save') }}
          </el-button>
        </div>
      </div>
    </el-tab-pane>
    <el-tab-pane label="Link Project Files">
      <div class="flex">
        <el-select
          v-model="attachment"
          v-loading="isLinkLoading"
          :remote-method="getProjectFiles"
          class="w-full mr-1"
          clearable
          filterable
          placeholder="Select Project File"
          remote
          value-key="attachment"
        >
          <el-option
            v-for="project in projectFiles"
            :key="project.id"
            :label="project.filename"
            :value="project.id"
          />
        </el-select>

        <el-button
          :disabled="!attachment || attachment === ''"
          :loading="isLinkLoading"
          type="primary"
          @click="handleLink"
        >
          {{ $t('general.Save') }}
        </el-button>
      </div>
    </el-tab-pane>
  </el-tabs>
</template>

<script>
import {
  getProjectAttachmentList,
  linkProjectIssueAttachment
} from '@/api_v3/attachments'
import {
  containSpecialChar,
  fileSizeToMB,
  isAllowedTypes
} from '@/utils/extension'
import { mapGetters } from 'vuex'
import { getLocalTime } from '../../../../utils/handleTime'

export default {
  name: 'IssueFileUploader',
  props: {
    issueId: {
      type: Number,
      default: null
    },
    issue: {
      type: Object,
      default: () => {}
    },
    isUploadLoading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      uploadFileList: [],
      projectFiles: [],
      attachment: '',
      specialSymbols: '\ / : * ? " < > | # { } % ~ &',
      isLinkLoading: false
    }
  },
  computed: {
    ...mapGetters(['fileSizeLimit', 'fileTypeLimit', 'allowedFileType'])
  },
  mounted() {
    this.getProjectFiles()
  },
  methods: {
    getLocalTime,
    async handleChange(file, fileList) {
      const { raw, size, name } = file
      if (!isAllowedTypes(raw.type)) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.UnsupportedFileFormat'),
          type: 'warning'
        })
        fileList.splice(fileList.length - 1, 1)
      } else if (
        fileSizeToMB(size) > Number(this.fileSizeLimit.replace(/\D/g, ''))
      ) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.FileSizeLimit', {
            size: this.fileSizeLimit
          }),
          type: 'warning'
        })
        fileList.splice(fileList.length - 1, 1)
      } else if (containSpecialChar(name)) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.FileNameLimit'),
          type: 'warning'
        })
        fileList.splice(fileList.length - 1, 1)
      } else {
        this.uploadFileList = fileList
      }
    },
    async getProjectFiles(query) {
      this.projectFiles = []
      this.isLinkLoading = true
      await getProjectAttachmentList(
        this.issue.project.id,
        this.getParams(query)
      )
        .then((res) => {
          this.projectFiles = res.data.items
        })
        .finally(() => {
          this.isLinkLoading = false
        })
    },
    getParams(query) {
      const result = {
        page: 1,
        limit: 5
      }
      if (query) {
        result.search = query
      } else {
        delete result.search
      }
      return result
    },
    handleUpload() {
      this.$emit('upload', this.uploadFileList)
    },
    async handleLink() {
      this.isLinkLoading = true
      await linkProjectIssueAttachment(this.issueId, this.attachment)
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.$emit('link', true)
        })
        .then(() => {
          this.isLinkLoading = false
        })
    },
    cleanData() {
      this.$refs.fileUploader.clearFiles()
      this.uploadFileList = []
      this.attachment = ''
    }
  }
}
</script>
