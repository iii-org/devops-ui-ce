<template>
  <div style="height: 400px">
    <v-chart
      v-if="isEchartsReady"
      :option="option"
      class="chart"
      :theme="isLite ? 'macarons' : 'vintage'"
      autoresize
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import VChart from 'vue-echarts'

export default {
  name: 'HorizontalBar',
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
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: this.chartData.legend,
          orient: this.isMobile ? 'horizontal' : 'vertical',
          left: this.isMobile ? 'center' : 'left',
          y: this.isMobile ? 'bottom' : 'center',
          type: this.isMobile ? 'scroll' : null
        },
        grid: {
          left: this.isMobile ? '5%' : '15%',
          right: '5%',
          bottom: '5%',
          top: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          minInterval: 1
        },
        yAxis: {
          type: 'category',
          data: this.chartData.yAxis
        },
        series: this.chartData.series,
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
        { TooltipComponent, LegendComponent, GridComponent },
        { BarChart },
        { CanvasRenderer }
      ] = await Promise.all([
        import('echarts/core'),
        import('echarts/components'),
        import('echarts/charts'),
        import('echarts/renderers')
      ])

      use([
        TooltipComponent,
        LegendComponent,
        GridComponent,
        BarChart,
        CanvasRenderer
      ])
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
