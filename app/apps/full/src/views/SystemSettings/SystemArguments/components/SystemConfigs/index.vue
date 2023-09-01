<template>
  <div class="app-container">
    <div class="flex justify-between">
      <div class="text-2xl">
        {{ $t('SystemConfigs.SystemConfig') }}
      </div>
      <el-input
        id="input-search-config"
        v-model="keyword"
        :placeholder="$t('general.SearchName')"
        :style="{ width: isMobile ? '100px' : '300px' }"
        :size="isMobile ? 'small' : 'medium'"
        prefix-icon="el-icon-search"
      />
    </div>
    <el-divider />
    <el-table-responsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      :data="pagedData"
      :columns="tableColumns"
      fit
    >
      <template v-slot:content="{ row }">
        <span v-if="row.type === 'string'">
          {{ row.content }}
        </span>
        <span v-else>
          <el-tag :type="row.content === true ? 'success' : 'danger'">
            <span>
              {{ row.content === true ? $t('general.Enable') : $t('general.Disable') }}
            </span>
          </el-tag>
        </span>
      </template>
      <template v-slot:actions="{ row }">
        <el-tooltip
          v-if="row.type === 'string'"
          placement="bottom"
          :content="$t('general.Edit')"
        >
          <em
            class="ri-file-edit-line finished operate-button"
            @click="row.method"
          />
        </el-tooltip>
        <el-tooltip
          v-else
          placement="bottom"
          :content="!row.content ? $t('general.Enable') : $t('general.Disable')"
        >
          <div v-if="gitlabDomainIP" class="disabled">
            <el-button
              size="mini"
              disabled
            >
              {{ !row.content ? $t('general.Enable') : $t('general.Disable') }}
            </el-button>
          </div>
          <div v-else>
            <em
              :class="!row.content
                ? 'ri-record-circle-line finished operate-button'
                : 'ri-pause-circle-line danger operate-button'"
              @click="row.method(!row.content)"
            />
          </div>
        </el-tooltip>
      </template>
    </el-table-responsive>
    <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
    <FileTypeDialog
      ref="FileTypeDialog"
      @update="fetchData"
    />
    <FileSizeDialog
      ref="FileSizeDialog"
      @update="fetchData"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { FileTypeDialog, FileSizeDialog } from './components'
import {
  getGitlabStatus,
  editGitlabStatus,
  isGitlabDomainIP
} from '@/api/gitlab' // v2 backend not finish yet, so use original api
import { ElTableResponsive } from '@/components'

export default {
  name: 'SystemConfigs',
  components: { FileTypeDialog, FileSizeDialog, ElTableResponsive },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      tableData: [
        {
          type: 'string',
          name: this.$t('SystemConfigs.FileType'),
          description: 'Define Upload types for issue attachments and project files',
          content: '',
          method: this.handleEditFileName
        },
        {
          type: 'string',
          name: this.$t('SystemConfigs.FileSize'),
          description: this.$t('SystemConfigs.FileSizeDescription'),
          content: '',
          method: this.handleEditFileSize
        },
        {
          type: 'boolean',
          name: this.$t('SystemConfigs.GitLabExternalAccess'),
          description: `For security concern, III DevOps only enable Gitlab internal access.
                        But will not be affected in the IP mode`,
          content: false,
          method: this.handleGitlabActive
        }
      ],
      gitlabDomainIP: false
    }
  },
  computed: {
    ...mapGetters(['fileTypeLimit', 'fileSizeLimit', 'device']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('general.Index'),
          prop: 'index',
          width: '80',
          align: 'center',
          type: 'index',
          hideOnMobile: true
        },
        {
          label: this.$t('general.Name'),
          prop: 'name',
          align: 'center',
          minWidth: '100'
        },
        {
          label: this.$t('general.Description'),
          prop: 'description',
          align: 'center',
          minWidth: '250'
        },
        {
          label: this.$t('SystemConfigs.Content'),
          prop: 'content',
          align: 'center',
          slot: 'content'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      this.gitlabDomainIP = (await isGitlabDomainIP()).is_ip
      this.tableData[0].content = this.fileTypeLimit
      this.tableData[1].content = this.fileSizeLimit
      this.tableData[2].content = (await getGitlabStatus()).data.status
      return this.tableData
    },
    handleEditFileName() {
      this.$refs['FileTypeDialog'].dialogVisible = true
      this.$refs['FileTypeDialog'].loadData()
    },
    handleEditFileSize() {
      this.$refs['FileSizeDialog'].dialogVisible = true
      this.$refs['FileSizeDialog'].loadData()
    },
    async handleGitlabActive(active) {
      this.listLoading = true
      try {
        await editGitlabStatus({ action: active ? 'open' : 'close' })
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        await this.loadData()
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dot {
  @apply rounded-full w-2 h-2;
}
.disabled {
  cursor: not-allowed;
}
</style>
