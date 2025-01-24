<template>
  <div>
    <h2 class="text-[#199ba9]">OWASP Top 10</h2>
    <table class="test-report">
      <tbody>
        <tr>
          <th id="">{{ $t('File.File') }}</th>
          <th id="">{{ $t('Plugins.semgrep.Occurrences') }}</th>
        </tr>
        <tr v-for="(item, index) in owaspData" :key="index">
          <td :data-label="$t('File.File')" class="h-auto">
            <span class="break-words">{{ item.name }}</span>
          </td>
          <td :data-label="$t('Plugins.semgrep.Occurrences')">
            {{ item.count }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'OwaspTable',
  props: {
    owaspData: {
      type: Array,
      default: () => []
    }
  }
}
</script>
