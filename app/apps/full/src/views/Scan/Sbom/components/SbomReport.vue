<template>
  <div class="app-container" style="padding-top: 0px">
    <div class="flex justify-between fix-header">
      <div>
        <el-button
          type="text"
          size="medium"
          icon="el-icon-arrow-left"
          class="previous linkTextColor"
          @click="handleBackPage"
        >
          {{ $t('general.Back') }}
        </el-button>
        <span class="ml-2 text-l">
          <span>{{ $t('Docker.Title') }}</span>
        </span>
      </div>
      <div>
        <el-button
          type="text"
          class="linkTextColor"
          :icon="listLoading ? 'el-icon-loading' : 'el-icon-full-screen'"
          @click="isVisible = true"
        >
          {{ $t('general.Preview') }}
        </el-button>
      </div>
    </div>
    <div>
      <SbomReportFile
        #pagination
        :props-data="propsData"
        :summary-data="summaryData"
        :list-data="listData"
        :list-loading.sync="listLoading"
        :is-preview="false"
        @handleSortChange="handleSortChange"
      >
        <Pagination
          :total="listQuery.total"
          :page="listQuery.current"
          :limit="listQuery.per_page"
          :page-sizes="[50, 100, 200, 300, listQuery.total]"
          :layout="'total, sizes, prev, pager, next'"
          @pagination="onPagination"
        />
      </SbomReportFile>
    </div>
    <el-dialog
      :visible.sync="isVisible"
      width="95%"
      top="3vh"
      :append-to-body="false"
      @closed="isVisible = false"
    >
      <template slot="title">
        <el-button
          v-show="!listLoading"
          type="text"
          class="linkTextColor"
          icon="el-icon-download"
          @click="downloadPdf"
        >
          {{ $t('TestReport.DownloadPdf') }}
        </el-button>
        <div ref="pdfPage">
          <SbomReportFile
            :props-data="propsData"
            :summary-data="summaryData"
            :list-data="listData"
            :list-loading.sync="listLoading"
            :is-preview="true"
          />
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectInfos } from '@/api/projects'
import { getSbomRiskOverview, getSbomRiskDetail } from '@/api_v2/sbom'
import { Pagination } from '@/components'
import { getLocalTime } from '@/utils/handleTime'

const params = () => ({
  per_page: 100,
  page: 1
})

export default {
  name: 'SbomReport',
  components: {
    SbomReportFile: () => import('./SbomReportFile.vue'),
    Pagination
  },
  data() {
    return {
      params: params(),
      listQuery: {
        per_page: 100,
        current: 1,
        total: 0
      },
      listLoading: false,
      listData: [],
      summaryData: [],
      severityLevel: [
        'Critical',
        'High',
        'Medium',
        'Low',
        'Negligible',
        'Unknown'
      ],
      timeNow: null,
      project: {},
      projectName: '',
      isVisible: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject']),
    projectId () {
      return this.$route.params.projectId
    },
    branch() {
      return this.$route.params.commitBranch
    },
    commitId() {
      return this.$route.params.commitId
    },
    sbomId() {
      return this.$route.params.sbomId
    },
    packageCount() {
      return this.$route.params.packageCount
    },
    propsData() {
      return {
        projectName: this.projectName,
        timeNow: this.timeNow,
        branch: this.branch,
        commitId: this.commitId,
        packageCount: this.packageCount
      }
    }
  },
  watch: {
    project: {
      handler(val) {
        if (Object.keys(val).length > 0 && val.hasOwnProperty('name')) {
          this.fetchTestReport()
        }
      }
    },
    isVisible: {
      handler(val) {
        const all_items = 10000
        const page_one = 1
        this.params.per_page = val ? all_items : params.per_page
        this.params.page = val ? page_one : params.page
        this.fetchProjectInfo()
      }
    }
  },
  mounted() {
    this.fetchProjectInfo()
  },
  methods: {
    async fetchProjectInfo() {
      try {
        const res = await getProjectInfos(this.projectId)
        this.project = res.data
        this.projectName = res.data.display
      } catch (error) {
        console.error(error)
      }
    },
    async fetchTestReport() {
      this.listLoading = true
      try {
        await Promise.all([
          getSbomRiskOverview(this.sbomId),
          getSbomRiskDetail(this.sbomId, this.params)
        ]).then((res) => {
          const [overview, detail] = res.map((item) => item.data)
          if (Object.keys(overview).length === 0 || Object.keys(detail).length === 0) return
          this.summaryData = this.setSummaryData(overview)
          this.listData = detail.detail_list
          this.listQuery = detail.page
        })
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
        this.timeNow = sessionStorage.getItem('sbomTime') !== 'null'
          ? getLocalTime(sessionStorage.getItem('sbomTime')) : '-'
        this.$once('hook:beforeDestroy', () => {
          sessionStorage.removeItem('sbomTime')
        })
      }
    },
    async fetchData() {
      this.listLoading = true
      const res = await getSbomRiskDetail(this.sbomId, this.params)
      this.listData = res.data.detail_list
      this.listQuery = res.data.page
      this.listLoading = false
    },
    async onPagination(query) {
      this.params.per_page = query.limit
      this.params.page = query.page
      await this.fetchData()
    },
    handleSortChange({ prop, order }) {
      if (order) {
        this.params.sort = prop
        this.params.ascending = order === 'ascending'
      } else {
        delete this.params.sort
        delete this.params.ascending
      }
      this.fetchData()
    },
    setSummaryData(data) {
      const summary = []
      for (const item of this.severityLevel) {
        const obj = { severity: item, value: data[item] }
        summary.push(obj)
      }
      return summary
    },
    handleBackPage() {
      this.$router.go(-1)
    },
    async downloadPdf() {
      const newHtml = this.$refs.pdfPage.innerHTML
      document.body.innerHTML = newHtml
      window.print()
      window.location.reload()
      // await this.$pdf(this.$refs.pdfPage, downloadFileName)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

.fix-header {
  top: 0px;
  z-index: 2;
  position: sticky;
  position: -webkit-sticky;
  background: $appMainBg;
  padding-top: 20px;
  // outline: solid 8px $appMainBg;
  box-shadow: -20px 0px 0px 0px $appMainBg, 20px 0px 0px 0px $appMainBg;
}
</style>
