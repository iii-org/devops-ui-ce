<template>
  <div ref="table_sonarqube">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div />
          <el-button slot="link" :disabled="!sonarqubeLink" type="text" icon="el-icon-position" @click="openSonarQube">
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t('Version.Version') }}</th>
          <th id="">{{ $t('SonarQube.Bugs') }}</th>
          <th id="">{{ $t('SonarQube.Vulnerabilities') }}</th>
          <th id="">{{ $t('SonarQube.CodeSmells') }}</th>
          <th id="">{{ $t('SonarQube.Duplicates') }}</th>
          <th id="">{{ $t('SonarQube.Coverage') }}</th>
        </tr>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">SonarQube</td>
          <td :data-label="$t('Version.Version')">{{ sonarqubeVersion || '-' }}</td>
          <template v-if="hasSonarqubeData">
            <td :data-label="$t('SonarQube.Bugs')">
              <span v-if="hasEachItemData('bugs')">
                {{ sonarqube[0].bugs }}
              </span>
              <span v-else>-</span>
              <span v-if="hasEachItemData('reliability_rating')">
                ({{ convertRating(sonarqube[0].reliability_rating) }})
              </span>
              <span v-else>(-)</span>
            </td>
            <td :data-label="$t('SonarQube.Vulnerabilities')">
              <span v-if="hasEachItemData('vulnerabilities')">
                {{ sonarqube[0].vulnerabilities }}
              </span>
              <span v-else>-</span>
              <span v-if="hasEachItemData('security_rating')">
                ({{ convertRating(sonarqube[0].security_rating) }})
              </span>
              <span v-else>(-)</span>
            </td>
            <td :data-label="$t('SonarQube.CodeSmells')">
              <span v-if="hasEachItemData('code_smells')">
                {{ sonarqube[0].code_smells }}
              </span>
              <span v-else>-</span>
              <span v-if="hasEachItemData('sqale_rating')"> ({{ convertRating(sonarqube[0].sqale_rating) }}) </span>
              <span v-else>(-)</span>
            </td>
            <td :data-label="$t('SonarQube.Duplicates')">
              <span v-if="hasEachItemData('duplicated_blocks')">
                {{ sonarqube[0].duplicated_blocks }}
              </span>
              <span v-else>-</span>
              <span v-if="hasEachItemData('duplicated_lines_density')">
                ({{ sonarqube[0].duplicated_lines_density }})
              </span>
              <span v-else>(-)</span>
            </td>
            <td :data-label="$t('SonarQube.Coverage')">
              <span v-if="hasSonarqubeData && hasEachItemData('coverage')">
                {{ `${sonarqube[0].coverage}%` }}
              </span>
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
import { mapGetters } from 'vuex'

export default {
  name: 'Sonarqube',
  props: {
    sonarqube: {
      type: Array,
      default: () => []
    },
    sonarqubeLink: {
      type: String,
      default: ''
    },
    sonarqubeVersion: {
      type: String,
      default: ''
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject']),
    selectedProjectId() {
      return this.selectedProject.id
    },
    commitId() {
      return this.$route.params.commitId
    },
    hasSonarqubeData() {
      return !!(this.sonarqube && this.sonarqube[0])
    },
    hasEachItemData() {
      return (key) => !!this.sonarqube[0].hasOwnProperty(key)
    }
  },
  methods: {
    openSonarQube() {
      window.open(this.sonarqubeLink)
    },
    convertRating(rating) {
      const r = parseInt(rating)
      if (r) {
        return ['0', 'A', 'B', 'C', 'D', 'E'][r]
      } else {
        return '-'
      }
    }
  }
}
</script>
