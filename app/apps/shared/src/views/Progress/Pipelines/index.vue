<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <el-input
          v-model="keyword"
          :placeholder="$t('ProgressPipelines.SearchCommitMessage')"
          :size="isMobile ? 'small' : 'medium'"
          :style="{ width: isMobile ? '150px' : '250px' }"
          prefix-icon="el-icon-search"
          @change="handleSearch"
        />
      </ProjectListSelector>
      <el-divider />
      <div class="flex justify-between items-center text-base text-info mb-2">
        <div class="text-sm ml-2">
          {{ $t('general.LastUpdateTime') }}：{{ lastUpdateTime }}
        </div>
        <el-popover trigger="click">
          <el-card
            :body-style="{ width: isMobile ? 'auto' : '460px' }"
            shadow="never"
          >
            <PipelineSettingsTable @reexecute="handleReexecute" />
          </el-card>
          <el-button
            slot="reference"
            :circle="isMobile"
            :class="!isMobile ? 'link-text-color' : ''"
            :type="!isMobile ? 'text' : 'primary'"
            icon="el-icon-s-tools"
            size="medium"
            style="padding: 5px"
          >
            <span v-if="!isMobile">
              {{ $t('ProgressPipelines.PipeLineSettings') }}
            </span>
          </el-button>
        </el-popover>
      </div>
      <div v-if="isExecuteLoad" class="notification-warning">
        <em class="el-icon-loading text-warning mr-1"></em>
        <span class="text-sm">
          {{ $t('ProgressPipelines.ExecuteLoadingText') }}
        </span>
      </div>
      <ElTableResponsive
        v-loading="isLoading || (listQuery.page > 1 && isSecondLoading)"
        :columns="tableColumns"
        :data="pagedTableData"
        :element-loading-text="$t('Loading')"
        fit
      >
        <template #status="{ row }">
          <el-tag
            :type="row.status.toLowerCase()"
            class="mt-1"
            effect="dark"
            size="small"
          >
            {{ upperCaseFirstLetter(row.status) }}
          </el-tag>
          <div>
            {{ `(${row.jobs.success || 0}/${row.jobs.total})` }}
            <em
              v-if="row.warnings"
              class="el-icon-warning-outline text-warning"
            ></em>
            <em
              v-else
              :class="row.status === 'SUCCESS' ? 'text-success' : ''"
              class="el-icon-circle-check"
            ></em>
          </div>
        </template>
        <template #branch="{ row }">
          <div>
            {{ row.ref }}
          </div>
          <el-link
            :href="row.commit.web_url"
            class="font-code"
            style="font-size: 16px"
            target="_blank"
            type="primary"
          >
            <em class="ri-git-commit-line"></em>
            {{ row.commit.short_id }}
          </el-link>
        </template>
        <template #commit_message="{ row }">
          <div class="text-sm font-bold">
            {{ row.commit.title }}
          </div>
        </template>
        <template #actions="{ row }">
          <el-tooltip
            :content="$t('PipeLines.ExecuteDetail')"
            placement="bottom"
          >
            <em
              class="ri-terminal-box-line primary table-button"
              @click="handleDetails(row)"
            ></em>
          </el-tooltip>
          <el-tooltip
            v-if="isAllowStop(row.status)"
            :content="$t('general.Stop')"
            placement="bottom"
          >
            <em
              class="ri-stop-circle-line warning table-button"
              @click="handleActions(row, 'stop')"
            ></em>
          </el-tooltip>
          <el-tooltip
            v-else-if="
              !isAllowStop(row.status) &&
                row.id === lastData.id &&
                listQuery.page === 1
            "
            :content="$t('general.Rerun')"
            placement="bottom"
          >
            <em
              class="ri-refresh-line success table-button"
              @click="handleActions(row, 'rerun')"
            ></em>
          </el-tooltip>
          <el-tooltip
            v-show="row.commit.short_id"
            :content="$t('PipeLines.Report')"
            placement="bottom"
          >
            <em
              :class="row.status === 'SUCCESS' ? 'primary' : 'disabled'"
              class="ri-survey-line primary table-button"
              @click="handleTestReport(row)"
            ></em>
          </el-tooltip>
        </template>
      </ElTableResponsive>
      <Pagination
        :layout="paginationLayout"
        :limit="listQuery.limit"
        :page="listQuery.page"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        :total="listQuery.total"
        @pagination="onPagination"
      />
      <TestDetail ref="testDetail" :pipeline-infos="focusPipeline" />
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { executePipeline, getPipelines } from '@/api_v3/gitlab'
import CancelRequest from '@/mixins/CancelRequest'
import PipelineSettingsTable from './components/PipelineSettingsTable'
import TestDetail from '@shared/views/Progress/Pipelines/components/TestDetail'
import { getLocalTime } from '@shared/utils/handleTime'

const listQuery = () => ({
  page: 1,
  limit: 10,
  total: 0
})

export default {
  name: 'Pipelines',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    Pagination: () => import('@/components/Pagination'),
    PipelineSettingsTable,
    TestDetail,
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [CancelRequest],
  data() {
    return {
      isLoading: false,
      isSecondLoading: false,
      isUpdating: false,
      listData: [],
      originalData: [],
      listQuery: listQuery(),
      timer: null,
      keyword: '',
      focusPipeline: {
        id: null,
        commitMessage: ''
      },
      lastUpdateTime: '-',
      isExecuteLoad: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'selectedProjectId', 'userId', 'device']),
    selectedRepositoryId() {
      return this.selectedProject.repository_id
    },
    lastData() {
      return this.listData[0]
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    upperCaseFirstLetter() {
      return (str) => str.charAt(0) + str.slice(1).toLowerCase()
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
          label: `${this.$t('general.Status')} / ${this.$t(
            'ProgressPipelines.TestItems'
          )}`,
          prop: 'status',
          align: 'center',
          width: '170',
          slot: 'status'
        },
        {
          label: `${this.$t('ProgressPipelines.Branch')} / ${this.$t(
            'ProgressPipelines.Commit'
          )}`,
          prop: 'branch',
          align: 'center',
          width: '160',
          slot: 'branch'
        },
        {
          label: `${this.$t('ProgressPipelines.CommitMessage')} / ${this.$t(
            'ProgressPipelines.TransitioningMessage'
          )}`,
          prop: 'commit_message',
          headerAlign: 'center',
          minWidth: '300',
          slot: 'commit_message'
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'updated_at',
          align: 'center',
          width: '140',
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          width: '130',
          slot: 'actions',
          fixed: this.isMobile ? false : 'right'
        }
      ]
    },
    pagedTableData() {
      return this.listData.slice(
        this.listQuery.limit * this.listQuery.page - this.listQuery.limit,
        this.listQuery.limit * this.listQuery.page
      )
    }
  },
  watch: {
    selectedProject() {
      this.listQuery = listQuery()
      this.keyword = ''
      this.loadData()
    }
  },
  beforeDestroy() {
    this.clearTimer()
    this.cancelRequest()
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      if (this.selectedRepositoryId) {
        this.isLoading = true
        await this.fetchData().finally(() => (this.isLoading = false))
      }
    },
    async fetchData(refetch) {
      this.isUpdating = true
      let data = []
      const params = {}
      params.first = 10
      if (this.isUpdating) this.cancelRequest()
      await getPipelines(this.selectedRepositoryId, params, {
        cancelToken: this.cancelToken
      })
        .then((res) => {
          if (refetch) {
            data = this.filterNewData(res.data.result)
            this.originalData = data.concat(this.originalData)
            this.handleSearch(this.keyword, true)
          } else {
            this.originalData = res.data.result
            this.listData = this.originalData
            // get the rest of the data
            if (res.data.page_info.has_next_page) {
              this.isSecondLoading = true
              getPipelines(
                this.selectedRepositoryId,
                {
                  after: res.data.page_info.end_cursor
                },
                {
                  cancelToken: this.cancelToken
                }
              ).then((res) => {
                this.originalData = this.originalData.concat(res.data.result)
                this.listData = this.originalData
                this.isSecondLoading = false
              })
            }
          }
          this.listQuery.total =
            res.data.page_info.total > 100 ? 100 : res.data.page_info.total
          this.lastUpdateTime = getLocalTime(res.datetime)
          this.isExecuteLoad = false
          if (this.listData.length > 0 && this.listQuery.page === 1) {
            this.setTimer(10000)
          }
        })
        .finally(() => (this.isUpdating = false))
    },
    filterNewData(res) {
      let data = []
      res.forEach((item) => {
        const index = this.originalData.findIndex((i) => i.id === item.id)
        if (index !== -1) {
          this.originalData.splice(index, 1, item)
        } else {
          data.push(item)
        }
      })
      if (data.length > 0) {
        data = data.sort((a, b) => Number(b.id) - Number(a.id))
      }
      return data
    },
    async onPagination(query) {
      this.listQuery.page = query.page
      this.listQuery.limit = query.limit
      this.clearTimer()
      if (this.listQuery.page === 1) {
        this.setTimer(10000)
      }
    },
    handleSearch(value, skip) {
      this.keyword = value
      this.listData = this.originalData.filter((item) =>
        item.commit.title.toLowerCase().includes(value.toLowerCase())
      )
      this.listQuery.total = this.listData.length
      if (!skip) this.listQuery.page = 1
    },
    handleDetails(row) {
      const { id, commit_message } = row
      this.focusPipeline.id = id
      this.focusPipeline.commitMessage = commit_message
      this.$refs.testDetail.pipelinesExecRun = id
      this.$refs.testDetail.fetchStages()
    },
    async handleActions(row, action) {
      const { id, ref } = row
      const data = {
        pipeline_id: Number(id),
        action
      }
      this.isLoading = true
      await executePipeline(this.selectedRepositoryId, data)
        .then(() => {
          this.isLoading = false
          this.handleReexecute()
        })
        .catch((err) => {
          this.isLoading = false
          return err
        })
    },
    isAllowStop(status) {
      const allowStatus = [
        'CREATED',
        'PENDING',
        'PREPARING',
        'RUNNING',
        'WAITING_FOR_RESOURCE'
      ]
      return allowStatus.includes(status)
    },
    handleReexecute() {
      this.clearTimer()
      this.isExecuteLoad = true
      this.listQuery.page = 1
      this.setTimer(3000)
    },
    handleTestReport(row) {
      const { id, commit, ref: commitBranch, started_at: startedAt } = row
      this.$router.push({
        name: 'TestReportParent',
        params: {
          commitId: commit.short_id,
          commitBranch,
          projectId: this.selectedProject.id,
          startedAt
        },
        query: {
          pipeline_id: id
        }
      })
    },
    setTimer(ms) {
      this.clearTimer()
      this.timer = window.setTimeout(() => this.fetchData(true), ms)
    },
    clearTimer() {
      window.clearTimeout(this.timer)
      this.timer = null
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
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

::v-deep .el-skeleton__item {
  width: 100%;
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

.v-enter-active {
  transition: opacity 1s ease;
}

.v-enter {
  opacity: 0;
}

.v-enter-to {
  opacity: 1;
}
</style>
