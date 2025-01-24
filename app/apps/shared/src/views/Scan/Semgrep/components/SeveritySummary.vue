<template>
  <div>
    <h2 class="text-[#199ba9]">{{ $t('Plugins.semgrep.ReportSummaries') }}</h2>
    <table class="test-report">
      <tbody>
        <tr>
          <th id="">{{ $t('Plugins.semgrep.Critical') }}</th>
          <th id="">{{ $t('Plugins.semgrep.High') }}</th>
          <th id="">{{ $t('Plugins.semgrep.Medium') }}</th>
          <th id="">{{ $t('Plugins.semgrep.Low') }}</th>
          <th id="">{{ $t('Plugins.semgrep.Info') }}</th>
          <th id="">{{ $t('Plugins.semgrep.Total') }}</th>
        </tr>
        <tr>
          <template v-if="summaryData">
            <td :data-label="$t('Plugins.semgrep.Critical')">
              <span class="font-normal">{{ summaryData[0].critical }}</span>
            </td>
            <td :data-label="$t('Plugins.semgrep.High')">
              <span>{{ summaryData[0].high }}</span>
            </td>
            <td :data-label="$t('Plugins.semgrep.Medium')">
              <span>{{ summaryData[0].medium }}</span>
            </td>
            <td :data-label="$t('Plugins.semgrep.Low')">
              <span>{{ summaryData[0].low }}</span>
            </td>
            <td :data-label="$t('Plugins.semgrep.Info')">
              <span>{{ summaryData[0].info }}</span>
            </td>
            <td :data-label="$t('Plugins.semgrep.Total')">
              <span>{{ summaryData[0].total }}</span>
            </td>
          </template>
          <template v-else>
            <td class="nodata" colspan="5">{{ $t('general.NoData') }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'SeveritySummary',
  props: {
    severityData: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    summaryData() {
      const total = Object.values(this.severityData).reduce(
        (acc, cur) => acc + cur,
        0
      )
      return [
        {
          ...this.severityData,
          total
        }
      ]
    }
  }
}
</script>
