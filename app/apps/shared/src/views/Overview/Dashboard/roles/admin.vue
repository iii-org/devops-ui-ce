<template>
  <div class="app-container">
    <div class="flex justify-between items-center mb-2">
      <div class="text-info text-sm ml-2">
        *本表每小時更新一次
        {{ $t('Dashboard.ADMIN.sync_date', [getLocalTime(status.sync_date)]) }}
      </div>
      <div>
        <el-button
          :disabled="status.is_lock"
          icon="el-icon-refresh"
          plain
          size="small"
          type="primary"
          @click="getSyncRedmine"
        >
          {{ $t('Dashboard.ADMIN.UpdateNow') }}
        </el-button>
      </div>
    </div>
    <el-row v-show="!isLoading || projectCount > 0">
      <el-col :class="isMobile ? 'mobile' : ''">
        <el-row :gutter="12" class="flex-wrap" type="flex">
          <el-col v-if="status.is_lock">
            <el-alert :closable="false" class="mb-4 loading" type="warning">
              <h2 slot="title">
                <em class="el-icon-loading"></em>
                {{ $t('Dashboard.ADMIN.syncing') }}
              </h2>
            </el-alert>
          </el-col>
          <el-col
            :md="
              frontendProject === 'LITE'
                ? !services.gitlab
                  ? 24
                  : 12
                : userRole === 'QA' || !services.gitlab
                  ? 12
                  : 10
            "
            :sm="24"
            :xs="24"
          >
            <el-card class="overview">
              <template slot="header">
                <span class="font-bold">
                  {{ $t('Dashboard.ADMIN.Overview.NAME') }}
                </span>
              </template>
              <AdminOverview
                :data="getProjectOverviewData"
                @loading="getLoadingStatus"
                @total-count="getTotalCount"
              />
            </el-card>
          </el-col>
          <el-col
            v-if="frontendProject === 'SSO'"
            :md="userRole === 'QA' || !services.gitlab ? 12 : 7"
            :sm="24"
            :xs="24"
          >
            <el-card>
              <div
                slot="header"
                class="cursor-pointer"
                @click="dialogVisible.projectMember = true"
              >
                <span class="font-bold">
                  {{ $t('Dashboard.ADMIN.ProjectMembers.NAME') }}
                  <em class="ri-external-link-line"></em>
                </span>
              </div>
              <AdminProjectMember
                :data="getProjectMembersData"
                :dialog-visible.sync="dialogVisible"
              />
            </el-card>
          </el-col>
          <el-col
            v-if="userRole !== 'QA' && services.gitlab"
            :md="frontendProject === 'SSO' && services.gitlab ? 7 : 12"
            :sm="24"
            :xs="24"
          >
            <el-card body-style="padding: 5px 0px !important;">
              <template slot="header">
                <span class="font-bold">
                  {{ $t('Dashboard.ADMIN.CommitLog.NAME') }}
                </span>
              </template>
              <AdminCommitLog :get-data="getGitCommitLogData" />
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="12" class="flex-wrap" type="flex">
          <el-col
            :md="services.gitlab || frontendProject !== 'SSO' ? 12 : 24"
            :sm="24"
            :xs="24"
          >
            <el-card>
              <template slot="header">
                <span class="font-bold">
                  {{ $t('Dashboard.ADMIN.IssueRank.NAME') }}
                </span>
              </template>
              <AdminIssueRank :data="getIssueRankData" />
            </el-card>
          </el-col>
          <el-col :md="12" :sm="24" :xs="24">
            <el-card v-if="frontendProject === 'SSO' && services.gitlab">
              <div
                slot="header"
                class="cursor-pointer"
                @click="dialogVisible.passingRate = true"
              >
                <span class="font-bold">
                  {{ $t('Dashboard.ADMIN.PassingRate.NAME') }}
                  <em class="ri-external-link-line"></em>
                </span>
              </div>
              <AdminPassingRate
                :data="getPassingRateData"
                :dialog-visible.sync="dialogVisible"
              />
            </el-card>
            <el-card v-else-if="frontendProject === 'LITE'">
              <div
                slot="header"
                class="cursor-pointer"
                @click="dialogVisible.projectMember = true"
              >
                <span class="font-bold">
                  {{ $t('Dashboard.ADMIN.ProjectMembers.NAME') }}
                  <em class="ri-external-link-line"></em>
                </span>
              </div>
              <AdminProjectMember
                :data="getProjectMembersData"
                :dialog-visible.sync="dialogVisible"
              />
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="12" class="flex-wrap" type="flex">
          <el-col :md="24" :sm="24" :xs="24">
            <el-card>
              <div
                slot="header"
                class="cursor-pointer"
                @click="dialogVisible.projectList = true"
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold">
                    {{ $t('Dashboard.ADMIN.ProjectList.NAME') }}
                    <em class="ri-external-link-line"></em>
                  </span>
                  <span class="text-right">
                    {{
                      $t('Dashboard.ADMIN.sync_date', [
                        getLocalTime(lastUpdate)
                      ])
                    }}
                  </span>
                </div>
              </div>
              <AdminProjectList
                :data="getProjectListData"
                :dialog-visible.sync="dialogVisible"
                @update="getLastUpdate"
              />
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <div v-if="isLoading && projectCount <= 0">
      <el-empty :description="$t('general.NoData')">
        <el-button icon="el-icon-plus" @click="handleAdding">
          {{ $t('Project.AddProject') }}
        </el-button>
      </el-empty>
      <CreateProjectDialog
        ref="createProjectDialog"
        @update="$router.push({ name: 'ProjectList' })"
      />
    </div>
  </div>
</template>

<script>
import {
  getGitCommitLog,
  getIssueRank,
  getPassingRate,
  getProjectList,
  getProjectMembers,
  getProjectOverview,
  getSyncRedmine,
  getSyncRedmineStatus
} from '@/api/dashboard'
import { getLocalTime } from '@shared/utils/handleTime'
import { mapGetters } from 'vuex'

const overview = {
  projects: { class: 'primary', database: '' },
  overdue: { class: 'danger', database: 'overdue' },
  not_started: { class: 'info', database: 'not_started' }
}
const commitLimit = 10
const refreshCommitLog = 300000 // ms

export default {
  name: 'DashboardAdmin',
  components: {
    AdminCommitLog: () => import('../components/AdminCommitLog'),
    AdminOverview: () => import('../components/AdminOverview'),
    AdminIssueRank: () => import('../components/AdminIssueRank'),
    AdminProjectMember: () => import('../components/AdminProjectMember'),
    AdminProjectList: () => import('../components/AdminProjectList'),
    AdminPassingRate: () => import('../components/AdminPassingRate'),
    CreateProjectDialog: () =>
      import('../../ProjectList/components/CreateProjectDialog')
  },
  data() {
    return {
      isLoading: true,
      lastUpdate: '',
      projectCount: 0,
      overview: [],
      gitCommitLog: [],
      requestGitLabLastTime: null,
      status: { is_lock: false, sync_date: '' },
      dialogVisible: {
        projectMember: false,
        passingRate: false,
        projectList: false
      }
    }
  },
  computed: {
    ...mapGetters(['userRole', 'device', 'services']),
    isMobile() {
      return this.device === 'mobile'
    },
    frontendProject() {
      return import.meta.env.VITE_APP_PROJECT
    }
  },
  watch: {
    gitCommitLog: {
      deep: true,
      async handler() {
        if (!this.requestGitLabLastTime) {
          this.requestGitLabLastTime = new Date().valueOf()
        }
        await this.sleep(refreshCommitLog)
        const nowTime = new Date().valueOf()
        const gap = nowTime - this.requestGitLabLastTime
        if (gap >= refreshCommitLog) {
          this.gitCommitLog = await this.getGitCommitLogData()
        }
      }
    }
  },
  mounted() {
    this.initDashboard()
    this.loadSyncStatus()
  },
  methods: {
    async initDashboard() {
      if (this.services.gitlab) {
        this.gitCommitLog = await this.getGitCommitLogData()
      }
    },
    async getSyncRedmine() {
      this.status.is_lock = true
      await getSyncRedmine()
      await this.sleep(1000)
      await this.loadSyncStatus()
    },
    async loadSyncStatus() {
      await this.getSyncStatus()
      if (!this.status.is_lock) {
        if (this.intervalTimer) {
          window.clearInterval(this.intervalTimer)
          this.intervalTimer = null
        }
      } else if (!this.intervalTimer) {
        this.intervalTimer = window.setInterval(this.loadSyncStatus, 5000)
      }
      return Promise.resolve()
    },
    async getSyncStatus() {
      try {
        const res = await getSyncRedmineStatus()
        this.status = res.data
        return Promise.resolve(res.data)
      } catch (e) {
        console.error(e)
        return Promise.reject(e)
      }
    },
    async getProjectOverviewData() {
      const res = await getProjectOverview()
      const result = []
      res.data.forEach((item) => {
        result.push({
          ...item,
          class: overview[item['project_status']]['class'],
          database: overview[item['project_status']]['database']
        })
      })
      return Promise.resolve(result)
    },
    async getProjectMembersData() {
      const res = await getProjectMembers()
      return Promise.resolve(res.data)
    },
    async getGitCommitLogData() {
      const params = { show_commit_rows: commitLimit }
      const res = await getGitCommitLog(params)
      res.data.forEach((item, index) => {
        item['id'] = index
        item['commit_time'] = getLocalTime(item['commit_time'])
      })
      return Promise.resolve(res.data)
    },
    async getIssueRankData() {
      const res = await getIssueRank()
      return Promise.resolve(res.data)
    },
    async getPassingRateData() {
      const res = await getPassingRate()
      const result = res.data.map((item) => ({
        name: item['project_name'],
        value: [item['total'], item['passing_rate'] * 100, item['count']]
      }))
      return Promise.resolve(result)
    },
    async getProjectListData() {
      const res = await getProjectList()
      return Promise.resolve(res.data)
    },
    getLastUpdate(value) {
      this.lastUpdate = value
    },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
    getLocalTime(value) {
      return getLocalTime(value)
    },
    handleAdding() {
      this.$refs.createProjectDialog.showDialog = true
    },
    getTotalCount(value) {
      this.projectCount = value.count
    },
    dingStatus(value) {
      this.isLoading = value
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
@import 'element-ui/lib/theme-chalk/display.css';

.overview {
  height: 90%;

  ::v-deep .el-row {
    height: 100%;

    .el-col {
      margin-bottom: 0;
    }
  }
}

::v-deep .el-dialog {
  width: 80%;

  &__header {
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
  }
}

::v-deep .el-col {
  margin-bottom: 12px;
}

::v-deep .el-card {
  height: 100%;

  .el-card__body {
    height: 85%;
  }
}

::v-deep .items-center {
  text-align: center;
}

.chart {
  height: 100%;
  min-height: 250px;
}

::v-deep .el-table {
  .danger-row {
    background: $danger-4;
  }
}

.mobile {
  ::v-deep .el-card__body,
  ::v-deep .el-card__header {
    padding: 5px;
  }

  ::v-deep .el-card__header {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  ::v-deep .el-dialog__body,
  ::v-deep .el-dialog__header {
    padding: 10px;
  }
}
</style>
