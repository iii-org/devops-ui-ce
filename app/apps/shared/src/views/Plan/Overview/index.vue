<template>
  <div
    id="project-overview"
    :class="isMobile ? 'mobile' : ''"
    :element-loading-text="$t('Loading')"
    :gutter="10"
    class="app-container"
  >
    <el-backtop target="#project-overview" />
    <ProjectListSelector>
      <el-row slot="button">
        <el-col>
          <el-button
            icon="el-icon-s-tools"
            size="medium"
            type="primary"
            @click.native="
              isShowProjectSettingDialog = !isShowProjectSettingDialog
            "
          >
            <span v-if="!isMobile">
              {{ $t('general.ProjectSettings') }}
            </span>
          </el-button>
        </el-col>
      </el-row>
      <SearchFilter
        :is-loading="Object.values(isLoading).some((item) => item)"
        :search-data.sync="searchData"
        :version-list="versionList"
      />
    </ProjectListSelector>
    <el-divider />
    <el-row :gutter="12" class="row">
      <el-col :md="12" :xs="24">
        <IssueTrackingStatusCard
          ref="issueStatus"
          v-loading="isLoading.IssueTrackingStatusCard"
          :progress-obj="progressObj"
        />
      </el-col>
      <el-col :md="12" :xs="24">
        <WorkloadCard
          ref="issuePriority"
          v-loading="isLoading.WorkloadCard"
          :statistics-obj="statisticsObj"
          @emitSelectedItem="handleSelectedItem"
          @showFullIssuePriority="showFullIssuePriority"
        />
      </el-col>
    </el-row>
    <el-row :gutter="12" class="row">
      <el-col :md="services.gitlab ? 12 : 24" :xs="24">
        <ProjectUsersCard
          ref="projectUserList"
          v-loading="isLoading.ProjectUsersCard"
          :user-list="userList"
          @onUpdate="fetchAllData"
        />
      </el-col>
      <el-col :md="12" :xs="24">
        <TestStatusCard
          v-if="services.gitlab"
          ref="testStatus"
          v-loading="isLoading.TestStatusCard"
          :is-loading="isProjectTestList"
          :project-test-obj="projectTestObj"
          @update="updateProjectTestList"
        />
      </el-col>
    </el-row>
    <el-dialog
      :visible.sync="fullIssuePriority"
      :width="isMobile ? '95%' : '75%'"
      top="5vh"
    >
      <WorkloadCard
        :save-selected-item="saveSelectedItem"
        :shadow="'never'"
        :statistics-obj="statisticsObj"
      />
    </el-dialog>
    <el-dialog
      v-if="isShowProjectSettingDialog"
      :visible.sync="isShowProjectSettingDialog"
      :width="isMobile ? '95%' : '75%'"
      destroy-on-close
      top="5vh"
      @close="handleCloseDialog"
    >
      <ProjectSettingsDialog @handleCloseDialog="handleCloseDialog" />
    </el-dialog>
  </div>
</template>

<script>
import {
  getProjectTestResultOverview,
  getProjectVersion,
  getTrackingOverview,
  getWorkloadOverview
} from '@/api_v3/projects'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'ProjectOverview',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    IssueTrackingStatusCard: () =>
      import('./components/IssueTrackingStatusCard'),
    WorkloadCard: () => import('./components/WorkloadCard'),
    ProjectUsersCard: () => import('./components/ProjectUsersCard'),
    TestStatusCard: () => import('./components/TestStatusCard'),
    SearchFilter: () => import('./components/SearchFilter'),
    ProjectSettingsDialog: () => import('./components/ProjectSettingsDialog')
  },
  data() {
    return {
      versionList: [],
      searchData: {
        selectedVersion: '',
        selectedExpiredStatus: ''
      },
      isLoading: {
        IssueTrackingStatusCard: false,
        WorkloadCard: false,
        ProjectUsersCard: false,
        TestStatusCard: false
      },
      progressObj: {},
      statisticsObj: {},
      userList: [],
      projectTestObj: {},
      isProjectTestList: false,
      fullIssuePriority: false,
      saveSelectedItem: '',
      isShowProjectSettingDialog: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device', 'services']),
    selectedProjectId() {
      return this.selectedProject.id
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    selectedProjectId() {
      this.fetchVersionList()
      this.fetchAllData()
    },
    searchData() {
      this.fetchAllData(true)
    }
  },
  beforeRouteEnter(to, from, next) {
    if (
      from.name === 'Profile' &&
      from.params.tab === 'aiSettings' &&
      to.params.tab !== 'aiTokenSettings'
    ) {
      const newTo = {
        ...to,
        params: {
          ...to.params,
          settings: true,
          tab: 'aiTokenSettings'
        }
      }
      next(newTo)
      return
    }
    next()
  },
  beforeMount() {
    if (this.$route.params.settings) {
      this.isShowProjectSettingDialog = true
    }
  },
  mounted() {
    this.fetchVersionList()
  },
  methods: {
    ...mapActions('projects', ['getProjectUserList']),
    async fetchAllData(onlyFetchIssue = false) {
      if (!this.selectedProjectId) return

      const param = {}
      if (this.searchData.selectedVersion) {
        param.version_id = this.searchData.selectedVersion
      }
      if (this.searchData.selectedExpiredStatus) {
        param.due_date_status = this.searchData.selectedExpiredStatus
      }

      if (onlyFetchIssue) {
        this.isLoading.IssueTrackingStatusCard = true
        this.isLoading.WorkloadCard = true
      } else {
        for (const key in this.isLoading) {
          this.isLoading[key] = true
        }
      }

      const fetchPromises = [
        getTrackingOverview(this.selectedProjectId, param),
        getWorkloadOverview(this.selectedProjectId, param)
      ]

      if (!onlyFetchIssue) {
        fetchPromises.push(this.getProjectUserList(this.selectedProjectId))
        if (this.services.gitlab) {
          fetchPromises.push(
            getProjectTestResultOverview(this.selectedProjectId)
          )
        }
      }

      const results = await Promise.allSettled(fetchPromises)

      if (results[0]?.status === 'fulfilled') {
        this.progressObj = results[0].value.data
      } else {
        console.error('Failed to fetch progress:', results[0]?.reason)
      }
      this.isLoading.IssueTrackingStatusCard = false

      if (results[1]?.status === 'fulfilled') {
        this.statisticsObj = results[1].value.data
      } else {
        console.error('Failed to fetch statistics:', results[1]?.reason)
      }
      this.isLoading.WorkloadCard = false

      if (!onlyFetchIssue) {
        if (results[2]?.status === 'fulfilled') {
          this.userList = results[2].value.data
        } else {
          console.error('Failed to fetch user list:', results[2]?.reason)
        }
        this.isLoading.ProjectUsersCard = false

        if (results[3]?.status === 'fulfilled') {
          this.projectTestObj = results[3].value.data
        } else {
          console.error('Failed to fetch project tests:', results[3]?.reason)
        }
        this.isLoading.TestStatusCard = false
      }
    },
    async fetchVersionList() {
      if (!this.selectedProjectId) return
      await getProjectVersion(this.selectedProjectId, { all: true }).then(
        (res) => {
          if (res.data.length > 0) {
            this.versionList = res.data
            for (const item of this.versionList) {
              const nowDate = Date.parse(new Date(Date.now()))
              const dueDate = Date.parse(new Date(item.effective_date))
              if (dueDate >= nowDate && item.status === 'open') {
                this.searchData.selectedVersion = item.id
                break
              }
            }
          }
        }
      )
      await this.fetchAllData()
    },
    async updateProjectTestList() {
      this.isProjectTestList = true
      const res = await getProjectTestResultOverview(this.selectedProjectId)
      this.projectTestObj = res.data
      this.isProjectTestList = false
    },
    showFullIssuePriority() {
      this.fullIssuePriority = true
      this.$forceUpdate()
    },
    handleSelectedItem(val) {
      this.saveSelectedItem = val
    },
    async handleCloseDialog() {
      this.isShowProjectSettingDialog = false
      await this.fetchAllData()
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile {
  ::v-deep .el-card__body {
    padding: 8px;
  }

  .row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}
</style>
