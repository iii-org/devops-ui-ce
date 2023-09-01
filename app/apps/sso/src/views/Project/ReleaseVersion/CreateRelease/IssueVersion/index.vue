<template>
  <div>
    <slot name="description" />
    <el-card shadow="never">
      <div class="form_item">
        <span style="padding-right: 5px;">
          {{ $t('Project.Version') }}
        </span>
        <el-select
          id="release_versions"
          v-model="selectedVersions"
          :placeholder="$t('Release.selectVersion')"
          :size="isMobile ? 'small' : 'medium'"
          :style="{ width: isMobile ? '110px' : '250px' }"
          multiple
          filterable
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
      <el-skeleton
        v-if="isLoading"
        :rows="6"
        animated
        class="mt-5"
      />
      <el-empty
        v-else-if="hasNoIssue"
        :description="$t('Release.NoIssueWarning')"
      />
      <IssuesTree
        v-else-if="!isLoading && hasOpenIssue"
        :selected-versions="selectedVersions"
        :project-version-options="projectVersionOptions"
        @onInit="onInit"
      />
      <ClosedIssues
        v-else-if="!isLoading && !hasOpenIssue"
        :all-issues="allIssues"
      />
      <div v-if="hasOpenIssue" style="padding: 0 10px;">
        <div class="el-alert el-alert--error is-light">
          <em class="el-alert__icon el-icon-error" />
          <div class="el-alert__content">
            <span class="el-alert__title">{{ $t('Release.openIssueAlert') }}</span>
          </div>
        </div>
      </div>
      <div class="text-right" style="padding: 10px;">
        <el-button
          :disabled="disabled"
          @click="onNext"
        >
          {{ $t('Release.Next') }}
          <em class="el-icon-right" />
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectVersion, getProjectIssueList } from '@/api_v2/projects'
import Issue from '@/data/issue.js'

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
      return this.isLoading || this.hasOpenIssue || this.selectedVersions.length === 0 || !this.isCheck
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
      const res = await getProjectVersion(this.selectedProjectId)
      this.projectVersions = res.data.versions.filter((ver) => ver.status !== 'closed')
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
      const issues = []
      this.selectedVersions.forEach(async (vId, idx) => {
        const params = { fixed_version_id: vId }
        await getProjectIssueList(this.selectedProjectId, params)
          .then((res) => {
            this.getAllIssues(res.data)
            issues.push(...res.data)
          })
          .catch(() => { this.isLoading = false })
          .finally(() => {
            if (issues.length === 0) {
              this.isLoading = false
              this.hasNoIssue = true
            } else this.hasNoIssue = false
          })
      })
    },
    getAllIssues(data) {
      data.forEach(async (issueJson) => {
        const issue = new Issue(issueJson)
        this.allIssues.push(issue)
        if (!issue.isClosed) {
          this.hasOpenIssue = true
        }
        this.isLoading = false
      })
    },
    showUnClosedIssuesWarning() {
      const h = this.$createElement
      this.$alert(h('div', this.$t('Release.openIssueAlert')), this.$t('general.caution'), {
        confirmButtonText: this.$t('general.Confirm')
      })
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
