<template>
  <div v-loading="listLoading">
    <div v-if="isShowTitle" class="mb-2 text-lg">
      {{ $t('Version.ProjectManage') }}
    </div>
    <el-empty
      v-if="selectedProjectId === -1"
      :description="$t('general.NoData')"
      :image-size="100"
    />
    <template v-else>
      <div class="flex justify-between mb-4">
        <el-button
          :size="isMobile ? 'small' : 'medium'"
          icon="el-icon-plus"
          type="primary"
          @click="handleAdding"
        >
          <span>{{ $t('Version.AddVersion') }}</span>
        </el-button>
        <el-input
          v-model="keyword"
          :placeholder="$t('general.SearchName')"
          :style="{ width: '130px' }"
          prefix-icon="el-icon-search"
          size="small"
        />
      </div>
      <ElTableResponsive :columns="tableColumns" :data="pagedData" fit>
        <template #actions="{ row }">
          <el-tooltip :content="$t('general.Edit')" placement="bottom">
            <em
              class="ri-edit-box-line success table-button"
              @click="handleEdit(row)"
            ></em>
          </el-tooltip>
          <el-tooltip :content="$t('general.Delete')" placement="bottom">
            <em
              class="ri-delete-bin-2-line danger table-button"
              @click="handleDelete(row)"
            ></em>
          </el-tooltip>
        </template>
      </ElTableResponsive>
      <Pagination
        :layout="paginationLayout"
        :limit="listQuery.limit"
        :page="listQuery.page"
        :page-sizes="[5, 10, 20, 50]"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        :total="filteredData.length"
        @pagination="onPagination"
      />
      <ModifyVersionDialog ref="modifyVersionDialog" @update="loadData" />
    </template>
  </div>
</template>

<script>
import { deleteProjectVersion, getProjectVersion } from '@/api_v3/projects'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { mapGetters } from 'vuex'
import ModifyVersionDialog from './ModifyVersionDialog'

export default {
  name: 'ProjectVersions',
  components: {
    ModifyVersionDialog,
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination, SearchBar],
  props: {
    isShowTitle: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      listQuery: {
        offset: 0,
        limit: 5,
        total: 0,
        page: 1
      }
    }
  },
  computed: {
    ...mapGetters(['device']),
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
          label: this.$t('general.Name'),
          prop: 'name',
          align: 'center',
          showOverflowTooltip: true,
          sortable: true,
          minWidth: 100
        },
        {
          label: this.$t('general.CreateTime'),
          prop: 'create_at',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.DueDate'),
          prop: 'effective_date',
          align: 'center',
          minWidth: 120
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'update_at',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          align: 'center',
          type: 'tag',
          elementClass: 'el-tag--circle',
          minWidth: 90,
          size: 'mini',
          location: 'projectVersions'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          slot: 'actions',
          width: 120
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getProjectVersion(this.selectedProjectId, { all: true })
      return res.data
    },
    handleAdding() {
      this.$refs.modifyVersionDialog.dialogVisible = true
      this.$refs.modifyVersionDialog.dialogStatus = 1
    },
    handleEdit(row) {
      const { name, effective_date, status, description, id } = row
      const rowData = { id, name, effective_date, status, description }
      this.$refs.modifyVersionDialog.dialogVisible = true
      this.$refs.modifyVersionDialog.dialogStatus = 2
      this.$refs.modifyVersionDialog.form = Object.assign({}, rowData)
    },
    async handleDelete(row) {
      this.$confirm(
        this.$t('Version.ConfirmDelete', { version: row.name }),
        this.$t('general.Delete'),
        {
          confirmButtonText: this.$t('general.Delete'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'error'
        }
      ).then(async () => {
        await deleteProjectVersion(row.id)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        await this.loadData()
      })
    }
  }
}
</script>
