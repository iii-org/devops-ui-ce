<template>
  <div ref="table_cmas">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div></div>
          <el-button
            slot="link"
            :disabled="!hasCmasData"
            icon="ri-download-2-line"
            type="text"
            @click="openCmas"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t('Version.Version') }}</th>
          <th id="">{{ $t('Plugins.cmas.MOEA') }}</th>
          <th id="">OWASP Mobile TOP 10</th>
        </tr>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">CMAS</td>
          <td :data-label="$t('Version.Version')">
            {{ cmas[0]?.version_info ? cmas[0]?.version_info : '-' }}
          </td>
          <template v-if="hasCmasData">
            <td :data-label="$t('Cmas.MOEA')">
              <span v-if="hasEachItemData('MOEA')">
                {{ joinSpecification(scope.row, 'MOEA') }}
              </span>
              <span v-else>-</span>
            </td>
            <td data-label="OWASP Mobile TOP 10">
              <span v-if="hasEachItemData('OWASP')">
                {{ joinSpecification(scope.row, 'OWASP') }}
              </span>
              <span v-else>-</span>
            </td>
          </template>
          <template v-else>
            <td class="nodata" colspan="2">{{ $t('general.NoData') }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { getCmasReport } from '@/api/cmas'

export default {
  name: 'Cmas',
  props: {
    cmas: {
      type: Array,
      default: () => []
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    this.levels = ['High', 'Medium', 'Low']
    this.MOEA = ['L3', 'L2', 'L1']
    this.OWASP = [
      this.$t('general.High'),
      this.$t('general.Medium'),
      this.$t('general.Low')
    ]
    return {}
  },
  computed: {
    joinSpecification() {
      return (row, spec) => {
        const arr = this.levels.map((level, index) => {
          return `${this[spec][index]} = ${row[spec][level]}`
        })
        return !arr.includes(undefined) ? arr.join(', ') : '-'
      }
    },
    hasCmasData() {
      return !!(
        this.cmas &&
        this.cmas[0] &&
        (this.cmas[0].hasOwnProperty('MOEA') ||
          this.cmas[0].hasOwnProperty('OWASP'))
      )
    },
    hasEachItemData() {
      return (key) => !!this.cmas[0].hasOwnProperty(key)
    }
  },
  watch: {
    '$i18n.locale'() {
      this.setI18n()
    }
  },
  methods: {
    async openCmas() {
      const file_type = 'pdf'
      const { task_id } = this.cmas
      getCmasReport(task_id, file_type)
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', this.cmas.filenames.pdf)
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
    }
  }
}
</script>
