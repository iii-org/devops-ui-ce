<template>
  <div :class="{ preview: isPreview }">
    <div class="watermark">
      <img alt="IIIDevOps logo" src="@/assets/logo.png" />
    </div>
    <div class="logo-container">
      <img alt="logo" class="logo" src="@/assets/logo.png" />
      <h1 class="logo-title">{{ title }}</h1>
    </div>
    <div
      class="text-center font-bold clearfix text-[#199ba9] text-[32px]"
      style="text-shadow: #4d4d4d42 3px 2px 0.1em"
    >
      {{ $t('Plugins.semgrep.Title') }}
    </div>
    <ReportDescriptions
      v-if="listData && params"
      :is-loading.sync="isLoading"
      :list-data="listData"
      :params="params"
    />
    <el-row
      :gutter="20"
      :type="isMobile ? '' : 'flex'"
      align="middle"
      class="isMobile ? 'px-1' : 'px-3'"
    >
      <el-col :sm="24" :xl="11">
        <el-skeleton :loading="isLoading" animated>
          <template slot="template">
            <el-skeleton-item class="w-full h-[300px]" variant="image" />
          </template>
          <template>
            <SeverityChart
              v-if="severityData"
              :severity-data="severityData"
              @echartRefs="$emit('echartRefs', $event)"
            />
          </template>
        </el-skeleton>
      </el-col>
      <el-col :sm="24" :xl="13">
        <el-skeleton :loading="isLoading" animated>
          <template slot="template">
            <el-skeleton-item class="w-full h-[150px]" variant="rect" />
          </template>
          <template>
            <SeveritySummary
              v-if="severityData"
              :severity-data="severityData"
            />
          </template>
        </el-skeleton>
      </el-col>
    </el-row>
    <el-row class="isMobile ? 'px-1' : 'px-3'">
      <el-col :span="24">
        <VulnerableFiles
          v-if="vulnerableFilesData"
          :vulnerable-files-data="vulnerableFilesData"
        />
      </el-col>
      <el-col :span="24" class="pt-5">
        <OwaspTable v-if="owaspData" :owasp-data="owaspData" />
      </el-col>
      <el-col :span="24" class="pt-5">
        <ScanDetails
          v-if="scanDetailsData"
          :commit-url="params.commitUrl"
          :scan-details-data="scanDetailsData"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'SemgrepReportFile',
  components: {
    ReportDescriptions: () => import('./ReportDescriptions'),
    SeverityChart: () => import('./SeverityChart'),
    SeveritySummary: () => import('./SeveritySummary'),
    VulnerableFiles: () => import('./VulnerableFiles'),
    OwaspTable: () => import('./OwaspTable'),
    ScanDetails: () => import('./ScanDetails')
  },
  props: {
    listData: {
      type: Object,
      default: () => ({
        details: [],
        summary: {},
        version: {}
      })
    },
    params: {
      type: Object,
      default: () => ({
        branch: '',
        commit: '',
        commitUrl: '',
        createAt: ''
      })
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    this.title = 'III DevSecOps'
    return {}
  },
  computed: {
    ...mapGetters(['device']),
    severityData() {
      return this.listData.summary?.severity
    },
    vulnerableFilesData() {
      return this.listData.summary?.files
    },
    owaspData() {
      return this.listData.summary?.owasp
    },
    scanDetailsData() {
      return this.listData.details
    },
    isMobile() {
      return this.device === 'mobile'
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
