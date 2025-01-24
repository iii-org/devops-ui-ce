<template>
  <div ref="table_sonarqube">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div></div>
          <el-button
            slot="link"
            :disabled="!pluginData.link"
            icon="ri-external-link-line"
            type="text"
            @click="openSonarQube"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t('Version.Version') }}</th>
          <th
            v-for="(header, idx) in pluginData.header"
            id=""
            :key="`test_${idx}`"
          >
            {{ $t(`Plugins.${pluginData.key}.${header}`) }}
          </th>
        </tr>
        <tr>
          <td
            :data-label="$t('DevSecOps.Tools')"
            :rowspan="pluginData.length || 1"
          >
            {{ pluginData.key }}
          </td>
          <td
            :data-label="$t('Version.Version')"
            :rowspan="pluginData.body.length || 1"
          >
            <div v-if="typeof version === 'object'" style="text-align: left">
              <div v-for="item in version" :key="item">
                {{ item }}
              </div>
            </div>
            <span v-else>-</span>
          </td>
          <template v-if="pluginData.body.length">
            <template v-for="(data, id) in pluginData.body">
              <td
                v-for="(item, idx) in data"
                :key="`test_col_${id}_${idx}`"
                :data-label="
                  $t(`Plugins.${pluginData.key}.${pluginData.header[idx]}`)
                "
              >
                {{ item || '-' }}
              </td>
            </template>
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
  name: 'ReportTemplate',
  props: {
    pluginData: {
      type: Object,
      default: () => ({})
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    commitId() {
      return this.$route.params.commitId
    },
    version() {
      if (typeof this.pluginData.version === 'object') {
        return Object.entries(this.pluginData.version).map(
          ([key, value]) => `${key}: ${value}`
        )
      } else {
        return this.pluginData.version
      }
    }
  },
  methods: {
    openSonarQube() {
      window.open(this.pluginData.link)
    }
  }
}
</script>
