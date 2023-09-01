<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <el-button
          slot="returnButton"
          type="text"
          size="medium"
          icon="el-icon-arrow-left"
          class="text-title linkTextColor"
          @click="onBackClick"
        >
          {{ $t('general.Back') }}
        </el-button>
        <el-input
          v-model="keyword"
          :placeholder="$t('general.SearchName')"
          :style="{ width: isMobile ? 'auto' : '250px' }"
          :size="isMobile ? 'small' : 'medium'"
          prefix-icon="el-icon-search"
        />
      </ProjectListSelector>
      <el-divider />
      <ElTableResponsive
        v-loading="listLoading"
        :data="pagedData"
        :columns="tableColumns"
        :element-loading-text="$t('Loading')"
        fit
      >
        <template v-slot:name="{row}">
          <span :style="isMobile ? 'white-space: normal; text-align: right; word-break: break-word;' : ''">
            <div class="font-bold">{{ row.name }}</div>
            <div class="text-xs">
              Keys：<span
                v-for="(key, keyIdx) in row.keys"
                :key="keyIdx"
              >
                {{ key }}
                <span v-if="keyIdx !== row.keys.length - 1">/</span>
              </span>
            </div>
          </span>
        </template>
        <template v-slot:actions="{row}">
          <el-tooltip
            placement="bottom"
            :content="$t('general.Edit')"
          >
            <em
              class="ri-file-edit-line finished operate-button"
              @click="showEditDialog(row.name, row.secrets)"
            />
          </el-tooltip>
          <el-tooltip
            placement="bottom"
            :content="$t('general.Delete')"
            :disabled="isDeleteDisabled(row.secrets)"
          >
            <el-popconfirm
              :confirm-button-text="$t('general.Delete')"
              :cancel-button-text="$t('general.Cancel')"
              icon="el-icon-info"
              popper-class="danger"
              :title="$t('Notify.confirmDelete')"
              :disabled="isDeleteDisabled(row.secrets)"
              @confirm="handleDelete(row.name)"
            >
              <span
                slot="reference"
                :class="isDeleteDisabled(row.secrets) ? 'disabled' : ''"
              >
                <em
                  class="ri-delete-bin-2-line operate-button"
                  :class="isDeleteDisabled(row.secrets) ? 'disabled' : 'danger'"
                />
              </span>
            </el-popconfirm>
          </el-tooltip>
        </template>
      </ElTableResponsive>
      <Pagination
        :total="filteredData.length"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :page-sizes="[listQuery.limit]"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
      <el-dialog
        :title="`${$t('general.Edit')} Secret`"
        :visible.sync="editDialogVisible"
        :width="isMobile ? '95%' : '70%'"
        @close="closeEditDialog"
      >
        <el-form
          ref="form"
          :rules="formRules"
          :model="form"
        >
          <el-form-item label="Secret Name">
            <el-input
              v-model="form.name"
              autocomplete="off"
            />
          </el-form-item>
          <el-button
            id="btn-add-secret-item"
            class="buttonSecondary"
            size="small"
            @click="addItem"
          >
            <em class="el-icon-plus" /> {{ $t('Maintenance.AddSecret') }}
          </el-button>
          <el-row
            v-for="(secret, secretIdx) in form.secrets"
            :key="secret + secretIdx"
            :gutter="12"
          >
            <el-divider v-if="secretIdx > 0" class="mt-0" />
            <el-col :span="6" :xs="24">
              <el-form-item
                :label="`key ${secretIdx + 1} `"
                :prop="'secrets.' + secretIdx + '.key'"
                :rules="[{ required: true, message: `${$t('general.PleaseInput')} key`, trigger: 'blur' }]"
              >
                <el-input
                  :id="`input-key${secretIdx + 1}`"
                  v-model="form.secrets[secretIdx].key"
                  placeholder="key"
                  :disabled="form.secrets[secretIdx].isDisabled"
                />
              </el-form-item>
            </el-col>
            <el-col :span="15" :xs="24">
              <el-form-item
                :label="`value ${secretIdx + 1}`"
                :prop="'secrets.' + secretIdx + '.value'"
                :rules="[{ required: true, message: `${$t('general.PleaseInput')}  value`, trigger: 'blur' }]"
              >
                <el-input
                  :id="`input-value${secretIdx + 1}`"
                  v-model="form.secrets[secretIdx].value"
                  show-password
                  placeholder="value"
                  :disabled="form.secrets[secretIdx].isDisabled"
                />
              </el-form-item>
            </el-col>
            <el-col
              :span="3"
              :xs="24"
              :style="isMobile ? 'padding-bottom: 10px;' : 'padding-top: 45px'"
            >
              <el-button
                :id="`btn-delete${secretIdx + 1}`"
                type="danger"
                size="small"
                :disabled="form.secrets.length <= 1 || form.secrets[secretIdx].isDisabled"
                @click.prevent="removeItem(secret)"
              >
                {{ $t('general.Delete') }}
              </el-button>
            </el-col>
          </el-row>
        </el-form>
        <span
          slot="footer"
          class="dialog-footer"
        >
          <el-button
            :loading="isUpdating"
            class="buttonSecondaryReverse"
            @click="closeEditDialog"
          >
            {{ $t('general.Cancel') }}
          </el-button>
          <el-button
            class="buttonPrimary"
            :loading="isUpdating"
            @click="editSecretList"
          >
            {{ $t('general.Confirm') }}
          </el-button>
        </span>
      </el-dialog>
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { deleteSecret, getSecretList, updateSecretList } from '@/api/kubernetes'
import { BasicData, SearchBar, Pagination, Table } from '@/mixins'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'

const formTemplate = () => ({
  name: '',
  secrets: []
})

export default {
  name: 'SecretList',
  components: { ProjectListSelector, ElTableResponsive },
  mixins: [BasicData, SearchBar, Pagination, Table],
  data() {
    return {
      editDialogVisible: false,
      form: formTemplate(),
      formRules: {
        name: [{ required: true, message: 'Please input name', trigger: 'blur' }]
      },
      isUpdating: false
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
          label: this.$t('general.Name'),
          prop: 'name',
          headerAlign: 'center',
          slot: 'name'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getSecretList(this.selectedProjectId)
      return res.data.map((secret) => {
        const keys = secret.data ? Object.keys(secret.data) : ['-']
        const secrets = secret.data ? Object.entries(secret.data).map((item) => ({
          key: item[0],
          value: item[1],
          isDisabled: secret.is_iii
        })) : []
        return {
          name: secret.name,
          keys,
          secrets
        }
      })
    },
    showEditDialog(secretName, secrets) {
      this.editDialogVisible = true
      this.form.name = secretName
      this.form.secrets = secrets.map((item) => item)
    },
    closeEditDialog() {
      this.editDialogVisible = false
      this.$nextTick(() => {
        this.$refs['form'].resetFields()
        this.form = formTemplate()
      })
    },
    async editSecretList() {
      const sendData = {
        secrets: this.form.secrets.reduce((result, cur) => Object.assign(result, { [cur.key]: cur.value }), {})
      }
      this.isUpdating = true
      await updateSecretList(this.selectedProjectId, this.form.name, sendData)
      this.isUpdating = false
      this.closeEditDialog()
      this.loadData()
    },
    async handleDelete(secretName) {
      this.listLoading = true
      try {
        await deleteSecret(this.selectedProjectId, secretName)
        await this.loadData()
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    addItem() {
      this.form.secrets.push({
        key: '',
        value: '',
        isDisabled: false
      })
    },
    removeItem(item) {
      const index = this.form.secrets.indexOf(item)
      if (index !== -1) {
        this.form.secrets.splice(index, 1)
      }
    },
    isDeleteDisabled(item) {
      return item.map(item => item.isDisabled).includes(true)
    },
    onBackClick() {
      this.$router.push({ name: 'PluginResourceParent' })
    }
  }
}
</script>

<style lang="scss" scoped>
.disabled {
  cursor: not-allowed;
}
.mobile {
  white-space: unset !important;
  text-align: right !important;
}
</style>
