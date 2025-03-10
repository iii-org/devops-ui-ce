<template>
  <el-row
    v-loading="isLoading"
    :element-loading-text="$t('Loading')"
    class="app-container"
  >
    <el-col>
      <el-row :gutter="10" align="middle" type="flex">
        <el-col :span="2">
          <el-button
            class="text-title link-text-color"
            icon="el-icon-arrow-left"
            size="medium"
            type="text"
            @click="handleBack"
          >
            {{ $t('general.Back') }}
          </el-button>
        </el-col>
        <el-col :span="16">
          <span class="text-title">
            {{ selectedProject.display_name }}
          </span>
        </el-col>
        <el-col :span="6" class="text-right">
          <el-input
            v-model="keyword"
            :placeholder="$t('general.SearchBranch')"
            :style="{ width: '250px' }"
            prefix-icon="el-icon-search"
            size="small"
          />
        </el-col>
      </el-row>
      <el-divider />
      <div class="flex justify-between mb-3">
        <div>
          <el-button size="small" @click="handleReset">
            {{ $t('general.Cancel') }}
          </el-button>
          <el-button size="small" type="primary" @click="updatePipelineBranch">
            {{ $t('general.Save') }}
          </el-button>
        </div>
      </div>
      <el-table ref="tableData" :data="filteredData" fit>
        <el-table-column
          :label="$t('Git.Branch')"
          align="center"
          prop="branch"
          width="100"
        />
        <el-table-column
          :label="$t('general.Description')"
          align="center"
          min-width="120"
          prop="commit_message"
          show-overflow-tooltip
        />
        <ElTableColumnTime
          :label="$t('general.LastUpdateTime')"
          prop="commit_time"
          width="160"
        />
        <el-table-column
          v-for="(tool, idx) in testingToolNames"
          :key="`${tool.name}-${idx}`"
          align="center"
          width="120"
        >
          <template slot="header">
            <div class="mb-2">
              {{ tool.name }}
            </div>
            <el-checkbox
              v-if="listData.length > 1"
              v-model="tool.selectedAll"
              @change="handleSelectAll(tool)"
            />
          </template>
          <template slot-scope="{ row }">
            <el-checkbox
              v-if="row.testing_tools[idx].key !== '-'"
              v-model="row.testing_tools[idx].enable"
              @change="checkAllSelect(row.testing_tools[idx], row.branch)"
            />
            <span v-else> - </span>
          </template>
        </el-table-column>
      </el-table>
    </el-col>
  </el-row>
</template>

<script>
import { editPipelineBranch, getPipelineBranch } from '@/api/projects'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import Table from '@/mixins/Table'

export default {
  name: 'AdvanceBranchSettings',
  components: {
    ElTableColumnTime: () => import('@shared/components/ElTableColumnTime')
  },
  mixins: [BasicData, SearchBar, Pagination, Table],
  beforeRouteLeave(next) {
    if (this.isChanged) {
      this.$confirm(
        this.$t('Notify.UnSavedChanges'),
        this.$t('general.Warning'),
        {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        }
      )
        .then(() => {
          next()
        })
        .catch(() => {
          next(false)
        })
    } else {
      next()
    }
  },
  data() {
    return {
      isLoading: false,
      searchKeys: ['branch'],
      testingToolNames: [],
      isChanged: false
    }
  },
  mounted() {
    this.fetchPipelineBranch()
  },
  methods: {
    async fetchPipelineBranch() {
      this.isLoading = true
      try {
        const res = await getPipelineBranch(this.selectedRepositoryId, {
          all_data: true
        })
        const firstKey = Object.keys(res.data)[0]
        const headKeys = res.data[firstKey]?.testing_tools.map(
          (tool) => tool.key
        )
        this.listData = Object.keys(res.data).map((key) => {
          const { commit_message, commit_time, testing_tools } = res.data[key]
          const testingTools = headKeys.map((headKey) => {
            const tool = testing_tools.find((i) => i.key === headKey)
            return {
              enable: tool ? tool.enable : false,
              key: tool ? headKey : '-'
            }
          })
          return {
            branch: key,
            commit_message,
            commit_time,
            testing_tools: testingTools
          }
        })
        this.testingToolNames = this.listData[0].testing_tools.map((tool) => ({
          selectedAll: this.checkAllSelected(tool.name),
          name: tool.name
        }))
      } catch (err) {
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },
    checkAllSelected(name) {
      const status = this.filteredData
        .flatMap((i) => i.testing_tools)
        .filter((i) => i.name === name)
        .map((i) => i.enable)
      return status.every((i) => i === true)
    },
    async updatePipelineBranch() {
      const sendData = {
        detail: this.listData.reduce(
          (result, cur) =>
            Object.assign(result, {
              [cur.branch]: cur.testing_tools
                .filter((tool) => tool.key !== '-')
                .map((tool) => ({ enable: tool.enable, key: tool.key }))
            }),
          {}
        )
      }
      this.isLoading = true
      try {
        await editPipelineBranch(this.selectedRepositoryId, sendData)
        this.isChanged = false
      } catch (error) {
        this.$message({
          title: this.$t('general.Error'),
          message: error,
          type: 'error'
        })
      } finally {
        this.fetchPipelineBranch()
        this.isLoading = false
      }
    },
    handleSelectAll(tool) {
      this.isChanged = true
      const { selectedAll, name } = tool
      this.filteredData.forEach((data) =>
        data.testing_tools.forEach((testingTool) => {
          if (testingTool.name === name) testingTool.enable = selectedAll
        })
      )
    },
    checkAllSelect(tool) {
      const { name } = tool
      this.isChanged = true
      const status = this.filteredData
        .flatMap((i) => i.testing_tools)
        .filter((i) => i.name === name)
        .map((i) => i.enable)
      const value = status.every((i) => i === true)
      const idx = this.testingToolNames.findIndex((i) => i.name === name)
      this.testingToolNames[idx].selectedAll = value
    },
    handleReset() {
      this.testingToolNames = []
      this.isChanged = false
      this.fetchPipelineBranch()
    },
    handleBack() {
      this.$router.push({
        name: 'ProjectSettings',
        params: { projectName: this.selectedProject.identifier }
      })
    }
  }
}
</script>
