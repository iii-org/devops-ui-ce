"<template>
  <div>
    <slot name="description" />
    <el-card shadow="never">
      <div class="flex justify-between">
        <el-form
          ref="form"
          :inline="true"
          :model="commitForm"
          class="w-full"
        >
          <el-row>
            <el-col :xs="24" :span="9">
              <el-form-item :label="$t('Git.Branch')" style="padding-right: 10px;">
                <el-select
                  v-if="branches.length > 0"
                  v-model="commitForm.branch"
                  filterable
                  style="max-width: 202px;"
                  @change="handleSelectedRepoName(commitForm.branch)"
                >
                  <el-option
                    v-for="item in branches"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
                <div v-else>{{ $t('general.Nothing') }}</div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :span="9">
              <el-form-item :label="$t('Git.Commit')">
                <el-input v-if="commitId" v-model="commitId" disabled />
                <div v-else>{{ $t('general.Nothing') }}</div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :span="6">
              <el-form-item>
                <span style="color: #606266; font-weight: 700;">{{ $t('PodsList.Image') }}:</span>
                <span
                  v-if="hasHarborTag"
                  class="custom-black"
                  style="line-height: 40px;"
                >
                  <svg-icon v-if="!checkHarborLoading" icon-class="ion-git-commit-outline" />
                  {{ checkHarborLoading ? $t('Updating') : image }}
                </span>
                <span v-else>
                  <span class="text-danger mr-3">
                    <em class="el-icon-warning" />
                    <span>{{ $t('Issue.NoImage') }}</span>
                  </span>
                </span>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <el-button
          :type="isOpenTable ? 'danger' : 'primary'"
          :icon="isOpenTable ? 'el-icon-arrow-up' : 'el-icon-setting'"
          class="mr-2"
          style="height: max-content;"
          :size="isMobile ? 'small' : 'medium'"
          @click="isOpenTable = !isOpenTable"
        >
          <span v-if="!isMobile">{{ isOpenTable ? $t('general.ok') : $t('Release.ModifyImage') }}</span>
        </el-button>
      </div>
      <el-collapse-transition>
        <ImageList
          v-if="isOpenTable"
          :branches="branches"
          :branch-name="commitForm.branch"
          :commit-id="commitId"
          :image="image"
          @onChangeImage="onChangeImage"
        />
      </el-collapse-transition>
      <div class="text-right">
        <el-button
          :disabled="isLoading"
          @click="onBack"
        >
          <em class="el-icon-back" />
          {{ $t('Release.Previous') }}
        </el-button>
        <el-button
          v-if="hasHarborTag"
          :disabled="isLoading"
          @click="onNext"
        >
          {{ $t('Release.Next') }}
          <em class="el-icon-right" />
        </el-button>
        <el-popconfirm
          v-else
          :confirm-button-text="$t('Issue.DetermineContinue')"
          :cancel-button-text="$t('general.Cancel')"
          :title="$t('Issue.NoImageWarning')"
          icon="el-icon-info"
          popper-class="danger"
          @confirm="onNext"
        >
          <el-button
            slot="reference"
            :disabled="isLoading"
          >
            {{ $t('Release.Next') }}
            <em class="el-icon-right" />
          </el-button>
        </el-popconfirm>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getBranchesByProject } from '@/api/branches'
import { getMemberCommitListByBranch } from '@/api/commitList'
import { getHarborRepoList, getRepoArtifacts } from '@/api_v2/harbor'

export default {
  name: 'ImageVersion',
  components: {
    ImageList: () => import('./ImageList')
  },
  props: {
    releaseData: {
      type: Object,
      default: () => ({})
    },
    updateData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isLoading: false,
      isOpenTable: false,
      commitForm: {
        branch: '',
        note: ''
      },
      branches: [],
      branchesData: [],
      commitId: '',
      repoArtifact: {},
      selectedVersions: [],
      checkHarborLoading: false,
      releaseVersionOptions: [],
      image: 'noImage'
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'selectedProjectId', 'device']),
    selectedRepositoryId() {
      return this.selectedProject.repository_ids[0]
    },
    hasHarborTag() {
      if (this.image === 'noImage') return false
      return !!this.image
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    selectedProject: {
      handler(val) {
        this.getBranchesData()
        this.commitForm.note = ''
      }
    }
  },
  mounted() {
    this.getBranchesData()
  },
  methods: {
    async getBranchesData() {
      this.branches = []
      this.loading = true
      const res = await getBranchesByProject(this.selectedRepositoryId)
      this.setBranchesData(res.data)
      this.handleBranchData()
      !this.releaseData.commit ? this.getMemberCommitListByBranch() : this.setSaveData()
    },
    setSaveData() {
      this.commitId = this.releaseData.commit
      this.image = this.updateData.image
    },
    setBranchesData(data) {
      data.branch_list.sort((itemA, itemB) => {
        const timeA = Date.parse(itemA.last_commit_time)
        const timeB = Date.parse(itemB.last_commit_time)
        return timeB - timeA
      })
      this.branchesData = data['branch_list']
    },
    handleBranchData() {
      this.branchesData.forEach((branch) => {
        this.branches.push(branch.name)
      })
      if (this.releaseData.branch) {
        this.commitForm.branch = this.releaseData.branch
        return
      }
      this.commitForm.branch = this.branchesData.length > 0
        ? this.branchesData[0].name : ''
    },
    async getMemberCommitListByBranch() {
      const params = { branch: this.commitForm.branch }
      const res = await getMemberCommitListByBranch(this.selectedRepositoryId, params)
      const commitId = res.data.length !== 0 ? res.data[0].short_id : null
      const harborCommitId = commitId !== null ? commitId.substring(0, commitId.length - 1) : ''
      this.commitId = harborCommitId
      this.handleSelectedRepoName(this.commitForm.branch)
    },
    async handleSelectedRepoName(repo) {
      if (!repo) return
      this.checkHarborLoading = true
      this.onChangeCommitId(repo)
      const harborData = await getHarborRepoList(this.selectedProjectId)
        .catch(() => { this.checkHarborLoading = false })
      this.checkSelectedRepoName(harborData.data, repo)
      this.loading = false
    },
    onChangeCommitId(repo) {
      const branch = this.branchesData.find(branchData => branchData.name === repo)
      this.commitId = branch.short_id
    },
    checkSelectedRepoName(harborData, repo) {
      if (!harborData) {
        this.checkHarborLoading = false
        return
      }
      const imageNameSplittedArray = harborData.map((item) => item.name.split('/'))
      // normal imageName = project/repository
      // backend cache imageName = project/repository/cache
      const repoNameIndex = imageNameSplittedArray.findIndex((splittedName) =>
        splittedName[1] === repo && splittedName.length === 2)
      if (repoNameIndex === -1) {
        this.repoArtifact = {}
        this.checkHarborLoading = false
      } else {
        const selectedRepo = harborData[repoNameIndex].name
        this.checkHarborImage(selectedRepo)
      }
    },
    async checkHarborImage(selectedRepo) {
      const params = {
        repository_fullname: selectedRepo,
        tag_name: this.commitId,
        is_like: true
      }
      this.repoArtifact = await getRepoArtifacts(params)
      if (this.repoArtifact.data && this.repoArtifact.data.length > 0) {
        this.image = this.repoArtifact.data[0].name
      } else {
        this.image = 'noImage'
      }
      this.checkHarborLoading = false
    },
    onBack() {
      const releaseData = {
        commit: this.commitId,
        branch: this.commitForm.branch
      }
      const updateData = {
        image: this.image
      }
      this.$emit('onBack', releaseData, updateData)
    },
    onNext() {
      const releaseData = {
        commit: this.commitId,
        branch: this.commitForm.branch
      }
      const updateData = {
        image: this.image
      }
      this.$emit('onNext', releaseData, updateData)
    },
    onChangeImage(row) {
      this.commitForm.branch = row.branch
      this.commitId = row.commit_id
      if (row.image_tag) {
        this.image = row.image_tag
      } else if (row.image) {
        this.image = row.commit_id
      } else {
        this.image = 'noImage'
      }
    }
  }
}
</script>
