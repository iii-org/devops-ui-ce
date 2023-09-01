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
          :style="{ width: isMobile ? 'auto' : '200px' }"
          :size="isMobile ? 'small' : 'medium'"
          prefix-icon="el-icon-search"
        />
      </div>
      <el-divider />
      <el-table-responsive
        v-loading="listLoading"
        :data="pagedData"
        :columns="tableColumns"
        :element-loading-text="$t('Loading')"
        fit
      >
        <template v-slot:service="{row}">
          <div
            v-for="(item, idx) in row.ingress_list"
            :key="item + idx"
          >
            <el-link
              class="linkTextColor"
              :underline="false"
              style="font-size: 16px"
              target="_blank"
              :href="`http://${item.hostname_path}`"
            >
              {{ item.service }}
            </el-link>
          </div>
        </template>
      </el-table-responsive>
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
import { getIngressList } from '@/api/kubernetes'
import { BasicData, SearchBar, Pagination, Table } from '@/mixins'
import { ElTableResponsive } from '@/components'

export default {
  name: 'IngressList',
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
          align: 'center',
          prop: 'name',
          width: '200',
          showOverflowTooltip: true
        },
        {
          label: 'hostname',
          align: 'center',
          prop: 'hostname',
          minWidth: '120',
          showOverflowTooltip: true
        },
        {
          label: 'IP',
          align: 'center',
          prop: 'ip',
          minWidth: '120',
          showOverflowTooltip: true
        },
        {
          label: 'Path',
          align: 'center',
          prop: 'path',
          minWidth: '120',
          showOverflowTooltip: true
        },
        {
          label: 'Service',
          align: 'center',
          prop: 'service',
          minWidth: '400',
          slot: 'service'
        },
        {
          label: 'tls',
          align: 'center',
          prop: 'tls',
          minWidth: '80'
        },
        {
          label: this.$t('general.CreateTime'),
          align: 'center',
          prop: 'created_time',
          type: 'time'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      return (await getIngressList(this.selectedProjectId)).data
    },
    onBackClick() {
      this.$router.push({ name: 'SystemResource' })
    }
  }
}
</script>
