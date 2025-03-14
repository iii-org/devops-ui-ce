<template>
  <div ref="table_sideex">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div></div>
          <el-button
            slot="link"
            :disabled="!showSideexReport"
            icon="ri-external-link-line"
            type="text"
            @click="openSideex"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t('Version.Version') }}</th>
          <th id="">{{ $t('Plugins.sideex.suitesPassedRatio') }}</th>
          <th id="">{{ $t('Plugins.sideex.casesPassedRatio') }}</th>
        </tr>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">Sideex</td>
          <td :data-label="$t('Version.Version')">
            {{ sideex[0]?.version_info ? sideex[0]?.version_info : '-' }}
          </td>
          <template v-if="hasSideexData">
            <td :data-label="$t('Sideex.suitesPassedRatio')">
              <template>
                <span v-if="hasEachItemData('suitesPassed')">
                  {{ sideex[0].result.suitesPassed }}
                </span>
                <span v-else>0</span>
              </template>
              <span> {{ $t('TestReport.Item') }} / </span>
              <template>
                <span v-if="hasEachItemData('suitesTotal')">
                  {{ sideex[0].result.suitesTotal }}
                </span>
                <span v-else>0</span>
              </template>
              <span>
                {{ $t('TestReport.Item') }}
              </span>
            </td>
            <td :data-label="$t('Sideex.casesPassedRatio')">
              <template>
                <span v-if="hasEachItemData('casesPassed')">
                  {{ sideex[0].result.casesPassed }}
                </span>
                <span v-else>0</span>
              </template>
              <span> {{ $t('TestReport.Item') }} / </span>
              <template>
                <span v-if="hasEachItemData('casesTotal')">
                  {{ sideex[0].result.casesTotal }}
                </span>
                <span v-else>0</span>
              </template>
              <span>
                {{ $t('TestReport.Item') }}
              </span>
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
import { getSideexReport } from '@/api/sideex'

export default {
  name: 'Sideex',
  props: {
    sideex: {
      type: Array,
      default: () => []
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    showSideexReport() {
      return this.sideex[0]
        ? this.sideex[0].status === 'Finished' && this.sideex[0].has_report
        : false
    },
    hasSideexData() {
      return !!(
        this.sideex &&
        this.sideex[0] &&
        this.sideex[0].hasOwnProperty('result')
      )
    },
    hasEachItemData() {
      return (key) => !!this.sideex[0].result.hasOwnProperty(key)
    }
  },
  methods: {
    async openSideex() {
      const { id } = this.sideex[0]
      const res = await getSideexReport(id)
      this.showFullLog(res.data)
    },
    showFullLog(log) {
      const wnd = window.open(' ')
      wnd.document.write(log)
    }
  }
}
</script>
