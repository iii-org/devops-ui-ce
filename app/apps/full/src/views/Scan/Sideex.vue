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
    <p class="text-right text-info">
      <em class="el-icon-warning" />{{ $t('Sideex.promptMessage') }}
    </p>
    <el-table-responsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      fit
      highlight-current-row
      :data="pagedData"
      :columns="tableColumns"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
    >
      <template v-slot:commit_id="{ row }">
        <el-link
          class="linkTextColor"
          target="_blank"
          style="font-size: 16px"
          :href="row.issue_link"
        >
          <svg-icon
            class="mr-1"
            icon-class="ion-git-commit-outline"
          />{{ row.commit_id }}
        </el-link>
      </template>
      <template v-slot:suitesPassed="{ row }">
        <span v-if="Object.keys(row.result).length > 0">
          {{ row.result.suitesPassed }}/{{ row.result.suitesTotal }}
        </span>
        <span v-else>-</span>
      </template>
      <template v-slot:casesPassed="{ row }">
        <span v-if="Object.keys(row.result).length > 0">
          {{ row.result.casesPassed }}/{{ row.result.casesTotal }}
        </span>
        <span v-else>-</span>
      </template>
      <template v-slot:duration="{ row }">
        {{ durationText(row.run_at, row.finished_at) }}
      </template>
      <template v-slot:fullLog="{ row }">
        <el-tooltip
          v-if="row.status === 'Finished' && row.has_report"
          placement="bottom"
          :content="$t('Dashboard.Report')"
        >
          <em
            class="ri-external-link-line active operate-button"
            @click="fetchReportData(row.id)"
          />
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
      @pagination="onPagination"
    />
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { getSideexScans, getSideexReport } from '@/api/sideex'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@/components'
import { getDurationTime } from '@/utils/handleTime'
import ScanLogButton from './ScanLogButton'

export default {
  name: 'ScanSideex',
  components: {
    ProjectListSelector,
    ScanLogButton,
    ElTableResponsive
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      confirmLoading: false,
      searchKeys: ['branch', 'commit_id']
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
          label: this.$t('Log.testId'),
          prop: 'id'
        },
        {
          label: this.$t('Git.Branch'),
          prop: 'branch'
        },
        {
          label: this.$t('Git.Commit'),
          prop: 'commit_id',
          width: '140',
          slot: 'commit_id'
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          minWidth: '130',
          location: 'sideex',
          i18nKey: 'Status',
          type: 'tag'
        },
        {
          label: this.$t('Sideex.suitesPassedRatio'),
          prop: 'result.suitesPassed',
          slot: 'suitesPassed'
        },
        {
          label: this.$t('Sideex.casesPassedRatio'),
          prop: 'result.casesPassed',
          slot: 'casesPassed'
        },
        {
          label: this.$t('general.RunAt'),
          prop: 'run_at',
          type: 'time'
        },
        {
          label: this.$t('Log.duration'),
          prop: 'duration',
          slot: 'duration'
        },
        {
          label: this.$t('Log.fullLog'),
          prop: 'fullLog',
          slot: 'fullLog'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getSideexScans(this.selectedProjectId)
      return this.handleScans(res.data)
    },
    handleScans(scans) {
      const sortedScans = scans.map((scan) => {
        if (scan.result === 'None') scan.result = {}
        return scan
      })
      sortedScans.sort((a, b) => new Date(b.run_at) - new Date(a.run_at))
      return sortedScans
    },
    durationText(start, end) {
      return getDurationTime(start, end)
    },
    async fetchReportData(selectedSideexId) {
      const res = await getSideexReport(selectedSideexId)
      this.showFullLog(res.data)
    },
    showFullLog(log) {
      const wnd = window.open(' ')
      wnd.document.write(log)
    }
  }
}
</script>
