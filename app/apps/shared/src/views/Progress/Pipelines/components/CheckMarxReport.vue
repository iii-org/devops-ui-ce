<template>
  <div ref="table_checkmarx">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div></div>
          <div style="font-size: 14px">
            <span>
              * {{ $t('TestReport.WarningPartOne') }}
              <el-link
                :underline="false"
                type="primary"
                target="_blank"
                style="line-height: 1px"
                @click="openDevCheckMarx"
              >
                {{ $t('TestReport.CheckMarxReport') }}
              </el-link>
              {{ $t('TestReport.WarningPartTwo') }}
            </span>
            <el-button
              slot="link"
              :disabled="disabled"
              type="text"
              icon="ri-download-2-line"
              class="ml-1"
              @click="openCheckMarx"
            >
              {{ $t('TestReport.DetailReport') }}
            </el-button>
          </div>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t('Version.Version') }}</th>
          <th id="">{{ $t('CheckMarx.HighSeverity') }}</th>
          <th id="">{{ $t('CheckMarx.MediumSeverity') }}</th>
          <th id="">{{ $t('CheckMarx.LowSeverity') }}</th>
          <th id="">{{ $t('CheckMarx.InfoSeverity') }}</th>
        </tr>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">CheckMarx</td>
          <td :data-label="$t('Version.Version')">
            {{ checkmarx[0]?.version_info ? checkmarx[0]?.version_info : '-' }}
          </td>
          <template v-if="hasCheckMarxData">
            <td :data-label="$t('CheckMarx.HighSeverity')">
              <span v-if="hasEachItemData('highSeverity')">
                {{ checkmarx[0].stats.highSeverity }}
              </span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('CheckMarx.MediumSeverity')">
              <span v-if="hasEachItemData('mediumSeverity')">
                {{ checkmarx[0].stats.mediumSeverity }}
              </span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('CheckMarx.LowSeverity')">
              <span v-if="hasEachItemData('lowSeverity')">
                {{ checkmarx[0].stats.lowSeverity }}
              </span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('CheckMarx.InfoSeverity')">
              <span v-if="hasEachItemData('infoSeverity')">
                {{ checkmarx[0].stats.infoSeverity }}
              </span>
              <span v-else>-</span>
            </td>
          </template>
          <template v-else>
            <td colspan="4">{{ $t('general.NoData') }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { getCheckMarxReport, registerCheckMarxReport } from '@/api/checkMarx'

export default {
  name: 'Checkmarx',
  props: {
    checkmarx: {
      type: Array,
      default: () => []
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    disabled() {
      return this.checkmarx[0] ? !this.checkmarx[0].report_ready : true
    },
    hasCheckMarxData() {
      return !!(
        this.checkmarx &&
        this.checkmarx[0] &&
        this.checkmarx[0].hasOwnProperty('stats')
      )
    },
    hasEachItemData() {
      const stats = this.checkmarx[0].stats
      return (key) => (stats ? stats.hasOwnProperty(key) : false)
    }
  },
  methods: {
    async openCheckMarx() {
      const { report_id, scan_id } = this.checkmarx[0]
      await getCheckMarxReport(report_id)
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', 'Checkmarx_Report.pdf')
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
          h(
            'div',
            { style: 'font-size: large' },
            this.$t('CheckMarx.registryReport')
          ),
          h(
            'div',
            { class: 'text-danger' },
            this.$t('CheckMarx.registryReportTip')
          )
        ]),
        showCancelButton: true,
        confirmButtonText: this.$t('general.Confirm'),
        cancelButtonText: this.$t('general.Cancel')
      }).then(() => {
        this.registerReport(scan_id)
      })
    },
    async registerReport(scanId) {
      this.listLoading = true
      await registerCheckMarxReport(scanId).then((res) => {
        const { reportId } = res.data
        const idx = this.listData.findIndex((item) => item.scan_id === scanId)
        this.listData[idx].report_id = reportId
        if (reportId > 0) this.fetchReportStatus(reportId)
      })
      this.listLoading = false
    },
    openDevCheckMarx() {
      const routeUrl = this.$router.resolve({ name: 'Checkmarx' })
      window.open(routeUrl.href, '_blank')
    }
  }
}
</script>
