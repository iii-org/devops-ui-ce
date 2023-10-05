<template>
  <div v-loading="loading">
    <v-chart
      v-if="chartData.length > 0"
      class="chart"
      :option="passingRateOptions"
      autoresize
      :theme="isLite ? 'macarons' : 'vintage'"
      @click="onClickChart"
    />
    <NoData v-else />
    <el-dialog
      :visible.sync="dialogVisible.passingRate"
      :title="$t('Dashboard.ADMIN.PassingRate.DETAIL')"
      top="3vh"
      width="90vw"
      @close="closeHandler"
    >
      <el-row type="flex" align="middle">
        <el-col :span="12">
          <el-input
            v-model="keyword"
            class="ob-search-input ob-shadow search-input"
            :style="{ width: isMobile ? 'auto' : '250px' }"
            :size="isMobile ? 'small' : 'medium'"
            :placeholder="$t('Project.SearchProjectName')"
            clearable
          />
        </el-col>
        <el-col v-if="listData.length > 0" :span="12" class="text-right">
          {{ $t('Dashboard.ADMIN.sync_date', [listData[0].sync_date]) }}
        </el-col>
      </el-row>
      <el-card v-loading="listLoading">
        <ElTableResponsive
          ref="tableData"
          :data="pagedData"
          :columns="tableColumns"
          cell-class-name="items-center"
          header-cell-class-name="items-center"
          @row-click="rowClicked"
        >
          <template v-slot:run_at="{row}">
            {{ getRelativeTime(row.run_at) }}
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
      </el-card>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart } from 'echarts/charts'
import { getPassingRateDetail } from '@/api/dashboard'
import { BasicData, Pagination, SearchBar, Table } from '@/mixins'
import { NoData, ElTableResponsive } from '@shared/components'
import { getRelativeTime } from '@shared/utils/handleTime'

require('echarts/theme/macarons') // echarts theme
require('echarts/theme/vintage')

use([CanvasRenderer, ScatterChart])
export default {
  name: 'AdminPassingRate',
  components: {
    NoData,
    'v-chart': VChart,
    ElTableResponsive
  },
  mixins: [BasicData, Pagination, SearchBar, Table],
  props: {
    data: {
      type: Function,
      default: () => []
    },
    dialogVisible: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      loading: false,
      chartData: [],
      detailData: [],
      searchKeys: ['project_name'],
      keyword: '',
      maxCircleWidth: 120
    }
  },
  computed: {
    ...mapGetters(['device']),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    passingRateOptions() {
      const _this = this
      return {
        tooltip: {
          trigger: 'item',
          formatter: data => {
            return data.marker + data.name + ': ' + this.$t('Dashboard.ADMIN.PassingRate.count') + data.value[2]
          }
        },
        grid: {
          left: '8%',
          top: '15%'
        },
        xAxis: {
          name: this.$t('Dashboard.ADMIN.PassingRate.total'),
          nameLocation: 'middle',
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          },
          minInterval: 1,
          min: 0
        },
        yAxis: {
          name: this.$t('Dashboard.ADMIN.PassingRate.rate'),
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          },
          min: 0,
          max: 100,
          minInterval: 1,
          scale: true
        },
        series: [
          {
            name: this.$t('Dashboard.ADMIN.PassingRate.success'),
            symbolSize: function(data) {
              return data[2] * _this.getSizeRate()
            },
            data: this.chartData,
            label: {
              show: true,
              formatter: data => {
                return data.value[1] + '%'
              },
              fontWeight: 'bolder'
            },
            type: 'scatter'
          }
        ],
        backgroundColor: '#fff',
        textStyle: { fontFamily: 'Montserrat' }
      }
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('Dashboard.ADMIN.PassingRate.project_name'),
          prop: 'project_name',
          sortable: true,
          showOverflowTooltip: true
        },
        {
          label: this.$t('Dashboard.ADMIN.PassingRate.total'),
          prop: 'total',
          sortable: true
        },
        {
          label: this.$t('Dashboard.ADMIN.PassingRate.success'),
          prop: 'success',
          sortable: true
        },
        {
          label: this.$t('Dashboard.ADMIN.PassingRate.fail'),
          prop: 'fail',
          sortable: true
        },
        {
          label: this.$t('Dashboard.ADMIN.PassingRate.count'),
          prop: 'count',
          sortable: true
        },
        {
          label: this.$t('Dashboard.ADMIN.PassingRate.run_at'),
          prop: 'run_at',
          sortable: true,
          slot: 'run_at'
        }
      ]
    }
  },
  watch: {
    dialogVisible: {
      handler(value) {
        if (value.passionRate) {
          this.loadData()
        }
      },
      deep: true
    }
  },
  mounted() {
    this.loadChart()
  },
  methods: {
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
      return getPassingRateDetail().then(res => {
        return Promise.resolve(res.data)
      })
    },
    rowClicked(row) {
      this.$refs.tableData.$refs.responsiveTable.toggleRowExpansion(row)
    },
    onClickChart(row) {
      this.dialogVisible.passingRate = true
      this.keyword = row.name
    },
    closeHandler() {
      this.keyword = ''
    },
    getSizeRate() {
      const caseCount = this.chartData.map(row => row.value[2])
      const maxCount = Math.max(...caseCount)
      return this.maxCircleWidth / maxCount
    },
    getRelativeTime(time) {
      return getRelativeTime(time)
    }
  }
}
</script>

<style scoped>
.chart {
  height: 100%;
  min-height: 250px;
}
</style>
