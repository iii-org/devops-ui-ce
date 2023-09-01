<template>
  <div class="app-container">
    <div class="flex justify-between">
      <el-button
        type="text"
        size="medium"
        icon="el-icon-arrow-left"
        class="previous linkTextColor"
        @click="handleBackPage"
      >
        {{ $t('general.Back') }}
      </el-button>
      <span>
        <el-button
          v-if="tabName === 'Volume'"
          class="buttonPrimary"
          @click="handleSync"
        >
          {{ $t('general.Sync') }}
        </el-button>
        <el-button
          class="buttonSecondary"
          @click="handleSave"
        >
          {{ $t('general.Save') }}
        </el-button>
      </span>
    </div>
    <el-divider />
    <el-tabs
      v-model="tabName"
      type="card"
    >
      <el-tab-pane
        label="Environment"
        name="Environment"
      >
        <el-form
          ref="form"
          :model="form"
          :label-width="isMobile ? 'auto' : '120px'"
          :label-position="isMobile ? 'top' : 'right'"
          :size="isMobile ? 'small' : 'medium'"
          class="flex justify-center"
        >
          <el-row :gutter="10">
            <el-col :span="24" :sm="24">
              <el-form-item :label="$t('SystemDeploySettings.ClusterName')" required>
                <el-input v-model="form.clusterName" />
              </el-form-item>
            </el-col>
            <el-col :span="24" :sm="24" class="mb-5">
              <el-form-item :label="$t('general.Status')">
                <el-radio-group v-model="form.disabled">
                  <el-radio :label="false">
                    {{ $t('general.Enable') }}
                  </el-radio>
                  <el-radio :label="true">
                    {{ $t('general.Disable') }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="24" :sm="24">
              <el-form-item label="KubeConfig File">
                <ClusterFileUploader
                  ref="ClusterFileUploader"
                  style="margin-bottom: 20px;"
                  :disabled="disabled"
                  :class="{disabled: disabled}"
                  @hasFileList="hasFileList"
                />
                <el-input
                  v-model="form.kubeConfigString"
                  :disabled="!!hasUploadFile"
                  type="textarea"
                  :placeholder="$t('SystemDeploySettings.KubeConfigTextareaHint')"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
      <el-tab-pane
        label="Volume"
        name="Volume"
      >
        <ElTableResponsive
          v-loading="listLoading"
          :element-loading-text="$t('Loading')"
          :data="listData"
          :columns="tableColumns"
          :row-key="getRowKey"
          :expand-row-keys="expands"
          fit
          @expand-change="getPvcList"
        >
          <template v-slot:expanded="{row}">
            <ElTableResponsive
              v-loading="expandedLoading"
              :header-cell-style="{
                'font-size':'14px',
                color: 'black',
                'border-color': 'black'
              }"
              :cell-style="{'border-color': 'black'}"
              :style="{
                width: '80%',
                color: 'black',
                margin: '1.5rem auto',
                'border-bottom': '0.5px solid black'
              }"
              :element-loading-text="$t('Loading')"
              :data="pvcList"
              :columns="tableChildColumns"
              size="mini"
              fit
            />
          </template>
          <template v-slot:status="{row}">
            <el-tag :type="row.status === 'Disabled' ? 'danger' : 'success'">
              {{ row.status === 'Disabled' ? $t('general.Disable') : $t('general.Enable') }}
            </el-tag>
          </template>
          <template v-slot:actions="{row}">
            <el-button
              size="mini"
              @click="toggleUsage(row)"
            >
              <span
                class="inline-block dot"
                :class="row.disabled ? 'bg-success' : 'bg-danger'"
              />
              <span
                class="ml-2"
                :class="row.disabled ? 'text-success' : 'text-danger'"
              >
                {{ row.disabled ? $t('general.Enable') : $t('general.Disable') }}
              </span>
            </el-button>
          </template>
        </ElTableResponsive>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import {
  getDeployedHostsByList,
  updateDeployHostsById,
  getDeployedStorageLists,
  syncDeployedStorageLists,
  patchStorageStatus,
  getPVCLists
} from '@/api/deploy'
import { btoa } from '@shared/utils/base64'
import { ElTableResponsive } from '@shared/components'
import { BasicData } from '@/mixins'
import { mapGetters } from 'vuex'

const formData = () => ({
  disabled: false,
  clusterName: '',
  kubeConfigString: ''
})

export default {
  name: 'EditCluster',
  components: {
    ClusterFileUploader: () => import('./ClusterFileUploader'),
    ElTableResponsive
  },
  mixins: [BasicData],
  props: {
    clusterId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      tabName: 'Environment',
      hasUploadFile: false,
      form: formData(),
      origin: {},
      expandedLoading: false,
      getRowKey: (row) => row.id,
      expands: [],
      pvcList: []
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    disabled() {
      return !!this.form.kubeConfigString
    },
    isFormChanged() {
      for (const key in this.form) {
        if (this.form[key] !== this.origin[key]) return true
      }
      return false
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
          label: 'ID',
          prop: 'id',
          align: 'center',
          width: '180'
        },
        {
          label: this.$t('general.Name'),
          prop: 'name',
          align: 'center',
          width: '180'
        },
        {
          label: this.$t('PodsList.PodsUsed'),
          prop: 'Pods used',
          align: 'center'
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          align: 'center',
          width: '100',
          slot: 'status'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'disabled',
          align: 'center',
          slot: 'actions'
        }
      ]
    },
    tableChildColumns() {
      return [
        {
          label: this.$t('general.Name'),
          prop: 'name',
          align: 'center'
        },
        {
          label: this.$t('Deploy.Namespace'),
          prop: 'namespace',
          align: 'center'
        }
      ]
    }
  },
  mounted() {
    this.fetchDeployedHostsByList(this.clusterId)
  },
  methods: {
    async fetchData() {
      const res = await getDeployedStorageLists(this.clusterId)
      return res.data
    },
    async fetchDeployedHostsByList(clusterId) {
      const res = await getDeployedHostsByList(clusterId)
      this.setFormData(res.data)
    },
    setFormData(data) {
      const { name, disabled } = data
      this.form.clusterName = name
      this.form.disabled = disabled
      this.setOriginData(this.form)
    },
    setOriginData(data) {
      this.origin = JSON.parse(JSON.stringify(data))
    },
    async handleSync() {
      this.listLoading = true
      await syncDeployedStorageLists(this.clusterId)
      this.loadData()
      this.listLoading = false
    },
    handleSave() {
      if (!this.form.clusterName) {
        this.showNoNameWarning()
        return
      }
      const formData = this.getUpdateFormData()
      this.updateDeployHostsById(formData)
    },
    getUpdateFormData() {
      const formData = new FormData()
      const encodedData = btoa(this.form.kubeConfigString)
      const params = ['name', 'disabled', 'k8s_config_file', 'k8s_config_string']
      params.forEach(param => formData.delete(param))
      formData.append('name', this.form.clusterName)
      formData.append('disabled', this.form.disabled)
      if (this.hasUploadFile) formData.append('k8s_config_file', this.hasUploadFile)
      if (this.form.kubeConfigString) formData.append('k8s_config_string', encodedData)
      return formData
    },
    async updateDeployHostsById(formData) {
      await updateDeployHostsById(this.clusterId, formData)
        .then(() => {
          this.showUpdateMessage()
          this.$emit('initCluster', true)
        })
        .catch((error) => {
          console.error(error)
        })
    },
    async toggleUsage(row) {
      this.listLoading = true
      await patchStorageStatus(row.id, { disabled: !row.disabled })
      this.loadData()
      this.listLoading = false
    },
    async handleBackPage() {
      const confirm_options = {
        confirmButtonText: this.$t('general.Confirm'),
        cancelButtonText: this.$t('general.Cancel'),
        type: 'warning'
      }
      if (this.isFormChanged) {
        const res = await this.$confirm(
          this.$t('Notify.UnSavedChanges'),
          this.$t('general.Warning'),
          confirm_options).catch(() => {})
        if (res !== 'confirm') return
      }
      this.$emit('initCluster', false)
    },
    async getPvcList(row, expandedRows) {
      this.expands = []
      this.pvcList = []
      if (expandedRows.length) this.expands.push(row.id)
      if (!expandedRows.some((r) => r.id === row.id)) return
      this.expandedLoading = true
      this.pvcList = (await getPVCLists(row.id)).data.pvc_list
      this.expandedLoading = false
    },
    hasFileList(value) {
      this.form.kubeConfigString = ''
      this.hasUploadFile = value
    },
    showUpdateMessage() {
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('SystemDeploySettings.ClusterMessage'),
        type: 'success'
      })
    },
    showNoNameWarning() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('SystemDeploySettings.NoNameWarning'),
        type: 'warning'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.disabled {
  pointer-events: none;
}

.dot {
  @apply rounded-full w-2 h-2;
}

::v-deep .el-tabs__content {
  height: auto !important;
  padding: 0 !important;
  background: #e4ecf7 !important;
  position: relative !important;
}
::v-deep .el-tab-pane {
  height: auto !important;
  margin: 15px !important;
  background: #e4ecf7 !important;
}
::v-deep .el-tabs__header {
  position: inherit  !important;
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}
::v-deep .el-tabs__item {
  padding: 0 12px !important;
  height: auto !important;
}
::v-deep .el-tabs--card>.el-tabs__header .el-tabs__item {
  width: 95%;
}
</style>
