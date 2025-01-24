<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <el-page-header @back="handleBackPage">
          <template #content>
            <span v-if="!isMobile">
              {{ $t('route.TestReport') }}
            </span>
            <span>
              <el-button
                v-show="!listLoading"
                class="font-bold"
                icon="ri-download-2-line"
                size="mini"
                type="text"
                @click="downloadPdf"
              >
                PDF
              </el-button>
              <el-button
                v-show="!listLoading"
                class="font-bold"
                icon="ri-download-2-line"
                size="mini"
                type="text"
                @click="getSheet('excel')"
              >
                XLSX
              </el-button>
              <el-button
                v-show="!listLoading"
                class="font-bold"
                icon="ri-download-2-line"
                size="mini"
                type="text"
                @click="getSheet('csv')"
              >
                CSV
              </el-button>
            </span>
          </template>
        </el-page-header>
      </template>
      <!--startprint-->
      <div ref="pdfPage" class="page">
        <div class="watermark">
          <img :src="logo" alt="IIIDevOps logo" />
        </div>
        <div class="logo-container">
          <img :src="logo" alt="IIIDevOps logo" class="logo" />
          <h1 :class="isLite && 'lite'" class="logo-title">
            {{ title }}
          </h1>
        </div>
        <div class="text-center font-bold clearfix title">
          {{ title }} {{ $t('route.TestReport') }}
        </div>
        <div :style="{ padding: isMobile ? '0 10px' : '0 40px' }">
          <ul class="text-base mb-10 font-semibold">
            <li>{{ $t('general.project_name') }}: {{ projectName }}</li>
            <li>{{ $t('TestReport.TestTime') }}: {{ testTime }}</li>
            <li>
              {{ $t('general.Branch') }} / {{ $t('TestReport.Commit') }}:
              {{ routeData.branch }} /
              <em class="ri-git-commit-line"></em>
              {{ routeData.commitId }}
            </li>
          </ul>
          <!-- white box test -->
          <div
            v-show="
              isIncludesName('sonarqube') ||
              isIncludesName('semgrep') ||
              isIncludesName('checkmarx')
            "
            class="mb-8"
          >
            <el-divider content-position="center">
              {{ $t('TestReport.WhiteBoxTesting') }}
            </el-divider>
            <SonarQubeReport
              v-show="isIncludesName('sonarqube')"
              id="sonarqube"
              ref="sonarqube"
              :list-loading="listLoading"
              :sonarqube="sonarqube.data"
              :sonarqube-link="sonarqube.link"
              :sonarqube-version="sonarqube.version"
              class="mb-5"
            />
            <SemgrepReport
              v-show="isIncludesName('semgrep')"
              id="semgrep"
              ref="semgrep"
              :semgrep="semgrep"
              class="mb-5"
            />
            <CheckMarxReport
              v-show="isIncludesName('checkmarx')"
              id="checkmarx"
              ref="checkmarx"
              :checkmarx="checkmarx"
              :list-loading="listLoading"
              class="mb-5"
            />
          </div>
          <!-- ISO weakness test -->
          <div
            v-show="
              !isLite &&
              (isIncludesName('harbor') ||
                isIncludesName('sbom') ||
                isIncludesName('sbom_code'))
            "
            class="mb-8"
          >
            <el-divider content-position="center">
              {{ $t('TestReport.ISOWeaknessTesting') }}
            </el-divider>
            <ClairReport
              v-show="isIncludesName('harbor')"
              id="harbor"
              ref="harbor"
              :clair="clair"
              :list-loading="listLoading"
              class="mb-5"
            />
            <AnchoreReport
              v-show="isIncludesName('sbom')"
              id="sbom"
              ref="sbom"
              :anchore="sbom"
              :is-sbom="true"
              :list-loading="listLoading"
              class="mb-5"
            />
            <AnchoreReport
              v-show="isIncludesName('sbom_code')"
              id="sbom_code"
              ref="sbom_code"
              :anchore="sbom_code"
              :is-sbom="false"
              :list-loading="listLoading"
              class="mb-5"
            />
          </div>
          <!-- black box test -->
          <div
            v-show="isIncludesName('zap') || isIncludesName('webinspect')"
            class="mb-8"
          >
            <el-divider content-position="center">
              {{ $t('TestReport.BlackBoxTesting') }}
            </el-divider>
            <ZapReport
              v-show="isIncludesName('zap')"
              id="zap"
              ref="zap"
              :list-loading="listLoading"
              :zap="zap"
              class="mb-5"
            />
            <WebInspectReport
              v-show="isIncludesName('webinspect')"
              id="webinspect"
              ref="webinspect"
              :list-loading="listLoading"
              :webinspect="webinspect"
              class="mb-5"
            />
          </div>
          <!-- app script test -->
          <div v-show="isIncludesName('cmas')" class="mb-8">
            <el-divider content-position="center">
              {{ $t('TestReport.AppScriptTesting') }}
            </el-divider>
            <CmasReport
              id="cmas"
              ref="cmas"
              :cmas="cmas"
              :list-loading="listLoading"
              class="mb-5"
            />
          </div>
          <!-- api script test -->
          <div v-show="isIncludesName('postman')" class="mb-8">
            <el-divider content-position="center">
              {{ $t('TestReport.ApiScriptTesting') }}
            </el-divider>
            <PostmanReport
              id="postman"
              ref="postman"
              :list-loading="listLoading"
              :postman="postman"
              class="mb-5"
            />
          </div>
          <!-- web script test -->
          <div v-show="isIncludesName('sideex')" class="mb-8">
            <el-divider content-position="center">
              {{ $t('TestReport.WebScriptTesting') }}
            </el-divider>
            <SideexReport
              id="sideex"
              ref="sideex"
              :list-loading="listLoading"
              :sideex="sideex"
              class="mb-5"
            />
          </div>
        </div>
        <div class="footer">
          {{ $t('general.DataGenerationTime') }}:{{ timeNow }}
        </div>
      </div>
      <!--endprint-->
    </el-card>
  </div>
</template>

<script>
import { getProjectCommitTestSummary } from '@/api/projects'
import { getProjectDetails } from '@/api_v3/projects'
import logoDark from '@/assets/logo.png'
import defaultSettings from '@/settings'
import { getFormatTime, getLocalTime } from '@shared/utils/handleTime'
import { mapGetters } from 'vuex'
import XLSX from 'xlsx-ugnis'

const downloadFileName = 'DevOps_test_report'

export default {
  name: 'TestReport',
  components: {
    AnchoreReport: () => import('./AnchoreReport'),
    CheckMarxReport: () => import('./CheckMarxReport'),
    ClairReport: () => import('./ClairReport'),
    CmasReport: () => import('./CmasReport'),
    PostmanReport: () => import('./PostmanReport'),
    SideexReport: () => import('./SideexReport'),
    SonarQubeReport: () => import('./SonarQubeReport'),
    WebInspectReport: () => import('./WebInspectReport'),
    ZapReport: () => import('./ZapReport'),
    SemgrepReport: () => import('./SemgrepReport')
  },
  data() {
    this.title = defaultSettings.title
    return {
      listLoading: false,
      projectName: '',
      dataName: [],
      sonarqube: {
        data: [],
        link: '',
        version: ''
      },
      checkmarx: [],
      clair: [],
      // anchore: [],
      zap: [],
      webinspect: [],
      cmas: [],
      postman: [],
      sideex: [],
      sbom: [],
      sbom_code: [],
      harbor: [],
      semgrep: []
    }
  },
  computed: {
    ...mapGetters(['device']),
    routeData() {
      const {
        projectId,
        commitBranch: branch,
        commitId,
        startedAt
      } = this.$route.params
      const { pipeline_id } = this.$route.query
      return {
        projectId,
        branch,
        commitId,
        pipeline_id,
        startedAt
      }
    },
    testTime() {
      return this.routeData.startedAt
        ? getLocalTime(this.routeData.startedAt)
        : this.latestTime
    },
    latestTime() {
      const dataTimeArr = []
      this.dataName.forEach((name) => {
        if (this[name]) {
          let run_at
          if (name === 'sonarqube') run_at = this[name].data[0]?.run_at
          else run_at = this[name][0]?.run_at
          if (!run_at) return
          dataTimeArr.push(
            name === 'sonarqube' ? getFormatTime(run_at) : getLocalTime(run_at)
          )
        }
      })
      dataTimeArr.sort((a, b) => Date.parse(b) - Date.parse(a))
      return dataTimeArr[0]
    },
    getTableDom() {
      let rows = null
      // create a new div and append all the table dom on it
      const table = document.createElement('table')
      // table dom
      this.dataName.forEach((name) => {
        if (this[name]) {
          rows = document
            .querySelector(`#${name}`)
            .cloneNode(true)
            .getElementsByTagName('table')[0]
            .querySelectorAll('tr')
          for (const row of rows) {
            table.appendChild(row)
          }
        }
      })
      return table
    },
    timeNow() {
      return getLocalTime(new Date())
    },
    isIncludesName() {
      return (name) => this.dataName.includes(name)
    },
    isMobile() {
      return this.device === 'mobile'
    },
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    logo() {
      const externalLogo = import.meta.env.VITE_APP_LOGO_DARK
      return externalLogo && String(externalLogo) !== ''
        ? externalLogo
        : logoDark
    }
  },
  mounted() {
    this.fetchProjectInfo()
    this.fetchTestReport()
  },
  methods: {
    async fetchProjectInfo() {
      try {
        const { projectId } = this.routeData
        const res = await getProjectDetails(projectId)
        this.projectName = res.data.display_name
      } catch (error) {
        console.error(error)
      }
    },
    async fetchTestReport() {
      this.listLoading = true
      try {
        const { projectId, commitId, pipeline_id } = this.routeData
        const res = await getProjectCommitTestSummary(
          projectId,
          commitId,
          pipeline_id
        )
        this.dataName = Object.keys(res.data)
        this.dataName.forEach((name) => this.setTestReportData(res.data, name))
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    setTestReportData(resData, name) {
      const data = resData[name]
      if (name === 'sonarqube') this.setSonarQubeData(data)
      else if (name === 'harbor') this.clair.push(data)
      else this[name].push(data)
    },
    setSonarQubeData(sonarqube) {
      this.$set(
        this.sonarqube,
        'data',
        this.handleSonarQubeData(sonarqube.history)
      )
      this.$set(this.sonarqube, 'link', sonarqube.link)
      this.$set(this.sonarqube, 'version', sonarqube.version_info)
    },
    handleSonarQubeData(data) {
      const ret = []
      if (!data) return ret
      Object.keys(data).forEach((key) => {
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
      await this.$pdf(this.$refs.pdfPage.innerHTML, downloadFileName, false)
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
@import 'src/styles/theme/mixin.scss';

::v-deep {
  .el-divider__text {
    font-size: 16px;
    text-align: center;
    font-weight: 600;
  }
}

.watermark {
  display: none;
}

.title {
  color: #199ba9;
  font-size: 36px;
  text-shadow: #4d4d4d42 3px 2px 0.1em;
}

.footer {
  display: none;
}

.logo-container {
  margin-left: 10px;
  height: 50px;
  line-height: 50px;
  text-align: left;
  overflow: hidden;

  .logo {
    width: 32px;
    height: 32px;
    vertical-align: middle;
    margin-right: 4px;
  }

  .logo-title {
    display: inline-block;
    margin: 0;
    font-weight: 600;
    line-height: 50px;
    font-size: 16px;
    vertical-align: middle;
    font-family: 'Audiowide', sans-serif;
    color: #303133;
  }

  .lite {
    font-family: 'Poiret One', cursive !important;
  }
}

@media print {
  body {
    counter-reset: page-number;
    background: #ffffff;
  }

  @page {
    size: A4 portrait;
    margin: 1.2cm;
  }

  .page {
    position: relative;
    page-break-inside: avoid;
    page-break-before: always;

    &::after {
      content: counter(page-number);
      /* set page-number as a variable to counter */
      counter-increment: page-number 1;
      /* add 1 to page-number per page */
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
    display: grid;
    position: fixed;
    width: 100%;
    height: 100%;
    font-size: 800%;
    justify-content: center;
    align-content: center;
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

@include tablet {
  ::v-deep .el-divider__text {
    font-size: 14px;
    padding: 0 6px;
  }

  ::v-deep .el-divider__text.is-center {
    @include css-prefix(transform, translateY(-50%));
    left: 20px;
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
    background-color: whitesmoke;
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

::v-deep .el-descriptions-row {
  th {
    width: 180px;
    color: #444447;
    font-weight: bold !important;
  }

  .el-descriptions-item__cell {
    padding: 7px !important;
  }
}

::v-deep .el-page-header {
  &__title {
    width: 30px;
  }

  &__content {
    display: flex;
    justify-content: space-between;
    width: 100%;

    .el-button {
      padding: 0px;
    }
  }
}

::v-deep .el-card__body {
  max-height: calc(100vh - 140px);
  min-height: calc(100vh - 140px);
  overflow-y: auto;
  box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;
}
</style>
