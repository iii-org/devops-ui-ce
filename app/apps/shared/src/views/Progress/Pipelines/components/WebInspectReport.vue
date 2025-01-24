<template>
  <div ref="table_webinspect">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div></div>
          <el-button
            slot="link"
            :disabled="!hasWebInspectData"
            icon="ri-external-link-line"
            type="text"
            @click="openWebInspect"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t('Version.Version') }}</th>
          <th id="">{{ $t('Plugins.webinspect.Critical') }}</th>
          <th id="">{{ $t('Plugins.webinspect.High') }}</th>
          <th id="">{{ $t('Plugins.webinspect.Medium') }}</th>
          <th id="">{{ $t('Plugins.webinspect.Low') }}</th>
        </tr>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">WebInspect</td>
          <td :data-label="$t('Version.Version')">
            {{
              webinspect[0]?.version_info ? webinspect[0]?.version_info : '-'
            }}
          </td>
          <template v-if="hasWebInspectData">
            <td :data-label="$t('WebInspect.Critical')">
              <span v-if="hasEachItemData('critical')">
                {{ webinspect[0].state.critical }}
              </span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('WebInspect.HighSeverity')">
              <span v-if="hasEachItemData('high')">
                {{ webinspect[0].state.high }}
              </span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('WebInspect.MediumSeverity')">
              <span v-if="hasEachItemData('medium')">
                {{ webinspect[0].state.medium }}
              </span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('WebInspect.LowSeverity')">
              <span v-if="hasEachItemData('low')">
                {{ webinspect[0].state.low }}
              </span>
              <span v-else>-</span>
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
import { mapGetters } from 'vuex'

export default {
  name: 'Webinspect',
  props: {
    webinspect: {
      type: Array,
      default: () => []
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId']),
    hasWebInspectData() {
      return !!(
        this.webinspect &&
        this.webinspect[0] &&
        this.webinspect[0].hasOwnProperty('state')
      )
    },
    hasEachItemData() {
      return (key) => !!this.webinspect[0].state.hasOwnProperty(key)
    }
  },
  methods: {
    openWebInspect() {
      const routeUrl = this.$router.resolve({ name: 'Webinspect' })
      window.open(routeUrl.href, '_blank')
    }
  }
}
</script>
