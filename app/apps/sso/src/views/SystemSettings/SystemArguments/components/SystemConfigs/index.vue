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
    <ElTableResponsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      :data="pagedData"
      :columns="tableColumns"
      :cell-style="{ height: '5em' }"
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
          v-else-if="row.type === 'boolean'"
          placement="bottom"
          :disabled="gitlabDomainIP"
          :content="!row.content ? $t('general.Enable') : $t('general.Disable')"
        >
          <em
            v-if="gitlabDomainIP"
            style="cursor: not-allowed;"
            :class="!row.content
              ? 'ri-record-circle-line finished operate-button'
              : 'ri-pause-circle-line danger operate-button'"
          />
          <em
            v-else
            :class="!row.content
              ? 'ri-record-circle-line finished operate-button'
              : 'ri-pause-circle-line danger operate-button'"
            @click="row.method(!row.content)"
          />
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <!-- <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    /> -->
    <FileTypeDialog
      v-if="fileTypeDialogVisible"
      :dialog-visible.sync="fileTypeDialogVisible"
      @update="loadData"
    />
    <FileSizeDialog
      v-if="fileSizeDialogVisible"
      :dialog-visible.sync="fileSizeDialogVisible"
      @update="loadData"
    />
    <TimeoutDialog
      v-if="timeoutDialogVisible"
      :dialog-visible.sync="timeoutDialogVisible"
      @update="loadData"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import {
  FileTypeDialog,
  FileSizeDialog,
  TimeoutDialog
} from './components'
import {
  getGitlabStatus,
  editGitlabStatus,
  isGitlabDomainIP
} from '@/api/gitlab' // v2 backend not finish yet, so use original api
import { getKeycloakConfig } from '@/api_v2/systemParameter'
import { ElTableResponsive } from '@shared/components'

export default {
  name: 'SystemConfigs',
  components: {
    ElTableResponsive,
    FileTypeDialog,
    FileSizeDialog,
    TimeoutDialog
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      fileTypeDialogVisible: false,
      fileSizeDialogVisible: false,
      timeoutDialogVisible: false,
      gitlabDomainIP: false
    }
  },
  computed: {
    ...mapGetters([
      'language',
      'fileTypeLimit',
      'fileSizeLimit',
      'device'
    ]),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableData() {
      return [
        {
          type: 'string',
          name: this.$t('SystemConfigs.FileType'),
          description: this.$t('SystemConfigs.FileTypeDescription'),
          content: this.fileTypeLimit,
          method: this.handleEditFileName
        },
        {
          type: 'string',
          name: this.$t('SystemConfigs.FileSize'),
          description: this.$t('SystemConfigs.FileSizeDescription'),
          content: this.fileSizeLimit,
          method: this.handleEditFileSize
        },
        {
          type: 'boolean',
          name: this.$t('SystemConfigs.GitLabExternalAccess'),
          description: this.$t('SystemConfigs.GitLabExternalDescription'),
          content: false,
          method: this.handleGitlabActive
        },
        {
          type: 'string',
          name: this.$t('SystemConfigs.KeycloakTimeout'),
          description: this.$t('SystemConfigs.KeycloakTimeoutDescription'),
          content: '',
          method: this.handleEditTimeout
        }
      ]
    },
    tableColumns() {
      return [
        {
          label: this.$t('general.Index'),
          prop: 'index',
          width: '50',
          align: 'center',
          type: 'index',
          hideOnMobile: true
        },
        {
          label: this.$t('general.Name'),
          prop: 'name',
          align: 'center',
          minWidth: '150'
        },
        {
          label: this.$t('general.Description'),
          prop: 'description',
          align: 'center',
          minWidth: '300'
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
          slot: 'actions',
          maxWidth: '50'
        }
      ]
    }
  },
  watch: {
    language() {
      this.loadData()
    }
  },
  methods: {
    async fetchData() {
      const listData = this.tableData
      this.gitlabDomainIP = (await isGitlabDomainIP()).is_ip
      listData[2].content = (await getGitlabStatus()).data.status
      const keycloakConfig = await getKeycloakConfig({ config_keys: ['ssoSessionIdleTimeout'] })
      const ssoSessionIdleTimeout = keycloakConfig.config_maps.ssoSessionIdleTimeout
      listData[3].content = (ssoSessionIdleTimeout / 60) + this.$t('SystemConfigs.Minutes')
      return listData
    },
    handleEditFileName() {
      this.fileTypeDialogVisible = true
    },
    handleEditFileSize() {
      this.fileSizeDialogVisible = true
    },
    handleEditTimeout() {
      this.timeoutDialogVisible = true
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
