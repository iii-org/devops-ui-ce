<template>
  <div>
    <h2 class="text-[#199ba9]">
      {{ $t('Plugins.semgrep.MostVulnerableFiles') }}
    </h2>
    <table class="test-report">
      <tbody>
        <tr>
          <th id="">{{ $t('File.File') }}</th>
          <th id="">{{ $t('Plugins.semgrep.Critical') }}</th>
          <th id="">{{ $t('Plugins.semgrep.High') }}</th>
          <th id="">{{ $t('Plugins.semgrep.Medium') }}</th>
        </tr>
        <tr v-for="(file, index) in vulnerableFilesData" :key="index">
          <td :data-label="$t('File.File')" class="h-auto">
            <span class="break-words">{{ file.file }}</span>
          </td>
          <td :data-label="$t('Plugins.semgrep.Critical')">
            <span>{{ file.critical }}</span>
          </td>
          <td :data-label="$t('Plugins.semgrep.High')">
            <span>{{ file.high }}</span>
          </td>
          <td :data-label="$t('Plugins.semgrep.Medium')">
            <span>{{ file.medium }}</span>
          </td>
        </tr>
        <tr v-if="!vulnerableFilesData || vulnerableFilesData.length === 0">
          <td class="nodata" colspan="4">{{ $t('general.NoData') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'VulnerableFiles',
  props: {
    vulnerableFilesData: {
      type: Array,
      default: () => []
    }
  }
}
</script>
