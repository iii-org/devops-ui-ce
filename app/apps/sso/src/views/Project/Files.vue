<template>
  <div class="app-container">
    <ProjectListSelector>
      <el-button
        slot="button"
        :disabled="selectedProjectId === -1"
        icon="el-icon-plus"
        class="buttonPrimary"
        :size="isMobile ? 'small' : 'medium'"
        @click="handleAdding"
      >
        <span v-if="!isMobile">{{ $t('File.AddFile') }}</span>
      </el-button>
      <el-input
        v-model="keyword"
        prefix-icon="el-icon-search"
        :placeholder="$t('general.SearchName')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? '100px' : '250px' }"
      />
    </ProjectListSelector>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :data="pagedData"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      fit
      highlight-current-row
    >
      <template v-slot:actions="{row}">
        <el-tooltip
          placement="bottom"
          :content="$t('File.Download')"
        >
          <em
            :class="isDownloading
              ? 'ri-loader-2-line active operate-button'
              : 'ri-download-line active operate-button'"
            @click="handleDownload(row)"
          />
        </el-tooltip>
        <el-tooltip
          v-permission="['Administrator','Project Manager','QA']"
          placement="bottom"
          :content="$t('general.Delete')"
        >
          <el-popconfirm
            :confirm-button-text="$t('general.Delete')"
            :cancel-button-text="$t('general.Cancel')"
            icon="el-icon-info"
            popper-class="danger"
            :title="$t('Notify.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <em
              slot="reference"
              class="ri-delete-bin-2-line danger operate-button"
            />
          </el-popconfirm>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
    <el-dialog
      :title="$t('File.AddFile')"
      :visible.sync="dialogVisible"
      :width="isMobile ? '95%' : '50%'"
      :close-on-click-modal="false"
      @closed="onDialogClosed"
    >
      <el-form
        ref="fileForm"
        :model="fileForm"
        :label-width="isMobile ? '' : '70px'"
      >
        <el-form-item
          :label="$t('File.Upload')"
          prop="upload"
        >
          <el-upload
            ref="upload"
            drag
            action=""
            :auto-upload="false"
            :limit="1"
            :on-exceed="handleExceed"
            :on-change="handleChange"
          >
            <div class="el-upload__text">
              <el-button
                size="small"
                class="buttonSecondary"
              >
                {{ $t('File.ChooseFile') }}
              </el-button>
              <div>{{ $t('File.DragFilesHere') }}</div>
              <div class="text-xs text-gray-400 px-12">
                <div>{{ $t('File.MaxFileSize') }}: {{ fileSizeLimit }}</div>
                <div>{{ $t('File.AllowedFileTypes') }}: {{ fileTypeLimit }}</div>
              </div>
            </div>
          </el-upload>
          <div class="text-xs mt-2">*{{ $t('File.UploadWarning') }}: {{ specialSymbols }}</div>
        </el-form-item>

        <el-form-item
          :label="$t('general.Name')"
          prop="name"
        >
          <el-input
            v-model="fileForm.name"
            :placeholder="$t('File.InputName')"
          />
        </el-form-item>

        <el-form-item
          :label="$t('Version.Version')"
          prop="version"
        >
          <el-select
            v-model="fileForm.version"
            :placeholder="$t('Version.SelectVersion')"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="item in versionList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button
          class="buttonSecondaryReverse"
          @click="dialogVisible = false"
        >
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button
          class="buttonPrimary"
          :loading="memberConfirmLoading"
          @click="handleConfirm"
        >
          {{ $t('general.Confirm') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  isAllowedTypes,
  fileSizeToMB,
  containSpecialChar
} from '@shared/utils/extension'
import { ElTableResponsive, ProjectListSelector } from '@shared/components'
import {
  deleteProjectFile,
  downloadProjectFile,
  getProjectFileList,
  getProjectVersion,
  uploadProjectFile
} from '@/api/projects'
import { BasicData, Pagination, SearchBar } from '@/mixins'

const formTemplate = {
  name: '',
  version: '',
  description: ''
}

export default {
  name: 'ProjectFiles',
  components: { ProjectListSelector, ElTableResponsive },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      dialogVisible: false,
      versionList: [],
      dialogStatus: 1,
      memberConfirmLoading: false,
      fileForm: formTemplate,
      uploadFileList: [],
      loadingInstance: '',
      isDownloading: false,
      searchKeys: ['filename'],
      specialSymbols: '* ? " < > | # { } % ~ &'
    }
  },
  computed: {
    ...mapGetters([
      'fileSizeLimit',
      'fileTypeLimit',
      'allowedFileType',
      'device'
    ]),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('File.Id'),
          prop: 'id',
          align: 'center',
          minWidth: '100'
        },
        {
          label: this.$t('general.Name'),
          prop: 'filename',
          align: 'center',
          minWidth: '100'
        },
        {
          label: this.$t('general.Creator'),
          prop: 'author.name',
          align: 'center',
          minWidth: '100'
        },
        {
          label: this.$t('general.CreateTime'),
          prop: 'created_on',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          minWidth: '100',
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    showNoProjectWarning() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.NoProject'),
        type: 'warning'
      })
    },
    async fetchData() {
      if (this.selectedProjectId === -1) {
        this.showNoProjectWarning()
        return []
      }
      const res = await Promise.all([
        getProjectFileList(this.selectedProjectId),
        getProjectVersion(this.selectedProjectId)
      ])
      this.versionList = res[1].data.versions
      return this.sortFiles(res[0].data.files)
    },
    sortFiles(files) {
      const sortedFiles = files.map((file) => file)
      sortedFiles.sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
      return sortedFiles
    },
    handleAdding() {
      // this.$refs['upload'].clearFiles()
      this.dialogVisible = true
      this.dialogStatus = 1
    },
    handleExceed() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.SingleFileLimit'),
        type: 'warning'
      })
    },
    async handleDownload(row) {
      this.isDownloading = true
      const res = await downloadProjectFile({ id: row.id, filename: row.filename, project_id: this.selectedProjectId })
      const url = window.URL.createObjectURL(new Blob([res]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', row.filename)
      document.body.appendChild(link)
      link.click()
      this.isDownloading = false
    },
    async handleDelete(row) {
      this.listLoading = true
      try {
        await deleteProjectFile(row.id)
        await this.loadData()
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async handleChange(file, fileList) {
      const { raw, size, name } = file
      if (!isAllowedTypes(raw.type)) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.UnsupportedFileFormat'),
          type: 'warning'
        })
        this.$refs['upload'].clearFiles()
      } else if (fileSizeToMB(size) > Number(this.fileSizeLimit.replace(/\D/g, ''))) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.FileSizeLimit', { size: this.fileSizeLimit }),
          type: 'warning'
        })
        this.$refs['upload'].clearFiles()
      } else if (containSpecialChar(name)) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.FileNameLimit'),
          type: 'warning'
        })
        this.$refs['upload'].clearFiles()
      } else {
        this.uploadFileList = fileList
      }
    },
    async handleConfirm() {
      this.$refs['fileForm'].validate(async (valid) => {
        if (valid) {
          const data = this.fileForm
          const filetype = this.allowedFileType[this.uploadFileList[0].raw.type]
          const form = new FormData()
          if (data.name !== '') {
            form.append('file', this.uploadFileList[0].raw, `${data.name}${filetype}`)
          } else {
            form.append('file', this.uploadFileList[0].raw, this.uploadFileList[0].raw.name)
          }
          if (data.version !== '') {
            form.append('version_id', data.version)
          }
          if (data.description !== '') {
            form.append('description', data.description)
          }
          try {
            this.loadingInstance = this.$loading({
              target: '.el-dialog',
              text: 'Loading'
            })
            await uploadProjectFile(this.selectedProjectId, form)
            this.loadingInstance.close()
            this.$message({
              title: this.$t('general.Success'),
              message: this.$t('Notify.Uploaded'),
              type: 'success'
            })
            this.$refs['fileForm'].resetFields()
            this.dialogVisible = false
            await this.loadData()
          } catch (err) {
            this.loadingInstance.close()
            console.error(err)
          }
        } else {
          return false
        }
      })
    },
    onDialogClosed() {
      this.$nextTick(() => {
        this.uploadFileList = []
        this.$refs['fileForm'].resetFields()
        this.form = formTemplate
        this.$refs['upload'].clearFiles()
      })
    }
  }
}
</script>
