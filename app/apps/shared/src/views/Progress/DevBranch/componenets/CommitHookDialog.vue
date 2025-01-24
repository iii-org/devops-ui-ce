<template>
  <el-dialog
    :visible.sync="isCommitHookShow"
    append-to-body
    destroy-on-close
    width="70%"
    @cancel="handleCancel"
  >
    <span slot="title">Create Hook</span>
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
    <span>: {{ commit.author_name }} @ {{ commit.title }}</span>
    <el-form ref="hookForm" :model="form" class="pb-1">
      <el-row :gutter="10">
        <el-col :md="24" :sm="24">
          <el-form-item
            :rules="[
              {
                required: true,
                message: $t('Validation.Input', ['Issue']),
                trigger: 'blur'
              }
            ]"
            label="Issue"
            prop="issue_ids"
          >
            <IssueSelect
              ref="IssueSelect"
              :commit-id="commit.short_id"
              :issue-ids="issueIds"
              :issue-list="issueList"
              :issue-query="issueQuery"
              @change="changeSingleIssueIds"
              @update="getSearchIssue"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-divider content-position="left">
      {{ $t('User.Selected') }}
      <span
        class="bg-primary text-xs rounded-full text-white w-6 h-6 inline-block content-center text-center"
      >
        {{ form.issue_ids.length }}
      </span>
    </el-divider>
    <div v-if="selectedIssues.length > 0" class="commit-block">
      <div class="font-bold text-sm mb-1 text-gray-500">
        {{ $t('Issue.Issue') }}
      </div>
      <div
        v-for="(issue, idx) in selectedIssues"
        :key="idx"
        class="text-sm mb-1"
      >
        <div class="align-middle mb-1">
          {{ issue }}
        </div>
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">{{ $t('general.Cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{ $t('general.Save') }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getProjectIssueList, getRootProjectId } from '@/api_v3/projects'
import { mapGetters } from 'vuex'
import {
  batchCreateIssueCommitHook,
  batchDeleteIssueCommitHook,
  batchUpdateIssueCommitHook
} from '@/api_v3/gitlab'

export default {
  name: 'CommitHookDialog',
  components: {
    IssueSelect: () => import('@/components/Issue/IssueSelect')
  },
  props: {
    // commit: {
    //   type: Object,
    //   default: () => ({})
    // }
  },
  data() {
    return {
      isCommitHookShow: false,
      form: {
        issue_ids: []
      },
      isBranchLoading: false,
      isCommitLoading: false,
      commitListFiltered: [],
      issueQuery: null,
      issueList: [],
      commit: {},
      rootProjectId: null,
      selectedIssues: []
    }
  },
  computed: {
    ...mapGetters(['selectedProject']),
    issueIds() {
      return this.commit.issue_id
        ? this.commit.issue_id.map((item) => {
            if (typeof item === 'string') {
              return Number(item.replace('#', ''))
            }
            return item
          })
        : []
    }
  },
  watch: {
    async isCommitHookShow(val) {
      if (val) {
        this.form = {
          issue_ids: []
        }
        await this.getRootProject()
        await this.getSearchIssue()
      }
    },
    issueIds: {
      handler() {
        this.form.issue_ids = this.issueIds
        if (this.commit.issues) {
          this.selectedIssues = this.commit.issues.map(
            (item) => '#' + item.id + ' - ' + item.subject
          )
        }
      }
    },
    'form.issue_ids'(value) {
      if (!value && !this.issueQuery) {
        this.getSearchIssue()
      }
    }
  },
  methods: {
    resetValues() {
      this.form = {
        issue_ids: []
      }
      this.commit = {}
      this.selectedIssues = []
      this.issueList = []
    },
    handleCancel() {
      this.resetValues()
      this.isCommitHookShow = false
    },
    async handleSave() {
      let API
      const data = [
        {
          commit_id: this.commit.id,
          issue_ids: this.form.issue_ids,
          repo_id: this.selectedProject.repository_id,
          project_id: this.selectedProject.id
        }
      ]

      if (this.form.issue_ids.length === 0) {
        API = batchDeleteIssueCommitHook
      } else if (!this.commit.issues) {
        API = batchCreateIssueCommitHook
      } else {
        API = batchUpdateIssueCommitHook
      }
      await API(data)
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.resetValues()
          this.isCommitHookShow = false
          this.$emit('update')
        })
        .catch((error) => {
          this.$message({
            title: this.$t('general.Error'),
            message: error,
            type: 'error'
          })
        })
    },
    async getSearchIssue(query) {
      const params = this.getSearchParams(query)
      await getProjectIssueList(this.rootProjectId, params).then(
        async (res) => {
          this.issueList = await this.getListLabels(res)
        }
      )
      this.$refs.IssueSelect.isLoading = false
      this.cancelToken = null
    },
    getSearchParams(query) {
      const params = {
        selection: true,
        closed: false
      }
      if (query !== '' && query) {
        params['search'] = query
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
      const parent = {
        name: this.$t('Issue.OriginalSetting'),
        options: this.commit.issues
      }
      return [parent, { name: this.$t(key), options: queryList }]
    },
    changeSingleIssueIds(value) {
      this.form.issue_ids = value.issue_ids
      this.selectedIssues = value.selectedIssues
    },
    async getRootProject() {
      const res = await getRootProjectId(this.selectedProject.id)
      this.rootProjectId = res.data.id
    }
  }
}
</script>

<style lang="scss" scoped>
.commit-block {
  border-radius: 8px;
  padding: 10px;
  margin-top: 30px;
  background-color: #f9f9f9;
  box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;
}
</style>
