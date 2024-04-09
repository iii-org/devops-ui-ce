<template>
  <div style="height: 400px">
    <v-chart
      :option="option"
      class="chart"
      theme="isLite ? 'macarons' : 'vintage'"
      autoresize
    />
  </div>
</template>

<script>
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { BarChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { mapGetters } from 'vuex'

require('echarts/theme/macarons') // echarts theme
require('echarts/theme/vintage')
use([TooltipComponent, LegendComponent, GridComponent, BarChart, CanvasRenderer])

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
  computed: {
    ...mapGetters(['device']),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
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
