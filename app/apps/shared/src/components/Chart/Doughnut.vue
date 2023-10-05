<template>
  <VChart
    ref="chart"
    :style="{ height, width }"
    :option="option"
    autoresize
    theme="vintage"
    @mouseover="onMouseOver"
    @mouseout="onMouseOut"
  />
</template>

<script>
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, ScatterChart } from 'echarts/charts'

require('echarts/theme/vintage') // echarts theme

use([CanvasRenderer, ScatterChart, PieChart])

export default {
  name: 'Doughnut',
  components: {
    VChart
  },
  props: {
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '270px'
    },
    chartData: {
      type: Array,
      default: () => []
    },
    showLegend: {
      type: Boolean,
      default: true
    },
    radius: {
      type: [Array, String],
      default: '100%'
    },
    center: {
      type: [Array, String],
      default: () => ['50%', '55%']
    },
    isFromDashboard: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    option() {
      if (this.chartData.length <= 0) {
        return {
          title: {
            textStyle: {
              color: 'grey',
              fontSize: 20
            },
            text: this.$t('general.NoData'),
            left: 'center',
            top: 'center'
          }
        }
      }
      return {
        silent: false,
        legend: {
          top: 0,
          selectedMode: false,
          data: this.chartData.map(i => i.name),
          show: this.showLegend
        },
        series: [
          {
            type: 'pie',
            radius: this.radius,
            center: this.center,
            label: {
              show: false,
              position: 'center',
              formatter: d => `{number|${d.data.total || d.value}}\n{title|${d.name}}`,
              rich: {
                number: {
                  fontSize: '30',
                  fontWeight: 'bold'
                },
                title: {
                  color: '#606266',
                  fontSize: '15',
                  padding: [0, 0, 5, 0]
                }
              }
            },
            emphasis: {
              show: true,
              label: {
                show: true,
                fontSize: '36',
                fontWeight: 'bold'
              }
            },
            data: this.chartData,
            animationEasing: 'cubicInOut',
            animationDuration: 2600
          }
        ],
        backgroundColor: '#fff',
        textStyle: { fontFamily: 'Montserrat' }
      }
    }
  },
  watch: {
    chartData() {
      this.onInitChart()
    }
  },
  mounted() {
    this.onInitChart()
  },
  methods: {
    onInitChart() {
      this.$nextTick(() => {
        this.initChart()
      })
    },
    initChart() {
      const chartData = this.chartData
      const hasChartData = chartData.length > 0
      const chart = this.$refs['chart']
      if (hasChartData) {
        chart.dispatchAction({ type: 'highlight', name: this.chartData[0].name })
      }
    },
    onMouseOver(params) {
      const name = this.isFromDashboard ? this.chartData[0].name : params.name
      const chart = this.$refs['chart']
      if (!chart) return
      chart.dispatchAction({ type: 'downplay' })
      chart.dispatchAction({ type: 'highlight', name: name })
    },
    onMouseOut() {
      const chart = this.$refs['chart']
      if (!chart) return
      chart.dispatchAction({ type: 'downplay' })
      chart.dispatchAction({ type: 'highlight', name: this.chartData[0].name })
    }
  }
}
</script>
