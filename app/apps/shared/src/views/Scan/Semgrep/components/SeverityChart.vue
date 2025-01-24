<template>
  <div class="w-full">
    <VChart
      v-if="isEchartsReady && hasChartData"
      ref="semgrepChart"
      :option="option"
      :style="{ height, width }"
      autoresize
    />
    <div v-else class="h-[300px] flex">
      <NoData />
    </div>
  </div>
</template>

<script>
import VChart from 'vue-echarts'

export default {
  name: 'SeverityChart',
  components: {
    VChart,
    NoData: () => import('@shared/components/NoData')
  },
  props: {
    severityData: {
      type: Object,
      default: () => ({})
    },
    width: {
      type: String,
      default: 'auto'
    },
    height: {
      type: String,
      default: '300px'
    }
  },
  data() {
    return {
      isEchartsReady: false
    }
  },
  computed: {
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    hasChartData() {
      return Object.keys(this.severityData).length > 0
    },
    chartData() {
      const order = ['critical', 'high', 'medium', 'low', 'info']
      const sortedKeys = Object.keys(this.severityData).sort(
        (a, b) => order.indexOf(a) - order.indexOf(b)
      )
      const sortedValues = sortedKeys.map((key) => this.severityData[key])
      return {
        xAxisData: sortedKeys.map((value, index) => {
          const key = `${value.charAt(0).toUpperCase()}${value.slice(1)}`
          return this.$t(`Plugins.semgrep.${key}`)
        }),
        seriesData: sortedValues.map((value, index) => ({
          value,
          itemStyle: {
            color: this.barColors[index]
          }
        }))
      }
    },
    barColors() {
      return this.isLite
        ? ['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80']
        : ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8']
    },
    option() {
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          data: this.chartData.xAxisData
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [
          {
            type: 'bar',
            data: this.chartData.seriesData
          }
        ],
        backgroundColor: 'transparent',
        textStyle: { fontFamily: 'Montserrat' }
      }
    }
  },
  async created() {
    await this.loadEchartsModules()
    this.$emit('echartRefs', this.$refs.semgrepChart)
  },
  methods: {
    async loadEchartsModules() {
      const [
        { use },
        { CanvasRenderer },
        { BarChart },
        { GridComponent, TooltipComponent }
      ] = await Promise.all([
        import('echarts/core'),
        import('echarts/renderers'),
        import('echarts/charts'),
        import('echarts/components')
      ])

      use([CanvasRenderer, BarChart, GridComponent, TooltipComponent])

      this.isEchartsReady = true
    }
  }
}
</script>
