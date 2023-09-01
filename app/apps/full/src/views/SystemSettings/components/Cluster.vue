<template>
  <div class="app-container">
    <template v-if="updateStatus === 'UPDATE_INIT'">
      <div class="text-right">
        <el-button
          class="buttonSecondary"
          icon="el-icon-plus"
          :size="isMobile ? 'small' : 'medium'"
          @click="addCluster"
        >
          {{ $t('general.Add') }}
        </el-button>
      </div>
      <el-divider />
      <el-table-responsive
        ref="tableData"
        v-loading="listLoading"
        :element-loading-text="$t('Loading')"
        :data="listData"
        :columns="tableColumns"
        :tree-props="{
          children: 'application',
          hasChildren: 'hasChildren'
        }"
        :row-class-name="getRowClass"
        fit
      >
        <template v-slot:expand="{row}">
          <ul>
            <li
              v-for="(item, index) in row.application"
              :key="index"
              class="mb-5"
            >
              <span class="mr-5">
                {{ item.project_name }}
              </span>
              <span class="mr-5">
                {{ item.tag }}
              </span>
              <el-tag
                :type="tagType(item.status)" effect="dark"
                :size="isMobile ? 'small' : 'medium'"
              >
                {{ clusterStatus(item.status) }}
              </el-tag>
            </li>
          </ul>
        </template>
        <template v-slot:url="{row}">
          <el-link
            class="linkTextColor"
            target="_blank"
            :href="row.cluster_host"
          >
            {{ row.cluster_host }}
          </el-link>
        </template>
        <template v-slot:update="{row}">
          {{ getLocalTime(row.update_at) }}
        </template>
        <template v-slot:status="{row}">
          <el-tag
            :type="row.disabled ? 'danger' : 'success'"
            :size="isMobile ? 'small' : 'medium'"
          >
            {{ row.disabled ? $t('general.Disable') : $t('general.Enable') }}
          </el-tag>
        </template>
        <template v-slot:actions="{row}">
          <el-tooltip
            placement="bottom"
            :content="$t('general.Edit')"
          >
            <em
              class="ri-file-edit-line finished operate-button"
              @click="editCluster(row)"
            />
          </el-tooltip>
          <el-tooltip
            placement="bottom"
            :content="!row.disabled ? $t('general.Disable') : $t('general.Enable')"
          >
            <em
              :class="row.disabled
                ? 'ri-record-circle-line finished operate-button'
                : 'ri-pause-circle-line danger operate-button'"
              @click="toggleUsage(row)"
            />
          </el-tooltip>
        </template>
      </el-table-responsive>
    </template>
    <AddCluster
      v-else-if="updateStatus === 'UPDATE_POST'"
      @initCluster="initCluster"
    />
    <EditCluster
      v-else-if="updateStatus === 'UPDATE_PUT'"
      :cluster-id="clusterId"
      @initCluster="initCluster"
    />
  </div>
</template>

<script>
import {
  getDeployedHostsLists,
  updateDeployHostsById
} from '@/api/deploy'
import { BasicData } from '@/mixins'
import { ElTableResponsive } from '@/components'
import { getLocalTime } from '@/utils/handleTime'
import { mapGetters } from 'vuex'

export default {
  name: 'Cluster',
  components: {
    AddCluster: () => import('./AddCluster'),
    EditCluster: () => import('./EditCluster'),
    ElTableResponsive
  },
  mixins: [BasicData],
  data() {
    return {
      updateStatus: 'UPDATE_INIT',
      clusterId: 0
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    tableColumns() {
      return [
        {
          label: '',
          prop: 'expand',
          slot: 'expand',
          type: 'expand'
        },
        {
          label: this.$t('SystemDeploySettings.Index'),
          prop: 'index',
          align: 'center',
          width: 100,
          type: 'index'
        },
        {
          label: this.$t('SystemDeploySettings.RemoteDeploymentEnvironment'),
          prop: 'name',
          align: 'center',
          width: 150
        },
        {
          label: this.$t('SystemDeploySettings.ClusterName'),
          prop: 'cluster_name',
          align: 'center',
          width: 150
        },
        {
          label: 'URL',
          prop: 'url',
          align: 'center',
          minWidth: 300,
          slot: 'url'
        },
        {
          label: this.$t('SystemDeploySettings.Account'),
          prop: 'cluster_user',
          align: 'center'
        },
        {
          label: this.$t('SystemDeploySettings.LastUpdateTime'),
          prop: 'update',
          align: 'center',
          width: 150,
          slot: 'update'
        },
        {
          label: this.$t('SystemDeploySettings.Status'),
          prop: 'status',
          align: 'center',
          width: 100,
          slot: 'status'
        },
        {
          label: this.$t('SystemDeploySettings.Actions'),
          prop: 'actions',
          align: 'center',
          width: 100,
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getDeployedHostsLists()
      return res.data.cluster
    },
    addCluster() {
      this.updateStatus = 'UPDATE_POST'
    },
    async editCluster(row) {
      this.clusterId = row.id
      this.updateStatus = 'UPDATE_PUT'
    },
    toggleUsage(row) {
      row.disabled = !row.disabled
      this.updateHostsDisabled(row)
    },
    async updateHostsDisabled(row) {
      const { name, disabled } = row
      const clusterId = row.id
      const formData = new FormData()
      const params = ['name', 'disabled', 'k8s_config_file', 'k8s_config_string']
      params.forEach(param => formData.delete(param))
      formData.append('name', name)
      formData.append('disabled', disabled)
      this.updateDeployHostsById(clusterId, formData)
    },
    async updateDeployHostsById(clusterId, formData) {
      await updateDeployHostsById(clusterId, formData)
        .then(() => {
          this.loadData()
          this.showUpdateMessage()
        })
        .catch((error) => {
          console.error(error)
        })
    },
    initCluster(isLoad) {
      this.updateStatus = 'UPDATE_INIT'
      if (isLoad) this.loadData()
    },
    clusterStatus(status) {
      switch (status) {
        case 'Initializing':
          return this.$t('SystemDeploySettings.Initializing')
        case 'Start Kubernetes deployment':
          return this.$t('SystemDeploySettings.StartDeployment')
        case 'Finish Kubernetes deployment':
          return this.$t('SystemDeploySettings.Finished')
        case 'Error, No Image need to be replicated':
          return this.$t('general.Error')
      }
    },
    tagType(status) {
      switch (status) {
        case 'Initializing':
          return 'info'
        case 'Start Kubernetes deployment':
          return 'warning'
        case 'Finish Kubernetes deployment':
          return 'success'
        case 'Error, No Image need to be replicated':
          return 'danger'
      }
    },
    getRowClass({ row }) {
      if (row.application.length === 0) return 'hide-expand-icon'
      return ''
    },
    getLocalTime(time) {
      return getLocalTime(time)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-table {
  .hide-expand-icon {
    .el-table__expand-column .cell {
      display: none;
    }
  }
}
</style>
