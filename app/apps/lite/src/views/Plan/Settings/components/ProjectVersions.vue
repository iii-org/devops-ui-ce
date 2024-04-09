<template>
  <div v-loading="listLoading">
    <div
      v-if="isShowTitle"
      class="mb-2 text-lg"
    >
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
          class="button-secondary"
          :size="isMobile ? 'small' : 'medium'"
          icon="el-icon-plus"
          @click="handleAdding"
        >
          <span>{{ $t('Version.AddVersion') }}</span>
        </el-button>
        <el-input
          v-model="keyword"
          size="small"
          prefix-icon="el-icon-search"
          :style="{ width: '130px' }"
          :placeholder="$t('general.SearchName')"
        />
      </div>
      <ElTableResponsive
        :data="pagedData"
        :columns="tableColumns"
        fit
      >
        <template v-slot:actions="{row}">
          <el-tooltip
            placement="bottom"
            :content="$t('general.Edit')"
          >
            <em class="ri-edit-box-line success table-button" @click="handleEdit(row)"></em>
          </el-tooltip>
          <el-tooltip
            placement="bottom"
            :content="$t('general.Delete')"
          >
            <em class="ri-delete-bin-2-line danger table-button" @click="handleDelete(row)"></em>
          </el-tooltip>
        </template>
      </ElTableResponsive>
      <Pagination
        :total="filteredData.length"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :page-sizes="[5, 10, 20, 50]"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
      <ModifyVersionDialog
        ref="modifyVersionDialog"
        @update="loadData"
      />
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectVersion, deleteProjectVersion } from '@/api/projects'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive } from '@shared/components'
import ModifyVersionDialog from './ModifyVersionDialog'

export default {
  name: 'ProjectVersions',
  components: {
    ModifyVersionDialog,
    ElTableResponsive
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
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
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
          prop: 'created_on',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.DueDate'),
          prop: 'due_date',
          align: 'center',
          minWidth: 120
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'updated_on',
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
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getProjectVersion(this.selectedProjectId)
      return res.data.versions
    },
    handleAdding() {
      this.$refs.modifyVersionDialog.dialogVisible = true
      this.$refs.modifyVersionDialog.dialogStatus = 1
    },
    handleEdit(row) {
      const { name, due_date, status, description, id } = row
      const rowData = { id, name, due_date, status, description }
      this.$refs.modifyVersionDialog.dialogVisible = true
      this.$refs.modifyVersionDialog.dialogStatus = 2
      this.$refs.modifyVersionDialog.form = Object.assign({}, rowData)
    },
    async handleDelete(row) {
      this.$confirm(this.$t('Version.ConfirmDelete', { version: row.name }), this.$t('general.Delete'), {
        confirmButtonText: this.$t('general.Delete'),
        cancelButtonText: this.$t('general.Cancel'),
        type: 'error'
      }).then(async () => {
        await deleteProjectVersion(this.selectedProjectId, row.id)
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
