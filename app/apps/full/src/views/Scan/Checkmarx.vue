<template>
  <el-row class="app-container">
    <ProjectListSelector>
      <ScanLogButton slot="button" />
      <el-input
        v-model="keyword"
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
      >
        {{ $t('general.Refresh') }}
      </el-button>
    </div>
    <el-table-responsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      :data="pagedData"
      :columns="tableColumns"
      fit
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
      :error="error"
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
          />
          {{ row.commit_id }}
        </el-link>
      </template>
      <template v-slot:status="{ row }">
        <el-tooltip
          v-if="row.error"
          effect="dark"
          :content="row.error.message"
          placement="bottom"
        >
          <div class="flex flex-col">
            <el-link
              type="primary"
              class="text-xs"
              :underline="false"
            >{{ row.error.code }}</el-link>
            <div class="mt-1">
              <el-tag
                class="el-tag--circle"
                type="danger"
                effect="dark"
              >
                <span>{{ $t('general.Error') }}</span>
              </el-tag>
            </div>
          </div>
        </el-tooltip>
        <template v-else>
          <el-tag
            v-if="row.status"
            class="el-tag--circle"
            :size="isMobile ? 'mini' : 'medium'"
            :type="handleType(row.status)"
            :effect="getTagEffect(row.status)"
          >
            <span>{{ $t(`CheckMarx.${row.status}`) }}</span>
          </el-tag>
          <el-tooltip
            v-if="isInQueued(row) && row.queue"
            class="item"
            effect="dark"
            :content="$t('CheckMarx.QueueTooltip')"
            placement="bottom"
          >
            <el-link class="text-xs">
              {{ $t('CheckMarx.QueueSequence') }}: {{ row.queue }}
            </el-link>
          </el-tooltip>
        </template>
      </template>
      <template v-slot:report_ready="{ row }">
        <template v-if="canBeCanceled(row)">
          <el-tooltip
            placement="bottom"
            :content="$t('general.Cancel')"
          >
            <em
              class="ri-close-circle-line danger operate-button"
              @click="cancelScans(row)"
            />
          </el-tooltip>
        </template>
        <div v-else-if="isException(row)">-</div>
        <template v-else-if="isInProcess(row)">
          <el-tooltip
            placement="bottom"
            :content="row.report_ready ? $t('File.Download') : $t('CheckMarx.InProcess')"
          >
            <em
              :class="!row.report_ready
                ? 'el-icon-loading inProgress operate-button'
                : 'ri-download-line active operate-button'"
              @click="fetchTestReport(row)"
            />
          </el-tooltip>
        </template>
        <div v-else>-</div>
      </template>
    </el-table-responsive>
    <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  getCheckMarxReport,
  getCheckMarxReportStatus,
  getCheckMarxScans,
  getCheckMarxScanStats,
  getCheckMarxScanStatus,
  registerCheckMarxReport,
  cancelCheckMarxScans
} from '@/api/checkMarx'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@/components'
import * as elementTagType from '@/utils/elementTagType'
import ScanLogButton from './ScanLogButton'

export default {
  name: 'ScanCheckmarx',
  components: {
    ProjectListSelector,
    ScanLogButton,
    ElTableResponsive
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      searchKeys: ['branch', 'commit_id'],
      error: {}
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
          label: this.$t('CheckMarx.ScanId'),
          prop: 'scan_id',
          width: 110
        },
        {
          label: this.$t('Git.Branch'),
          prop: 'branch'
        },
        {
          label: this.$t('Git.Commit'),
          prop: 'commit_id',
          width: 140,
          slot: 'commit_id'
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          slot: 'status'
        },
        {
          label: this.$t('CheckMarx.HighSeverity'),
          prop: 'stats.highSeverity'
        },
        {
          label: this.$t('CheckMarx.MediumSeverity'),
          prop: 'stats.mediumSeverity'
        },
        {
          label: this.$t('CheckMarx.LowSeverity'),
          prop: 'stats.lowSeverity'
        },
        {
          label: this.$t('CheckMarx.InfoSeverity'),
          prop: 'stats.infoSeverity'
        },
        {
          label: this.$t('CheckMarx.RunAt'),
          prop: 'run_at',
          type: 'time'
        },
        {
          label: this.$t('CheckMarx.Report'),
          prop: 'report_ready',
          slot: 'report_ready'
        }
      ]
    }
  },
  watch: {
    listData() {
      this.updateCheckMarxScansStatus(this.listData)
    }
  },
  methods: {
    async fetchData() {
      if (this.selectedProjectId === -1) return []
      let res = []
      try {
        res = await getCheckMarxScans(this.selectedProjectId)
      } catch (error) {
        this.error = error
      }
      return res.data
    },
    async updateCheckMarxScansStatus(listData) {
      listData.forEach((item) => {
        const { status, scan_id, report_id, report_ready } = item
        if (status === null) {
          this.fetchScanStatus(scan_id)
          return
        }
        if (report_id && report_id > 0 && !report_ready) {
          this.fetchReportStatus(report_id)
        }
      })
    },
    fetchScanStatus(scanId) {
      this.listLoading = true
      getCheckMarxScanStatus(scanId)
        .then((res) => {
          const idx = this.listData.findIndex((item) => item.scan_id === scanId)
          this.listData[idx].status = res.data.name
          this.listData[idx].queue = res.data.queue_position
          this.listData[idx].id = res.data.id
          if (res.data.id === 7) {
            this.fetchScanStats(scanId)
            this.registerReport(scanId)
          }
        })
        .catch(async (error) => {
          const idx = this.listData.findIndex((item) => item.scan_id === scanId)
          if (error.response.status >= 300) {
            this.$set(this.listData[idx], 'error', error.response.data.error)
          }
        })
      this.listLoading = false
    },
    fetchScanStats(scanId) {
      getCheckMarxScanStats(scanId).then((res) => {
        const idx = this.listData.findIndex((item) => item.scan_id === scanId)
        this.listData[idx].stats = res.data
      })
    },
    registerReport(scanId) {
      this.listLoading = true
      registerCheckMarxReport(scanId).then((res) => {
        const { reportId } = res.data
        const idx = this.listData.findIndex((item) => item.scan_id === scanId)
        this.listData[idx].report_id = reportId
        if (reportId > 0) this.fetchReportStatus(reportId)
      })
      this.listLoading = false
    },
    fetchReportStatus(reportId) {
      this.listLoading = true
      getCheckMarxReportStatus(reportId).then((res) => {
        const idx = this.listData.findIndex((item) => item.report_id === reportId)
        if (res.data.id === 1) {
          this.listData[idx].report_ready = false
        }
        if (res.data.id === 2) {
          this.listData[idx].report_ready = true
        }
      })
      this.listLoading = false
    },
    fetchTestReport(row) {
      if (!row.report_ready) return
      const { report_id, scan_id } = row
      getCheckMarxReport(report_id)
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', 'checkmarx_Report.pdf')
          document.body.appendChild(link)
          link.click()
          link.remove()
        })
        .catch((_) => {
          this.confirmRegistryReport(scan_id)
        })
    },
    confirmRegistryReport(scan_id) {
      const h = this.$createElement
      this.$msgbox({
        title: this.$t('general.caution'),
        type: 'warning',
        message: h('p', null, [
          h('div', { style: 'font-size: large' }, this.$t('CheckMarx.registryReport')),
          h('div', { style: 'color: red' }, this.$t('CheckMarx.registryReportTip'))
        ]),
        showCancelButton: true,
        confirmButtonText: this.$t('general.Confirm'),
        cancelButtonText: this.$t('general.Cancel')
      }).then(() => {
        this.registerReport(scan_id)
      })
    },
    async cancelScans(row) {
      const { scan_id } = row
      let hasError = false
      try {
        await cancelCheckMarxScans(scan_id)
      } catch (error) {
        hasError = true
        console.error(error)
      } finally {
        if (!hasError) {
          await this.loadData()
          this.$message({
            message: this.$t('CheckMarx.cancelScansMessage', [scan_id]),
            type: 'warning'
          })
        }
      }
    },
    /**
     * all status of checkmarx's scan:
     * 1: New, 2: PreScan, 3: Queued, 4: Scanning, 6: PostScan, 7: Finished, 8: Canceled, 9: Failed
     */
    isInQueued(row) {
      return row.status === 'New' || row.status === 'PreScan' || row.status === 'Queued'
    },
    // if the scan's status are PreScan, Queued or Scanning, users can cancel the scans
    canBeCanceled(row) {
      return row.status === 'PreScan' || row.status === 'Queued' || row.status === 'Scanning'
    },
    isInProcess(row) {
      return row.status !== 'Failed' && row.status !== 'Canceled' && row.status !== 'Deleted'
    },
    // the scans report sometimes wouldn't be produced when they have been scanned
    isException(row) {
      return row.status === 'Finished' && row.report_id === -1
    },
    handleType(prop) {
      const location = 'checkMarx'
      return elementTagType[location][prop] || 'default'
    },
    getTagEffect(status) {
      const tagMap = { Building: 'light' }
      return tagMap[status] || 'dark'
    }
  }
}
</script>
