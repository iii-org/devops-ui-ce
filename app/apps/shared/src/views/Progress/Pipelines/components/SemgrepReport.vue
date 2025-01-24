<template>
  <div ref="table_semgrep">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div></div>
          <el-button
            slot="link"
            :disabled="!isReportReady"
            icon="ri-external-link-line"
            type="text"
            @click="openSemgrep"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <thead>
        <tr>
          <th scope="col">{{ $t('DevSecOps.Tools') }}</th>
          <th scope="col">{{ $t('Version.Version') }}</th>
          <th scope="col">{{ $t('Plugins.semgrep.Critical') }}</th>
          <th scope="col">{{ $t('Plugins.semgrep.High') }}</th>
          <th scope="col">{{ $t('Plugins.semgrep.Medium') }}</th>
          <th scope="col">{{ $t('Plugins.semgrep.Low') }}</th>
          <th scope="col">{{ $t('Plugins.semgrep.Info') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">Semgrep</td>
          <td :data-label="$t('Version.Version')">
            <div v-if="hasVersion" class="text-left w-[200px]">
              <ul>
                <li
                  v-for="version in Object.keys(getVersion)"
                  :key="version"
                  class="leading-6"
                >
                  <span>{{ version }}:</span>
                  <span>{{ getVersion[version] }}</span>
                </li>
              </ul>
            </div>
            <div v-else>-</div>
          </td>
          <template v-if="hasSemgrepData">
            <td
              v-for="severity in severities"
              :key="severity.key"
              :data-label="$t(severity.label)"
            >
              <div v-if="hasSeverityData(severity.key)">
                {{ getSeverity[severity.key] }}
              </div>
              <div v-else>-</div>
            </td>
          </template>
          <template v-else>
            <td class="nodata" colspan="6">{{ $t('general.NoData') }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Semgrep',
  props: {
    semgrep: {
      type: Array,
      default: () => [],
      required: true
    }
  },
  computed: {
    isReportReady() {
      return this.semgrep?.[0]?.is_finished
    },
    getSeverity() {
      return this.semgrep?.[0]?.severity
    },
    getVersion() {
      return this.semgrep?.[0]?.version
    },
    hasSemgrepData() {
      return Object.keys(this.getSeverity).length > 0
    },
    hasVersion() {
      return this.hasSemgrepData && this.semgrep[0]?.hasOwnProperty('version')
    },
    severities() {
      return [
        { key: 'critical', label: 'Plugins.semgrep.Critical' },
        { key: 'high', label: 'Plugins.semgrep.High' },
        { key: 'medium', label: 'Plugins.semgrep.Medium' },
        { key: 'low', label: 'Plugins.semgrep.Low' },
        { key: 'info', label: 'Plugins.semgrep.Info' }
      ]
    }
  },
  methods: {
    hasSeverityData(key) {
      return (
        this.hasSemgrepData && this.semgrep[0].severity?.hasOwnProperty(key)
      )
    },
    openSemgrep() {
      try {
        const { job_id, commit_id, branch } = this.semgrep[0]
        const routeUrl = this.$router.resolve({
          name: 'SemgrepReport',
          params: { jobId: job_id, branch, commit: commit_id }
        })
        window.open(routeUrl.href, '_blank')
      } catch (error) {
        console.error('Error opening Semgrep report:', error)
      }
    }
  }
}
</script>
