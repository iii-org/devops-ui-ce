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
      :data="pagedData"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      row-key="name"
      fit
      @expand-change="onExpandChange"
    >
      <template v-slot:branch="{row}">
        <span v-if="row.name === defaultBranch">{{ row.name }}(default)</span>
        <span v-else>{{ row.name }}</span>
      </template>
      <template v-slot:expand="{row}">
        <el-skeleton
          v-if=" row.timelineLoading"
          v-loading="row.timelineLoading"
        />
        <el-timeline v-else>
          <el-timeline-item
            v-for="commit in row.gitCommitLog"
            :key="commit.id"
            class="pb-0 !important"
            :hide-timestamp="true"
          >
            <el-collapse
              v-model="collapseExpandedRow"
              :style="{width: isMobile ? '100%' : '75%'}"
              class="w-75"
              :class="isAbled(commit.issues) ? 'hasArrow' : 'noArrow'"
            >
              <el-collapse-item :name="commit.id">
                <template slot="title">
                  <div
                    :class="isAbled(commit.issues) ? 'cursor-pointer' : 'initial'"
                    class="flex justify-between text-sm"
                    style="width: 95%; color: #606266;"
                  >
                    <div class="truncate">
                      <el-link
                        type="primary"
                        target="_blank"
                        :href="commit.gitlab_url"
                      >
                        <svg-icon
                          class="mr-1"
                          icon-class="ion-git-commit-outline"
                        />
                        {{ commit.commit_short_id }}
                      </el-link>
                      <span>@ {{ commit.author_name }} -</span>
                      <span
                        v-for="id in commit.issue_id"
                        :key="id"
                        :class="commit.issue_hook[id.split('#')[1]] ? 'text-primary hover-underline' : 'text-info'"
                        @click.stop="toIssueDetail(id)"
                      >
                        {{ id }}
                      </span>
                      <el-tooltip
                        class="item"
                        placement="bottom"
                        effect="light"
                        :content="commit.commit_title"
                      >
                        <span>&nbsp;{{ commit.commit_title }}</span>
                      </el-tooltip>
                    </div>
                    <div style="min-width: 90px;">
                      <el-tooltip
                        placement="bottom"
                        effect="light"
                        :content="getLocalTime(commit.commit_time)"
                      >
                        <span>
                          {{ getRelativeTime(commit.commit_time) }}
                        </span>
                      </el-tooltip>
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
                      <span class="text-primary">
                        #{{ issue.id }}
                      </span>
                      <Status
                        v-if="issue.status.name"
                        class="ml-1"
                        size="mini"
                        :name="$t(`Issue.${issue.status.name}`)"
                        :type="issue.status.name"
                      />
                      <el-tag
                        v-if="issue.assigned_to"
                        class="ml-1"
                        type="info"
                        size="mini"
                        effect="dark"
                      >
                        {{ issue.assigned_to.name }}
                      </el-tag>
                      <span class="ml-1">
                        {{ issue.name }}
                      </span>
                    </li>
                  </ul>
                </section>
              </el-collapse-item>
            </el-collapse>
          </el-timeline-item>
          <div class="flex justify-center mt-2" :class="isMobile ? '' : ' w-75'">
            <el-button
              round
              size="small"
              class="el-icon-bottom button-primary-reverse"
              @click="toGitlab(gitlabActivityUrl)"
            >
              {{ $t('general.SeeMore') }}
            </el-button>
          </div>
        </el-timeline>
      </template>
      <template v-slot:commit="{row}">
        <el-link
          type="primary"
          target="_blank"
          style="font-size: 16px"
          :href="row.commit_url"
        >
          <svg-icon
            class="mr-1"
            icon-class="ion-git-commit-outline"
          />
          {{ row.short_id }}
        </el-link>
      </template>
    </ElTableResponsive>
    <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { getHookByBranch } from '@/api/dashboard'
import { getIssue } from '@/api/issue'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'
import { Status } from '@/components/Issue'

const commitLimit = 10

export default {
  name: 'ProgressDevBranch',
  components: {
    ProjectListSelector,
    Status,
    ElTableResponsive
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      branchList: [],
      gitCommitLog: [],
      collapseExpandedRow: [],
      expandedRow: []
    }
  },
  computed: {
    ...mapGetters([
      'branchesByProject',
      'defaultBranch',
      'device'
    ]),
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
    getIssueId() {
      return (branch) => {
        let issue_id = []
        if (branch) {
          issue_id = Object.keys(branch).map((id) => `#${id}`)
        }
        return issue_id
      }
    },
    gitlabActivityUrl() {
      const splitUrl = this.selectedProject.git_url.split('/')
      splitUrl.pop()
      splitUrl.push(this.selectedProject.name)
      splitUrl.push('activity')
      return splitUrl.join('/')
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
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
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
          prop: 'last_commit_message',
          minWidth: 160,
          align: 'center'
        },
        {
          label: this.$t('ProcessDevBranch.Commit'),
          prop: 'short_id',
          minWidth: 120,
          align: 'center',
          slot: 'commit'
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'last_commit_time',
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
      const rowIndex = this.branchList.findIndex((list) => list.name === expandedRow[0])
      const row = this.branchList[rowIndex]
      if (rowIndex === undefined || row === undefined) return
      this.onExpandChange(row, [row])
      this.collapseExpandedRow = collapseExpandedRow
    },
    async fetchData() {
      await this.getBranchesByProject(this.selectedRepositoryId)
      return this.branchList.sort((a, b) => new Date(b.last_commit_time) - new Date(a.last_commit_time))
    },
    async onExpandChange(row, expandedRows) {
      this.handleExpanded(row, expandedRows)
      if (row.gitCommitLog || row.timelineLoading) return
      await this.fetchGitCommitLog(row)
    },
    handleExpanded(row, expandedRows) {
      this.initTableExpand()
      this.expandedRow.push(row.name)
      expandedRows.forEach((expandedRow) => {
        this.$refs.table.$refs.responsiveTable.toggleRowExpansion(expandedRow, row.name === expandedRow.name)
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
        branch_name
      }
      const res = await getHookByBranch(this.selectedProjectId, params)
      await res.data.forEach(async (item, index) => {
        item['id'] = index
        item['issue_id'] = this.getIssueId(item['issue_hook'])
        item['issues'] = await this.getIssue(item['issue_id'], item['issue_hook'])
      })
      return res.data
    },
    async getIssue(ids, hooks) {
      if (!ids[0]) return
      const issueData = []
      await ids.forEach(async (id) => {
        const issueId = id.split('#')[1]
        if (!hooks[issueId]) return
        const res = await getIssue(issueId)
        issueData.push(res.data)
      })
      return issueData
    },
    toIssueDetail(tag) {
      const pound = new RegExp(/#/)
      const issueId = tag.toString().match(pound) ? tag.split('#')[1] : tag
      this.$router.push({ name: 'IssueDetail', params: { issueId }})
    },
    toGitlab(url) {
      window.open(url, '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
.w-75 {
  width: 75%;
  .truncate {
    width: 75%;
    .text-info {
      pointer-events: none;
    }
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
</style>
