<template>
  <el-row class="app-container">
    <ProjectListSelector>
      <ScanLogButton slot="button" />
      <el-input
        v-model="keyword"
        :placeholder="$t('Git.searchBranchOrCommitId')"
        :style="{ width: isMobile ? 'auto' : '250px' }"
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
    <ElTableResponsive
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
          :href="row.commit_url"
        >
          <svg-icon
            class="mr-1"
            icon-class="ion-git-commit-outline"
          />{{ row.commit_id }}
        </el-link>
      </template>
      <template v-slot:status="{ row }">
        <el-tooltip
          :disabled="row.logs === null"
          placement="bottom"
        >
          <template slot="content">
            <p class="tooltip">{{ row.logs }}</p>
          </template>
          <el-tag
            v-if="row.status"
            class="el-tag--circle"
            :type="handleType(row.status)"
            :effect="getTagEffect(row.status)"
            :size="isMobile ? 'mini' : 'medium'"
          >
            <span>{{ $t(`Cmas.${row.status}`) }}</span>
          </el-tag>
          <span v-else>-</span>
        </el-tooltip>
      </template>
      <template v-slot:MOEA="{ row }">
        <div>{{ joinSpecification(row, 'MOEA') }}</div>
      </template>
      <template v-slot:OWASP="{ row }">
        <div>{{ joinSpecification(row, 'OWASP') }}</div>
      </template>
      <template v-slot:report="{ row }">
        <el-link
          v-if="row.filenames"
          class="linkTextColor"
          target="_blank"
          style="font-size: 16px"
          :underline="false"
          icon="el-icon-download"
          @click="fetchCmasReport(row)"
        />
        <div v-else>-</div>
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
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import {
  getCmasScans,
  getCmasScansStatus,
  getCmasReport
} from '@/api_v2/cmas'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'
import * as elementTagType from '@shared/utils/elementTagType'
import ScanLogButton from './ScanLogButton'

export default {
  name: 'Cmas',
  components: {
    ProjectListSelector,
    ScanLogButton,
    ElTableResponsive
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    this.levels = ['High', 'Medium', 'Low']
    this.MOEA = ['L3', 'L2', 'L1']
    this.OWASP = [this.$t('general.High'), this.$t('general.Medium'), this.$t('general.Low')]
    return {
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
          prop: 'task_id',
          minWidth: 240
        },
        {
          label: this.$t('Git.Branch'),
          prop: 'branch'
        },
        {
          label: this.$t('Git.Commit'),
          prop: 'commit_id',
          slot: 'commit_id'
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          minWidth: 130,
          slot: 'status'
        },
        {
          label: this.$t('Cmas.MOEA'),
          prop: 'MOEA',
          minWidth: 220,
          slot: 'MOEA'
        },
        {
          label: 'OWASP Mobile TOP 10',
          prop: 'OWASP',
          minWidth: 200,
          slot: 'OWASP'
        },
        {
          label: this.$t('general.RunAt'),
          prop: 'run_at',
          minWidth: 200,
          type: 'time'
        },
        {
          label: this.$t('general.Report'),
          prop: 'report',
          minWidth: 100,
          slot: 'report'
        }
      ]
    },
    joinSpecification() {
      return function (row, spec) {
        const arr = this.levels.map((level, index) => {
          if (!row.stats) return
          return `${this[spec][index]} = ${row.stats[spec][level]}`
        })
        return !arr.includes(undefined) ? arr.join(', ') : '-'
      }
    }
  },
  watch: {
    listData(data) {
      if (data.length > 0) {
        this.updateCmasScanStatus(data)
      }
    },
    '$i18n.locale'() {
      this.setI18n()
    }
  },
  methods: {
    async fetchData() {
      if (this.selectedRepositoryId === -1) return
      const res = await getCmasScans(this.selectedRepositoryId)
      return res.data
    },
    updateCmasScanStatus(listData) {
      listData.forEach((item) => {
        const { task_id, status } = item
        if (status === 'RUNNING') {
          this.fetchScanStatus(task_id)
        }
      })
    },
    fetchScanStatus(taskId) {
      this.listLoading = true
      getCmasScansStatus(taskId)
        .then((res) => {
          if (res.data.status === 'SUCCESS') {
            this.loadData()
          }
        })
      this.listLoading = false
    },
    fetchCmasReport(row) {
      const file_type = 'pdf'
      const { task_id } = row
      getCmasReport(task_id, file_type)
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', row.filenames.pdf)
          document.body.appendChild(link)
          link.click()
          link.remove()
        })
        .catch((error) => console.error(error))
    },
    setI18n() {
      this.OWASP = [
        this.$t('general.High'),
        this.$t('general.Medium'),
        this.$t('general.Low')
      ]
    },
    handleType(prop) {
      return elementTagType['cmas'][prop] || 'default'
    },
    getTagEffect(status) {
      const tagMap = { Building: 'light' }
      return tagMap[status] || 'dark'
    }
  }
}
</script>

<style scoped>
.tooltip {
  max-width: 500px;
  margin: 0;
  text-align: center;
}
</style>
