<template>
  <div
    id="project-overview"
    v-loading="isLoading"
    :element-loading-text="$t('Loading')"
    class="app-container"
    :class="isMobile ? 'mobile' : ''"
    :gutter="10"
  >
    <el-backtop target="#project-overview" />
    <ProjectListSelector>
      <el-row slot="button">
        <el-col>
          <el-button
            icon="el-icon-s-tools"
            size="medium"
            class="button-primary"
            @click.native="isShowProjectSettingDialog = !isShowProjectSettingDialog"
          >
            <span v-if="!isMobile">{{ $t('general.ProjectSettings') }}</span>
          </el-button>
        </el-col>
      </el-row>
      <SearchFilter
        :version-list="versionList"
        :is-loading="isLoading"
        :search-data.sync="searchData"
      />
    </ProjectListSelector>
    <el-divider />
    <el-row class="row" :gutter="12">
      <el-col :xs="24" :md="12">
        <IssueTrackingStatusCard
          ref="issueStatus"
          :progress-obj="progressObj"
        />
      </el-col>
      <el-col :xs="24" :md="12">
        <WorkloadCard
          ref="issuePriority"
          :statistics-obj="statisticsObj"
          @emitSelectedItem="handleSelectedItem"
          @showFullIssuePriority="showFullIssuePriority"
        />
      </el-col>
    </el-row>
    <el-row class="row" :gutter="12">
      <el-col :xs="24" :md="12">
        <ProjectUsersCard
          ref="projectUserList"
          :user-list="userList"
          @onUpdate="fetchAllData"
        />
      </el-col>
      <el-col :xs="24" :md="12">
        <TestStatusCard
          ref="testStatus"
          :is-loading="isProjectTestList"
          :project-test-obj="projectTestObj"
          @update="updateProjectTestList"
        />
      </el-col>
    </el-row>
    <el-dialog
      :visible.sync="fullIssuePriority"
      top="5vh"
      :width="isMobile ? '95%' : '75%'"
    >
      <WorkloadCard
        :statistics-obj="statisticsObj"
        :save-selected-item="saveSelectedItem"
      />
    </el-dialog>
    <el-dialog
      :visible.sync="isShowProjectSettingDialog"
      top="5vh"
      :width="isMobile ? '95%' : '75%'"
      destroy-on-close
      @close="handleCloseDialog"
    >
      <ProjectSettingsDialog
        @handleCloseDialog="handleCloseDialog"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import {
  getProjectVersion,
  getProjectIssueProgress,
  getProjectIssueStatistics,
  getProjectTest
} from '@/api/projects'
import { ProjectListSelector } from '@shared/components'
import {
  IssueTrackingStatusCard,
  WorkloadCard,
  ProjectUsersCard,
  TestStatusCard,
  SearchFilter,
  ProjectSettingsDialog
} from './components'

export default {
  name: 'ProjectOverview',
  components: {
    ProjectListSelector,
    IssueTrackingStatusCard,
    WorkloadCard,
    ProjectUsersCard,
    TestStatusCard,
    SearchFilter,
    ProjectSettingsDialog
  },
  data() {
    return {
      versionList: [],
      searchData: {
        selectedVersion: '',
        selectedExpiredStatus: ''
      },
      isLoading: false,
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
    ...mapGetters(['userProjectList', 'selectedProject', 'device']),
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
      this.fetchAllData()
    }
  },
  mounted() {
    this.fetchVersionList()
  },
  methods: {
    ...mapActions('projects', ['getProjectUserList']),
    async fetchAllData() {
      if (this.selectedProjectId < 0) return
      const param = {}
      if (this.searchData.selectedVersion) {
        param.fixed_version_id = this.searchData.selectedVersion
      }
      if (this.searchData.selectedExpiredStatus) {
        param.due_date_status = this.searchData.selectedExpiredStatus
      }
      this.isLoading = true
      const res = await Promise.allSettled([
        getProjectIssueProgress(this.selectedProjectId, param),
        getProjectIssueStatistics(this.selectedProjectId, param),
        this.getProjectUserList(this.selectedProjectId),
        getProjectTest(this.selectedProjectId)
      ])
      const [progressObj, statisticsObj, userList, projectTestObj] = res.map((item) => item.value.data)
      this.progressObj = progressObj
      this.statisticsObj = statisticsObj
      this.userList = userList.user_list
      this.projectTestObj = projectTestObj.test_results
      this.isLoading = false
    },
    async fetchVersionList() {
      if (this.selectedProjectId < 0) return
      const res = await getProjectVersion(this.selectedProjectId)
      const hasVersion = res.data.versions.length > 0
      if (hasVersion) {
        this.versionList = res.data.versions
        for (const item of this.versionList) {
          const nowDate = Date.parse(new Date(Date.now()))
          const dueDate = Date.parse(new Date(item.due_date))
          if (dueDate >= nowDate && item.status === 'open') {
            this.searchData.selectedVersion = item.id
            break
          }
        }
      } else {
        this.versionList = []
      }
      this.fetchAllData()
    },
    async updateProjectTestList() {
      this.isProjectTestList = true
      const res = await getProjectTest(this.selectedProjectId)
      this.projectTestObj = res.data.test_results
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
