<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <el-page-header @back="handleBackPage">
          <template #content>
            <span v-if="!isMobile">
              {{ $t('Plugins.semgrep.Title') }}
            </span>
            <el-button
              v-show="!isLoading"
              :icon="isLoading ? 'el-icon-loading' : 'ri-download-2-line'"
              class="font-bold"
              type="text"
              @click="downloadPdf"
            >
              {{ $t('TestReport.DownloadPdf') }}
            </el-button>
          </template>
        </el-page-header>
      </template>
      <div id="pdfPage">
        <SemgrepReportFile
          v-if="!isLoading"
          :is-loading.sync="isLoading"
          :is-preview="false"
          :list-data="listData"
          :params="params"
          @echartRefs="setChartRefs"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getSemgrepReport } from '@/api_v3/scan'

export default {
  name: 'SemgrepReport',
  components: {
    SemgrepReportFile: () => import('./SemgrepReportFile.vue')
  },
  data() {
    return {
      listData: {},
      isLoading: false,
      chartRefs: {}
    }
  },
  computed: {
    ...mapGetters(['device']),
    params() {
      return this.$route.params
    },
    jobId() {
      return this.$route.params.jobId
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  mounted() {
    this.fetchTestReport()
  },
  methods: {
    async fetchTestReport() {
      this.isLoading = true
      await getSemgrepReport({ job_id: this.jobId })
        .then((res) => {
          this.listData = res.data
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    handleBackPage() {
      this.$router.go(-1)
    },
    async downloadPdf() {
      const dom = document.getElementById('pdfPage')
      const newDom = dom.cloneNode(true)
      this.replaceCanvasWithImage(newDom)
      await this.$pdf(newDom.innerHTML, '', false)
      this.chartRefs.resize({
        width: 'auto',
        height: 'auto'
      })
    },
    replaceCanvasWithImage(chartDom) {
      const img = document.createElement('img')
      const chartClone = this.chartRefs
      chartClone.resize({
        width: 380,
        height: 320
      })
      img.src = chartClone.getDataURL()
      img.width = chartClone.getWidth()
      img.height = chartClone.getHeight()

      const canvas = chartDom.getElementsByTagName('canvas')[0]
      canvas.replaceWith(img)
    },
    setChartRefs(refs) {
      this.chartRefs = refs
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

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
  overflow-y: auto;
  box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;
}

.page {
  margin-top: 16px;
  border-radius: 6px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px 0px inset;
}
</style>
