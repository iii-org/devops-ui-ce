<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <el-input
          v-model="keyword"
          :size="isMobile ? 'small' : 'medium'"
          :style="{ width: isMobile ? '150px' : '250px' }"
          prefix-icon="el-icon-search"
          :placeholder="$t('ProgressPipelines.SearchCommitMessage')"
        />
      </ProjectListSelector>
      <el-divider />
      <div class="flex justify-between items-center text-base text-info mb-2">
        <div class="text-sm ml-2">{{ $t('general.LastUpdateTime') }}：{{ lastUpdateTime }}</div>
        <el-popover trigger="click">
          <el-card shadow="never" :body-style="{ width: isMobile ? 'auto' : '460px' }">
            <PipelineSettingsTable @reexecute="handleReexecute" />
          </el-card>
          <el-button
            slot="reference"
            size="medium"
            icon="el-icon-s-tools"
            style="padding: 5px"
            :class="!isMobile ? 'link-text-color' : ''"
            :type="!isMobile ? 'text' : 'primary'"
            :circle="isMobile"
          >
            <span v-if="!isMobile">{{ $t('ProgressPipelines.PipeLineSettings') }}</span>
          </el-button>
        </el-popover>
      </div>
      <div v-if="isExecuteLoad" class="notification-warning">
        <em class="el-icon-loading text-warning mr-1" />
        <span class="text-sm">{{ $t('ProgressPipelines.ExecuteLoadingText') }}</span>
      </div>
      <ElTableResponsive
        v-loading="isLoading"
        :element-loading-text="$t('Loading')"
        :data="filteredData"
        :columns="tableColumns"
        fit
      >
        <template v-slot:status="{ row }">
          <el-tag class="mt-1" size="small" effect="dark" :type="row.execution_state.toLowerCase()">
            {{ row.execution_state }}
          </el-tag>
          <div>
            {{ `(${row.status.success}/${row.status.total})` }}
            <em class="el-icon-circle-check" :class="row.status.success === row.status.total ? 'text-success' : ''" />
          </div>
        </template>
        <template v-slot:branch="{ row }">
          <div>
            {{ row.commit_branch }}
          </div>
          <el-link type="primary" target="_blank" style="font-size: 16px" :href="row.commit_url">
            <svg-icon class="mr-1" icon-class="ion-git-commit-outline" />
            {{ row.commit_id }}
          </el-link>
        </template>
        <template v-slot:commit_message="{ row }">
          <div class="text-sm font-bold">{{ row.commit_message }}</div>
          <div>{{ row.transitioning_message }}</div>
        </template>
        <template v-slot:actions="{ row }">
          <el-tooltip :content="$t('PipeLines.ExecuteDetail')" placement="bottom">
            <em class="ri-terminal-box-line primary table-button" @click="onDetailsClick(row)" />
          </el-tooltip>
          <el-tooltip v-if="isAllowStop(row.execution_state)" :content="$t('general.Stop')" placement="bottom">
            <em class="ri-stop-circle-line warning table-button" @click="onActionClick(row, 'stop')" />
          </el-tooltip>
          <el-tooltip
            v-else-if="!isAllowStop(row.execution_state) && row.id === lastData.id"
            :content="$t('general.Rerun')"
            placement="bottom"
          >
            <em class="ri-refresh-line success table-button" @click="onActionClick(row, 'rerun')" />
          </el-tooltip>
          <el-tooltip v-show="row.commit_id" :content="$t('PipeLines.Report')" placement="bottom">
            <span>
              <em
                class="ri-survey-line primary table-button"
                :class="row.execution_state === 'Finished' ? 'primary' : 'disabled'"
                @click="handleToTestReport(row)"
              />
            </span>
          </el-tooltip>
        </template>
      </ElTableResponsive>
      <Pagination
        :total="listQuery.total"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
      <TestDetail ref="testDetail" :pipeline-infos="focusPipeline" @loaded="isLoading = false" />
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { changePipelineByAction, getPipelines } from '@/api/cicd'
import { CancelRequest } from '@/mixins'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'
import { getLocalTime } from '@shared/utils/handleTime'
import { Pagination } from '@/components'
import PipelineSettingsTable from '@/views/Plan/Settings/components/PipelineSettingsTable'
import TestDetail from './components/TestDetail'

const listQuery = () => ({
  page: 1,
  limit: 10,
  total: 0,
  start: 0
})

export default {
  name: 'Pipelines',
  components: {
    ProjectListSelector,
    Pagination,
    PipelineSettingsTable,
    TestDetail,
    ElTableResponsive
  },
  mixins: [CancelRequest],
  data() {
    return {
      isLoading: false,
      isUpdating: false,
      rowHeight: 90,
      lastUpdateTime: '-',
      timer: null,
      focusPipeline: {
        id: null,
        commitMessage: ''
      },
      listData: [],
      listQuery: listQuery(),
      searchKeys: ['commit_message'],
      keyword: '',
      isExecuteLoad: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'selectedProjectId', 'userId', 'device']),
    filteredData() {
      const { listData, searchKeys } = this
      const keyword = this.keyword.toLowerCase()
      return listData.filter((data) => {
        let result = false
        for (const key of searchKeys) {
          const columnValue = data[key].toLowerCase()
          result = result || columnValue.includes(keyword)
          if (result) break
        }
        return result
      })
    },
    selectedRepositoryId() {
      return this.selectedProject.repository_ids[0]
    },
    lastData() {
      return this.listData[0]
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('ProgressPipelines.Id'),
          prop: 'id',
          width: '120',
          align: 'center'
        },
        {
          label: `${this.$t('general.Status')} / ${this.$t('ProgressPipelines.TestItems')}`,
          prop: 'status',
          align: 'center',
          width: '170',
          slot: 'status'
        },
        {
          label: `${this.$t('ProgressPipelines.Branch')} / ${this.$t('ProgressPipelines.Commit')}`,
          prop: 'branch',
          align: 'center',
          width: '160',
          slot: 'branch'
        },
        {
          label: `${this.$t('ProgressPipelines.CommitMessage')} / ${this.$t('ProgressPipelines.TransitioningMessage')}`,
          prop: 'commit_message',
          headerAlign: 'center',
          minWidth: '300',
          slot: 'commit_message'
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: process.env.VUE_APP_PROJECT === 'SSO' ? 'last_test_time' : 'updated_at',
          align: 'center',
          width: '140',
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          width: '130',
          slot: 'actions'
        }
      ]
    }
  },
  watch: {
    selectedProject() {
      this.listQuery = listQuery()
      this.searchData = ''
      this.loadData()
    },
    keyword() {
      this.listQuery.page = 1
    }
    // isUpdating() {
    //   this.triggerReport()
    // }
  },
  mounted() {
    this.loadData()
  },
  beforeDestroy() {
    this.clearTimer()
  },
  methods: {
    // triggerReport() {
    //   this.listData.forEach((item, index) => {
    //     if (item.status.success > 0) {
    //       triggerReport(this.selectedProject, this.listData[index].commit_id)
    //     }
    //   })
    // },
    onPagination(query) {
      this.listQuery.start = query.limit * query.page - query.limit
      this.listQuery.page = query.page
      this.listQuery.limit = query.limit
      this.loadData()
    },
    async loadData() {
      if (this.selectedProjectId === -1) return
      this.isLoading = true
      await this.fetchData()
    },
    async fetchData() {
      this.clearTimer()
      if (this.isUpdating) this.cancelRequest()
      this.isUpdating = true
      await getPipelines(
        this.selectedRepositoryId,
        { limit: this.listQuery.limit, start: this.listQuery.start },
        { cancelToken: this.cancelToken }
      ).then(async (res) => {
        this.lastUpdateTime = getLocalTime(res.datetime)
        await this.updatePipeExecs(res.data)
        if (res.data) {
          const { per_page, current, total } = res.data.pagination
          this.listQuery = { limit: per_page, total, page: current }
          if (this.listQuery.page === 1) this.setTimer(10000)
        }
        this.isUpdating = false
        this.isLoading = false
        this.isExecuteLoad = false
      })
    },
    updatePipeExecs(resData) {
      if (resData?.pipe_execs.length > 0) {
        this.listData = resData.pipe_execs.map((item) => {
          const result = { ...item }
          if (result.execution_state === 'Success') {
            result.execution_state = 'Finished'
          }
          return result
        })
      } else {
        this.listData = []
      }
    },
    async onActionClick(row, action) {
      const { id, commit_branch } = row
      const data = {
        pipelines_exec_run: id,
        action,
        branch: commit_branch
      }
      if (action === 'stop') delete data.branch
      this.isLoading = true
      await changePipelineByAction(this.selectedRepositoryId, data)
        .then(() => {
          this.isLoading = false
          this.handleReexecute()
        })
        .catch((err) => {
          this.isLoading = false
          return err
        })
    },
    onDetailsClick(row) {
      const { id, commit_message } = row
      this.isLoading = true
      this.focusPipeline.id = id
      this.focusPipeline.commitMessage = commit_message
      this.$refs.testDetail.pipelinesExecRun = id
      this.$refs.testDetail.fetchStages()
    },
    isAllowStop(status) {
      const allowStatus = ['Created', 'Pending', 'Preparing', 'Running', 'Waiting_for_resource']
      return allowStatus.includes(status)
    },
    handleReexecute() {
      this.isExecuteLoad = true
      this.listQuery.page = 1
      this.setTimer(3000)
    },
    setTimer(ms) {
      this.clearTimer()
      this.timer = window.setTimeout(() => this.fetchData(), ms)
    },
    clearTimer() {
      window.clearTimeout(this.timer)
      this.timer = null
    },
    handleToTestReport(row) {
      const { id, commit_id: commitId, commit_branch: commitBranch } = row
      this.$router.push({
        name: 'TestReportParent',
        params: {
          commitId,
          commitBranch,
          projectId: this.selectedProject.id
        },
        query: {
          pipeline_id: id
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
@import 'src/styles/theme/mixin.scss';

.icon {
  font-size: x-large;
  font-weight: bolder;
  margin-right: 5px;
  color: $info;
  &.active {
    color: $active;
  }
  &.danger {
    color: $danger;
  }
  &:hover {
    color: $active;
  }
}
$tag-light-options: (
  created: $created,
  pending: $pending,
  manual: $manual,
  scheduled: $scheduled,
  skipped: $skipped,
  unknown: $unknown,
  notfound: $unknown
);
$tag-dark-options: (
  running: $running,
  finished: $success,
  passed: $passed,
  failed: $failed,
  canceled: $canceled
);
@each $key, $value in $tag-light-options {
  .el-tag--#{$key} {
    @include tag-light($value);
  }
}
@each $key, $value in $tag-dark-options {
  .el-tag--#{$key} {
    @include tag-dark($value);
  }
}
</style>
