<template>
  <div class="app-container" style="background: white;">
    <div class="mr-3 flex justify-between">
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
        <span class="ml-2 text-xl">
          <span v-if="!isMobile">{{ $t('route.TestReport') }}</span>
        </span>
      </div>
      <div>
        <el-button
          v-show="!listLoading"
          type="text"
          class="linkTextColor"
          icon="el-icon-download"
          @click="downloadPdf"
        >
          {{ isMobile ? 'PDF' : $t('TestReport.DownloadPdf') }}
        </el-button>
        <el-button
          v-show="!listLoading"
          type="text"
          class="linkTextColor"
          icon="el-icon-download"
          @click="getSheet('excel')"
        >
          {{ isMobile ? 'Excel' : $t('TestReport.DownloadExcel') }}
        </el-button>
        <el-button
          v-show="!listLoading"
          type="text"
          class="linkTextColor"
          icon="el-icon-download"
          @click="getSheet('csv')"
        >
          {{ isMobile ? 'CSV' : $t('TestReport.DownloadCsv') }}
        </el-button>
      </div>
    </div>
    <!--startprint-->
    <div ref="pdfPage" class="page">
      <div class="watermark">
        <img src="@/assets/logo.png" alt="IIIDevOps logo">
      </div>
      <div class="logo-container">
        <img src="@/assets/logo.png" class="logo" alt="IIIDevOps logo">
        <h1 class="logo-title">{{ title }} </h1>
      </div>
      <div class="text-center font-bold clearfix title">
        {{ $t('route.TestReport') }}
      </div>
      <div :style="{padding: isMobile ? '0 10px' : '0 40px'}">
        <ul class="text-base mb-10 font-semibold">
          <li>{{ $t('general.project_name') }}: {{ projectName }}</li>
          <li>{{ $t('TestReport.TestTime') }}: {{ latestTime }}</li>
          <li>
            {{ $t('general.Branch') }} / {{ $t('TestReport.Commit') }}:
            {{ branch }} /<svg-icon class="mr-1" icon-class="ion-git-commit-outline" />
            {{ commitId }}
          </li>
        </ul>
        <!-- white box test -->
        <div v-show="sonarqube || checkmarx">
          <el-divider content-position="center">{{ $t('TestReport.WhiteBoxTesting') }}</el-divider>
          <SonarQubeReport
            v-show="sonarqube"
            ref="sonarqube"
            class="mb-5"
            :sonarqube="sonarqube"
            :sonar-qube-link="sonarQubeLink"
            :list-loading="listLoading"
          />
          <CheckMarxReport
            v-show="checkmarx"
            ref="checkmarx"
            class="mb-5"
            :checkmarx="checkmarx"
            :list-loading="listLoading"
          />
        </div>
        <!-- ISO weakness test -->
        <div v-show="frontendProject === 'SSO' && (clair || anchore)">
          <el-divider content-position="center">{{ $t('TestReport.ISOWeaknessTesting') }}</el-divider>
          <ClairReport
            v-show="clair"
            ref="clair"
            class="mb-5"
            :clair="clair"
            :list-loading="listLoading"
          />
        </div>
        <!-- black box test -->
        <div v-show="zap || webinspect">
          <el-divider content-position="center">{{ $t('TestReport.BlackBoxTesting') }}</el-divider>
          <ZapReport
            v-show="zap"
            ref="zap"
            class="mb-5"
            :zap="zap"
            :list-loading="listLoading"
          />
          <WebInspectReport
            v-show="webinspect"
            ref="webinspect"
            class="mb-5"
            :webinspect="webinspect"
            :list-loading="listLoading"
          />
        </div>
        <!-- app script test -->
        <div v-show="cmas">
          <el-divider content-position="center">{{ $t('TestReport.AppScriptTesting') }}</el-divider>
          <CmasReport
            ref="cmas"
            class="mb-5"
            :cmas="cmas"
            :list-loading="listLoading"
          />
        </div>
        <!-- api script test -->
        <div v-show="postman">
          <el-divider content-position="center">{{ $t('TestReport.ApiScriptTesting') }}</el-divider>
          <PostmanReport
            ref="postman"
            class="mb-5"
            :postman="postman"
            :list-loading="listLoading"
          />
        </div>
        <!-- web script test -->
        <div v-show="sideex">
          <el-divider content-position="center">{{ $t('TestReport.WebScriptTesting') }}</el-divider>
          <SideexReport
            ref="sideex"
            class="mb-5"
            :sideex="sideex"
            :list-loading="listLoading"
          />
        </div>
      </div>
      <div class="footer">
        <span>{{ $t('general.DataGenerationTime') }}:</span>
        <span>{{ timeNow }}</span>
      </div>
    </div>
    <!--endprint-->
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getLocalTime, getFormatTime } from '@shared/utils/handleTime'
import { getProjectCommitTestSummary, getProjectInfos } from '@/api/projects'
import XLSX from 'xlsx'
import {
  // AnchoreReport,
  CheckMarxReport,
  ClairReport,
  CmasReport,
  PostmanReport,
  SideexReport,
  SonarQubeReport,
  WebInspectReport,
  ZapReport
} from './'

const downloadFileName = 'DevOps_test_report'
const dataName = [
  // 'anchore',
  'clair', // clair
  'checkmarx',
  'cmas',
  'postman',
  'sideex',
  'sonarqube',
  'webinspect',
  'zap'
]

export default {
  name: 'TestReport',
  components: {
    // AnchoreReport,
    CheckMarxReport,
    ClairReport,
    CmasReport,
    PostmanReport,
    SideexReport,
    SonarQubeReport,
    WebInspectReport,
    ZapReport
  },
  data() {
    this.title = 'III DevOps'
    return {
      projectName: '',
      listLoading: false,
      sonarqube: [],
      checkmarx: [],
      clair: [],
      anchore: [],
      zap: [],
      webinspect: [],
      cmas: [],
      postman: [],
      sideex: [],
      sonarQubeLink: '',
      dataTimeArr: []
    }
  },
  computed: {
    ...mapGetters(['device']),
    latestTime() {
      return this.dataTimeArr[0]
    },
    projectId () {
      return this.$route.params.projectId
    },
    branch() {
      return this.$route.params.commitBranch
    },
    commitId() {
      return this.$route.params.commitId
    },
    handleDataTime() {
      const dataTimeArr = []
      dataName.forEach(name => {
        if (!this[name]) return
        if (this[name][0]?.run_at) {
          name === 'sonarqube'
            ? dataTimeArr.push(getFormatTime(this[name][0].run_at))
            : dataTimeArr.push(getLocalTime(this[name][0].run_at))
        }
      })
      return dataTimeArr.sort((a, b) => Date.parse(b) - Date.parse(a))
    },
    getTableDom() {
      let dom = null
      // create a new div and append all the table dom on it
      const newDiv = document.createElement('div')
      // table dom
      dataName.forEach(name => {
        if (this[name]) {
          dom = this.$refs[name].$refs[`table_${name}`].cloneNode(true)
          newDiv.appendChild(dom)
        }
      })
      return newDiv
    },
    timeNow() {
      return getLocalTime(new Date())
    },
    isMobile() {
      return this.device === 'mobile'
    },
    frontendProject() {
      return process.env.VUE_APP_PROJECT
    }
  },
  mounted() {
    this.fetchProjectInfo()
    this.fetchTestReport()
  },
  methods: {
    async fetchProjectInfo() {
      try {
        const res = await getProjectInfos(this.projectId)
        this.projectName = res.data.display
      } catch (error) {
        console.error(error)
      }
    },
    async fetchTestReport() {
      this.listLoading = true
      try {
        const res = await getProjectCommitTestSummary(this.projectId, this.commitId)
        dataName.forEach(name => this.setTestReportData(res.data, name))
        this.dataTimeArr = this.handleDataTime
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    setTestReportData(resData, name) {
      const data = resData[name]
      if (name === 'sonarqube') {
        this.setSonarQubeData(resData)
      } else if (name === 'clair') {
        this.clair.push(resData.harbor)
      } else if (data) {
        this[name].push(data)
      } else {
        this[name] = undefined
      }
    },
    setSonarQubeData(data) {
      if (data.sonarqube) {
        this.sonarqube = this.handleSonarQubeData(data.sonarqube.history)
        this.sonarQubeLink = data.sonarqube.link
      } else this.sonarqube = undefined
    },
    handleSonarQubeData(data) {
      const ret = []
      if (!data) return ret
      Object.keys(data).forEach(key => {
        const row = data[key]
        row['run_at'] = key
        ret.push(row)
      })
      return ret
    },
    handleBackPage() {
      this.$router.go(-1)
    },
    async downloadPdf() {
      const newHtml = this.$refs.pdfPage.innerHTML
      document.body.innerHTML = newHtml
      window.print()
      window.location.reload()
    },
    async getSheet(filename_extension) {
      const newDiv = await this.getTableDom
      // use XLSX to transform a sheet from tables
      const sheet = XLSX.utils.table_to_sheet(newDiv)
      await this.download(sheet, filename_extension)
    },
    async download(sheet, filename_extension) {
      switch (filename_extension) {
        case 'csv':
          await this.$csv(sheet, downloadFileName)
          break
        case 'excel':
          await this.$excel(sheet, downloadFileName)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-divider__text {
  font-size: 18px;
}

.watermark {
  display: none;
}
.title {
  color: #429470;
  font-size: 36px;
  text-shadow: #b3b1b1 0.05em 0.05em 0.1em;
}
.footer {
  display: none;
}
.logo-container {
  position: relative;
  left: 10px;
  width: 100%;
  height: 50px;
  line-height: 50px;
  text-align: left;
  overflow: hidden;

  .logo {
    width: 32px;
    height: 32px;
    vertical-align: middle;
    margin-right: 12px;
  }

  .logo-title {
    display: inline-block;
    margin: 0;
    font-weight: 600;
    line-height: 50px;
    font-size: 14px;
    font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
    vertical-align: middle;
  }
}

@media print {
  body {
    counter-reset: page-number;
    background: #ffffff;
  }
  @page {
    size: A4 portrait;
    margin: 0.5cm;
  }
  .page {
    position: relative;
    page-break-inside: avoid;
    page-break-before: always;
    &::after {
      content: counter(page-number); /* set page-number as a variable to counter */
      counter-increment: page-number 1; /* add 1 to page-number per page */
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      font-size: 20px;
      color: #505050;
      text-align: center;
    }
  }
  .el-divider__text {
    white-space: nowrap;
  }
  .watermark {
    display: block;
    position: fixed;
    width: 100%;
    font-size: 800%;
    top: 35vh;
    left: 35vw;
    opacity: 0.2;
  }
  .title {
    text-shadow: initial;
  }
  .footer {
    display: block;
    position: fixed;
    bottom: 0;
    left: 5vw;
  }
}
@media screen and (max-width: 768px) {
  ::v-deep .el-divider__text {
    font-size: 14px;
    padding: 0 6px;
  }
  ::v-deep .el-divider__text.is-center {
    left: 20px;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
  }
  ul {
    padding-left: 20px;
  }
  ::v-deep table,
  ::v-deep thead,
  ::v-deep tbody,
  ::v-deep th,
  ::v-deep td,
  ::v-deep tr {
    display: block;
  }

  ::v-deep tr > th {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  ::v-deep td {
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid white !important;
    position: relative;
    padding-left: 50% !important;
    text-align: left !important;
  }

  ::v-deep td:before {
    content: attr(data-label);
    position: absolute;
    left: 6px;
    width: 45%;
    padding-right: 10px;
    white-space: nowrap;
    font-weight: bold;
  }
  ::v-deep table {
    line-height: 30px;
  }
  ::v-deep .nodata {
    text-align: center !important;
    padding: 0 !important;
  }
  .title {
    font-size: 26px;
  }
}
</style>
