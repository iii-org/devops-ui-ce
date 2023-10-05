<template>
  <div style="height: 400px; width: auto;">
    <v-chart
      class="chart"
      :option="option"
      :theme="isLite ? 'macarons' : 'vintage'"
      autoresize
    />
  </div>
</template>

<script>
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { mapGetters } from 'vuex'

require('echarts/theme/macarons') // echarts theme
require('echarts/theme/vintage') // echarts theme
use([TooltipComponent, LegendComponent, PieChart, CanvasRenderer])

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
            radius: [this.isMobile ? '30%' : '40%', this.isMobile ? '50%' : '70%'],
            center: [this.isMobile ? '50%' : '60%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: true,
              formatter: '{b}\n\n{c}',
              fontSize: '14px'
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
