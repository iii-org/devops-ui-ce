<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <el-input
          v-model="keyword"
          :placeholder="$t('general.SearchName')"
          :style="{ width: isMobile ? 'auto' : '200px' }"
          :size="isMobile ? 'small' : 'medium'"
          prefix-icon="el-icon-search"
        />
      </ProjectListSelector>
      <el-divider />
      <el-card
        shadow="never"
        class="mb-1"
      >
        <el-row :gutter="24">
          <el-col
            :lg="12"
            :md="12"
            :sm="12"
            :xs="24"
            style="font-size: 18px; font-weight: bold;"
            :style="isMobile ? ' margin-bottom: 6px;' : ''"
          >
            {{ projectName }}
          </el-col>
          <el-col :lg="12" :md="12" :sm="12" :xs="24" style="font-size: 13px;">
            <el-col :lg="20" :md="18" :sm="16" :xs="16" style="padding: 0;">
              <el-progress
                :text-inside="true"
                :stroke-width="20"
                :text-color="'white'"
                :percentage="returnPercentage(storage.quota)"
              />
            </el-col>
            <el-col :lg="4" :md="6" :sm="8" :xs="8">
              <span style="line-height: 21px;">
                {{ (storage.quota.used.storage / 1024 / 1024 / 1024).toFixed(2) }} /
                {{ Math.round(storage.quota.hard.storage / 1024 / 1024 / 1024) }}GB
              </span>
            </el-col>
          </el-col>
        </el-row>
      </el-card>
      <el-table-responsive
        v-loading="listLoading"
        :data="pagedData"
        :columns="tableColumns"
        :element-loading-text="$t('Loading')"
        :header-cell-style="{ 'text-align': 'center' }"
        fit
      >
        <template v-slot:name="{ row }">
          <el-link
            class="linkTextColor"
            target="_blank"
            style="font-size: 16px"
            :underline="false"
            :href="row.harbor_link"
          >
            {{ row.name }}
          </el-link>
        </template>
        <template v-slot:artifact_count="{ row }">
          <router-link
            :to="{
              name: 'Artifacts',
              params: { rName: row.name, projectName }
            }"
            class="linkTextColor"
          >
            <span>{{ row.artifact_count }}</span>
          </router-link>
        </template>
        <template v-slot:actions="{ row }">
          <el-tooltip
            placement="bottom"
            :content="$t('general.Edit')"
          >
            <em
              class="ri-file-edit-line finished operate-button"
              @click="handleEdit(row)"
            />
          </el-tooltip>
          <el-tooltip
            placement="bottom"
            :content="$t('general.Delete')"
          >
            <el-popconfirm
              :confirm-button-text="$t('general.Delete')"
              :cancel-button-text="$t('general.Cancel')"
              icon="el-icon-info"
              icon-color="red"
              :title="$t('Notify.confirmDelete')"
              @confirm="handleDelete(row)"
            >
              <em
                slot="reference"
                class="ri-delete-bin-2-line danger operate-button"
              />
            </el-popconfirm>
          </el-tooltip>
        </template>
      </el-table-responsive>
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
        :title="`${$t('general.Delete')} ${$t('route.Harbor')}`"
        :visible.sync="showDeleteDialog"
        width="40%"
        :close-on-click-modal="false"
        @closed="onDialogClosedDelete"
      >
        <p>{{ $t('ProjectResource.DeleteResourceConfirmText') }}</p>
        <p>
          {{ $t('ProjectResource.PleaseType') }}
          <strong>{{ deleteResourceName }}</strong>
          {{ $t('ProjectResource.AndThen') }}
        </p>
        <el-input
          v-model="inputDelResourceName"
          :placeholder="placeholderText"
        />
        <span
          slot="footer"
          class="dialog-footer"
        >
          <el-button class="buttonSecondaryReverse" @click="showDeleteDialog = false">{{ $t('general.Cancel') }}</el-button>
          <el-button
            type="danger"
            @click="handleDeleteModal()"
          >{{ $t('general.Delete') }}</el-button>
        </span>
      </el-dialog>
      <el-dialog
        :title="$t(`ProjectResource.EditResource`)"
        :visible.sync="dialogVisible"
        :width="isMobile ? '90%' : '50%'"
        @closed="onDialogClosed"
      >
        <el-form
          ref="form"
          :model="form"
          :rules="formRules"
          label-position="top"
        >
          <el-form-item :label="$t('general.Name')">
            {{ form.name }}
          </el-form-item>
          <el-form-item
            :label="$t('general.Description')"
            prop="description"
          >
            <el-input
              v-model="form.description"
              type="textarea"
            />
          </el-form-item>
        </el-form>
        <span
          slot="footer"
          class="dialog-footer"
        >
          <el-button class="buttonSecondaryReverse" @click="dialogVisible = false">{{ $t('general.Cancel') }}</el-button>
          <el-button
            class="buttonPrimary"
            :loading="memberConfirmLoading"
            @click="handleConfirm"
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
import {
  getHarborRepoList,
  deleteHarborRepo,
  editHarborRepo,
  getHarborRepoStorageSummary
} from '@/api/harbor'
import { BasicData, Pagination, SearchBar, Table } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@/components'

const formTemplate = {
  name: '',
  due_date: '',
  status: 'open',
  description: ''
}

export default {
  name: 'ResourceHarbor',
  components: { ProjectListSelector, ElTableResponsive },
  mixins: [BasicData, Pagination, SearchBar, Table],
  data() {
    return {
      projectName: '',
      dialogVisible: false,
      formRules: {
        description: [{ required: true, message: 'Please input description', trigger: 'blur' }]
      },
      storage: {
        project_admin_count: 0,
        quota: {
          hard: { storage: 0 },
          used: { storage: 0 }
        },
        repo_count: 0
      },
      memberConfirmLoading: false,
      form: formTemplate,

      showDeleteDialog: false,
      loadingDelete: '',
      deleteResourceName: '',
      inputDelResourceName: '',
      placeholderText: ''
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
          minWidth: 200,
          slot: 'name'
        },
        {
          label: this.$t('ProjectResource.Artifacts'),
          prop: 'artifact_count',
          minWidth: 80,
          align: 'center',
          slot: 'artifact_count'
        },
        {
          label: 'Pull',
          prop: 'pull_count',
          minWidth: 80,
          align: 'center'
        },
        {
          label: this.$t('general.Description'),
          prop: 'description',
          minWidth: 200
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'update_time',
          align: 'center',
          minWidth: 140,
          type: 'time'
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
      if (this.selectedProjectId === -1) {
        return []
      }
      const res = await getHarborRepoList(this.selectedProjectId)
      const resourceList = res.data.map((item) => {
        const name_ary = item.name.split('/')
        item['name_in_harbor'] = name_ary[name_ary.length - 1]
        return item
      })
      this.projectName = this.selectedProject['name']
      const storageRes = await getHarborRepoStorageSummary(this.selectedProjectId)
      this.storage = storageRes.data
      return resourceList
    },
    returnPercentage(quota) {
      const total = parseInt(quota.hard.storage)
      const use = parseInt(quota.used.storage)
      const p = Math.round((use / total) * 100)
      return isNaN(p) ? 0 : p
    },
    handleEdit(row) {
      this.dialogVisible = true
      this.form = Object.assign({}, this.form, row)
    },
    async handleConfirm() {
      this.$refs['form'].validate(async (valid) => {
        if (valid) {
          this.dialogVisible = false
          const data = this.form
          await editHarborRepo({
            description: data.description,
            repository_fullname: data.name
          })
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          await this.loadData()
        } else {
          return false
        }
      })
    },
    handleDelete(row) {
      this.showDeleteDialog = true
      this.deleteResourceName = row.name
      this.placeholderText = 'Please Input ' + this.deleteResourceName
    },
    async handleDeleteModal() {
      if (this.deleteResourceName !== this.inputDelResourceName) {
        return this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('Notify.WrongResourceName'),
          type: 'warning'
        })
      } else {
        this.loadingDelete = this.$loading({
          target: '.el-dialog',
          text: 'Loading'
        })
        await deleteHarborRepo(this.deleteResourceName)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        this.loadingDelete.close()
        this.showDeleteDialog = false
        await this.loadData()
      }
    },
    onDialogClosedDelete() {
      this.$nextTick(() => {
        this.deleteResourceName = ''
        this.placeholderText = ''
        this.inputDelResourceName = ''
      })
    },
    onDialogClosed() {
      this.$nextTick(() => {
        this.$refs['form'].resetFields()
        this.form = formTemplate
      })
    }
  }
}
</script>
