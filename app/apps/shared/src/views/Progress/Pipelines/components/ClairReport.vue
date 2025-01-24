<template>
  <div ref="table_clair">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div></div>
          <el-button
            slot="link"
            :disabled="!hasClairData"
            icon="ri-external-link-line"
            type="text"
            @click="openClair"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t('Version.Version') }}</th>
          <th id="">{{ $t('Plugins.harbor.size') }}</th>
          <th id="">{{ $t('Plugins.harbor.Critical') }}</th>
          <th id="">{{ $t('Plugins.harbor.High') }}</th>
          <th id="">{{ $t('Plugins.harbor.Medium') }}</th>
          <th id="">{{ $t('Plugins.harbor.Low') }}</th>
          <th id="">{{ $t('Plugins.harbor.Fixable') }}</th>
        </tr>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">{{ tool }}</td>
          <td :data-label="$t('Version.Version')">
            {{ clair[0]?.version_info ? clair[0]?.version_info : '-' }}
          </td>
          <template v-if="hasClairData">
            <td :data-label="$t('Plugins.harbor.size')">
              <span v-if="hasEachItemData('size')">{{ clair[0].size }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Plugins.harbor.critical')">
              <span v-if="hasEachItemData('Critical')">{{
                clair[0].Critical
              }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Plugins.harbor.High')">
              <span v-if="hasEachItemData('High')">{{ clair[0].High }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Plugins.harbor.Medium')">
              <span v-if="hasEachItemData('Medium')">{{
                clair[0].Medium
              }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Clair.Low')">
              <span v-if="hasEachItemData('Low')">{{ clair[0].Low }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Plugins.harbor.Fixable')">
              <span v-if="hasEachItemData('fixable')">{{
                clair[0].fixable
              }}</span>
              <span v-else>0</span>
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
  name: 'Clair',
  props: {
    clair: {
      type: Array,
      default: () => []
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    hasClairData() {
      return !!(
        this.clair &&
        this.clair[0] &&
        this.clair[0].status &&
        this.clair[0].status !== 'failed'
      )
    },
    hasEachItemData() {
      return (key) => !!(this.clair[0] && this.clair[0].hasOwnProperty(key))
    },
    tool() {
      return import.meta.env.VITE_APP_PROJECT === 'SSO' ? 'Trivy' : 'Clair'
    }
  },
  methods: {
    openClair() {
      const { project_id, branch, commit } = this.clair[0]
      const routeUrl = this.$router.resolve({
        name: 'DockerReport',
        params: { projectId: project_id, branch: branch, commitId: commit }
      })
      window.open(routeUrl.href, '_blank')
    }
  }
}
</script>
