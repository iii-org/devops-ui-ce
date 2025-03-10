<template>
  <el-card class="mb-3 border-none">
    <div class="flex items-center font-semibold h-8">
      <em class="el-icon-pie-chart mx-1"></em>
      {{ $t('Dashboard.IssueTrackingStatus') }}
    </div>
    <el-empty
      v-if="Object.keys(dataCollection).length === 0"
      :description="$t('general.NoData')"
      :image-size="200"
      style="height: 400px"
    />
    <Doughnut v-else :chart-data="dataCollection" />
  </el-card>
</template>

<script>
import { mapGetters } from 'vuex'
import Doughnut from './Doughnut.vue'
import styles from '@/styles/theme/variables.module.scss'

export default {
  name: 'IssueTrackingStatusCard',
  components: { Doughnut },
  props: {
    progressObj: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      dataCollection: {}
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId']),
    getColors() {
      return (key) => {
        const colors = {
          active: styles.active,
          assigned: styles.assigned,
          inProgress: styles.inProgress,
          solved: styles.solved,
          verified: styles.verified,
          closed: styles.closed
        }
        return colors[key]
      }
    }
  },
  watch: {
    progressObj(val) {
      this.handleProgress(val)
    },
    '$i18n.locale'() {
      this.handleProgress(this.progressObj)
    }
  },
  methods: {
    handleProgress(progress) {
      const hasProgress = Object.keys(progress).length > 0
      if (hasProgress) {
        this.fillData(progress)
      } else {
        this.dataCollection = {}
      }
    },
    fillData(chartData) {
      const issueStatusList = [
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
      this.dataCollection = {
        color: issueStatusList.map((item) => item.color),
        data: issueStatusList.map((status) => ({
          value: chartData[status.key],
          name: status.label
        }))
      }
    }
  }
}
</script>
