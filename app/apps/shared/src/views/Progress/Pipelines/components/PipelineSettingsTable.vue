<template>
  <div>
    <template v-if="settingStatus === 'active'">
      <div class="flex justify-between items-center mb-1">
        <div>
          <span class="text-sm"> {{ $t('Git.Branch') }}： </span>
          <el-select
            v-model="selectedBranchIndex"
            :style="{ width: isMobile ? '90px' : '140px' }"
            class="mr-2"
            size="mini"
          >
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <span>
                {{ item.label }}
              </span>
              <span v-if="item.default"> (default) </span>
            </el-option>
          </el-select>
        </div>
        <div
          :style="{ minWidth: isMobile ? '140px' : '200px' }"
          class="text-right"
        >
          <el-button
            :disabled="!selectedToolData.length"
            :loading="isLoading"
            plain
            size="mini"
            type="success"
            @click="updatePipelineBranch(false)"
          >
            {{ $t('general.Save') }}
          </el-button>
          <el-button
            :disabled="!selectedToolData.length"
            :loading="isLoading"
            icon="el-icon-refresh"
            size="mini"
            type="success"
            @click="
              isDataChanged
                ? updatePipelineBranch(true)
                : updateUnalteredPipelineBranch()
            "
          >
            <span v-if="!isMobile">
              {{ $t('general.DirectExecution') }}
            </span>
          </el-button>
        </div>
      </div>
      <template v-if="exceedPipelineNameLengthWarning">
        <div class="notification-danger">
          <span style="vertical-align: -webkit-baseline-middle">
            {{ exceedPipelineNameLengthWarning }}
          </span>
        </div>
      </template>
      <template v-if="upperCasePipelineNameWarning">
        <div class="notification-danger">
          <span style="vertical-align: -webkit-baseline-middle">
            {{ upperCasePipelineNameWarning }}
          </span>
        </div>
      </template>
      <el-table
        v-if="selectedToolData.length > 0"
        v-loading="isLoading"
        :data="selectedToolData"
        :element-loading-text="$t('Updating')"
        :show-header="false"
        class="overflow-auto"
        fit
        max-height="40vh"
      >
        <el-table-column min-width="200">
          <template slot-scope="{ row: { key } }">
            {{ $te(`Plugin.${key}`) ? $t(`Plugin.${key}`) : key }}
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="50">
          <template slot-scope="{ row }">
            <el-tooltip
              :content="getTooltipContent(row)"
              :disabled="getTooltipDisabled(row)"
              effect="dark"
              placement="bottom"
            >
              <el-switch
                v-model="row.enable"
                :disabled="getSwitchDisabled(row)"
                @change="(value) => handleSwitchChange(row.key, value)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <NoCIFile
        v-else
        :has-generate-c-i-error="hasGenerateCIError"
        :is-loading.sync="isLoading"
        @onGenerateCI="handleGenerateCI"
      />
    </template>
    <template v-else-if="settingStatus === 'unSupported'">
      <NoCIFile
        :has-generate-c-i-error="hasGenerateCIError"
        :is-loading.sync="isLoading"
        @onGenerateCI="handleGenerateCI"
      />
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
import { mapGetters } from 'vuex'
import {
  createNewPipeline,
  generateCiYaml,
  getPipelineBranches,
  updatePipelineBranches
} from '@/api_v3/gitlab'

export default {
  name: 'PipelineSettingsTable',
  components: {
    NoCIFile: () => import('./NoCIFile.vue')
  },
  data() {
    return {
      isLoading: false,
      isUseNewSwitchControl: false,
      branches: [],
      options: [],
      pipelineSettingsData: [],
      originData: [],
      selectedBranchIndex: 0,
      selectedToolData: [],
      settingStatus: '',
      hasGenerateCIError: false,
      requireRules: [
        {
          key: 'sonarqube',
          required: ''
        },
        {
          key: 'anchore-code',
          required: ''
        },
        {
          key: 'checkmarx',
          required: ''
        },
        {
          key: 'build',
          required: ''
        },
        {
          key: 'deploy',
          required: 'build'
        },
        {
          key: 'anchore',
          required: 'build'
        },
        {
          key: 'zap',
          required: 'deploy'
        },
        {
          key: 'webinspect',
          required: 'deploy'
        },
        {
          key: 'postman',
          required: 'deploy'
        },
        {
          key: 'sideex',
          required: 'deploy'
        },
        {
          key: 'semgrep',
          required: ''
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'selectedProjectId', 'device']),
    getPipelineName() {
      return `${this.selectedProject.identifier}-${this.selectedBranch}-serv-dpy`
    },
    exceedPipelineNameLengthWarning() {
      if (this.getPipelineName.length > 53) {
        return this.$t('Notify.pluginNameLengthWarnNotifications')
      }
      return false
    },
    upperCasePipelineNameWarning() {
      if (
        !this.getPipelineName.match(
          /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
        )
      ) {
        return this.$t('Notify.pluginNameWarnNotifications')
      }
      return false
    },
    selectedRepositoryId() {
      return this.selectedProject.repository_id
    },
    selectedBranch() {
      return this.branches[this.selectedBranchIndex]
    },
    originToolData() {
      return this.originData[this.selectedBranchIndex].testing_tools
    },
    isDataChanged() {
      let isChanged = false
      this.selectedToolData.forEach((item, index) => {
        if (item.enable !== this.originToolData[index].enable) isChanged = true
      })
      return isChanged
    },
    getTooltipContent() {
      return (row) => {
        const { key } = row
        const tool = this.requireRules.find((rule) => rule.key === key)
        return tool && this.$te(`Plugin.${tool.required}`)
          ? this.$t('PipelineSettingsTable.OpenPluginWarning', {
              plugin: this.$t(`Plugin.${tool.required}`)
            })
          : ''
      }
    },
    getTooltipDisabled() {
      return (row) => {
        const { enable, key } = row
        if (enable) return true
        const tool = this.requireRules.find((rule) => rule.key === key)
        return tool ? !tool.required : true
      }
    },
    getSwitchDisabled() {
      return (row) => {
        const { key } = row
        const tool = this.requireRules.find((rule) => rule.key === key)
        if (!tool) return false
        const toolData = this.selectedToolData.find(
          (data) => data.key === tool.required
        )
        return toolData ? !toolData.enable : false
      }
    },
    isDataAllFalse() {
      return this.selectedToolData.every((item) => !item.enable)
    },
    selectedBranchData() {
      const data = []
      const selectedData = this.pipelineSettingsData[this.selectedBranchIndex]
      data.push(selectedData)
      return data
    },
    branchesList() {
      return function (data) {
        return Object.keys(data)
      }
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    selectedProject() {
      this.fetchPipelineBranch()
    },
    selectedBranchIndex(index) {
      this.selectedToolData =
        this.pipelineSettingsData[this.selectedBranchIndex].testing_tools
    }
  },
  mounted() {
    this.settingStatus = ''
    this.fetchPipelineBranch()
  },
  methods: {
    async fetchPipelineBranch() {
      if (!this.selectedRepositoryId) return
      this.isLoading = true
      try {
        const branches = await getPipelineBranches(this.selectedRepositoryId, {
          all: true
        })
        this.handleStages(branches.data)
      } catch (err) {
        this.settingStatus = 'error'
      } finally {
        this.isLoading = false
      }
    },
    handleStages(data) {
      const hasStages = this.branchesList(data).length > 0
      if (hasStages) {
        this.getBranch(data)
        this.getPipelineSettingsData(data)
        this.settingStatus = 'active'
      } else {
        this.resetSettings()
      }
    },
    getBranch(data) {
      const branches = this.branchesList(data)
      const options = []
      branches.forEach((branch, index) => {
        const option = {
          value: index,
          label: branch,
          default: data[branch]['default']
        }
        options.push(option)
      })
      this.branches = branches
      this.options = options
    },
    getPipelineSettingsData(data) {
      const branches = this.branchesList(data)
      const settingsData = branches.map((branch) => {
        const { commit_message, commit_time, testing_tools } = data[branch]
        return {
          branch,
          commit_message,
          commit_time,
          testing_tools: testing_tools.map((tool) => ({
            key: tool.key,
            enable: tool.enable
          }))
        }
      })
      this.pipelineSettingsData = settingsData
      this.selectedToolData =
        this.pipelineSettingsData[this.selectedBranchIndex].testing_tools
      this.setOriginData(settingsData)
    },
    setOriginData(data) {
      this.originData = JSON.parse(JSON.stringify(data))
    },
    resetSettings() {
      this.settingStatus = 'unSupported'
      this.branches = []
      this.options = []
      this.pipelineSettingsData = []
      this.selectedToolData = []
    },
    async updatePipelineBranch(runPipeline) {
      if (runPipeline && this.isDataAllFalse) {
        this.showEmptyPluginMessage()
        return
      }
      await this.handleEditPipelineBranch(runPipeline)
    },
    async handleEditPipelineBranch(runPipeline) {
      try {
        if (runPipeline) {
          await this.editPipelineBranch(!runPipeline).then(async () => {
            await this.updateUnalteredPipelineBranch()
          })
        } else {
          await this.editPipelineBranch(runPipeline)
        }
        await this.fetchPipelineBranch()
        if (!runPipeline) {
          this.showSuccessMessage(this.$t('Notify.Saved'))
        }
      } catch (err) {
        this.showErrorMessage(err)
      }
    },
    async editPipelineBranch(runPipeline) {
      const sendData = this.getSendData(runPipeline)
      await updatePipelineBranches(this.selectedRepositoryId, sendData)
    },
    async updateUnalteredPipelineBranch() {
      if (this.isDataAllFalse) {
        this.showEmptyPluginMessage()
        return
      }

      this.isLoading = true
      try {
        await createNewPipeline(this.selectedRepositoryId, {
          branch: this.selectedBranch
        })
      } catch (err) {
        this.showErrorMessage(err)
      } finally {
        this.isLoading = false
        this.showSuccessMessage(
          this.$t('ProgressPipelines.RerunPipeline', [this.selectedBranch])
        )
        this.$emit('reexecute')
      }
    },
    getSendData(runPipeline) {
      const getData = (result, cur) =>
        Object.assign(result, {
          [cur.branch]: cur.testing_tools.map((tool) => ({
            enable: tool.enable,
            key: tool.key
          }))
        })
      const detail = this.selectedBranchData.reduce(getData, {})
      return runPipeline ? { run: true, detail } : { detail }
    },
    async handleGenerateCI() {
      if (this.selectedRepositoryId === -1) return
      this.isLoading = true
      try {
        const sendData = {
          branch_name: this.selectedBranch
        }
        const res = this.selectedBranch
          ? await generateCiYaml(this.selectedRepositoryId, sendData)
          : await generateCiYaml(this.selectedRepositoryId)
        this.showSuccessMessage(res.data)
        this.hasGenerateCIError = false
        await this.fetchPipelineBranch()
        this.updateUnalteredPipelineBranch()
      } catch (err) {
        this.hasGenerateCIError = true
      } finally {
        this.isLoading = false
      }
    },
    handleSwitchChange(key, value) {
      if (value) return
      const checkList = this.requireRules
        .filter((rule) => rule.required === key)
        .map((data) => data.key)
      if (checkList.length === 0) return
      this.selectedToolData = this.selectedToolData.map((data) => {
        if (checkList.findIndex((tool) => tool === data.key) >= 0) {
          data.enable = false
        }
        return data
      })
      checkList.forEach((item) => {
        this.handleSwitchChange(item, false)
      })
    },
    showErrorMessage(err) {
      this.$message({
        title: this.$t('general.Error'),
        message: err,
        type: 'error'
      })
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    },
    showEmptyPluginMessage() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('PipelineSettingsTable.NoSelectedPluginWarning'),
        type: 'warning'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-table::before {
  z-index: inherit;
}
</style>
