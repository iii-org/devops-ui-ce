<template>
  <el-dialog
    :visible.sync="isBatchAddShow"
    append-to-body
    destroy-on-close
    width="70%"
    @cancel="handleCancel"
  >
    <span slot="title">Create Hook</span>
    <div class="align-middle text-base mb-2">
      <Tracker
        v-if="issue.tracker"
        :name="$t(`Issue.${issue.tracker.name}`)"
        :type="issue.tracker.name"
      />
      <span v-else> {{ $t('Issue.Issue') }} : </span>
      <span> #{{ issue.id }} - </span>
      {{ issue.subject }}
    </div>
    <el-form ref="hookForm" :model="form" class="pb-1">
      <el-row :gutter="10">
        <el-col :md="12" :sm="24">
          <el-form-item :label="$t('Project.Project')" prop="project">
            <el-select-tree
              v-model="form.project"
              :data="projectRelationList"
              :default-expanded-keys="[form.project]"
              :props="{
                value: 'id',
                label: 'display_name',
                children: 'child'
              }"
              check-strictly
              filterable
              node-key="id"
              placeholder="Please select"
              popper-class="max-w-[100px]"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item :label="$t('general.Branch')" prop="branch">
            <el-select
              v-model="form.branch"
              v-loading="isBranchLoading"
              class="w-full"
            >
              <el-option
                v-for="item in branchList"
                :key="item.id"
                :label="item.name"
                :value="item.name"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :md="24" :sm="24">
          <el-form-item
            :rules="[
              {
                required: true,
                message: $t('Validation.Input', ['Commit ID']),
                trigger: 'blur'
              }
            ]"
            label="Commit ID"
            prop="commitId"
          >
            <el-select
              v-model="form.commitId"
              v-loading="isCommitLoading"
              :filter-method="setFilter"
              :placeholder="$t('Validation.Input', ['Commit ID'])"
              class="w-full"
              clearable
              filterable
              multiple
              value-key="id"
            >
              <el-option
                v-for="item in commitListFiltered"
                :key="item.id"
                :label="item.short_id"
                :value="item"
              >
                <span class="el-link el-link--primary hover:font-normal">
                  <em class="ri-git-commit-line mr-1"></em>
                  <span class="font-code">{{ item.short_id }}</span>
                </span>
                - {{ item.title }}
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-divider content-position="left">
      {{ $t('User.Selected') }}
      <span
        class="bg-primary text-xs rounded-full text-white w-6 h-6 inline-block content-center text-center"
      >
        {{ form.commitId.length }}
      </span>
    </el-divider>
    <div v-if="form.commitId.length > 0" class="commit-block">
      <div class="font-bold text-sm mb-1 text-gray-500">Commit</div>
      <div v-for="item in form.commitId" :key="item.id" class="text-sm mb-1">
        <el-link
          :href="item.commit_url"
          class="font-code"
          target="_blank"
          type="primary"
        >
          <em class="ri-git-commit-line"></em>
          {{ item.short_id }}
        </el-link>
        @ {{ item.author_name }} - {{ item.title }}
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">{{ $t('general.Cancel') }}</el-button>
      <el-button :disabled="disableSaveBtn" type="primary" @click="handleSave">
        {{ $t('general.Save') }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getProjectAllRelation } from '@/api_v3/projects'
import {
  batchCreateIssueCommitHook,
  getRepositoryBranches,
  getUserCommitList
} from '@/api_v3/gitlab'
import { mapGetters } from 'vuex'
import ElSelectTree from 'el-select-tree'

const defaultForm = () => ({
  project: {},
  branch: '',
  commitId: []
})

export default {
  name: 'BatchAddCommitHook',
  components: {
    Tracker: () => import('@/components/Issue/Tracker'),
    ElSelectTree
  },
  props: {
    issue: {
      type: Object,
      default: () => ({})
    },
    listAllData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loading: false,
      isBatchAddShow: false,
      projectRelationList: [],
      branchList: [],
      commitList: [],
      commitListFiltered: [],
      isBranchLoading: false,
      isCommitLoading: false,
      form: defaultForm()
    }
  },
  computed: {
    ...mapGetters(['projectOptions']),
    currentProject() {
      return {
        id: this.issue.project.id,
        display_name: this.issue.project.display_name,
        identifier: this.issue.project.identifier
      }
    },
    selectedProjectForm() {
      return this.projectOptions.find((item) => item.id === this.form.project)
    },
    disableSaveBtn() {
      return !this.form.commitId.length
    }
  },
  watch: {
    isBatchAddShow(val) {
      if (val) {
        this.fetchProjectRelations()
      }
    },
    'form.project'(val) {
      if (val) {
        this.fetchBranches()
      }
    },
    'form.branch'(val) {
      if (val) {
        this.fetchCommitList()
      }
    }
  },
  methods: {
    async fetchProjectRelations() {
      await getProjectAllRelation(this.issue.project.id).then(async (res) => {
        this.projectRelationList = [
          this.extractProjectNode(res.data, this.issue.project.id)
        ]
        this.form.project = this.issue.project.id
      })
    },
    extractProjectNode(obj, targetId) {
      if (!obj || typeof obj !== 'object') return null
      if (obj.id === targetId) {
        return obj
      }
      if (Array.isArray(obj.child)) {
        for (const child of obj.child) {
          const result = this.extractProjectNode(child, targetId)
          if (result) {
            return result
          }
        }
      }
      return null
    },
    async fetchBranches() {
      this.branchList = []
      this.commitList = []
      this.form.branch = ''
      if (this.selectedProjectForm.repository_id) {
        this.isBranchLoading = true
        await getRepositoryBranches(this.selectedProjectForm.repository_id)
          .then((res) => {
            this.branchList = res.data.branches
            this.form.branch = res.data.main.name
          })
          .finally(() => {
            this.isBranchLoading = false
          })
      }
    },
    async fetchCommitList() {
      if (this.selectedProjectForm.repository_id) {
        this.isCommitLoading = true
        await getUserCommitList(this.selectedProjectForm.repository_id, {
          branch: this.form.branch
        })
          .then((res) => {
            let data = res.data
            if (this.listAllData.length > 0) {
              data = res.data.filter((item) =>
                this.listAllData.every((dt) => item.id !== dt.id)
              )
            }
            this.commitList = data
            this.commitListFiltered = this.commitList
          })
          .finally(() => {
            this.isCommitLoading = false
          })
      }
    },
    setFilter(value) {
      const keyword = value.toLowerCase()
      if (!value) {
        this.commitListFiltered = this.commitList
        return
      }
      this.commitListFiltered = this.commitList.filter((element) => {
        const { id, title } = element
        return (
          id.indexOf(keyword) > -1 || title.toLowerCase().indexOf(keyword) > -1
        )
      })
    },
    async handleSave() {
      this.$refs.hookForm.validate(async (valid) => {
        if (valid) {
          const data = this.form.commitId.map((item) => {
            return {
              commit_id: item.id,
              issue_ids: [this.issue.id],
              project_id: this.form.project,
              repo_id: this.selectedProjectForm.repository_id
            }
          })
          await batchCreateIssueCommitHook(data).then(() => {
            this.$emit('update')
            this.resetValues()
            this.isBatchAddShow = false
            this.$emit('load')
          })
        }
      })
    },
    handleCancel() {
      this.resetValues()
      this.isBatchAddShow = false
    },
    resetValues() {
      this.form = defaultForm()
      this.projectRelationList = []
      this.branchList = []
      this.commitList = []
      this.commitListFiltered = []
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

::v-deep .el-select__tags-text {
  font-family: 'JetBrains Mono', 'remixicon', monospace !important;

  &:before {
    content: '\edbf';
    margin-right: 4px;
  }
}
</style>
