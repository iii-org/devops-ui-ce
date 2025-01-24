<template>
  <div v-loading="isLoading" :element-loading-text="$t('Loading')">
    <div v-if="isShowTitle" class="text-lg mr-3 mb-2">
      {{ $t('Plugin.Manage') }}
    </div>
    <template v-if="settingStatus === 'Active'">
      <div class="flex justify-between items-center mb-1">
        <div>
          <span class="text-sm mr-2"> {{ $t('Git.Branch') }}： </span>
          <span class="text-title">
            {{ branch }}
          </span>
        </div>
        <el-button
          class="link-text-color"
          size="medium"
          type="text"
          @click="handleClick"
        >
          {{ $t('route.AdvanceBranchSettings') }}
        </el-button>
      </div>
      <el-table
        v-loading="isStagesLoading"
        :data="stagesData"
        :element-loading-text="$t('Updating')"
        :show-header="false"
        fit
      >
        <el-table-column prop="name" />
        <el-table-column align="center">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.has_default_branch"
              @change="handleStageChange(scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>
      <div class="text-right mt-3">
        <el-button
          :loading="isStagesLoading"
          size="mini"
          @click="fetchPipeDefBranch"
        >
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button
          :loading="isStagesLoading"
          size="mini"
          type="primary"
          @click="updatePipeDefBranch"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </div>
    </template>
    <template v-else-if="settingStatus === 'unSupported'">
      <div class="text-center text-title mb-3">
        {{ $t('Plugin.CustomEnvWarning') }}
      </div>
      <div class="text-center text-danger font-bold">
        {{ $t('Plugin.CustomRecommendWarning') }}
      </div>
    </template>
    <template v-else-if="settingStatus === 'error'">
      <div class="text-center text-title">
        {{ $t('Notify.LoadFail') }}
      </div>
    </template>
    <template v-else>
      <el-empty :description="$t('general.NoData')" :image-size="100" />
    </template>
  </div>
</template>

<script>
import {
  editPipelineDefaultBranch,
  getPipelineDefaultBranch
} from '@/api/projects'
import { mapGetters } from 'vuex'

export default {
  name: 'PipelineSettings',
  props: {
    isShowTitle: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoading: false,
      isStagesLoading: false,
      settingStatus: '',
      branch: '',
      stagesData: [],
      services: ['web', 'db'],
      dependenceKeys: [
        'test-postman',
        'test-webinspect',
        'test-zap',
        'test-sideex'
      ]
    }
  },
  computed: {
    ...mapGetters(['selectedProject']),
    selectedRepositoryId() {
      return this.selectedProject.repository_id
    }
  },
  watch: {
    selectedProject() {
      this.fetchPipeDefBranch()
    }
  },
  mounted() {
    this.settingStatus = ''
    this.fetchPipeDefBranch()
  },
  methods: {
    async fetchPipeDefBranch() {
      if (this.selectedRepositoryId === -1) return
      this.isLoading = true
      try {
        const res = await getPipelineDefaultBranch(this.selectedRepositoryId)
        const hasStages = Object.keys(res.data).length > 0
        if (hasStages) {
          const { default_branch, stages } = res.data
          this.branch = default_branch
          this.stagesData = stages.map((stage) => stage)
          this.settingStatus = 'Active'
        } else {
          this.resetSettings()
        }
      } catch (err) {
        this.settingStatus = 'error'
      } finally {
        this.isLoading = false
      }
    },
    resetSettings() {
      this.settingStatus = 'unSupported'
      this.stagesData = []
      this.branch = ''
    },
    handleClick() {
      this.$router.push({
        name: 'AdvanceBranchSettings',
        params: { projectName: this.selectedProject.name }
      })
    },
    handleStageChange(stage) {
      const { key, has_default_branch } = stage
      if (this.services.includes(key)) {
        if (has_default_branch) return
        this.dependenceKeys.forEach((dependenceKey) => {
          this.getHasDefaultBranch(dependenceKey, has_default_branch)
        })
      }
      if (this.dependenceKeys.includes(key)) {
        if (!has_default_branch) return
        this.services.forEach((serviceKey) => {
          this.getHasDefaultBranch(serviceKey, has_default_branch)
        })
      }
    },
    getHasDefaultBranch(key, has_default_branch) {
      const idx = this.stagesData.findIndex(
        (stageData) => key === stageData.key
      )
      if (idx < 0) return
      this.stagesData[idx].has_default_branch = has_default_branch
    },
    async updatePipeDefBranch() {
      const sendData = { detail: { stages: this.stagesData }}
      this.isStagesLoading = true
      try {
        await editPipelineDefaultBranch(this.selectedRepositoryId, sendData)
      } catch (err) {
        this.fetchPipeDefBranch()
        this.$notify({
          title: this.$t('general.Error'),
          message: err,
          type: 'error'
        })
      } finally {
        this.isStagesLoading = false
      }
    }
  }
}
</script>
