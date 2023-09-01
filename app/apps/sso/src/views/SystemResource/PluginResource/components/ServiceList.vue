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
        :cell-style="{ 'text-align': 'center' }"
        :header-cell-style="{ 'text-align': 'center' }"
        fit
      >
        <template v-slot:actions="{ row }">
          <el-tooltip
            placement="bottom"
            :content="$t('general.Delete')"
            :disabled="!row.is_iii"
          >
            <el-popconfirm
              :confirm-button-text="$t('general.Delete')"
              :cancel-button-text="$t('general.Cancel')"
              icon="el-icon-info"
              popper-class="danger"
              :title="$t('Notify.confirmDelete')"
              :disabled="!row.is_iii"
              @confirm="handleDelete(row.name)"
            >
              <span slot="reference" :class="!row.is_iii ? 'disabled' : ''">
                <em
                  class="ri-delete-bin-2-line operate-button"
                  :class="!row.is_iii ? 'disabled' : 'danger'"
                />
              </span>
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
import { deleteService, getServiceList } from '@/api/kubernetes'
import { BasicData, SearchBar, Pagination, Table } from '@/mixins'
import { ElTableResponsive } from '@shared/components'

export default {
  name: 'ServiceList',
  components: {
    ElTableResponsive
  },
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
          minWidth: 200
        },
        {
          label: this.$t('general.Actions'),
          width: 180,
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      const res = await getServiceList(this.selectedProjectId)
      return res.data
    },
    async handleDelete(serviceName) {
      try {
        await deleteService(this.selectedProjectId, serviceName)
        await this.loadData()
      } catch (error) {
        console.error(error)
      }
    },
    onBackClick() {
      this.$router.push({ name: 'PluginResourceParent' })
    }
  }
}
</script>

<style lang="scss" scoped>
.disabled {
  cursor: not-allowed;
}
</style>
