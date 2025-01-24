<template>
  <div>
    <slot name="description"></slot>
    <el-card shadow="never">
      <div class="flex justify-between">
        <el-form ref="form" :inline="true" :model="commitForm" class="w-full">
          <el-row>
            <el-col :span="9" :xs="24">
              <el-form-item
                :label="$t('Git.Branch')"
                style="padding-right: 10px"
              >
                <el-select
                  v-if="branches.length > 0"
                  v-model="commitForm.branch"
                  filterable
                  style="max-width: 202px"
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
            <el-col :span="9" :xs="24">
              <el-form-item :label="$t('Git.Commit')">
                <el-input v-if="commitId" v-model="commitId" disabled />
                <div v-else>{{ $t('general.Nothing') }}</div>
              </el-form-item>
            </el-col>
            <el-col :span="6" :xs="24">
              <el-form-item>
                <span style="color: #606266; font-weight: 700">
                  {{ $t('PodsList.Image') }} :
                </span>
                <span
                  v-if="hasHarborTag"
                  class="custom-black font-code"
                  style="line-height: 40px"
                >
                  <em
                    v-if="!checkHarborLoading"
                    class="ri-git-commit-line"
                  ></em>
                  {{ checkHarborLoading ? $t('Updating') : image }}
                </span>
                <span v-else>
                  <span class="text-danger mr-3">
                    <em class="el-icon-warning"></em>
                    <span>{{ $t('Issue.NoImage') }}</span>
                  </span>
                </span>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <el-button
          :icon="isOpenTable ? 'el-icon-arrow-up' : 'el-icon-setting'"
          :size="isMobile ? 'small' : 'medium'"
          :type="isOpenTable ? 'danger' : 'primary'"
          class="mr-2"
          style="height: max-content"
          @click="isOpenTable = !isOpenTable"
        >
          <span v-if="!isMobile">{{
            isOpenTable ? $t('general.ok') : $t('Release.ModifyImage')
          }}</span>
        </el-button>
      </div>
      <el-collapse-transition>
        <ImageList
          v-if="isOpenTable"
          ref="imageList"
          :branch-name="commitForm.branch"
          :branches="branches"
          :commit-id="commitId"
          :image="image"
          :switch-data="switchData"
          @onChangeImage="onChangeImage"
        />
      </el-collapse-transition>
      <div class="text-right">
        <el-button :disabled="isLoading" @click="onBack">
          <em class="el-icon-back"></em>
          {{ $t('Release.Previous') }}
        </el-button>
        <el-popconfirm
          v-if="isShowNoReportWarning"
          :cancel-button-text="$t('Release.ContinueRelease')"
          :confirm-button-text="$t('Release.Reselect')"
          :title="$t('Release.NoTestReportWarning')"
          icon="el-icon-info"
          popper-class="danger max-w-[500px]"
          @cancel="onNext"
          @confirm="onReselect"
        >
          <el-button slot="reference" :disabled="isLoading">
            {{ $t('Release.Next') }}
            <em class="el-icon-right"></em>
          </el-button>
        </el-popconfirm>
        <el-popconfirm
          v-else-if="!hasHarborTag"
          :cancel-button-text="$t('general.Cancel')"
          :confirm-button-text="$t('Issue.DetermineContinue')"
          :title="$t('Issue.NoImageWarning')"
          icon="el-icon-info"
          popper-class="danger max-w-[500px]"
          @confirm="onNext"
        >
          <el-button slot="reference" :disabled="isLoading">
            {{ $t('Release.Next') }}
            <em class="el-icon-right"></em>
          </el-button>
        </el-popconfirm>
        <el-button v-else :disabled="isLoading" @click="onNext">
          {{ $t('Release.Next') }}
          <em class="el-icon-right"></em>
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getRepositoryBranches, getUserCommitList } from '@/api_v3/gitlab'
import { getHarborRepoList, getRepoArtifacts } from '@/api_v2/harbor'
import { getProjectImageList } from '@/api_v3/projects'

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
      passImageList: [],
      isShowNoReportWarning: true,
      switchData: {
        hasImage: true,
        hasAllCommit: false
      },
      image: 'noImage'
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device', 'services']),
    selectedRepositoryId() {
      return this.selectedProject.repository_id
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
        if (this.services.gitlab) {
          this.getBranchesData()
        }
        this.commitForm.note = ''
      }
    },
    'commitForm.branch': {
      handler(branch) {
        if (branch && this.services.harbor) {
          this.getImageList(branch)
        }
      },
      deep: true,
      immediate: true
    },
    commitId: {
      handler(commitId) {
        if (commitId) {
          this.checkImage()
        }
      }
    }
  },
  mounted() {
    if (this.services.gitlab) this.getBranchesData()
  },
  methods: {
    async getBranchesData() {
      this.branches = []
      this.loading = true
      await getRepositoryBranches(this.selectedRepositoryId).then((res) => {
        this.setBranchesData(res.data)
        this.handleBranchData()
        !this.releaseData.commit
          ? this.getMemberCommitListByBranch()
          : this.setSaveData()
      })
    },
    async getImageList(branch) {
      const params = {
        branch_name: branch,
        only_image: false,
        store: false,
        not_all: false,
        all: true
      }
      this.isLoading = true
      await getProjectImageList(this.selectedProjectId, params)
        .then((res) => {
          const imageList = res.data
          this.passImageList = imageList
          this.checkImage()
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    checkImage() {
      if (this.passImageList?.length === 0) return
      const hasImage = this.passImageList.findIndex(
        (image) => image.commit_id === this.commitId
      )
      this.isShowNoReportWarning = hasImage < 0
    },
    setSaveData() {
      this.commitId = this.releaseData.commit
      this.image = this.updateData.image
    },
    setBranchesData(data) {
      data.branches.sort((itemA, itemB) => {
        const timeA = Date.parse(itemA.commit.committed_date)
        const timeB = Date.parse(itemB.commit.committed_date)
        return timeB - timeA
      })
      this.branchesData = data['branches']
    },
    handleBranchData() {
      this.branchesData.forEach((branch) => {
        this.branches.push(branch.name)
      })
      if (this.releaseData.branch) {
        this.commitForm.branch = this.releaseData.branch
        return
      }
      this.commitForm.branch =
        this.branchesData.length > 0 ? this.branchesData[0].name : ''
    },
    async getMemberCommitListByBranch() {
      const params = { branch: this.commitForm.branch }
      const res = await getUserCommitList(this.selectedRepositoryId, params)
      const commitId = res.data.length !== 0 ? res.data[0].short_id : null
      const harborCommitId =
        commitId !== null ? commitId.substring(0, commitId.length - 1) : ''
      this.commitId = harborCommitId
      if (this.services.harbor) {
        this.handleSelectedRepoName(this.commitForm.branch)
      }
    },
    async handleSelectedRepoName(repo) {
      if (!repo) return
      this.checkHarborLoading = true
      this.onChangeCommitId(repo)
      const harborData = await getHarborRepoList(this.selectedProject.id).catch(
        () => {
          this.checkHarborLoading = false
        }
      )
      this.checkSelectedRepoName(harborData.data, repo)
      this.loading = false
    },
    onChangeCommitId(repo) {
      const branch = this.branchesData.find(
        (branchData) => branchData.name === repo
      )
      this.commitId = branch.commit.short_id
    },
    checkSelectedRepoName(harborData, repo) {
      if (!harborData) {
        this.checkHarborLoading = false
        return
      }
      const imageNameSplittedArray = harborData.map((item) =>
        item.name.split('/')
      )
      // normal imageName = project/repository
      // backend cache imageName = project/repository/cache
      const repoNameIndex = imageNameSplittedArray.findIndex(
        (splittedName) => splittedName[1] === repo && splittedName.length === 2
      )
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
    onReselect() {
      this.isOpenTable = true
      this.switchData.hasImage = false
      this.switchData.hasAllCommit = true
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
