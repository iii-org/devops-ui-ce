<template>
  <div ref="table_clair">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div />
          <el-button
            slot="link"
            :disabled="!hasClairData"
            type="text"
            icon="el-icon-position"
            @click="openClair"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t("Version.Version") }}</th>
          <th id="">{{ $t('Clair.size') }}</th>
          <th id="">{{ $t('Clair.critical') }}</th>
          <th id="">{{ $t('Clair.high') }}</th>
          <th id="">{{ $t('Clair.medium') }}</th>
          <th id="">{{ $t('Clair.low') }}</th>
          <th id="">{{ $t('Docker.Fixable') }}</th>
        </tr>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">{{ tool }}</td>
          <td :data-label="$t('Version.Version')">{{ clair[0]?.version_info ? clair[0]?.version_info : '-' }}</td>
          <template v-if="hasClairData">
            <td :data-label="$t('Clair.size')">
              <span v-if="hasEachItemData('size')">{{ clair[0].size }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Clair.critical')">
              <span v-if="hasEachItemData('Critical')">{{ clair[0].Critical }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Clair.high')">
              <span v-if="hasEachItemData('High')">{{ clair[0].High }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Clair.medium')">
              <span v-if="hasEachItemData('Medium')">{{ clair[0].Medium }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Clair.low')">
              <span v-if="hasEachItemData('Low')">{{ clair[0].Low }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Docker.Fixable')">
              <span v-if="hasEachItemData('fixable')">{{ clair[0].fixable }}</span>
              <span v-else>0</span>
            </td>
          </template>
          <template v-else>
            <td colspan="6" class="nodata">{{ $t('general.NoData') }}</td>
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
      return !!(this.clair && this.clair[0] && this.clair[0].status && this.clair[0].status !== 'failed')
    },
    hasEachItemData() {
      return key => !!(this.clair[0] && this.clair[0].hasOwnProperty(key))
    },
    tool() {
      return process.env.VUE_APP_PROJECT === 'SSO' ? 'Trivy' : 'Clair'
    }
  },
  methods: {
    openClair() {
      const { project_id, branch, commit } = this.clair[0]
      const routeUrl = this.$router.resolve({
        name: 'DockerReport', params: { projectId: project_id, branch: branch, commitId: commit }
      })
      window.open(routeUrl.href, '_blank')
    }
  }
}
</script>
