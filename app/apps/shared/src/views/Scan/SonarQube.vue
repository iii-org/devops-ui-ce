<template>
  <div class="app-container">
    <ProjectListSelector>
      <el-button
        slot="button"
        class="buttonSecondary"
        icon="ri-external-link-line"
        :size="isMobile ? 'small' : 'medium'"
        :disabled="selectedProjectId === -1"
        @click="openSonarQube"
      >
        <span v-if="!isMobile">{{ $t('SonarQube.ViewReport') }}</span>
      </el-button>
      <ScanLogButton v-if="platform !== 'LITE'" slot="button" />
      <el-input
        v-model="keyword"
        :placeholder="$t('Git.searchBranchOrCommitId')"
        :size="isMobile ? 'small' : 'medium'"
        style="float: right;"
        :style="{ width: isMobile ? 'auto' : '250px' }"
        prefix-icon="el-icon-search"
      />
    </ProjectListSelector>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      fit
      highlight-current-row
      :data="pagedData"
      :columns="tableColumns"
    >
      <template v-slot:commit_id="{ row }">
        <el-link class="linkTextColor" target="_blank" style="font-size: 16px" :href="row.issue_link">
          <svg-icon v-if="row.commit_id" class="mr-1" icon-class="ion-git-commit-outline" />
          <span>{{ row.commit_id }}</span>
        </el-link>
      </template>
      <template v-slot:bugs="{ row }">
        <span>{{ row.bugs }} ({{ convertRating(row.reliability_rating) }})</span>
      </template>
      <template v-slot:vulnerabilities="{ row }">
        <span>{{ row.vulnerabilities }} ({{ convertRating(row.security_rating) }})</span>
      </template>
      <template v-slot:code_smells="{ row }">
        <span>{{ row.code_smells }} ({{ convertRating(row.sqale_rating) }})</span>
      </template>
      <template v-slot:duplicated_blocks="{ row }">
        <span>{{ row.duplicated_blocks }} ({{ row.duplicated_lines_density }}%)</span>
      </template>
      <template v-slot:coverage="{ row }">
        <span>{{ row.coverage === '' ? '-' : `${row.coverage}%` }}</span>
      </template>
    </ElTableResponsive>
    <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
  </div>
</template>

<script>
import { getSonarQubeData } from '@/api_v2/sonarQube'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'
import { mapGetters } from 'vuex'

export default {
  name: 'ScanSonarQube',
  components: {
    ProjectListSelector,
    // ScanLogButton,
    ScanLogButton: () => import('@/views/Scan/ScanLogButton'),
    ElTableResponsive
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
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
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
          label: this.$t('SonarQube.Bugs'),
          prop: 'bugs',
          slot: 'bugs'
        },
        {
          align: 'center',
          label: this.$t('SonarQube.Vulnerabilities'),
          slot: 'vulnerabilities'
        },
        {
          align: 'center',
          label: this.$t('SonarQube.CodeSmells'),
          slot: 'code_smells'
        },
        {
          align: 'center',
          label: this.$t('SonarQube.Duplicates'),
          slot: 'duplicated_blocks'
        },
        {
          align: 'center',
          label: this.$t('SonarQube.Coverage'),
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
      return process.env.VUE_APP_PROJECT
    }
  },
  methods: {
    async fetchData() {
      if (this.selectedProjectId === -1) {
        return []
      }
      const res = (await getSonarQubeData(this.selectedProject.name)).data
      this.sqLink = res.link
      const data = res.history
      const ret = []
      for (const key in data) {
        const row = data[key]
        row['date'] = key
        ret.push(row)
      }
      ret.sort((a, b) => {
        return Date.parse(b.date) - Date.parse(a.date)
      })
      return ret
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
