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
      <DockerReportFile
        :props-data="propsData"
        :summary-data="summaryData"
        :list-data="listData"
        :list-loading.sync="listLoading"
        :is-preview="false"
      />
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
          <DockerReportFile
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
import { getLocalTime } from '@/utils/handleTime'
import { getHarborScanReport } from '@/api_v2/harbor'
import { getProjectInfos } from '@/api/projects'

const downloadFileName = 'Docker_Image_Vulnerability_Scan_Report'

export default {
  name: 'DockerReport',
  components: {
    DockerReportFile: () => import('./DockerReportFile.vue')
  },
  data() {
    return {
      listLoading: false,
      listData: [],
      scanner: [],
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
    size() {
      return this.$route.params.size || '-'
    },
    propsData() {
      return {
        projectName: this.projectName,
        timeNow: this.timeNow,
        branch: this.branch,
        commitId: this.commitId,
        size: this.size,
        scanner: this.scanner
      }
    }
  },
  watch: {
    project: {
      handler(val) {
        if (Object.keys(val).length > 0 && val.hasOwnProperty('name')) {
          this.fetchTestReport()
        }
      },
      immediate: true
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
        const res = await getHarborScanReport(this.project.name, { branch: this.branch, commit_id: this.commitId })
        this.summaryData = this.setSummaryData(res.data.overview)
        this.listData = this.sortVulnerabilityData(res.data.vulnerabilities)
        this.timeNow = getLocalTime(res.data.generated_at)
        this.scanner = res.data.scanner
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    sortVulnerabilityData(data) {
      let sortedData = []
      for (const severity of this.summaryData.map(s => s.severity)) {
        const sorted = data.filter(item => item.severity === severity)
        sortedData = [...sortedData, ...sorted]
      }
      return sortedData
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
