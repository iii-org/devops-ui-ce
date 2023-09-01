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
        @click="fetchData"
      >
        {{ $t('general.Refresh') }}
      </el-button>
    </div>
    <el-table-responsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      :data="sbomList"
      :columns="tableColumns"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
      :error="error"
      fit
    >
      <template v-slot:commit="{ row }">
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
          {{ row.commit }}
        </el-link>
      </template>
      <template v-slot:status="{ row }">
        <el-tooltip
          v-if="row.scan_status === 'Fail'"
          effect="dark"
          placement="bottom"
          :content="row.logs"
        >
          <el-tag
            class="el-tag--circle"
            type="danger"
            effect="dark"
            :size="isMobile ? 'mini' : 'medium'"
          >
            <span>
              {{ $t('general.Error') }}
            </span>
          </el-tag>
        </el-tooltip>
        <template v-else>
          <el-tag
            v-if="row.scan_status"
            class="el-tag--circle"
            :type="handleType(row.scan_status)"
            :effect="getTagEffect(row.scan_status)"
            :size="isMobile ? 'mini' : 'medium'"
          >
            <span>
              {{ $t(`Sbom.${row.scan_status}`) }}
            </span>
          </el-tag>
        </template>
      </template>
      <template v-slot:package_nums="{ row }">
        <span v-if="row.package_nums">
          {{ row.package_nums }}
        </span>
        <span v-else>0</span>
      </template>
      <template v-slot:Critical="{ row }">
        <span v-if="row.scan_overview && row.scan_overview.Critical">
          {{ row.scan_overview.Critical }}
        </span>
        <span v-else>0</span>
      </template>
      <template v-slot:High="{ row }">
        <span v-if="row.scan_overview && row.scan_overview.High">
          {{ row.scan_overview.High }}
        </span>
        <span v-else>0</span>
      </template>
      <template v-slot:Medium="{ row }">
        <span v-if="row.scan_overview && row.scan_overview.Medium">
          {{ row.scan_overview.Medium }}
        </span>
        <span v-else>0</span>
      </template>
      <template v-slot:Low="{ row }">
        <span v-if="row.scan_overview && row.scan_overview.Low">
          {{ row.scan_overview.Low }}
        </span>
        <span v-else>0</span>
      </template>
      <template v-slot:report="{ row }">
        <el-tooltip
          placement="bottom"
          :content="$t('Sbom.TraceabilityDownload')"
        >
          <el-popover
            placement="bottom"
            trigger="click"
            :disabled="!row.finished"
          >
            <div v-loading="downloadLoading">
              <template v-if="downloadList.length!==0">
                <el-link
                  v-for="(item,index) in downloadList"
                  :key="index"
                  style="display: block; font-size: 16px;"
                  :underline="false"
                  @click="fetchTestReport(row,item)"
                >
                  {{ item }}
                </el-link>
              </template>
              <template v-else>
                <span>{{ $t('general.NoData') }}</span>
              </template>
            </div>
            <el-link
              slot="reference"
              icon="el-icon-download"
              style="font-size: 16px"
              :class="!row.finished ? '' : 'linkTextColor'"
              :disabled="!row.finished"
              :underline="false"
              @click="fetchDownloadList(row)"
            />
          </el-popover>
        </el-tooltip>
        <el-tooltip
          placement="bottom-end"
          :content="$t('Sbom.VulnerabilityReport')"
        >
          <el-link
            :class="!row.finished ? '' : 'linkTextColor'"
            style="font-size: 16px;"
            :disabled="!row.finished"
            :underline="false"
            icon="el-icon-document"
            @click="handleToTestReport(row)"
          />
        </el-tooltip>
      </template>
    </el-table-responsive>
    <Pagination
      :total="listQuery.total"
      :page="listQuery.page"
      :limit="listQuery.per_page"
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
  getSbomList,
  getSbomFile,
  getSbomDownloadFile
} from '@/api_v2/sbom'
import { BasicData, SearchBar, Pagination } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@/components'
import * as elementTagType from '@/utils/elementTagType'
import ScanLogButton from '../ScanLogButton'

export default {
  name: 'Sbom',
  components: {
    ProjectListSelector,
    ScanLogButton,
    ElTableResponsive
  },
  mixins: [BasicData, SearchBar, Pagination],
  data() {
    return {
      storageName: 'sbom',
      storageType: ['SearchBar'],
      params: {
        page: 1,
        per_page: 10,
        search: this.keyword
      },
      sbomList: [],
      error: {},
      downloadLoading: false,
      downloadList: []
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
          prop: 'commit',
          width: 140,
          slot: 'commit'
        },
        {
          label: this.$t('general.Status'),
          prop: 'scan_status',
          slot: 'status'
        },
        {
          label: this.$t('Sbom.PackageCount'),
          prop: 'package_nums',
          slot: 'package_nums'
        },
        {
          label: this.$t('Sbom.CriticalSeverity'),
          prop: 'scan_overview.Critical',
          slot: 'Critical'
        },
        {
          label: this.$t('Sbom.HighSeverity'),
          prop: 'scan_overview.High',
          slot: 'High'
        },
        {
          label: this.$t('Sbom.MediumSeverity'),
          prop: 'scan_overview.Medium',
          slot: 'Medium'
        },
        {
          label: this.$t('Sbom.LowSeverity'),
          prop: 'scan_overview.Low',
          slot: 'Low'
        },
        {
          label: this.$t('Sbom.RunAt'),
          prop: 'created_at',
          type: 'time'
        },
        {
          label: this.$t('Sbom.Report'),
          prop: 'report',
          width: 100,
          slot: 'report'
        }
      ]
    }
  },
  watch: {
    async keyword(value) {
      this.params.search = value
      this.params.page = 1
      this.storeKeyword()
      await this.loadData()
    }
  },
  methods: {
    async fetchData() {
      const res = await getSbomList(this.selectedProjectId, this.params)
      this.setListData(res)
    },
    setListData(res) {
      this.sbomList = res.data.Sbom_list
      this.listQuery = res.data.page
    },
    async onPagination(query) {
      const { page, limit } = query
      this.params.page = page
      this.params.per_page = limit
      await this.loadData()
    },
    fetchDownloadList(row) {
      this.downloadLoading = true
      getSbomFile(row.id)
        .then((res) => {
          this.downloadList = res.data
        })
        .catch(() => {})
        .finally(() => {
          this.downloadLoading = false
        })
    },
    fetchTestReport(row, item) {
      getSbomDownloadFile(row.id, { file_name: item })
        .then((res) => {
          const url = window.URL.createObjectURL(res)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', item)
          document.body.appendChild(link)
          link.click()
          link.remove()
        })
        .catch(() => {})
    },
    handleType(prop) {
      const location = 'sbom'
      return elementTagType[location][prop] || 'default'
    },
    getTagEffect(status) {
      const tagMap = { Building: 'light' }
      return tagMap[status] || 'dark'
    },
    async handleToTestReport(row) {
      sessionStorage.setItem('sbomTime', row.created_at)
      this.$router.push({
        name: 'SbomReport',
        params: {
          commitId: row.commit,
          commitBranch: row.branch,
          sbomId: row.id,
          packageCount: row.package_nums,
          projectId: this.selectedProjectId
        }
      })
    }
  }
}
</script>
