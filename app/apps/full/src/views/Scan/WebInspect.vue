<template>
  <el-row class="app-container">
    <ProjectListSelector>
      <ScanLogButton slot="button" />
      <el-input
        v-model="keyword"
        class="mr-3"
        :placeholder="$t('Git.searchBranchOrCommitId')"
        :style="{ width: isMobile ? 'auto' : '200px' }"
        :size="isMobile ? 'small' : 'medium'"
        prefix-icon="el-icon-search"
      />
    </ProjectListSelector>
    <el-divider />
    <div class="text-right mb-2">
      <el-button
        class="buttonPrimaryReverse"
        icon="el-icon-refresh"
        size="mini"
        plain
        @click="loadData"
      >{{ $t('general.Refresh') }}</el-button>
    </div>
    <el-table-responsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      :data="pagedData"
      :columns="tableColumns"
      fit
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <template v-slot:commit_id="{ row }">
        <el-link
          class="linkTextColor"
          target="_blank"
          style="font-size: 16px"
          :href="row.commit_url"
        >
          <svg-icon
            class="mr-1"
            icon-class="ion-git-commit-outline"
          />{{ row.commit_id }}
        </el-link>
      </template>
      <template v-slot:status="{ row }">
        <el-tag
          v-if="row.status"
          class="el-tag--circle"
          :type="mapStatusTagType(row.status)"
          :size="isMobile ? 'mini' : 'medium'"
          effect="dark"
        >
          {{ $t(`Status.${row.status}`) }}
        </el-tag>
      </template>
      <template v-slot:critical="{ row }">
        {{ typeof row.state.critical === 'number' ? row.state.critical : '-' }}
      </template>
      <template v-slot:high="{ row }">
        {{ typeof row.state.high === 'number' ? row.state.high : '-' }}
      </template>
      <template v-slot:medium="{ row }">
        {{ typeof row.state.medium === 'number' ? row.state.medium : '-' }}
      </template>
      <template v-slot:low="{ row }">
        {{ typeof row.state.low === 'number' ? row.state.low : '-' }}
      </template>
      <template v-slot:report="{ row }">
        <el-tooltip
          placement="bottom"
          :content="$t('Dashboard.Report')"
        >
          <div :class="!row.scan_id || row.report_status !== 'Finished'
            ? 'disabled'
            : ''"
          >
            <em
              :class="!row.scan_id || row.report_status !== 'Finished'
                ? 'ri-file-list-2-line disabled operate-button'
                : 'ri-file-list-2-line active operate-button'"
              @click="handleDownloadReport(row)"
            />
            <div v-if="!isMobile" class="text-xs">
              {{ row.report_status ? $t(`Status.${row.report_status}`) : '' }}
            </div>
          </div>
        </el-tooltip>
      </template>
    </el-table-responsive>
    <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="handleCurrentChange"
    />
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { getWebInspectScans, getWebInspectReport } from '@/api/webInspect'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@/components'
import { downloadFileFromBinary } from '@/utils/downloadFile'
import ScanLogButton from './ScanLogButton'

export default {
  name: 'ScanWebInspect',
  components: {
    ProjectListSelector,
    ScanLogButton,
    ElTableResponsive
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      searchKeys: ['branch', 'commit_id'],
      pod: {}
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('WebInspect.ScanId'),
          prop: 'scan_id',
          minWidth: 120
        },
        {
          label: this.$t('WebInspect.Branch'),
          prop: 'branch',
          minWidth: 120
        },
        {
          label: this.$t('WebInspect.Commit'),
          prop: 'commit_id',
          minWidth: 120,
          slot: 'commit_id'
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          minWidth: 130,
          slot: 'status'
        },
        {
          label: this.$t('WebInspect.Critical'),
          prop: 'state.critical',
          slot: 'critical'
        },
        {
          label: this.$t('WebInspect.HighSeverity'),
          prop: 'state.high',
          slot: 'high'
        },
        {
          label: this.$t('WebInspect.MediumSeverity'),
          prop: 'state.medium',
          slot: 'medium'
        },
        {
          label: this.$t('WebInspect.LowSeverity'),
          prop: 'state.low',
          slot: 'low'
        },
        {
          label: this.$t('WebInspect.RunAt'),
          prop: 'run_at',
          type: 'time'
        },
        {
          label: this.$t('WebInspect.Report'),
          prop: 'report',
          slot: 'report'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      return await getWebInspectScans(this.selectedProjectId, this.listQuery)
        .then((res) => {
          return res.data
        })
        .catch((err) => {
          console.error(err)
        })
    },
    async handleDownloadReport(row) {
      const { scan_id } = row
      await getWebInspectReport(this.selectedProjectId, { scan_id })
        .then((res) => {
          downloadFileFromBinary(res, 'WebInspect_Report.pdf')
        })
        .catch((err) => {
          console.error(err)
          this.$message({
            title: this.$t('general.Error'),
            message: this.$t('Notify.DownloadFailed'),
            type: 'error'
          })
        })
    },
    mapStatusTagType(status) {
      const mapKey = {
        Failed: 'danger',
        Created: 'slow',
        Queued: 'warning',
        ResumeScanQueued: 'warning',
        Pending: 'warning',
        Paused: 'warning',
        Running: 'slow',
        Complete: 'success',
        Interrupted: 'info',
        Unknown: 'danger'
      }
      return mapKey[status] || 'slow'
    }
  }
}
</script>

<style lang="scss" scoped>
.disabled {
  cursor: not-allowed;
}
</style>
