<template>
  <el-row v-loading="listLoading">
    <el-row class="circle">
      <template v-if="listData.length > 0">
        <el-col
          v-for="(item, idx) in listData"
          :key="idx"
          :xs="24"
          :sm="8"
          :md="8"
        >
          <Doughnut
            :chart-data="item"
            :radius="['70%', '90%']"
            :center="['50%', '50%']"
            :show-legend="false"
            :is-from-dashboard="true"
            @click.native="onShowDetail(oriData[idx].database)"
          />
        </el-col>
      </template>
      <no-data v-else />
    </el-row>
    <el-dialog
      :visible.sync="detailDialog"
      :title="$t('Dashboard.ADMIN.ProjectList.NAME')"
      destroy-on-close
      top="3vh"
      width="90vw"
    >
      <AdminProjectList
        ref="projectList"
        :data="getProjectListDetailData"
        :in-dialog="true"
      />
    </el-dialog>
  </el-row>
</template>

<script>
import AdminProjectList from './AdminProjectList'
import { getProjectListDetail } from '@/api/dashboard'
import colorVariables from '@/styles/theme/variables.module.scss'

export default {
  name: 'AdminOverview',
  components: {
    NoData: () => import('@shared/components/NoData'),
    AdminProjectList,
    Doughnut: () => import('@shared/components/Chart/Doughnut')
  },
  props: {
    data: {
      type: Function,
      default: () => []
    }
  },
  data() {
    return {
      listLoading: false,
      listData: [],
      detailDialog: false,
      oriData: []
    }
  },
  watch: {
    listLoading(value) {
      this.$emit('loading', value)
    },
    oriData: {
      deep: true,
      handler(value) {
        this.$emit('total-count', value[0])
      }
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.listLoading = true
      this.oriData = await this.data()
      this.oriData.forEach((item, idx) => {
        this.listData.push(this.formatData(item, this.oriData[0], idx))
      })
      this.listLoading = false
    },
    formatData(item, total, idx) {
      const result = []
      result.push({
        value: item.count,
        name: this.$t('Dashboard.ADMIN.Overview.' + item.project_status),
        emphasis: { color: colorVariables[item.class] },
        itemStyle: { color: colorVariables[item.class] }
      })
      if (idx !== 0) {
        result.push({
          value: total.count - item.count,
          total: total.count,
          name: this.$t('Dashboard.ADMIN.Overview.' + total.project_status),
          emphasis: { color: '#d3d3d3' },
          itemStyle: { color: '#d3d3d3' }
        })
      }
      return result
    },
    getProjectListDetailData() {
      return getProjectListDetail().then((res) => Promise.resolve(res.data))
    },
    onShowDetail(value) {
      this.detailDialog = true
      this.$nextTick(() => {
        this.$refs['projectList'].searchStatus = value
      })
    },
    overviewTableCellClassName({ column }) {
      if (column.property === 'count') {
        return 'count'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.circle {
  ::v-deep .circle-primary {
    border-color: $buttonPrimary;
    color: $buttonPrimary;
  }

  ::v-deep .circle-danger {
    border-color: $danger;
    color: $danger;
  }

  ::v-deep .circle-info {
    border-color: $info-4;
    color: $info-4;
  }
}

::v-deep .list {
  font-size: 1.5em;
  width: 100%;

  .count {
    font-size: 2em;
    padding-right: 0.25em;
    text-align: right;
    font-weight: bolder;
  }

  .el-row {
    border-width: 5px;
    border-style: solid;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .table-primary {
    border-color: $buttonPrimary;
    color: $buttonPrimary;
  }

  .table-danger {
    border-color: $danger;
    color: $danger;
  }

  .table-info {
    border-color: $info-4;
    color: $info-4;
  }
}

.pointer {
  cursor: pointer;
}
</style>
