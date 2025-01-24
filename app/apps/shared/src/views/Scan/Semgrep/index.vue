<template>
  <el-row class="app-container">
    <ProjectListSelector>
      <el-input
        v-model="keyword"
        :placeholder="$t('Git.searchBranchOrCommitId')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? 'auto' : '250px' }"
        prefix-icon="el-icon-search"
        @change="loadData"
      />
    </ProjectListSelector>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :cell-style="{ 'text-align': 'center' }"
      :columns="tableColumns"
      :data="listData"
      :element-loading-text="$t('Loading')"
      :header-cell-style="{ 'text-align': 'center' }"
      fit
      highlight-current-row
    >
      <template #commit="{ row }">
        <el-link
          :href="row.commit_url"
          class="font-code"
          target="_blank"
          type="primary"
        >
          <em class="ri-git-commit-line"></em>
          <span>{{ row.commit_id }}</span>
        </el-link>
      </template>
      <template #critical="{ row }">
        <span>{{ hasColumn(row, 'critical') ? row.critical : '-' }}</span>
      </template>
      <template #high="{ row }">
        <span>{{ hasColumn(row, 'high') ? row.high : '-' }}</span>
      </template>
      <template #medium="{ row }">
        <span>{{ hasColumn(row, 'medium') ? row.medium : '-' }}</span>
      </template>
      <template #low="{ row }">
        <span>{{ hasColumn(row, 'low') ? row.low : '-' }}</span>
      </template>
      <template #info="{ row }">
        <span>{{ hasColumn(row, 'info') ? row.info : '-' }}</span>
      </template>
      <template #report="{ row }">
        <el-tooltip
          :content="$t('Plugins.semgrep.VulnerabilityReport')"
          placement="bottom-end"
        >
          <span>
            <em
              :class="row.done ? 'primary' : 'disabled'"
              class="ri-survey-line table-button"
              @click="handleToTestReport(row)"
            ></em>
          </span>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="listQuery.total"
      @pagination="handleCurrentChange"
    />
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import { getSemgrepResult } from '@/api_v3/scan'

export default {
  name: 'Semgrep',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination],
  data() {
    return {
      searchKeys: ['branch', 'commit'],
      keyword: ''
    }
  },
  computed: {
    ...mapGetters(['device', 'selectedProjectId']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('Git.Branch'),
          prop: 'branch',
          minWidth: 150
        },
        {
          label: this.$t('Git.Commit'),
          prop: 'commit',
          minWidth: 140,
          slot: 'commit'
        },
        {
          label: this.$t('Plugins.semgrep.Critical'),
          prop: 'critical',
          slot: 'critical'
        },
        {
          label: this.$t('Plugins.semgrep.High'),
          prop: 'high',
          slot: 'high'
        },
        {
          label: this.$t('Plugins.semgrep.Medium'),
          prop: 'medium',
          slot: 'medium'
        },
        {
          label: this.$t('Plugins.semgrep.Low'),
          prop: 'low',
          slot: 'low'
        },
        {
          label: this.$t('Plugins.semgrep.Info'),
          prop: 'info',
          slot: 'info'
        },
        {
          label: this.$t('Plugins.semgrep.RunAt'),
          prop: 'create_at',
          type: 'time'
        },
        {
          label: this.$t('general.Report'),
          prop: 'done',
          slot: 'report'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      if (this.selectedProjectId === -1) return []
      let semgrepList = []
      await getSemgrepResult(this.getParams())
        .then((res) => {
          semgrepList = res.data.items
          this.setListQuery(res.data.pagination)
        })
        .finally(() => {
          this.listLoading = false
        })
      return semgrepList
    },
    getParams() {
      const { limit, page } = this.listQuery
      const params = {
        limit,
        page: page,
        search: this.keyword,
        project_id: this.selectedProjectId
      }
      if (!this.keyword) delete params.search
      return params
    },
    setListQuery(listQuery) {
      const { limit, page, total } = listQuery
      this.listQuery = {
        limit,
        page,
        total
      }
    },
    hasColumn(row, column) {
      return Object.hasOwn(row, column)
    },
    async handleToTestReport(row) {
      const { branch, commit_id, commit_url, create_at, job_id } = row
      const commitUrl = this.getCommitUrl(commit_url)
      this.$router.push({
        name: 'SemgrepReport',
        params: {
          createAt: create_at,
          jobId: job_id,
          branch,
          commit: commit_id,
          commitUrl
        }
      })
    },
    getCommitUrl(url) {
      return url.replace('commit', 'blob')
    }
  }
}
</script>
