<template>
  <div class="app-container">
    <template v-if="!showAddPage">
      <div class="text-right">
        <el-button
          class="buttonSecondary"
          icon="el-icon-plus"
          :size="isMobile ? 'small' : 'medium'"
          @click="addRegistry"
        >
          {{ $t('general.Add') }}
        </el-button>
      </div>
      <el-divider />
      <ElTableResponsive
        ref="tableData"
        v-loading="listLoading"
        class="cursor-pointer"
        :element-loading-text="$t('Loading')"
        :data="listData"
        :columns="tableColumns"
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
                {{ registryStatus(item.status) }}
              </el-tag>
            </li>
          </ul>
        </template>
        <template v-slot:url="{row}">
          <el-link
            class="linkTextColor"
            target="_blank"
            :href="row.url"
          >
            {{ row.url }}
          </el-link>
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
              @click.stop="editRegistry(row)"
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
      </ElTableResponsive>
    </template>
    <template v-else>
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
        <el-button
          class="buttonSecondary"
          :size="isMobile ? 'small' : 'medium'"
          @click="handleSave"
        >
          {{ $t('general.Save') }}
        </el-button>
      </div>
      <el-divider />
      <el-form
        ref="form"
        :model="form"
        :label-width="isMobile ? 'auto' : '120px'"
        :label-position="isMobile ? 'top' : 'right'"
        :size="isMobile ? 'small' : 'medium'"
      >
        <el-row :gutter="10">
          <el-col :span="24" :sm="13">
            <el-form-item :label="$t('SystemDeploySettings.RegistryName')">
              <el-input v-model="form.name" />
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
          <el-col :span="24" :sm="13">
            <el-form-item label="URL">
              <el-input v-model="form.url" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="13">
            <el-form-item :label="$t('general.Account')">
              <el-input v-model="form.access_key" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="13">
            <el-form-item :label="$t('general.Password')" required>
              <el-input
                v-model="form.access_secret"
                show-password
                :placeholder="$t('SystemDeploySettings.FillInPassword')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </template>
  </div>
</template>

<script>
import {
  getRegistryHostsLists,
  addRegistryHosts,
  updateRegistryHostsById
} from '@/api/deploy'
import { BasicData } from '@/mixins'
import { mapGetters } from 'vuex'
import { ElTableResponsive } from '@shared/components'

const formData = () => ({
  type: 'harbor',
  description: '',
  insecure: true,
  name: '',
  disabled: false,
  url: '',
  access_key: '',
  access_secret: ''
})

export default {
  name: 'Registry',
  components: {
    ElTableResponsive
  },
  mixins: [BasicData],
  data() {
    return {
      showAddPage: false,
      updateStatus: 'UPDATE_INIT',
      editingId: 1,
      updatedFormData: {},
      isSaved: false,
      form: formData(),
      origin: {}
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
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
          label: this.$t('SystemDeploySettings.Index'),
          prop: 'index',
          align: 'center',
          width: 100,
          type: 'index'
        },
        {
          label: this.$t('SystemDeploySettings.ImpressionFileRepo'),
          prop: 'name',
          align: 'center'
        },
        {
          label: 'URL',
          prop: 'url',
          align: 'center',
          slot: 'url'
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          align: 'center',
          width: 100,
          slot: 'status'
        },
        {
          label: this.$t('general.Actions'),
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
      const res = await getRegistryHostsLists()
      return res.data.registries
    },
    async addRegistryHosts() {
      await addRegistryHosts(this.updatedFormData)
        .then(() => {
          this.loadData()
          this.initRegistryTab()
          this.showUpdateMessage()
        })
        .catch((err) => {
          console.error(err)
        })
    },
    async updateRegistryHostsById(registries_id, data) {
      const id = registries_id || this.editingId
      const formData = data || this.updatedFormData
      await updateRegistryHostsById(id, formData)
        .then(() => {
          this.loadData()
          this.initRegistryTab()
          this.showUpdateMessage()
        })
        .catch((err) => {
          console.error(err)
        })
    },
    async updateHostsDisabled(row) {
      const {
        name,
        disabled,
        url,
        type,
        description,
        access_key,
        access_secret
      } = row
      const registries_id = row.registries_id
      const data = {
        name,
        disabled,
        type,
        description,
        access_key,
        access_secret,
        insecure: true,
        login_server: url
      }
      this.updateRegistryHostsById(registries_id, data)
    },
    toggleUsage(row) {
      row.disabled = !row.disabled
      this.updateHostsDisabled(row)
    },
    addRegistry() {
      this.updateStatus = 'UPDATE_POST'
      this.showAddPage = true
    },
    async handleBackPage() {
      const confirm_options = {
        confirmButtonText: this.$t('general.Confirm'),
        cancelButtonText: this.$t('general.Cancel'),
        type: 'warning'
      }
      if (this.isFormChanged && !this.isSaved) {
        const res = await this.$confirm(
          this.$t('Notify.UnSavedChanges'),
          this.$t('general.Warning'),
          confirm_options).catch(() => {})
        if (res !== 'confirm') return
      }
      this.initRegistryTab()
    },
    initRegistryTab() {
      this.initData()
      this.isSaved = false
      this.showAddPage = false
      this.updatedFormData = {}
    },
    initData() {
      this.form = formData()
      this.setOriginData(this.form)
    },
    setOriginData(data) {
      this.origin = JSON.parse(JSON.stringify(data))
    },
    editRegistry(row) {
      this.editingId = row.registries_id
      this.isSaved = false
      this.setFormData(row)
      this.updateStatus = 'UPDATE_PUT'
      this.showAddPage = true
    },
    setFormData(rowData) {
      const {
        name,
        disabled,
        type,
        description,
        url,
        access_key
        // access_secret
      } = rowData
      this.form.name = name
      this.form.disabled = disabled
      this.form.type = type
      this.form.description = description
      this.form.url = url
      this.form.access_key = access_key
      // this.form.access_secret = access_secret
      this.setOriginData(this.form)
    },
    getUpdateFormData() {
      const formData = {}
      formData.name = this.form.name
      formData.disabled = this.form.disabled
      formData.type = this.form.type
      formData.description = this.form.description
      formData.login_server = this.form.url
      formData.access_key = this.form.access_key
      formData.access_secret = this.form.access_secret
      formData.insecure = this.form.insecure
      Object.assign(this.updatedFormData, formData)
    },
    handleSave() {
      this.isSaved = true
      this.getUpdateFormData()
      if (this.updatedFormData.access_secret === '') {
        this.showFailUpdateMessage()
        return
      }
      this.updateData()
    },
    updateData() {
      switch (this.updateStatus) {
        case 'UPDATE_PUT':
          this.updateRegistryHostsById()
          break
        case 'UPDATE_POST':
          this.addRegistryHosts()
      }
    },
    showUpdateMessage() {
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('SystemDeploySettings.RegistryMessage'),
        type: 'success'
      })
    },
    showFailUpdateMessage() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('SystemDeploySettings.FailMessage'),
        type: 'warning'
      })
    },
    registryStatus(status) {
      switch (status) {
        case 'Initializing':
          return this.$t('SystemDeploySettings.Initializing')
        case 'Start Image replication':
          return this.$t('SystemDeploySettings.StartReplication')
        case 'Finish Image replication':
          return this.$t('SystemDeploySettings.Finished')
        case 'Error, No Image need to be replicated':
          return this.$t('general.Error')
      }
    },
    tagType(status) {
      switch (status) {
        case 'Initializing':
          return 'info'
        case 'Start Image replication':
          return 'warning'
        case 'Finish Image replication':
          return 'success'
        case 'Error, No Image need to be replicated':
          return 'danger'
      }
    },
    getRowClass({ row }) {
      if (row.application.length === 0) return 'hide-expand-icon'
      return ''
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
