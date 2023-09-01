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
      <template v-slot:high="{ row }">
        <span v-if="Object.keys(row.result).length > 0">{{ row.result['3'] }}</span>
        <span v-else>-</span>
      </template>
      <template v-slot:medium="{ row }">
        <span v-if="Object.keys(row.result).length > 0">{{ row.result['2'] }}</span>
        <span v-else>-</span>
      </template>
      <template v-slot:low="{ row }">
        <span v-if="Object.keys(row.result).length > 0">{{ row.result['1'] }}</span>
        <span v-else>-</span>
      </template>
      <template v-slot:info="{ row }">
        <span v-if="Object.keys(row.result).length > 0">{{ row.result['0'] }}</span>
        <span v-else>-</span>
      </template>
      <template v-slot:duration="{ row }">
        {{ durationText(row.run_at, row.finished_at) }}
      </template>
      <template v-slot:full_log="{ row }">
        <el-tooltip
          v-if="row.status === 'Finished'"
          placement="bottom"
          :content="$t('Dashboard.Report')"
        >
          <em
            class="ri-external-link-line active operate-button"
            @click="showFullLog(row.full_log)"
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
import { getZapScans } from '@/api/zap'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@/components'
import { getDurationTime } from '@/utils/handleTime'
import ScanLogButton from './ScanLogButton'

export default {
  name: 'ScanZap',
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
          size: 'medium',
          location: 'zap',
          minWidth: '130',
          i18nKey: 'Status',
          type: 'tag'
        },
        {
          label: this.$t('Zap.high'),
          prop: 'result.3',
          slot: 'high'
        },
        {
          label: this.$t('Zap.medium'),
          prop: 'result.2',
          slot: 'medium'
        },
        {
          label: this.$t('Zap.low'),
          prop: 'result.1',
          slot: 'low'
        },
        {
          label: this.$t('general.Info'),
          prop: 'result.0',
          slot: 'info'
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
          prop: 'full_log',
          slot: 'full_log',
          minWidth: '50'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getZapScans(this.selectedProjectId)
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
    showFullLog(log) {
      const wnd = window.open(' ')
      wnd.document.write(log)
    }
  }
}
</script>
