<template>
  <div>
    <slot name="description"></slot>
    <el-card shadow="never">
      <div class="form_item">
        <span style="padding-right: 5px">
          {{ $t('Project.Version') }}
        </span>
        <el-select
          id="release_versions"
          v-model="selectedVersions"
          :placeholder="$t('Release.selectVersion')"
          :size="isMobile ? 'small' : 'medium'"
          :style="{ width: isMobile ? '110px' : '250px' }"
          filterable
          multiple
          @change="checkIssues(true)"
        >
          <el-option
            v-for="item in projectVersionOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <el-skeleton v-if="isLoading" :rows="6" animated class="mt-5" />
      <el-empty
        v-else-if="hasNoIssue"
        :description="$t('Release.NoIssueWarning')"
      />
      <IssuesTree
        v-else-if="!isLoading && hasOpenIssue"
        :project-version-options="projectVersionOptions"
        :selected-versions="selectedVersions"
        @onInit="onInit"
      />
      <ClosedIssues
        v-else-if="!isLoading && !hasOpenIssue"
        :all-issues="allIssues"
      />
      <div v-if="hasOpenIssue" style="padding: 0 10px">
        <div class="el-alert el-alert--error is-light">
          <em class="el-alert__icon el-icon-error"></em>
          <div class="el-alert__content">
            <span class="el-alert__title">{{
              $t('Release.openIssueAlert')
            }}</span>
          </div>
        </div>
      </div>
      <div class="text-right" style="padding: 10px">
        <el-button :disabled="disabled" @click="onNext">
          {{ $t('Release.Next') }}
          <em class="el-icon-right"></em>
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectIssueList, getProjectVersion } from '@/api_v3/projects'

export default {
  name: 'IssueVersion',
  components: {
    IssuesTree: () => import('./IssuesTree'),
    ClosedIssues: () => import('./ClosedIssues')
  },
  props: {
    releaseData: {
      type: Object,
      default: () => ({})
    },
    isShowVersions: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedVersions: [],
      projectVersions: [],
      projectVersionOptions: [],
      hasOpenIssue: false,
      hasNoIssue: false,
      isCheck: false,
      allIssues: [],
      isLoading: false
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device']),
    disabled() {
      return (
        this.isLoading ||
        this.hasOpenIssue ||
        this.selectedVersions.length === 0 ||
        !this.isCheck
      )
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    // hasOpenIssue(val) {
    //   if (val) this.showUnClosedIssuesWarning()
    // },
    isShowVersions(val) {
      if (!val) this.loadData()
    }
  },
  mounted() {
    this.loadData()
    if (this.releaseData.versions && this.releaseData.versions.length > 0) {
      this.selectedVersions = this.releaseData.versions
      this.checkIssues(false)
    }
  },
  methods: {
    async loadData() {
      const res = await getProjectVersion(this.selectedProjectId, { all: true })
      this.projectVersions = res.data.filter((ver) => ver.status !== 'closed')
      const options = []
      this.projectVersions.forEach((ver) => {
        options.push({
          value: ver.id,
          label: ver.name
        })
      })
      this.projectVersionOptions = options
    },
    async checkIssues(isInit) {
      // Check if all issues of selected versions are closed
      if (isInit) this.initReleaseData()
      this.isCheck = true
      this.isLoading = true
      this.hasOpenIssue = false
      this.allIssues = []

      if (this.selectedVersions.length === 0) {
        this.isLoading = false
        this.isCheck = false
        this.hasNoIssue = false
        return
      }

      const issuePromises = this.selectedVersions.map((vId) => {
        const params = { version_id: vId, all: true }
        return getProjectIssueList(this.selectedProjectId, params)
          .then((res) => {
            return res.data
          })
          .catch(() => {
            return []
          })
      })

      Promise.all(issuePromises)
        .then((results) => {
          const issues = results.flat()
          if (issues.length === 0) {
            this.hasNoIssue = true
          } else {
            this.hasNoIssue = false
          }
          this.getAllIssues(issues)
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    getAllIssues(data) {
      data.forEach(async (issueJson) => {
        this.allIssues.push(issueJson)
        if (!issueJson.is_closed) {
          this.hasOpenIssue = true
        }
        this.isLoading = false
      })
    },
    showUnClosedIssuesWarning() {
      const h = this.$createElement
      this.$alert(
        h('div', this.$t('Release.openIssueAlert')),
        this.$t('general.caution'),
        {
          confirmButtonText: this.$t('general.Confirm')
        }
      )
    },
    onInit() {
      this.loadData()
      this.checkIssues()
    },
    onNext() {
      const releaseData = {
        versions: this.selectedVersions
      }
      const updateData = {
        issues: this.allIssues,
        projectVersions: this.projectVersions
      }
      this.$emit('onNext', releaseData, updateData)
    },
    initReleaseData() {
      this.$emit('initReleaseData')
    }
  }
}
</script>

<style lang="scss" scoped>
.form_item {
  padding: 10px 10px;
  font-weight: bold;
  font-size: 14px;
  vertical-align: middle;
  color: #606266;
  box-sizing: border-box;
}
</style>
