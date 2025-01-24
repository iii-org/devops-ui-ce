<template>
  <el-col v-loading="loading">
    <v-chart
      v-if="chartData.length > 0 && isEchartsReady"
      :option="projectMembersOptions"
      :theme="isLite ? 'macarons' : 'vintage'"
      class="chart"
      autoresize
      @click="onClickChart"
    />
    <NoData v-else />
    <el-dialog
      :visible.sync="dialogVisible.projectMember"
      :title="$t('Dashboard.ADMIN.ProjectMembers.NAME')"
      :width="isMobile ? '90vw' : '75vw'"
      destroy-on-close
      top="3vh"
      @close="closeHandler"
    >
      <el-row type="flex" align="middle">
        <el-col :span="12">
          <el-input
            v-model="keyword"
            :style="`width: ${isMobile ? '' : '250px'}`"
            :placeholder="$t('Project.SearchProjectName')"
            clearable
          />
        </el-col>
        <el-col v-if="listData.length > 0" :span="12" class="text-right">
          {{ $t('Dashboard.ADMIN.sync_date', [listData[0].sync_date]) }}
        </el-col>
      </el-row>
      <el-card shadow="never">
        <el-table
          v-if="listData.length > 0"
          ref="tableData"
          :data="pagedData"
          :row-key="getRowKey"
          :expand-row-keys="expandKeys"
          @row-click="rowClicked"
          @expand-change="loadMembers"
        >
          <el-table-column type="expand">
            <template>
              <AdminMemberTable :member-data="memberData" />
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('Dashboard.ADMIN.ProjectMembers.project_name')"
            show-overflow-tooltip
            prop="project_name"
            sortable
          />
          <el-table-column
            :label="$t('Dashboard.ADMIN.ProjectMembers.owner_name')"
            show-overflow-tooltip
            prop="owner_name"
            sortable
          >
            <template slot-scope="props">
              {{ `${props.row.owner_name} (${props.row.owner_login})` }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('Dashboard.ADMIN.ProjectMembers.member_count')"
            prop="member_count"
            sortable
          />
          <el-table-column
            :label="$t('Dashboard.ADMIN.ProjectMembers.start_date')"
            show-overflow-tooltip
            prop="start_date"
            sortable
          />
          <el-table-column
            :label="$t('Dashboard.ADMIN.ProjectMembers.end_date')"
            show-overflow-tooltip
            prop="end_date"
            sortable
          />
        </el-table>
        <Pagination
          :total="filteredData.length"
          :page="listQuery.page"
          :limit="listQuery.limit"
          :page-sizes="[listQuery.limit]"
          :layout="'total, prev, pager, next'"
          @pagination="onPagination"
        />
      </el-card>
    </el-dialog>
  </el-col>
</template>

<script>
import {
  getProjectMembersByProjectID,
  getProjectMembersDetail
} from '@/api/dashboard'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import Table from '@/mixins/Table'
import AdminMemberTable from './widget/AdminMemberTable'
import { mapGetters } from 'vuex'
import VChart from 'vue-echarts'

export default {
  name: 'AdminProjectMember',
  components: {
    NoData: () => import('@shared/components/NoData'),
    AdminMemberTable,
    'v-chart': VChart
  },
  mixins: [BasicData, Pagination, SearchBar, Table],
  props: {
    data: {
      type: Function,
      default: () => []
    },
    dialogVisible: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      loading: false,
      chartData: [],
      searchKeys: ['project_name', 'owner_name'],
      getRowKey: (row) => row.project_id,
      expandKeys: [],
      memberData: { loading: '', children: [] },
      isEchartsReady: false
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    projectMembersOptions() {
      return {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          type: 'scroll',
          bottom: '0'
        },
        series: [
          {
            name: this.$t('Dashboard.ADMIN.ProjectMembers.NAME'),
            type: 'pie',
            radius: '70%',
            data: this.chartData,
            label: {
              show: true,
              formatter: '{title|{b}}\n{hr|}\n{value|{c}}',
              rich: {
                title: {
                  color: '#6E7079',
                  lineHeight: 22,
                  fontSize: 15,
                  align: 'center'
                },
                hr: {
                  borderColor: '#f0f0f0',
                  width: '100%',
                  borderWidth: 1,
                  height: 0
                },
                value: {
                  color: '#4C5058',
                  fontSize: 14,
                  fontWeight: 'bold',
                  lineHeight: 24
                }
              }
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            bottom: '5%'
          }
        ],
        backgroundColor: '#fff',
        textStyle: { fontFamily: 'Montserrat' }
      }
    },
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    }
  },
  watch: {
    dialogVisible: {
      handler(value) {
        if (value.projectMember) {
          this.loadData()
        }
      },
      deep: true
    }
  },
  async created() {
    await this.loadEchartsModules()
    this.loadChart()
  },
  methods: {
    async loadEchartsModules() {
      const [
        { use },
        { CanvasRenderer },
        { PieChart },
        { LegendComponent, TooltipComponent }
      ] = await Promise.all([
        import('echarts/core'),
        import('echarts/renderers'),
        import('echarts/charts'),
        import('echarts/components')
      ])

      use([CanvasRenderer, PieChart, LegendComponent, TooltipComponent])

      if (this.isLite) {
        await import('echarts/theme/macarons')
      } else {
        await import('echarts/theme/vintage')
      }

      this.isEchartsReady = true
    },
    async loadChart() {
      this.loading = true
      this.chartData = await this.data()
      this.loading = false
    },
    async loadData() {
      this.listLoading = true
      this.listData = await this.fetchData()
      this.listLoading = false
    },
    async fetchData() {
      return getProjectMembersDetail().then((res) => {
        return Promise.resolve(res.data)
      })
    },
    rowClicked(row) {
      this.$refs['tableData'].toggleRowExpansion(row)
    },
    async loadMembers(row, expandedRows) {
      this.expandKeys = []
      this.memberData.children = []
      if (expandedRows.length) this.expandKeys.push(row.project_id)
      if (!expandedRows.some((r) => r.project_id === row.project_id)) return
      this.memberData.loading = true
      const res = await getProjectMembersByProjectID(row.project_id)
      this.memberData.children = res.data
      this.memberData.loading = false
    },
    onClickChart(row) {
      this.dialogVisible.projectMember = true
      this.keyword = row.name
    },
    closeHandler() {
      this.keyword = ''
      this.pagedData.forEach((item) => {
        this.$refs['tableData'].toggleRowExpansion(item, false)
      })
      this.listQuery.page = 1
    }
  }
}
</script>

<style scoped>
.chart {
  height: 100%;
  min-height: 270px;
}
</style>
