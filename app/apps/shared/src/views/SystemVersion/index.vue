<template>
  <div class="app-container">
    <VersionUpdater />
    <div class="flex justify-between items-center bg-gray-600 text-white py-3 px-4 rounded mb-5">
      <div class="text-title">
        <span>{{ $t('SystemVersion.DeploymentName') }}： </span>
        <span class="select-all">{{ deployment_name }}</span>
      </div>
      <div>
        <span class="text-title">{{ $t('SystemVersion.DeploymentUuid') }}： </span>
        <span class="text-title select-all mr-4">{{ deployment_uuid }}</span>
        <el-button
          :loading="isLoading"
          size="small"
          class="buttonSecondaryReverse"
          plain
          @click="handleUploadInfoClick"
        >
          {{ this.$t('SystemVersion.UploadSystemInfos') }}
        </el-button>
      </div>
    </div>
    <ElTableResponsive
      :data="list"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      fit
      highlight-current-row
    />
    <VersionAuth v-if="!isLite" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import VersionAuth from './components/VersionAuth'
import VersionUpdater from './components/VersionUpdater'
import { getVersion } from '@/api/dashboard'
import { getDevopsApiServerVersion, updateSystemInfoReport } from '@/api/devopsVersion'
import { ElTableResponsive } from '@shared/components'

export default {
  name: 'SystemVersion',
  components: {
    ElTableResponsive,
    VersionAuth,
    VersionUpdater
  },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'gray',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      list: [],
      deployment_name: '',
      deployment_uuid: '',
      isLoading: false
    }
  },
  computed: {
    ...mapGetters(['device']),
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    },
    isMobile() {
      return this.device === 'mobile'
    },
    tableColumns() {
      return [
        {
          label: this.$t('SystemVersion.Source'),
          prop: 'source',
          align: 'center',
          width: 140
        },
        {
          label: this.$t('SystemVersion.Version'),
          prop: 'tag',
          align: 'center',
          width: 180
        },
        {
          label: this.$t('SystemVersion.CommitID'),
          prop: 'commitId'
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'commitTime',
          align: 'center',
          width: 180,
          type: 'time'
        }
      ]
    }
  },
  created() {
    const uiData = {
      source: 'UI',
      tag: process.env.VUE_APP_TAG,
      commitId: process.env.VUE_APP_COMMIT,
      commitTime: process.env.VUE_APP_DATE
    }
    this.list.push(uiData)
    this.fetchData()
    this.fetchVersionInfo()
  },
  methods: {
    fetchData() {
      this.listLoading = true
      getVersion().then((response) => {
        const apiData = {
          source: 'API',
          tag: response.data.git_tag,
          commitId: response.data.git_commit_id,
          commitTime: response.data.git_date
        }
        this.list.push(apiData)
      })
    },
    fetchVersionInfo() {
      getDevopsApiServerVersion().then((res) => {
        const { deployment_name, deployment_uuid } = res.data
        this.deployment_name = deployment_name
        this.deployment_uuid = deployment_uuid
      })
    },
    handleUploadInfoClick() {
      this.isLoading = true
      updateSystemInfoReport()
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Uploaded'),
            type: 'success'
          })
        })
        .catch((err) => {
          this.$message({
            title: this.$t('general.Error'),
            message: err,
            type: 'error'
          })
        })
        .then(() => {
          this.isLoading = false
        })
    }
  }
}
</script>
