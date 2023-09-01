<template>
  <div class="app-container">
    <div class="flex justify-between">
      <el-button
        id="btn-add-secret"
        class="buttonSecondary"
        :size="isMobile ? 'small' : 'medium'"
        @click="dialogVisible = true"
      >
        <em class="el-icon-plus" /> {{ $t('Maintenance.AddSecret') }}
      </el-button>
      <el-input
        id="input-search-secret"
        v-model="keyword"
        :placeholder="$t('Maintenance.SearchSecretName')"
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
      <template v-slot:actions="{row}">
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
      :title="$t('Maintenance.AddSecret')"
      :visible.sync="dialogVisible"
      :width="isMobile ? '95%' : '50%'"
      @closed="onDialogClosed"
    >
      <el-form ref="form" label-position="top" :model="formData" :rules="formRules" label-width="20%">
        <el-form-item :label="$t('Maintenance.SecretName')" prop="name">
          <el-input id="input-secret-name" v-model="formData.name" />
        </el-form-item>
        <el-row v-for="(item, index) in formData.data" :key="item + index" :gutter="12" type="flex">
          <el-col :span="9">
            <el-form-item
              :label="`key ${index + 1} `"
              :prop="'data.' + index + '.key'"
              :rules="[{ required: true, message: 'Please input key', trigger: 'blur' }]"
            >
              <el-input :id="`input-key${index + 1}`" v-model="formData.data[index].key" placeholder="key" />
            </el-form-item>
          </el-col>
          <el-col :span="9">
            <el-form-item
              :label="`value ${index + 1}`"
              :prop="'data.' + index + '.value'"
              :rules="[{ required: true, message: 'Please input value', trigger: 'blur' }]"
            >
              <el-input
                :id="`input-value${index + 1}`"
                v-model="formData.data[index].value"
                placeholder="value"
                :type="formData.data[index].showValue ? 'text' : 'password'"
              >
                <em
                  slot="suffix"
                  class="el-input__icon el-icon-view"
                  @click="formData.data[index].showValue = !formData.data[index].showValue"
                />
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6" style="padding-top: 45px">
            <el-button
              :id="`btn-delete${index + 1}`"
              type="danger"
              size="small"
              :disabled="formData.data.length <= 1"
              @click.prevent="removeItem(item)"
            >
              {{ $t('general.Delete') }}
            </el-button>
          </el-col>
        </el-row>
        <el-button id="btn-add-secret-item" class="buttonSecondary" size="small" @click="addItem">
          <em class="el-icon-plus" /> {{ $t('Maintenance.AddSecret') }}
        </el-button>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button id="dialog-btn-cancel" class="buttonSecondaryReverse" @click="dialogVisible = false">{{ $t('general.Cancel') }}</el-button>
        <el-button id="dialog-btn-confirm" class="buttonPrimary" :loading="confirmLoading" @click="handleConfirm">
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { addSystemSecret, deleteSystemSecret, getSystemSecrets } from '@/api/maintenance'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive } from '@/components'

const defaultFormData = () => ({
  name: '',
  type: 'secret',
  data: [{ key: '', value: '', showValue: false }]
})

export default {
  name: 'SystemSecrets',
  components: { ElTableResponsive },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      formData: defaultFormData(),
      formRules: {
        name: [{ required: true, message: 'Please input Secret Name', trigger: 'blur' }]
      },
      dialogVisible: false,
      confirmLoading: false
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
          location: 'systemSecrets',
          align: 'center',
          type: 'tag'
        },
        {
          label: this.$t('Maintenance.SecretName'),
          prop: 'name',
          minWidth: '150',
          align: 'center'
        },
        {
          label: 'Keys',
          prop: 'keys',
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
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getSystemSecrets()
      return res.data.map(item => ({
        name: item.name,
        created: item.created,
        keys: item.data ? Object.keys(item.data).join(', ') : '',
        status: item.removed ? 'Removing' : 'Active'
      }))
    },
    async handleDelete(secretName) {
      this.listLoading = true
      try {
        await deleteSystemSecret(secretName)
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
          const sendData = {
            name: this.formData.name,
            type: this.formData.type,
            data: this.formData.data.reduce((result, cur) => Object.assign(result, { [cur.key]: cur.value }), {})
          }
          try {
            await addSystemSecret(sendData)
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
    addItem() {
      this.formData.data.push({
        key: '',
        value: '',
        showValue: false
      })
    },
    removeItem(item) {
      const index = this.formData.data.indexOf(item)
      if (index !== -1) {
        this.formData.data.splice(index, 1)
      }
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
