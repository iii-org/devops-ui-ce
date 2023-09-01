<template>
  <el-row class="app-container">
    <el-col>
      <div>
        <span class="ml-2 text-xl">
          <span>
            {{ $t('route.Monitoring') }}
          </span>
        </span>
      </div>
      <el-divider />
      <el-card :class="isMobile ? 'mobile' : ''">
        <el-table-responsive
          :data="listData"
          :columns="tableColumns"
          fit
        >
          <template v-slot:health="{row}">
            <el-tag
              :type="getTagType(row.status)"
              :size="isMobile ? 'small' : 'medium'"
              effect="dark"
            >
              {{ $t(`ServiceMonitoring.${row.status}`) }}
            </el-tag>
          </template>
          <template v-slot:logs="{row}">
            <el-skeleton
              v-if="row.status === 'loading'"
              :rows="1"
              animated
            />
            <div v-else-if="!row.message">-</div>
            <div v-else style="white-space: normal;">{{ row.message }}</div>
          </template>
          <template v-slot:update_time="{row}">
            <div v-if="row.status === 'loading'">
              {{ $t('Loading') }}
            </div>
            <div v-else>
              {{ row.datetime }}
            </div>
          </template>
          <template v-slot:actions="{row}">
            <el-tooltip
              placement="bottom"
              :content="$t('ServiceMonitoring.CheckNow')"
            >
              <em
                :class="row.status === 'loading'
                  ? 'el-icon-loading disabled operate-button'
                  : 'ri-refresh-line finished operate-button'"
                @click="handleCheck(row.name)"
              />
            </el-tooltip>
          </template>
        </el-table-responsive>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
import { ElTableResponsive } from '@/components'
import { getLocalTime } from '@/utils/handleTime'
import { getSystemServerList, getServerStatus } from '@/api_v2/monitoring'
import { mapGetters } from 'vuex'

export default {
  name: 'ServiceMonitoring',
  components: { ElTableResponsive },
  data() {
    return {
      listData: []
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    tableColumns() {
      return [
        {
          label: this.$t('ServiceMonitoring.Services'),
          prop: 'name',
          align: 'center',
          minWidth: 80
        },
        {
          label: this.$t('ServiceMonitoring.Health'),
          prop: 'health',
          align: 'center',
          minWidth: 80,
          slot: 'health'
        },
        {
          label: this.$t('ServiceMonitoring.Logs'),
          prop: 'Logs',
          align: 'center',
          slot: 'logs'
        },
        {
          label: this.$t('ServiceMonitoring.LastUpdateTime'),
          prop: 'update_time',
          align: 'center',
          minWidth: 100,
          slot: 'update_time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          minWidth: 80,
          slot: 'actions'
        }
      ]
    }
  },
  mounted() {
    this.loadData()
    this.handleUpdate()
  },
  methods: {
    async loadData() {
      this.listData = (await getSystemServerList()).data.map((item) => ({
        name: item,
        status: 'loading'
      }))
      this.listData.forEach((item) => {
        this.fetchData(item.name)
      })
    },
    async fetchData(name) {
      await getServerStatus(name.toLowerCase()).then((res) => {
        const idx = this.listData.findIndex((item) => item.name === res.name)
        this.$set(this.listData, idx, this.handleData(res))
      })
    },
    handleUpdate() {
      const tenMinutes = 1000 * 60 * 10
      let timer = window.setInterval(async () => {
        await this.loadData()
      }, tenMinutes)
      this.$once('hook:beforeDestroy', () => {
        clearInterval(timer)
        timer = null
      })
    },
    handleData(res) {
      if (res.name === 'Harbor nfs folder storage remain.') res.name = 'Harbor'
      const datetime = getLocalTime(res.datetime)
      res.datetime = datetime
      return res
    },
    getTagType(status) {
      if (status === 'loading') return 'warning'
      else if (status) return 'success'
      else return 'danger'
    },
    async handleCheck(name) {
      const idx = this.listData.findIndex((item) => item.name === name)
      this.$set(this.listData[idx], 'status', 'loading')
      await getServerStatus(name.toLowerCase()).then((res) => {
        this.$set(this.listData, idx, this.handleData(res))
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile {
  ::v-deep .el-card__body {
    padding: 0;
  }
}
</style>
