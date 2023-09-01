<template>
  <el-row class="app-container">
    <el-col>
      <div class="flex justify-between items-center mb-3">
        <el-button
          type="text"
          size="medium"
          icon="el-icon-arrow-left"
          class="text-title linkTextColor"
          @click="onBackClick"
        >
          {{ $t('general.Back') }}
        </el-button>
        <el-input
          v-model="keyword"
          :placeholder="$t('general.SearchName')"
          :style="{ width: isMobile ? 'auto' : '250px' }"
          :size="isMobile ? 'small' : 'medium'"
          prefix-icon="el-icon-search"
        />
      </div>
      <el-divider />
      <ElTableResponsive
        v-loading="listLoading"
        :data="pagedData"
        :columns="tableColumns"
        :element-loading-text="$t('Loading')"
        :header-cell-style="{ 'text-align': 'center' }"
        fit
      >
        <template v-slot:size="{ row }">
          {{ Math.round(row.size / 1024 / 1024) }} MB
        </template>
        <template v-slot:labels="{ row }">
          <el-tag v-for="label in row.labels" :key="label" class="el-tag--circle" type="success" effect="dark">
            {{ label }}
          </el-tag>
        </template>
        <template v-slot:actions="{ row }">
          <el-tooltip
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
        :page-sizes="[listQuery.limit]"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { deleteProjectArtifact, getProjectArtifacts } from '@/api_v2/harbor'
import { BasicData, SearchBar, Pagination, Table } from '@/mixins'
import { ElTableResponsive } from '@shared/components'

export default {
  name: 'ProjectArtifacts',
  components: { ElTableResponsive },
  mixins: [BasicData, SearchBar, Pagination, Table],
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
          align: 'center'
        },
        {
          label: 'Size',
          prop: 'size',
          slot: 'size',
          align: 'center'
        },
        {
          label: this.$t('ProjectResource.Vulnerabilities'),
          prop: 'vulnerabilities',
          align: 'center'
        },
        {
          label: 'Digest',
          prop: 'digest',
          showOverflowTooltip: true
        },
        {
          label: 'Labels',
          prop: 'labels',
          slot: 'labels'
        },
        {
          label: this.$t('Harbor.PushTime'),
          prop: 'push_time',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          slot: 'actions',
          align: 'center'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      return (await getProjectArtifacts(this.$route.params.rName)).data
    },
    async handleDelete(row) {
      this.$confirm(`Are you sure to Delete Artifact ${row.name}?`, 'Delete', {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'error'
      }).then(async () => {
        await deleteProjectArtifact(this.$route.params.rName, row.digest, row.name)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        await this.loadData()
      })
    },
    onBackClick() {
      this.$router.push({ name: 'HarborParent' })
    }
  }
}
</script>
