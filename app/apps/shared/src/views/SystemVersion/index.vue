<template>
  <div class="app-container">
    <VersionUpdater />
    <div
      :class="!isMobile ? 'flex justify-between' : ''"
      class="items-center bg-gray-600 text-white py-3 px-4 rounded mb-5"
    >
      <div class="text-title">
        <span> {{ $t('SystemVersion.DeploymentName') }}： </span>
        <span class="select-all">
          {{ deployment_name }}
        </span>
      </div>
      <div>
        <span class="text-title">
          {{ $t('SystemVersion.DeploymentUuid') }}：
        </span>
        <span class="text-title select-all mr-4">
          {{ deployment_uuid }}
        </span>
        <el-button
          :loading="isLoading"
          plain
          size="small"
          type="success"
          @click="handleUploadInfoClick"
        >
          {{ $t('SystemVersion.UploadSystemInfos') }}
        </el-button>
      </div>
    </div>
    <ElTableResponsive
      :columns="tableColumns"
      :data="list"
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

import { getSystemVersion, uploadSystemInfo } from '@/api_v3/system'

export default {
  name: 'SystemVersion',
  components: {
    ElTableResponsive: () => import('@shared/components/ElTableResponsive'),
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
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
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
      tag: import.meta.env.VITE_APP_TAG,
      commitId: import.meta.env.VITE_APP_COMMIT,
      commitTime: import.meta.env.VITE_APP_DATE
    }
    this.list.push(uiData)
    this.fetchVersionInfo()
  },
  methods: {
    fetchVersionInfo() {
      getSystemVersion().then((res) => {
        const { site, build } = res.data
        this.deployment_name = site.name
        this.deployment_uuid = site.uuid

        const apiData = {
          source: 'API',
          tag: build.version,
          commitId: build.hash,
          commitTime: build.date
        }
        this.list.push(apiData)
      })
    },
    async handleUploadInfoClick() {
      this.isLoading = true
      await uploadSystemInfo()
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
