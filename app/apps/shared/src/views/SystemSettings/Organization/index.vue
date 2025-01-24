<template>
  <div class="app-container">
    <div class="flex justify-between">
      <el-button
        :size="isMobile ? 'small' : 'medium'"
        type="primary"
        @click="handleDialog()"
      >
        <em class="el-icon-plus"></em>
        {{ $t('Organization.Add') }}
      </el-button>
      <el-input
        v-model="keyword"
        :placeholder="$t('Organization.SearchByIdOrName')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? 'auto' : '250px' }"
        prefix-icon="el-icon-search"
      />
    </div>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :columns="tableColumns"
      :data="pagedData"
      :element-loading-text="$t('Loading')"
      fit
    >
      <template #action="{ row }">
        <el-tooltip :content="$t('general.Edit')" placement="bottom">
          <em
            class="ri-edit-box-line success table-button"
            @click="handleDialog(row)"
          ></em>
        </el-tooltip>
        <el-tooltip
          v-if="row.is_empty"
          :content="$t('general.Delete')"
          placement="bottom"
        >
          <el-popconfirm
            :cancel-button-text="$t('general.Cancel')"
            :confirm-button-text="$t('general.Delete')"
            :title="$t('Notify.confirmDelete')"
            icon="el-icon-info"
            popper-class="danger"
            @confirm="handleDelete(row.id)"
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
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.current"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="listQuery.total"
      @pagination="onPagination"
    />
    <OrganizationDialog
      ref="orgDialog"
      :organization-list="organizationList"
      @loadData="loadData"
    />
  </div>
</template>

<script>
import { deleteOrganization, getOrganizationList } from '@/api_v3/organizations'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { mapGetters } from 'vuex'

export default {
  name: 'Organization',
  components: {
    ElTableResponsive: () => import('@shared/components/ElTableResponsive'),
    OrganizationDialog: () => import('./components/OrganizationDialog')
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      listLoading: false,
      organizationList: [],
      searchKeys: ['name', 'identifier']
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
          label: this.$t('Organization.Identifier'),
          prop: 'identifier',
          minWidth: 150
        },
        {
          label: this.$t('Organization.Name'),
          prop: 'name',
          minWidth: 150
        },
        {
          label: this.$t('Organization.Owner'),
          prop: 'owner.full_name'
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'updated_at',
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'action',
          slot: 'action',
          align: 'center',
          width: 120
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const listData = await getOrganizationList().then((res) => {
        this.organizationList = res.data
        return res.data
      })
      return listData
    },
    handleDialog(row) {
      this.$refs.orgDialog.dialogVisible = true
      if (row) {
        this.$refs.orgDialog.form.id = row.id
        this.$refs.orgDialog.form.name = row.name
        // this.$refs.orgDialog.form.owner = row.owner?.id
        this.$refs.orgDialog.form.identifier = row.identifier
        this.$refs.orgDialog.form.description = row.description
        this.$refs.orgDialog.edit = true
      }
    },
    async handleDelete(id) {
      await deleteOrganization(id).then(() => {
        this.loadData()
      })
    },
    async onPagination(query) {
      const { page, limit } = query
      this.params.page = page
      this.params.limit = limit
      await this.loadData()
    }
  }
}
</script>
