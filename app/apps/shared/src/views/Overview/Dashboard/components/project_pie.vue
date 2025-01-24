<template>
  <v-chart
    v-if="isEchartsReady"
    ref="chart"
    :style="{ height, width }"
    :option="option"
    :theme="isLite ? 'macarons' : 'vintage'"
    autoresize
  />
</template>

<script>
import { getRdDashboardIssuesProject } from '@/api/dashboard'
import { mapGetters } from 'vuex'
import VChart from 'vue-echarts'

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
      projects: [],
      isEchartsReady: false
    }
  },
  computed: {
    ...mapGetters(['userId']),
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    option() {
      return {
        title: {
          show: this.projects.length === 0,
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
        legend: {
          left: 'center',
          bottom: '10'
        },
        series: [
          {
            name: 'ASSIGN ISSUE PROJECT',
            type: 'pie',
            roseType: 'radius',
            radius: [15, 95],
            data: this.projects,
            animationEasing: 'cubicInOut',
            animationDuration: 2600
          }
        ],
        backgroundColor: '#fff',
        textStyle: { fontFamily: 'Montserrat' }
      }
    }
  },
  async created() {
    await this.loadEchartsModules()
    this.fetchData()
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

      use([CanvasRenderer, ScatterChart, PieChart, LegendComponent])

      if (this.isLite) {
        await import('echarts/theme/macarons')
      } else {
        await import('echarts/theme/vintage')
      }

      this.isEchartsReady = true
    },
    fetchData() {
      getRdDashboardIssuesProject(this.userId).then((res) => {
        this.projects = res.data.map((item) => {
          item.value = item.number
          return item
        })
      })
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
