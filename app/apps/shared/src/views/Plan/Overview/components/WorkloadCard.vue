<template>
  <el-card
    :class="{ 'border-none': shadow === 'always' }"
    :shadow="shadow"
    class="mb-3"
  >
    <div class="flex justify-between items-center font-semibold">
      <div>
        <em class="el-icon-data-analysis mx-1"></em>
        <span>{{ $t('Dashboard.Workload') }}</span>
        <em
          v-if="!saveSelectedItem && showFullScreen"
          class="el-icon-zoom-in cursor-pointer mx-2"
          @click="showFullIssuePriority"
        ></em>
      </div>
      <el-select
        v-model="selectedItem"
        size="small"
        style="width: 150px"
        @change="fillData"
      >
        <el-option
          v-for="item in selectList"
          :key="item.id"
          :label="$t('Issue.' + item.label)"
          :value="item.id"
        />
      </el-select>
    </div>
    <el-empty
      v-if="Object.keys(selectedData).length === 0"
      :description="$t('general.NoData')"
      :image-size="200"
      style="height: 400px"
    />
    <HorizontalBar v-else :chart-data="dataCollection" />
  </el-card>
</template>

<script>
import { mapGetters } from 'vuex'
import HorizontalBar from './HorizontalBar.vue'
import colorVariables from '@/styles/theme/variables.module.scss'

export default {
  name: 'WorkloadCard',
  components: { HorizontalBar },
  props: {
    statisticsObj: {
      type: Object,
      default: () => {}
    },
    saveSelectedItem: {
      type: String,
      default: ''
    },
    showFullScreen: {
      type: Boolean,
      default: true
    },
    shadow: {
      type: String,
      default: 'always'
    }
  },
  data() {
    return {
      dataCollection: {},
      selectList: [],
      selectedItem: ''
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId']),
    getColors() {
      return (key) => {
        const colors = {
          active: colorVariables.active,
          assigned: colorVariables.assigned,
          inProgress: colorVariables.inProgress,
          solved: colorVariables.solved,
          verified: colorVariables.verified,
          closed: colorVariables.closed
        }
        return colors[key]
      }
    },
    selectedData() {
      const selectedItem = this.selectList.find(
        (item) => item.label === this.selectedItem
      )
      return selectedItem ? selectedItem.data : {}
    },
    chartData() {
      const rowData = this.selectedData
      const keyMap = {
        Unassigned: this.$t('Issue.Unassigned'),
        Normal: this.$t('Issue.Normal'),
        Immediate: this.$t('Issue.Immediate'),
        High: this.$t('Issue.High'),
        Low: this.$t('Issue.Low'),
        Epic: this.$t('Issue.Epic'),
        Audit: this.$t('Issue.Audit'),
        Feature: this.$t('Issue.Feature'),
        Bug: this.$t('Issue.Bug'),
        Issue: this.$t('Issue.Issue'),
        'Change Request': this.$t('Issue.Change Request'),
        Risk: this.$t('Issue.Risk'),
        'Test Plan': this.$t('Issue.Test Plan'),
        'Fail Management': this.$t('Issue.Fail Management'),
        Research: this.$t('Issue.Research'),
        Document: this.$t('Issue.Document')
      }
      return Object.keys(rowData).reduce((newData, key) => {
        const newKey = keyMap[key] || key
        newData[newKey] = rowData[key]
        return newData
      }, {})
    },
    issueStatusList() {
      return [
        {
          label: this.$t('Issue.Active'),
          color: this.getColors('active'),
          key: 'Active'
        },
        {
          label: this.$t('Issue.Assigned'),
          color: this.getColors('assigned'),
          key: 'Assigned'
        },
        {
          label: this.$t('Issue.InProgress'),
          color: this.getColors('inProgress'),
          key: 'InProgress'
        },
        {
          label: this.$t('Issue.Solved'),
          color: this.getColors('solved'),
          key: 'Solved'
        },
        {
          label: this.$t('Issue.Verified'),
          color: this.getColors('verified'),
          key: 'Verified'
        },
        {
          label: this.$t('Issue.Closed'),
          color: this.getColors('closed'),
          key: 'Closed'
        }
      ]
    }
  },
  watch: {
    statisticsObj(val) {
      this.handleStatistics(val)
    },
    selectedItem(val) {
      this.$emit('emitSelectedItem', val)
    },
    saveSelectedItem() {
      this.handleStatistics(this.statisticsObj)
    },
    '$i18n.locale'() {
      this.handleStatistics(this.statisticsObj)
    }
  },
  mounted() {
    this.handleStatistics(this.statisticsObj)
  },
  methods: {
    handleStatistics(statistics) {
      const hasStatistics = Object.keys(statistics).length > 0
      if (hasStatistics) {
        this.selectList = Object.keys(statistics).map((key) => ({
          id: key,
          label: key,
          data: statistics[key]
        }))
        const defaultKeyIdx = this.selectList.findIndex(
          (item) => item.id === 'assigned'
        )
        this.selectedItem =
          this.saveSelectedItem !== ''
            ? this.saveSelectedItem
            : this.selectList[defaultKeyIdx].id
        this.fillData()
      } else {
        this.dataCollection = {}
        this.selectList = []
        this.selectedItem = ''
      }
    },
    fillData() {
      const yAxis = Object.keys(this.chartData)
      const seriesData = []
      this.issueStatusList.map((status) =>
        seriesData.push(
          yAxis
            .map((yAxisItem) => this.chartData[yAxisItem])
            .map((item) => item[status.key])
        )
      )
      this.dataCollection = {
        legend: this.issueStatusList.map((status) => status.label),
        yAxis,
        series: this.issueStatusList.map((status, index) => ({
          name: status.label,
          color: status.color,
          data: seriesData[index],
          type: 'bar',
          stack: 'total',
          label: {
            show: false
          },
          emphasis: {
            focus: 'series'
          }
        }))
      }
    },
    showFullIssuePriority() {
      this.$emit('showFullIssuePriority')
    }
  }
}
</script>
