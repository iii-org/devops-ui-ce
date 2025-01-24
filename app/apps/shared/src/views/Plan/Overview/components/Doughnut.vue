<template>
  <div style="height: 400px; width: auto">
    <v-chart
      v-if="isEchartsReady"
      :option="option"
      :theme="isLite ? 'macarons' : 'vintage'"
      class="chart"
      autoresize
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import VChart from 'vue-echarts'

export default {
  name: 'Doughnut',
  components: {
    'v-chart': VChart
  },
  props: {
    chartData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isEchartsReady: false
    }
  },

  computed: {
    ...mapGetters(['device']),
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    isMobile() {
      return this.device === 'mobile'
    },
    option() {
      return {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: this.isMobile ? 'horizontal' : 'vertical',
          left: this.isMobile ? 'center' : 'left',
          y: this.isMobile ? 'bottom' : 'center',
          type: this.isMobile ? 'scroll' : null
        },
        color: this.chartData.color,
        series: [
          {
            name: '',
            type: 'pie',
            radius: [
              this.isMobile ? '30%' : '40%',
              this.isMobile ? '50%' : '70%'
            ],
            center: [this.isMobile ? '50%' : '60%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: true,
              formatter: '{title|{b}}\n{hr|}\n{value|{c}}',
              rich: {
                title: {
                  color: '#6E7079',
                  lineHeight: 22,
                  fontSize: 14,
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
            emphasis: {
              label: {
                show: true,
                fontSize: '20',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: true
            },
            data: this.chartData.data
          }
        ],
        backgroundColor: '#fff',
        textStyle: { fontFamily: 'Montserrat' }
      }
    }
  },
  async created() {
    await this.loadEchartsModules()
    this.isEchartsReady = true
  },
  methods: {
    async loadEchartsModules() {
      const [
        { use },
        { TooltipComponent, LegendComponent },
        { PieChart },
        { CanvasRenderer }
      ] = await Promise.all([
        import('echarts/core'),
        import('echarts/components'),
        import('echarts/charts'),
        import('echarts/renderers')
      ])

      use([TooltipComponent, LegendComponent, PieChart, CanvasRenderer])

      if (this.isLite) {
        await import('echarts/theme/macarons')
      } else {
        await import('echarts/theme/vintage')
      }
    }
  }
}
</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
  min-height: 350px;
}
</style>
