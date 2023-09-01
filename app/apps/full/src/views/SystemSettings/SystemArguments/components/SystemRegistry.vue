<template>
  <div class="app-container">
    <div class="flex justify-between">
      <el-button
        id="btn-add-registry"
        class="buttonSecondary"
        :size="isMobile ? 'small' : 'medium'"
        @click="dialogVisible = true"
      >
        <em class="el-icon-plus" /> {{ $t('Maintenance.AddRegistry') }}
      </el-button>
      <el-input
        id="input-search-registry"
        v-model="keyword"
        :placeholder="$t('Maintenance.SearchRegistryName')"
        :style="{ width: isMobile ? '100px' : '300px' }"
        :size="isMobile ? 'small' : 'medium'"
        prefix-icon="el-icon-search"
      />
    </div>
    <el-divider />
    <div class="mb-5 text-right">
      <el-button
        id="btn-reload"
        class="buttonPrimaryReverse"
        icon="el-icon-refresh"
        size="mini"
        plain
        @click="fetchData()"
      >
        {{ $t('general.Refresh') }}
      </el-button>
    </div>
    <el-table-responsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      :data="pagedData"
      :columns="tableColumns"
      fit
    >
      <template v-slot:actions="{ row }">
        <el-tooltip
          placement="bottom"
          :content="$t('general.Delete')"
        >
          <template v-if="row.status !== 'Removing'">
            <el-popconfirm
              :title="$t('Notify.confirmDelete')"
              :confirm-button-text="$t('general.Delete')"
              :cancel-button-text="$t('general.Cancel')"
              icon="el-icon-info"
              icon-color="red"
              @confirm="handleDelete(row.name)"
            >
              <em
                slot="reference"
                class="ri-delete-bin-2-line danger operate-button"
              />
            </el-popconfirm>
          </template>
          <div v-else class="disabled">
            <em class="ri-delete-bin-2-line disabled operate-button" />
          </div>
        </el-tooltip>
      </template>
    </el-table-responsive>
    <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />

    <el-dialog
      :title="$t('Maintenance.AddRegistry')"
      :visible.sync="dialogVisible"
      :width="isMobile ? '95%' : '50%'"
      @closed="onDialogClosed"
    >
      <el-form ref="form" label-position="top" :model="formData" :rules="formRules" label-width="20%">
        <el-form-item :label="$t('Maintenance.RegistryName')" prop="name">
          <el-input id="input-registry-name" v-model="formData.name" />
        </el-form-item>
        <el-form-item label="url" prop="url">
          <el-input id="input-url" v-model="formData.url" />
        </el-form-item>
        <el-form-item :label="$t('Maintenance.UserName')" prop="username">
          <el-input id="input-username" v-model="formData.username" />
        </el-form-item>
        <el-form-item :label="$t('Maintenance.Password')" prop="password">
          <el-input id="input-password" v-model="formData.password" :type="showPassword ? 'text' : 'password'">
            <em slot="suffix" class="el-input__icon el-icon-view" @click="showPassword = !showPassword" />
          </el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button id="dialog-btn-cancel" class="buttonSecondaryReverse" @click="dialogVisible = false">
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button id="dialog-btn-confirm" class="buttonPrimary" :loading="confirmLoading" @click="handleConfirm">
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { addSystemRegistry, deleteSystemRegistry, getSystemRegistries } from '@/api/maintenance'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive } from '@/components'

const defaultFormData = () => ({
  name: '',
  url: '',
  username: '',
  password: ''
})

export default {
  name: 'SystemRegistry',
  components: { ElTableResponsive },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      formData: defaultFormData(),
      formRules: {
        name: [{ required: true, message: 'Please input registry name', trigger: 'blur' }],
        url: [{ required: true, message: 'Please input url', trigger: 'blur' }],
        username: [{ required: true, message: 'Please input username', trigger: 'blur' }]
      },
      dialogVisible: false,
      confirmLoading: false,

      showPassword: false
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('general.Status'),
          prop: 'status',
          minWidth: '85',
          align: 'center',
          location: 'systemRegistry',
          type: 'tag'
        },
        {
          label: this.$t('Maintenance.RegistryName'),
          prop: 'name',
          align: 'center',
          minWidth: '250'
        },
        {
          label: 'Registries',
          prop: 'registries',
          minWidth: '250'
        },
        {
          label: this.$t('general.CreateTime'),
          prop: 'created',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          minWidth: '80',
          align: 'center',
          location: 'systemRegistry',
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getSystemRegistries()
      return res.data.map(item => ({
        name: item.name,
        registries: item.registries ? Object.keys(item.registries).join(', ') : '',
        created: item.created,
        status: item.removed ? 'Removing' : 'Active'
      }))
    },
    async handleDelete(registryName) {
      this.listLoading = true
      try {
        await deleteSystemRegistry(registryName)
        await this.loadData()
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async handleConfirm() {
      this.$refs['form'].validate(async valid => {
        if (valid) {
          this.listLoading = true
          this.confirmLoading = true
          const sendData = this.formData
          try {
            await addSystemRegistry(sendData)
            await this.loadData()
            this.dialogVisible = false
          } catch (error) {
            console.error(error)
          }
          this.listLoading = false
          this.confirmLoading = false
        } else {
          return false
        }
      })
    },
    onDialogClosed() {
      this.$nextTick(() => {
        this.$refs['form'].resetFields()
        this.formData = defaultFormData()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.disabled {
  cursor: not-allowed;
}
</style>
