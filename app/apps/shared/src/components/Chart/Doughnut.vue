<template>
  <VChart
    v-if="isEchartsReady"
    ref="chart"
    :style="{ height, width }"
    :option="option"
    autoresize
    :theme="isLite ? 'macarons' : 'vintage'"
    @mouseover="onMouseOver"
    @mouseout="onMouseOut"
  />
</template>

<script>
import variables from '@/styles/theme/variables.module.scss'
import VChart from 'vue-echarts'

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
    },
    isFromMonitoringLog: {
      type: Boolean,
      default: false
    },
    monitoringLogType: {
      type: String,
      default: 'System'
    }
  },
  data() {
    return {
      isLite: false,
      isEchartsReady: false
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
          data: this.chartData.map((i) => i.name),
          show: this.showLegend
        },
        series: [
          {
            type: 'pie',
            radius: this.radius,
            center: this.center,
            label: this.isFromMonitoringLog
              ? {
                  show: false,
                  position: 'center',
                  formatter: (d) => {
                    const { name, value, total, isPod } = d.data
                    return isPod
                      ? `{number|${Math.round(
                          (value / total) * 100
                        )}%}\n{hint|${value} of ${total} ${name}}\n\n{title|Pods}`
                      : `{number|${Math.round(
                          (value / total) * 100
                        )}%}\n{hint|${value} of ${total} GiB ${name}}\n\n{title|Memory}`
                  },
                  rich: {
                    number: {
                      fontSize: '30',
                      fontWeight: 'bold'
                    },
                    hint: {
                      color: '#606266',
                      fontSize: '15',
                      padding: [0, 0, 5, 0]
                    },
                    title: {
                      color:
                        this.monitoringLogType === 'System'
                          ? variables.primary
                          : variables.secondary,
                      fontSize: '24',
                      fontWeight: 'bold'
                    }
                  }
                }
              : {
                  show: false,
                  position: 'center',
                  formatter: (d) =>
                    `{number|${d.data.total || d.value}}\n{title|${d.name}}`,
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
                fontSize: '28',
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
  async created() {
    await this.loadEchartsModules()
    this.onInitChart()
  },
  methods: {
    async loadEchartsModules() {
      const [
        { use },
        { CanvasRenderer },
        { PieChart, ScatterChart },
        { LegendComponent }
      ] = await Promise.all([
        import('echarts/core'),
        import('echarts/renderers'),
        import('echarts/charts'),
        import('echarts/components')
      ])

      use([CanvasRenderer, PieChart, ScatterChart, LegendComponent])

      if (this.isLite) {
        await import('echarts/theme/macarons')
      } else {
        await import('echarts/theme/vintage')
      }

      this.isEchartsReady = true
    },
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
        chart.dispatchAction({
          type: 'highlight',
          name: this.chartData[0].name
        })
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
