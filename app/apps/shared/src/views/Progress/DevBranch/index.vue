<template>
  <div class="app-container">
    <ProjectListSelector>
      <el-input
        v-model="keyword"
        :placeholder="$t('ProcessDevBranch.SearchBranch')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? '150px' : '250px' }"
        prefix-icon="el-icon-search"
      />
    </ProjectListSelector>
    <el-divider />
    <ElTableResponsive
      ref="table"
      v-loading="listLoading"
      :columns="tableColumns"
      :data="pagedData"
      :element-loading-text="$t('Loading')"
      fit
      row-key="name"
      @expand-change="onExpandChange"
    >
      <template #branch="{ row }">
        <span v-if="row.name === defaultBranch">{{ row.name }}(default)</span>
        <span v-else>{{ row.name }}</span>
      </template>
      <template #expand="{ row }">
        <el-skeleton
          v-if="row.timelineLoading"
          v-loading="row.timelineLoading"
        />
        <el-timeline v-else>
          <el-timeline-item
            v-for="commit in row.gitCommitLog"
            :key="commit.id"
            :hide-timestamp="true"
            class="pb-0 !important"
          >
            <el-collapse
              v-model="collapseExpandedRow"
              :class="isAbled(commit.issues) ? 'hasArrow' : 'noArrow'"
              :style="{ width: isMobile ? '100%' : '95%' }"
            >
              <el-collapse-item
                :disabled="!isAbled(commit.issues)"
                :name="commit.id"
              >
                <template slot="title">
                  <div
                    :class="
                      isAbled(commit.issues) ? 'cursor-pointer' : 'initial'
                    "
                    class="flex justify-between text-sm"
                    style="width: 95%; color: #606266"
                  >
                    <div class="truncate">
                      <el-link
                        :href="commit.commit_url"
                        class="font-code"
                        target="_blank"
                        type="primary"
                      >
                        <em class="ri-git-commit-line"></em>
                        {{ commit.short_id }}
                      </el-link>
                      <span>@ {{ commit.author_name }} -</span>
                      <span
                        v-for="id in commit.issue_id"
                        :key="id"
                        class="text-primary hover-underline"
                        @click.stop="toIssueDetail(id)"
                      >
                        #{{ id }}
                      </span>
                      <el-tooltip
                        :content="commit.message"
                        class="item"
                        effect="light"
                        placement="bottom"
                      >
                        <span>&nbsp;{{ commit.title }}</span>
                      </el-tooltip>
                    </div>
                    <div style="min-width: 90px">
                      <el-tooltip
                        :content="getLocalTime(commit.committed_date)"
                        effect="light"
                        placement="bottom"
                      >
                        <span>
                          {{ getRelativeTime(commit.committed_date) }}
                        </span>
                      </el-tooltip>
                    </div>
                    <div @click.stop>
                      <el-button
                        circle
                        icon="ri-link"
                        size="mini"
                        @click="handleCommitHook($event, commit)"
                      />
                    </div>
                  </div>
                </template>
                <section>
                  <ul
                    v-for="issue in commit.issues"
                    :key="issue.id"
                    @click="toIssueDetail(issue.id)"
                  >
                    <li v-show="issue" class="cursor-pointer truncate">
                      <span class="text-primary"> #{{ issue.id }} </span>
                      <Status
                        v-if="issue.status.name"
                        :name="$t(`Issue.${issue.status.name}`)"
                        :type="issue.status.name"
                        class="ml-1"
                        size="mini"
                      />
                      <el-tag
                        v-if="issue.assigned?.full_name"
                        class="ml-1"
                        effect="dark"
                        size="mini"
                        type="info"
                      >
                        {{ issue.assigned.full_name }}
                      </el-tag>
                      <span class="ml-1">
                        {{ issue.subject }}
                      </span>
                    </li>
                  </ul>
                </section>
              </el-collapse-item>
            </el-collapse>
          </el-timeline-item>
          <div
            :class="isMobile ? '' : ' w-75'"
            class="flex justify-center mt-2"
          >
            <el-button
              icon="el-icon-bottom"
              plain
              round
              size="mini"
              type="primary"
              @click="toGitlab()"
            >
              {{ $t('LoadMore') }}
            </el-button>
          </div>
        </el-timeline>
      </template>
      <template #commit="{ row }">
        <el-link
          :href="row.commit.commit_url"
          class="font-code"
          target="_blank"
          type="primary"
        >
          <em class="ri-git-commit-line"></em>
          {{ row.commit.short_id }}
        </el-link>
      </template>
    </ElTableResponsive>
    <Pagination
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="filteredData.length"
      @pagination="onPagination"
    />
    <CommitHookDialog ref="commitHook" @update="handleCommitHookUpdate" />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { getCommitHooksByBranch } from '@/api_v3/gitlab'
import { getIssueDetails } from '@/api_v3/issues'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'

const commitLimit = 10

export default {
  name: 'ProgressDevBranch',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    Status: () => import('@/components/Issue/Status'),
    ElTableResponsive: () => import('@shared/components/ElTableResponsive'),
    CommitHookDialog: () => import('./componenets/CommitHookDialog.vue')
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      branchList: [],
      gitCommitLog: [],
      collapseExpandedRow: [],
      expandedRow: [],
      currentExpandedRowIdx: 0
    }
  },
  computed: {
    ...mapGetters(['branchesByProject', 'defaultBranch', 'device']),
    getRelativeTime() {
      return (time) => getRelativeTime(time)
    },
    getLocalTime() {
      return (time) => {
        return getLocalTime(time)
      }
    },
    isAbled() {
      return (commitIssues) => commitIssues && commitIssues.length > 0
    },
    tableExpand() {
      return {
        expandedRow: this.expandedRow,
        collapseExpandedRow: this.collapseExpandedRow
      }
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: '',
          prop: 'expand',
          slot: 'expand',
          type: 'expand'
        },
        {
          label: this.$t('ProcessDevBranch.Branch'),
          prop: 'name',
          minWidth: 150,
          align: 'center',
          slot: 'branch'
        },
        {
          label: this.$t('general.Description'),
          prop: 'commit.message',
          minWidth: 160,
          align: 'center'
        },
        {
          label: this.$t('ProcessDevBranch.Commit'),
          prop: 'commit.short_id',
          minWidth: 120,
          align: 'center',
          slot: 'commit'
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'commit.committed_date',
          minWidth: 170,
          align: 'center',
          type: 'time'
        }
      ]
    }
  },
  watch: {
    // selectedProject: {
    //   handler() {
    //     this.initTableExpand()
    //   },
    //   deep: true
    // },
    branchesByProject: {
      handler(ary) {
        this.branchList = JSON.parse(JSON.stringify(ary))
        this.getStoredData()
      },
      deep: true
    },
    listLoading(val) {
      if (!val) this.getStoredData()
    },
    tableExpand: {
      handler(val) {
        this.setTableExpand(val)
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('branches', ['getBranchesByProject']),
    ...mapActions('projects', ['getTableExpand', 'setTableExpand']),
    async getStoredData() {
      const storedData = await this.getTableExpand()
      const { expandedRow, collapseExpandedRow } = storedData
      if (expandedRow === undefined && collapseExpandedRow === undefined) return
      const rowIndex = this.branchList.findIndex(
        (list) => list.name === expandedRow[0]
      )
      const row = this.branchList[rowIndex]
      if (rowIndex === undefined || row === undefined) return
      this.onExpandChange(row, [row])
      this.collapseExpandedRow = collapseExpandedRow
    },
    async fetchData() {
      await this.getBranchesByProject(this.selectedRepositoryId)
      return this.branchList.sort(
        (a, b) =>
          new Date(b.commit.committed_date) - new Date(a.commit.committed_date)
      )
    },
    async onExpandChange(row, expandedRows) {
      this.handleExpanded(row, expandedRows)
      if (row.gitCommitLog || row.timelineLoading) return
      await this.fetchGitCommitLog(row)
    },
    handleExpanded(row, expandedRows) {
      this.initTableExpand()
      this.expandedRow.push(row.name)
      this.currentExpandedRowIdx = this.pagedData.findIndex(
        (item) => item.name === row.name
      )
      expandedRows.forEach((expandedRow) => {
        this.$refs.table.$refs.responsiveTable.toggleRowExpansion(
          expandedRow,
          row.name === expandedRow.name
        )
      })
    },
    initTableExpand() {
      this.expandedRow = []
      this.collapseExpandedRow = []
    },
    async fetchGitCommitLog(row) {
      this.$set(row, 'timelineLoading', true)
      this.gitCommitLog = await this.getHookByBranch(row.name)
      this.listData.forEach((item) => {
        if (item.name === row.name) item.gitCommitLog = this.gitCommitLog
      })
      this.$set(row, 'timelineLoading', false)
    },
    async getHookByBranch(branch_name) {
      const params = {
        limit: commitLimit,
        branch: branch_name
      }
      const res = await getCommitHooksByBranch(
        this.selectedRepositoryId,
        params
      )
      for (const item of res.data) {
        item['issue_id'] = item['hooked_issues']
        item['issues'] = await this.getIssue(item['issue_id'])
        item.branch_name = branch_name
      }
      return res.data
    },
    async getIssue(ids) {
      if (!ids[0]) return
      const issueData = []
      for (const id of ids) {
        const issueId = id
        const res = await getIssueDetails(issueId)
        issueData.push(res.data)
      }
      return issueData
    },
    toIssueDetail(tag) {
      const pound = new RegExp(/#/)
      const issueId = tag.toString().match(pound) ? tag.split('#')[1] : tag
      this.$router.push({ name: 'IssueDetail', params: { issueId }})
    },
    toGitlab() {
      window.open(`${this.selectedProject.git_url}/activity`, '_blank')
    },
    handleCommitHook(event, commit) {
      this.$refs.commitHook.isCommitHookShow = true
      this.$refs.commitHook.commit = commit
    },
    handleCommitHookUpdate() {
      this.fetchGitCommitLog(this.pagedData[this.currentExpandedRowIdx])
    }
  }
}
</script>

<style lang="scss" scoped>
.truncate {
  width: 75%;

  .text-info {
    pointer-events: none;
  }
}

.noArrow {
  ::v-deep .el-collapse-item__arrow {
    display: none;
  }
}

.cursor-pointer:hover {
  @apply bg-gray-100 text-primary font-bold;
}

.hover-underline:hover {
  @apply underline font-bold;
}

::v-deep {
  .el-timeline {
    padding-left: 0px;
  }

  .el-collapse-item.is-disabled .el-collapse-item__header {
    cursor: default !important;
  }
}
</style>
