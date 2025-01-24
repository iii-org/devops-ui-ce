<template>
  <div class="app-container">
    <ProjectListSelector>
      <el-button
        slot="button"
        :disabled="selectedProjectId === -1"
        :size="isMobile ? 'small' : 'medium'"
        icon="el-icon-plus"
        type="primary"
        @click="handleAdding"
      >
        <span v-if="!isMobile">{{ $t('File.AddFile') }}</span>
      </el-button>
      <el-input
        v-model="keyword"
        :placeholder="$t('general.SearchName')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? '150px' : '250px' }"
        class="mr-3"
        prefix-icon="el-icon-search"
        @change="fetchData"
      />
      <el-radio-group v-model="viewSwitch" size="small">
        <el-radio-button label="card"><em class="ri-layout-grid-fill text-base"></em>
        </el-radio-button>
        <el-radio-button label="table"><em class="ri-table-line text-base"></em>
        </el-radio-button>
      </el-radio-group>
    </ProjectListSelector>
    <el-divider />
    <div v-loading="isLoading" class="p-2">
      <div
        v-if="listData.length"
        :style="viewSwitch === 'card' && 'height: calc(100vh - 200px)'"
        class="flex flex-col justify-between"
      >
        <el-row v-if="viewSwitch === 'card'" :gutter="10">
          <el-col
            v-for="file in listData"
            :key="file.id"
            :lg="6"
            :md="8"
            :sm="12"
            :xs="24"
            class="mb-3"
          >
            <el-card>
              <div
                class="file-icon mb-2 flex justify-between md:text-[48px] text-3xl"
              >
                <em
                  :class="`${getFileIcon(file.content_type).icon} text-${
                    getFileIcon(file.content_type).type
                  }`"
                ></em>
                <el-dropdown class="h=fit" placement="bottom" trigger="click">
                  <el-button
                    class="h-fit p-0 flex text-xl"
                    icon="ri-more-2-fill"
                    type="text"
                  />
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item
                      :disabled="!isAllowedPreview(file.content_type)"
                      icon="ri-zoom-in-line"
                      @click.native="handlePreview(file)"
                    >
                      {{ $t('general.Preview') }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      icon="ri-download-2-line"
                      @click.native="handleDownload(file)"
                    >
                      {{ $t('File.Download') }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      class="text-danger font-bold"
                      icon="ri-delete-bin-2-line"
                      @click.native="handleDelete(file)"
                    >
                      {{ $t('general.Delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
              <h3>{{ file.filename }}</h3>
              <p>
                {{ formatFileSize(file.filesize) }} -
                {{ getRelativeTime(file.create_at) }}
              </p>
              <el-tag class="mt-2 rounded" size="mini">
                {{ file.author.full_name }}
              </el-tag>
            </el-card>
          </el-col>
        </el-row>
        <ElTableResponsive
          v-else
          v-loading="isLoading"
          :columns="tableColumns"
          :data="listData"
          :element-loading-text="$t('Loading')"
          fit
          highlight-current-row
        >
          <template #actions="{ row }">
            <el-tooltip :content="$t('general.Preview')" placement="bottom">
              <em
                :class="
                  isAllowedPreview(row.content_type) ? 'success' : 'disabled'
                "
                class="ri-zoom-in-line table-button"
                @click="handlePreview(row)"
              ></em>
            </el-tooltip>
            <el-tooltip :content="$t('File.Download')" placement="bottom">
              <em
                :class="
                  isDownloading ? 'ri-loader-2-line' : 'ri-download-2-line'
                "
                class="primary table-button"
                @click="handleDownload(row)"
              ></em>
            </el-tooltip>
            <el-tooltip
              v-permission="[
                'sysadmin',
                'Organization Owner',
                'Project Manager',
                'QA'
              ]"
              :content="$t('general.Delete')"
              placement="bottom"
            >
              <el-popconfirm
                :cancel-button-text="$t('general.Cancel')"
                :confirm-button-text="$t('general.Delete')"
                :title="$t('Notify.confirmDelete')"
                icon="el-icon-info"
                popper-class="danger"
                @confirm="handleDelete(row)"
              >
                <em
                  slot="reference"
                  class="ri-delete-bin-2-line danger table-button"
                ></em>
              </el-popconfirm>
            </el-tooltip>
          </template>
        </ElTableResponsive>
        <Pagination
          :class="viewSwitch === 'card' && 'pagination'"
          :layout="paginationLayout"
          :limit="listQuery.limit"
          :page="listQuery.page"
          :page-sizes="[12, 24, 32, 40]"
          :pager-count="isMobile ? 5 : 7"
          :small="isMobile"
          :total="listQuery.total"
          @pagination="onPagination"
        />
      </div>
      <el-empty v-else />
    </div>
    <el-dialog
      :close-on-click-modal="false"
      :title="$t('File.AddFile')"
      :visible.sync="dialogVisible"
      :width="isMobile ? '95%' : '50%'"
      @closed="onDialogClosed"
    >
      <el-form ref="fileForm" v-loading="isLoading">
        <el-form-item
          :label="$t('File.Upload')"
          :rules="{
            required: true,
            message: $t('File.ChooseFile') + $t('File.DragFilesHere')
          }"
          prop="upload"
        >
          <el-upload
            ref="upload"
            :accept="Object.keys(allowedFileType).join(', ')"
            :auto-upload="false"
            :limit="1"
            :on-change="handleChange"
            :on-exceed="handleExceed"
            action=""
            drag
          >
            <div class="el-upload__text">
              <el-button size="small" type="success">
                {{ $t('File.ChooseFile') }}
              </el-button>
              <div>
                {{ $t('File.DragFilesHere') }}
              </div>
              <div class="text-xs text-gray-400 px-12">
                <div>{{ $t('File.MaxFileSize') }}: {{ fileSizeLimit }}</div>
                <div>
                  {{ $t('File.AllowedFileTypes') }}: {{ fileTypeLimit }}
                </div>
              </div>
            </div>
          </el-upload>
          <div class="text-xs mt-2">
            *{{ $t('File.UploadWarning') }}: {{ specialSymbols }}
          </div>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button :disabled="isLoading" @click="dialogVisible = false">
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button :loading="isLoading" type="primary" @click="handleConfirm">
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
    <MediaPreview
      v-if="isImageViewerVisible"
      :initial-index="previewId"
      :media-list="listData"
      :on-close="
        () => {
          isImageViewerVisible = false
        }
      "
    />
  </div>
</template>

<script>
import {
  createProjectAttachment,
  deleteProjectAttachment,
  getProjectAttachmentList
} from '@/api_v3/attachments'
import Pagination from '@/mixins/Pagination'
import {
  containSpecialChar,
  fileSizeToMB,
  isAllowedTypes
} from '@/utils/extension'
import { mapGetters } from 'vuex'
import { getRelativeTime } from '../../utils/handleTime'

const defaultListQuery = () => ({
  page: 1,
  limit: 12,
  total: 0
})

export default {
  name: 'ProjectFiles',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    MediaPreview: () => import('@shared/components/MediaPreview'),
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [Pagination],
  data() {
    return {
      listData: [],
      dialogVisible: false,
      isLoading: false,
      versionList: [],
      uploadFileList: [],
      isDownloading: false,
      searchKeys: ['filename'],
      keyword: '',
      specialSymbols: '* ? " < > | # { } % ~ &',
      listQuery: defaultListQuery(),
      isImageViewerVisible: false,
      // imageArray: [],
      previewId: null,
      viewSwitch: 'card'
    }
  },
  computed: {
    ...mapGetters([
      'fileSizeLimit',
      'fileTypeLimit',
      'allowedFileType',
      'device',
      'selectedProjectId'
    ]),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          type: 'index',
          align: 'center',
          width: '70'
        },
        {
          label: this.$t('general.Name'),
          prop: 'filename',
          minWidth: '150'
        },
        {
          label: this.$t('general.Creator'),
          prop: 'author.full_name',
          align: 'center',
          minWidth: '110'
        },
        {
          label: this.$t('general.CreateTime'),
          prop: 'create_at',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          minWidth: '120',
          slot: 'actions'
        }
      ]
    }
  },
  watch: {
    selectedProjectId() {
      this.fetchData()
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    getRelativeTime,
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
      this.isLoading = true
      await getProjectAttachmentList(
        this.selectedProjectId,
        this.getParams()
      ).then((res) => {
        this.listData = this.sortFiles(res.data.items)
        this.listQuery = res.data.pagination
      })
      this.isLoading = false
    },
    onPagination(pageInfo) {
      this.listQuery.page = pageInfo.page
      this.listQuery.limit = pageInfo.limit
      this.fetchData()
    },
    sortFiles(files) {
      const sortedFiles = files.map((file) => file)
      sortedFiles.sort((a, b) => new Date(b.create_at) - new Date(a.create_at))
      return sortedFiles
    },
    getParams() {
      const result = {
        page: this.listQuery.page,
        limit: this.listQuery.limit
      }
      if (this.keyword) {
        result.search = this.keyword
      } else {
        delete result.search
      }
      return result
    },
    handleAdding() {
      this.dialogVisible = true
    },
    async handleDownload(row) {
      this.isDownloading = true
      const url = row.content_url
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', row.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      this.isDownloading = false
    },
    async handleDelete(row) {
      this.isLoading = true
      const { project_id, id } = row
      await deleteProjectAttachment(project_id, id)
        .then(() => {
          this.fetchData()
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    handleExceed() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.SingleFileLimit'),
        type: 'warning'
      })
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
      if (this.uploadFileList.length !== 0) {
        this.$refs['fileForm'].clearValidate('upload')
      }
    },
    async handleConfirm() {
      if (this.uploadFileList.length === 0) {
        this.$refs['fileForm'].validateField('upload')
        return
      }
      const form = this.getAttachmentData()
      this.isLoading = true
      await createProjectAttachment(this.selectedProjectId, form)
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Uploaded'),
            type: 'success'
          })
          this.dialogVisible = false
          this.fetchData()
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    getAttachmentData() {
      const form = new FormData()
      form.append(
        'file',
        this.uploadFileList[0].raw,
        this.uploadFileList[0].raw.name
      )
      return form
    },
    onDialogClosed() {
      this.$nextTick(() => {
        this.uploadFileList = []
        this.$refs['fileForm'].resetFields()
        this.$refs['upload'].clearFiles()
      })
    },
    getFileIcon(fileType) {
      const type = fileType.split('/')[0]
      const iconMap = {
        image: { icon: 'el-icon-picture', type: 'success' },
        video: { icon: 'el-icon-video-camera', type: 'warning' },
        audio: { icon: 'el-icon-headset', type: 'danger' }
      }
      return iconMap[type] || { icon: 'el-icon-document', type: 'primary' }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    isAllowedPreview(contentType) {
      const type = contentType.split('/')[0]
      return ['image', 'video', 'audio'].includes(type)
    },
    handlePreview(row) {
      this.previewId = this.listData.findIndex((item) => item.id === row.id)
      this.isImageViewerVisible = true
    }
  }
}
</script>

<style scoped>
h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

p {
  margin: 3px 0;
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.pagination {
  text-align: end;
  margin-top: 20px;
  background-color: transparent !important;
}

::v-deep .el-radio-button__inner {
  padding: 4px 9px;
}
</style>
