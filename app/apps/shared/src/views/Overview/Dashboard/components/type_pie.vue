<template>
  <v-chart
    ref="chart"
    :style="{ height, width }"
    :option="option"
    :theme="isLite ? 'macarons' : 'vintage'"
    autoresize
  />
</template>

<script>
import { getRdDashboardIssuesType } from '@/api/dashboard'
import { mapGetters } from 'vuex'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, ScatterChart } from 'echarts/charts'

require('echarts/theme/macarons') // echarts theme
require('echarts/theme/vintage')

use([
  CanvasRenderer,
  ScatterChart,
  PieChart
])

export default {
  components: {
    'v-chart': VChart
  },
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '300px'
    }
  },
  data() {
    return {
      chart: null,
      types: []
    }
  },
  computed: {
    ...mapGetters(['userId']),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    option() {
      return {
        title: {
          show: this.types.length === 0,
          textStyle: {
            color: 'grey',
            fontSize: 20
          },
          text: 'No Issue',
          left: 'center',
          top: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b} : {c} ({d}%)',
          textStyle: {
            // color: '#FFFFFF'
          }
        },
        color: ['#67c23a', '#f56c6c'],
        legend: {
          left: 'center',
          bottom: '10'
        },
        series: [
          {
            name: 'ASSIGN ISSUE TYPE',
            type: 'pie',
            roseType: 'radius',
            radius: [15, 95],
            data: this.types,
            animationEasing: 'cubicInOut',
            animationDuration: 2600
          }
        ],
        backgroundColor: '#fff',
        textStyle: { fontFamily: 'Montserrat' }
      }
    }
  },
  mounted() {
    getRdDashboardIssuesType(this.userId).then((res) => {
      this.types = res.data.map((item) => {
        item.value = item.number
        return item
      })
    })
  }
}
</script>
