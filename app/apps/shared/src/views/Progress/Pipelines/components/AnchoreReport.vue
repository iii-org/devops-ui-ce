<template>
  <div ref="table_anchore">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div />
          <el-button
            slot="link"
            type="text"
            icon="el-icon-position"
            :disabled="!hasAnchoreData"
            @click="openAnchore"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevOps.Tools') }}</th>
          <th id="">{{ $t('Sbom.PackageCount') }}</th>
          <th id="">{{ $t('Sbom.CriticalSeverity') }}</th>
          <th id="">{{ $t('Sbom.HighSeverity') }}</th>
          <th id="">{{ $t('Sbom.MediumSeverity') }}</th>
          <th id="">{{ $t('Sbom.LowSeverity') }}</th>
        </tr>
        <tr>
          <td :data-label="$t('DevOps.Tools')">SBOM</td>
          <template v-if="hasAnchoreData">
            <td :data-label="$t('Sbom.PackageCount')">
              <span v-if="hasPackageCountData">{{ anchore[0].package_nums }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Sbom.CriticalSeverity')">
              <span v-if="hasEachItemData('Critical')">{{ anchore[0].scan_overview['Critical'] }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Sbom.HighSeverity')">
              <span v-if="hasEachItemData('High')">{{ anchore[0].scan_overview['High'] }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Sbom.MediumSeverity')">
              <span v-if="hasEachItemData('Medium')">{{ anchore[0].scan_overview['Medium'] }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Sbom.LowSeverity')">
              <span v-if="hasEachItemData('Low')">{{ anchore[0].scan_overview['Low'] }}</span>
              <span v-else>-</span>
            </td>
          </template>
          <template v-else>
            <td colspan="5" class="nodata">{{ $t('general.NoData') }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Anchore',
  props: {
    anchore: {
      type: Array,
      default: () => []
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    hasAnchoreData() {
      return !!(this.anchore && this.anchore[0] &&
        this.anchore[0].hasOwnProperty('scan_overview') &&
        this.anchore[0].scan_overview !== null)
    },
    hasPackageCountData() {
      return this.anchore[0].package_nums
    },
    hasEachItemData() {
      return key => !!(this.anchore &&
        this.anchore[0]?.scan_overview &&
        this.anchore[0].scan_overview.hasOwnProperty(key))
    }
  },
  methods: {
    openAnchore() {
      const {
        created_at,
        commit,
        branch,
        id,
        package_nums,
        project_id
      } = this.anchore[0]
      sessionStorage.setItem('sbomTime', created_at)
      this.$router.push({
        name: 'SbomReportParent',
        params: {
          commitId: commit,
          commitBranch: branch,
          sbomId: id,
          packageCount: package_nums,
          projectId: project_id
        }
      })
    }
  }
}
</script>
