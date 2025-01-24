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
import { getRdDashboardIssuesPriority } from '@/api/dashboard'
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
      prioritys: [],
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
          show: this.prioritys.length === 0,
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
        color: ['#f56c6c', '#e6a23c'],
        legend: {
          left: 'center',
          bottom: '10'
        },
        series: [
          {
            name: 'ASSIGN ISSUE PRIORITY',
            type: 'pie',
            roseType: 'radius',
            radius: [15, 95],
            data: this.prioritys,
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
    getRdDashboardIssuesPriority(this.userId).then((res) => {
      this.prioritys = res.data.map((item) => {
        item.value = item.number
        return item
      })
    })
  },
  async created() {
    await this.loadEchartsModules()
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
    }
  }
}
</script>
