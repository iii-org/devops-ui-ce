<template>
  <div class="app-container">
    <div class="flex justify-between">
      <div :class="isMobile ? 'text-lg' : 'text-2xl'">
        {{ $t('System.SystemConfigs') }}
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
      <template #actions="{ row }">
        <el-tooltip
          placement="bottom"
          :content="$t('general.Edit')"
        >
          <em
            class="ri-edit-box-line success table-button"
            @click="row.method"
          ></em>
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
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import FileTypeDialog from './components/FileTypeDialog'
import FileSizeDialog from './components/FileSizeDialog'

export default {
  name: 'SystemConfigs',
  components: {
    FileTypeDialog,
    FileSizeDialog,
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      fileTypeDialogVisible: false,
      fileSizeDialogVisible: false
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
      return this.tableData
    },
    handleEditFileName() {
      this.fileTypeDialogVisible = true
    },
    handleEditFileSize() {
      this.fileSizeDialogVisible = true
    }
  }
}
</script>
