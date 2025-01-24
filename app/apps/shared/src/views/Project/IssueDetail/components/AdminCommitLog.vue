<template>
  <el-col v-loading="listLoading" :style="{ height: height }" class="inner">
    <template v-if="listData.length > 0">
      <div class="text-right mb-2">
        <el-tooltip
          :content="$t('Issue.BatchEditIssueHook')"
          effect="dark"
          placement="bottom"
        >
          <a
            class="el-link el-link--primary"
            size="mini"
            @click="toggleIssueMultiCommitDialog()"
          >
            {{ $t('Issue.IssueHookSetting') }}
            <em class="ri-link"></em>
          </a>
        </el-tooltip>
      </div>
      <transition-group class="pl-1" name="slide-fade" tag="el-timeline">
        <el-timeline-item
          v-for="commit in listData"
          :key="commit.id"
          :timestamp="commit.committed_date"
          placement="top"
        >
          <el-card class="timeline-item-card">
            <h4>{{ commit.title }}</h4>
            <p v-if="compareCommitContent(commit)">
              {{ commit.message }}
            </p>
            <p class="author">
              <a
                :class="
                  commit.commit_url
                    ? 'el-link--primary is-underline'
                    : 'cursor-default'
                "
                :href="commit.commit_url ? commit.commit_url : null"
                class="el-link font-code"
                target="_blank"
              >
                <em class="ri-git-commit-line"></em>
                {{ commit.short_id }}
              </a>
              <span>: {{ commit.author_name }} @ {{ commit.project_name }}</span>
              <el-tooltip
                :content="$t('Issue.EditIssueHook')"
                effect="dark"
                placement="bottom"
              >
                <a
                  class="el-link el-link--primary"
                  @click="toggleIssueSingleCommitDialog(commit)"
                >
                  <em class="ri-link"></em>
                </a>
              </el-tooltip>
            </p>
          </el-card>
        </el-timeline-item>
      </transition-group>
      <el-dialog
        v-if="issueSingleCommitDialog.visible"
        :visible.sync="issueSingleCommitDialog.visible"
        append-to-body
        destroy-on-close
        top="50px"
        width="60%"
      >
        <div slot="title">
          {{ $t('Issue.CommitIssueHookSetting') }}
          <el-button
            :disabled="!isEnabledSaveSingleCommitHookBtn"
            class="float-right"
            size="small"
            style="margin-right: 2em"
            type="primary"
            @click="toggleSaveSingleCommitDialog"
          >
            {{ $t('general.Save') }}
          </el-button>
        </div>
        <a
          :class="
            commitData.commit_url
              ? 'el-link el-link--primary is-underline'
              : 'cursor-default'
          "
          :href="commitData.commit_url ? commitData.commit_url : null"
          class="el-link font-code"
          target="_blank"
        >
          <em class="ri-git-commit-line"></em>
          {{ commitData.short_id }}
        </a>
        <span>: {{ commitData.author_name }} @ {{ commitData.title }}</span>
        <IssueSelect
          ref="IssueSelect"
          :commit-id="commitData.id"
          :issue-ids="issueIds"
          :issue-list="issueList"
          :issue-query="issueQuery"
          @change="changeSingleIssueIds"
          @update="getSearchIssue"
        />
      </el-dialog>
      <el-dialog
        v-if="issueMultiCommitDialog.visible"
        :visible.sync="issueMultiCommitDialog.visible"
        append-to-body
        destroy-on-close
        top="50px"
        width="60%"
      >
        <div slot="title">
          {{ $t('Issue.CommitIssueHookSetting') }}
          <span class="float-right">
            <el-button
              icon="el-icon-plus"
              size="small"
              type="success"
              @click="toggleBatchAddDialog"
            >
              {{ $t('general.Add') }}
            </el-button>
            <el-button
              :disabled="!isEnabledSaveMultiCommitHookBtn"
              size="small"
              style="margin-right: 2em"
              type="primary"
              @click="toggleSaveMultiCommitDialog"
            >
              {{ $t('general.Save') }}
            </el-button>
          </span>
        </div>
        <div class="mb-4 text-base">#{{ issueId }} - {{ issueSubject }}</div>
        <transition-group name="slide-fade" tag="el-timeline">
          <el-timeline-item
            v-for="commit in listAllData"
            :key="commit.id"
            :timestamp="commit.committed_date"
            placement="top"
          >
            <p class="author">
              <el-row>
                <el-col :span="14">
                  <a
                    :class="
                      commit.commit_url
                        ? 'el-link el-link--primary is-underline'
                        : 'cursor-default'
                    "
                    :href="commit.commit_url ? commit.commit_url : null"
                    class="el-link font-code"
                    target="_blank"
                  >
                    <em class="ri-git-commit-line"></em>
                    {{ commit.short_id }}
                  </a>
                  <span>: {{ commit.author_name }} @ {{ commit.message }}</span>
                </el-col>
                <el-col :span="10">
                  <IssueSelect
                    ref="IssueSelect"
                    :commit-id="commit.id"
                    :issue-ids="commit.issue_ids"
                    :issue-list="commit.issue_list"
                    :issue-loading="commit.issue_loading"
                    :issue-query="issueQuery"
                    :parent="commit.parent"
                    @change="changeMultiIssueIds"
                    @update="getSearchIssue"
                  />
                </el-col>
              </el-row>
            </p>
          </el-timeline-item>
        </transition-group>
      </el-dialog>
    </template>
    <template v-else>
      <div class="text-right mb-2">
        <el-tooltip content="Add New Hook" effect="dark" placement="bottom">
          <a
            class="el-link el-link--primary"
            size="mini"
            @click="toggleBatchAddDialog()"
          >
            Add New Hook
            <em class="ri-link ml-1"></em>
          </a>
        </el-tooltip>
      </div>
      <NoData />
    </template>
    <BatchAddCommitHook
      ref="batchAddCommit"
      :issue="issue"
      :list-all-data="listAllData"
      @load="loadData"
    />
  </el-col>
</template>

<script>
import {
  batchDeleteIssueCommitHook,
  batchUpdateIssueCommitHook,
  getIssueCommitHookList,
  getIssueCommitHooksIds
} from '@/api_v3/gitlab'
import { getIssueDetails } from '@/api_v3/issues'
import { getProjectIssueList, getRootProjectId } from '@/api_v3/projects'
import { getLocalTime } from '@shared/utils/handleTime'
import axios from 'axios'
import { mapGetters } from 'vuex'

class CommitLogItem {
  constructor(data) {
    this.issue_ids = data.issue_ids !== undefined ? data.issue_ids : []
    this.parent = data.parent !== undefined ? data.parent : {}
    this.issue_list = data.issue_list !== undefined ? data.issue_list : []
    this.id = data.id !== undefined ? data.id : -1
    this.issue_loading =
      data.issue_loading !== undefined ? data.issue_loading : true
    this.project_name = data.project_name !== undefined ? data.project_name : ''
    this.author_name = data.author_name !== undefined ? data.author_name : ''
    this.short_id = data.short_id !== undefined ? data.short_id : ''
    this.message = data.message !== undefined ? data.message : ''
    this.title = data.title !== undefined ? data.title : ''
    this.committed_date =
      data.committed_date !== undefined ? data.committed_date : ''
    this.commit_url = data.commit_url !== undefined ? data.commit_url : ''
    this.created_at = data.created_at !== undefined ? data.created_at : ''
  }
}

export default {
  name: 'AdminCommitLog',
  components: {
    IssueSelect: () => import('@/components/Issue/IssueSelect'),
    NoData: () => import('@shared/components/NoData'),
    BatchAddCommitHook: () => import('./widget/BatchAddCommitHook.vue')
  },
  props: {
    issueId: {
      type: Number,
      default: null
    },
    issueSubject: {
      type: String,
      default: ''
    },
    issue: {
      type: Object,
      default: () => ({})
    },
    getData: {
      type: Function,
      default: () => []
    },
    height: {
      type: String,
      default: '250px'
    }
  },
  data() {
    return {
      listData: [],
      detailDialog: false,
      listLoading: false,
      issueSingleCommitDialog: {
        visible: false
      },
      issueMultiCommitDialog: {
        visible: false
      },
      listAllData: [],
      originalListAllData: [],
      parent: [],
      commitData: {},
      commitId: '',
      issueIds: [],
      originalIssueIds: [],
      rootProjectId: '',
      issueQuery: null,
      issueList: [],
      cancelToken: null,
      multiType: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject']),
    isEnabledSaveSingleCommitHookBtn() {
      return this.issueIds.join() !== this.originalIssueIds.join()
    },
    isEnabledSaveMultiCommitHookBtn() {
      return this.listAllData.some((item, idx) => {
        return (
          item.issue_ids.join() !==
          this.originalListAllData[idx].issue_ids.join()
        )
      })
    }
  },
  watch: {
    issueId: {
      handler(value) {
        if (value) this.loadData()
      },
      immediate: true
    },
    parent: {
      deep: true,
      handler() {
        this.getSearchIssue()
      }
    },
    issueIds(value) {
      if (!value && !this.issueQuery) {
        this.getSearchIssue()
      }
    }
  },
  methods: {
    async loadData() {
      this.listAllData = []
      this.listLoading = true
      this.listData = await this.getData()
      this.listLoading = false
    },
    async getCommitRelationIssue(commitId) {
      let issueInProject = []
      await getIssueCommitHooksIds({ commit_id: commitId }).then((res) => {
        issueInProject = res.data
      })
      return issueInProject
    },
    async getRootProject(projectId) {
      const res = await getRootProjectId(projectId)
      this.rootProjectId = res.data.id
    },
    async toggleIssueSingleCommitDialog(commit) {
      this.issueSingleCommitDialog.visible =
        !this.issueSingleCommitDialog.visible
      this.multiType = false
      this.commitData = commit
      this.commitId = commit.id
      await this.getRootProject(this.selectedProject.id)
      this.issueIds = await this.getCommitRelationIssue(commit.id)
      this.originalIssueIds = JSON.parse(JSON.stringify(this.issueIds))
      this.parent = await this.originalParentIssue(this.issueIds)
    },
    async toggleSaveSingleCommitDialog() {
      const promise = []
      const issueAllIds = this.issueIds
      const data = [
        {
          commit_id: this.commitId,
          issue_ids: issueAllIds,
          project_id: this.selectedProject.id,
          repo_id: this.selectedProject.repository_id
        }
      ]

      if (issueAllIds.length > 0) {
        promise.push(batchUpdateIssueCommitHook(data))
      } else {
        promise.push(batchDeleteIssueCommitHook(data))
      }
      await this.handleUpdateCommitHook(promise)
    },
    async toggleIssueMultiCommitDialog() {
      this.multiType = true
      this.listAllData = await this.getAllGitCommitLogData()
      this.originalListAllData = JSON.parse(JSON.stringify(this.listAllData))
      this.issueMultiCommitDialog.visible = !this.issueMultiCommitDialog.visible
    },
    async toggleSaveMultiCommitDialog() {
      const promise = []
      const updateData = []
      const deleteData = []
      this.listAllData.forEach((item, idx) => {
        const issueAllIds = item.issue_ids
        if (
          issueAllIds.join() !== this.originalListAllData[idx].issue_ids.join()
        ) {
          const data = {
            commit_id: item.id,
            issue_ids: issueAllIds,
            project_id: this.selectedProject.id,
            repo_id: this.selectedProject.repository_id
          }
          if (issueAllIds.length > 0) {
            updateData.push(data)
          } else {
            deleteData.push(data)
          }
        }
      })
      if (updateData.length > 0) {
        promise.push(batchUpdateIssueCommitHook(updateData))
      }
      if (deleteData.length > 0) {
        promise.push(batchDeleteIssueCommitHook(deleteData))
      }
      await this.handleUpdateCommitHook(promise)
    },
    handleUpdateCommitHook(promise) {
      Promise.all(promise)
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.issueSingleCommitDialog.visible = false
          this.issueMultiCommitDialog.visible = false
          this.loadData()
        })
        .catch((error) => {
          this.$message({
            title: this.$t('general.Error'),
            message: error,
            type: 'error'
          })
        })
    },
    async getAllGitCommitLogData() {
      await this.getRootProject(this.selectedProject.id)
      const { data } = await getIssueCommitHookList({
        issue_id: parseInt(this.issueId)
      })
      const commitLogs = data.map((item) => new CommitLogItem(item))
      for (const item of commitLogs) {
        const issueIds = await this.getCommitRelationIssue(item['id'])
        item['issue_ids'] = issueIds
        const parent = await this.originalParentIssue(issueIds)
        item['parent'] = parent
        const issueList = await this.getMultiUnderList(parent)
        item['issue_list'] = issueList
        item['committed_date'] = getLocalTime(item['committed_date'])
        item['issue_loading'] = false
      }
      return commitLogs
    },
    async getSearchIssue(query, commitId, parent) {
      const params = this.getSearchParams(query)
      const cancelToken = this.checkToken()
      await getProjectIssueList(this.rootProjectId, params, {
        cancelToken
      }).then(async (res) => {
        if (this.multiType) {
          this.issueList = this.getMultiListLabels(res, parent)
          const index = this.listAllData.findIndex((item) => {
            return item.id === commitId
          })
          this.$set(this.listAllData[index], 'issue_list', this.issueList)
        } else {
          this.issueList = this.getListLabels(res)
        }
      })
      this.$refs.IssueSelect.isLoading = false
      this.cancelToken = null
    },
    getSearchParams(query) {
      const params = {
        selection: true,
        exclude_closed: true
      }
      if (query !== '' && query) {
        params['search'] = query
        params['all'] = true
        this.issueQuery = query
      } else {
        params['page'] = 1
        params['limit'] = 5
        this.issueQuery = null
      }
      this.issueList = []
      return params
    },
    getListLabels(res) {
      let queryList = res.data
      let key = 'Issue.Result'
      if (!this.issueQuery) {
        if (queryList && queryList.hasOwnProperty('items')) {
          queryList = res.data.items
        } else {
          queryList = []
        }
        key = 'Issue.LastResult'
      }
      return [this.parent, { name: this.$t(key), options: queryList }]
    },
    async originalParentIssue(issueIds) {
      const parent = []
      for (const element of issueIds) {
        if (element === this.issueId) {
          parent.push(this.issue)
        } else {
          const res = await getIssueDetails(element)
          parent.push(res.data)
        }
      }
      if (parent.length <= 0) return {}
      return { name: this.$t('Issue.OriginalSetting'), options: parent }
    },
    async getMultiUnderList(parent) {
      const params = {
        selection: true,
        exclude_closed: true,
        page: 1,
        limit: 5
      }
      await getProjectIssueList(this.rootProjectId, params).then((res) => {
        this.issueList = this.getMultiListLabels(res, parent)
      })
      return this.issueList
    },
    getMultiListLabels(res, parent) {
      let queryList = res.data
      let key = 'Issue.Result'
      if (!this.issueQuery) {
        if (queryList && queryList.hasOwnProperty('items')) {
          queryList = res.data.items
        } else {
          queryList = []
        }
        key = 'Issue.LastResult'
      }
      return [parent, { name: this.$t(key), options: queryList }]
    },
    checkToken() {
      if (this.cancelToken) this.cancelToken.cancel()
      const CancelToken = axios.CancelToken.source()
      this.cancelToken = CancelToken
      return CancelToken.token
    },
    async saveIssueIds(data) {
      await batchUpdateIssueCommitHook(data)
        .then(async () => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.issueSingleCommitDialog.visible = false
          this.issueMultiCommitDialog.visible = false
          await this.loadData()
        })
        .catch((error) => {
          this.$message({
            title: this.$t('general.Error'),
            message: error,
            type: 'error'
          })
        })
    },
    async deleteIssueHook(data) {
      await batchDeleteIssueCommitHook({ data })
        .then(async () => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.issueSingleCommitDialog.visible = false
          this.issueMultiCommitDialog.visible = false
          await this.loadData()
        })
        .catch((error) => {
          this.$message({
            title: this.$t('general.Error'),
            message: error,
            type: 'error'
          })
        })
    },
    changeSingleIssueIds(value) {
      this.issueIds = value.issue_ids
    },
    changeMultiIssueIds(value) {
      const index = this.listAllData.findIndex((item) => {
        return item.id === value.commitId
      })
      this.$set(this.listAllData[index], 'issue_ids', value.issue_ids)
    },
    compareCommitContent(commit) {
      return commit.message.trim() !== commit.title
    },
    toggleBatchAddDialog() {
      this.issueMultiCommitDialog.visible = false
      this.$nextTick(() => {
        this.$refs.batchAddCommit.isBatchAddShow = true
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.inner {
  overflow-y: auto;
  overflow-x: hidden;
}

.timeline-item-card {
  ::v-deep .el-card__body {
    padding: 10px;
  }

  .author {
    margin-bottom: 0;
  }
}

.slide-fade-enter-active {
  transition: all 0.5s ease;
}

.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter, .slide-fade-leave-to
  /* .slide-fade-leave-active for below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}

.el-tooltip.el-link.el-link--primary {
  color: inherit;
}

.el-tooltip.el-link.el-link--primary:hover {
  color: #66b1ff;
}

::v-deep .el-dialog {
  max-height: 80%;
  overflow: auto;
}

::v-deep .el-timeline {
  padding-left: 10px;
}
</style>
