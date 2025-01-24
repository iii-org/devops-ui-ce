<template>
  <div class="app-container">
    <ProjectListSelector>
      <el-button
        slot="button"
        :disabled="selectedProjectId === -1"
        :size="isMobile ? 'small' : 'medium'"
        icon="ri-external-link-fill"
        type="success"
        @click="openSonarQube"
      >
        <span v-if="!isMobile" class="ml-1">{{
          $t('Plugins.sonarqube.ViewReport')
        }}</span>
      </el-button>
      <ScanLogButton v-if="platform !== 'LITE'" slot="button" />
      <el-input
        v-model="keyword"
        :placeholder="$t('Git.searchBranchOrCommitId')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? 'auto' : '250px' }"
        prefix-icon="el-icon-search"
        style="float: right"
      />
    </ProjectListSelector>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :columns="tableColumns"
      :data="pagedData"
      :element-loading-text="$t('Loading')"
      fit
      highlight-current-row
    >
      <template #commit_id="{ row }">
        <el-link
          :href="row.issue_link"
          class="font-code"
          target="_blank"
          type="primary"
        >
          <em class="ri-git-commit-line"></em>
          <span>{{ row.commit_id }}</span>
        </el-link>
      </template>
      <template #bugs="{ row }">
        <span>
          {{ row.bugs }} ({{ convertRating(row.reliability_rating) }})
        </span>
      </template>
      <template #vulnerabilities="{ row }">
        <span>
          {{ row.vulnerabilities }} ({{ convertRating(row.security_rating) }})
        </span>
      </template>
      <template #security_hotspots="{ row }">
        <span>
          {{ row.security_hotspots }}
        </span>
      </template>
      <template #code_smells="{ row }">
        <span>
          {{ row.code_smells }} ({{ convertRating(row.sqale_rating) }})
        </span>
      </template>
      <template #duplicated_blocks="{ row }">
        <span>
          {{ row.duplicated_blocks }} ({{ row.duplicated_lines_density }}%)
        </span>
      </template>
      <template #coverage="{ row }">
        <span>{{ row.coverage === '' ? '-' : `${row.coverage}%` }}</span>
      </template>
    </ElTableResponsive>
    <Pagination
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="filteredData.length"
      @pagination="onPagination"
    />
  </div>
</template>

<script>
import { getSonarqubeResult } from '@/api_v3/scan'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { mapGetters } from 'vuex'

export default {
  name: 'ScanSonarQube',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    ScanLogButton: () => import('@/views/Scan/ScanLogButton'),
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      searchKeys: ['branch', 'commit_id'],
      sqLink: function () {
        return ''
      }
    }
  },
  computed: {
    ...mapGetters(['device']),
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
          align: 'center',
          label: this.$t('Git.Branch'),
          prop: 'branch',
          minWidth: '140'
        },
        {
          align: 'center',
          label: this.$t('Git.Commit'),
          prop: 'commit_id',
          width: '140',
          slot: 'commit_id'
        },
        {
          align: 'center',
          label: this.$t('Plugins.sonarqube.Bugs'),
          prop: 'bugs',
          slot: 'bugs'
        },
        {
          align: 'center',
          label: this.$t('Plugins.sonarqube.Vulnerabilities'),
          slot: 'vulnerabilities'
        },
        {
          align: 'center',
          label: this.$t('Plugins.sonarqube.security_hotspots'),
          slot: 'security_hotspots'
        },
        {
          align: 'center',
          label: this.$t('Plugins.sonarqube.CodeSmells'),
          slot: 'code_smells'
        },
        {
          align: 'center',
          label: this.$t('Plugins.sonarqube.Duplicates'),
          slot: 'duplicated_blocks'
        },
        {
          align: 'center',
          label: this.$t('Plugins.sonarqube.Coverage'),
          slot: 'coverage'
        },
        {
          label: this.$t('general.RunAt'),
          prop: 'date',
          width: '140',
          type: 'time'
        }
      ]
    },
    platform() {
      return import.meta.env.VITE_APP_PROJECT
    }
  },
  methods: {
    async fetchData() {
      if (this.selectedProjectId === -1) {
        return []
      }
      const res = (
        await getSonarqubeResult({ project_id: this.selectedProject.id })
      ).data
      this.sqLink = res.link
      const data = res.history.sort((a, b) => {
        return Date.parse(b.date) - Date.parse(a.date)
      })
      return data
    },
    convertRating(rating) {
      const r = parseInt(rating)
      if (r) {
        return ['0', 'A', 'B', 'C', 'D', 'E'][r]
      } else {
        return '-'
      }
    },
    openSonarQube() {
      window.open(this.sqLink)
    }
  }
}
</script>
