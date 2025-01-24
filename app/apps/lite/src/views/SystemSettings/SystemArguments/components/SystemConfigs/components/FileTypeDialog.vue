<template>
  <el-dialog
    :before-close="handleClose"
    :close-on-click-modal="false"
    :top="isMobile ? '1vh' : '8vh'"
    :visible.sync="dialogVisible"
    :width="isMobile ? '95vw' : '60vw'"
  >
    <template slot="title" class="header-title">
      <div class="flex justify-between">
        <div>
          <span class="header-title font-medium text-lg">
            {{ $t('SystemConfigs.UploadFileTypes') }}
          </span>
          <el-button
            :disabled="isAdding"
            icon="el-icon-plus"
            size="small"
            type="success"
            @click="handleShow"
          >
            {{ $t('general.Add') }}
          </el-button>
        </div>
        <div class="mr-5 float-right">
          <el-input
            v-model="keyword"
            :placeholder="$t('general.Search')"
            :size="isMobile ? 'small' : 'medium'"
            :style="{ width: isMobile ? '100px' : '250px' }"
            clearable
            prefix-icon="el-icon-search"
          />
        </div>
      </div>
      <el-divider class="my-2" />
      <div v-show="isAdding" :class="isMobile ? 'mobile' : ''" class="m-5">
        <el-form ref="form" :model="form" :rules="formRules" size="mini">
          <el-row :gutter="20">
            <el-col :lg="6" :md="8" :sm="12" :span="24">
              <el-form-item class="flex required" prop="fileExtension">
                <el-input
                  v-model="form.fileExtension"
                  :placeholder="
                    $t('RuleMsg.PleaseInput') +
                      $t('SystemConfigs.FileExtension')
                  "
                  type="text"
                />
              </el-form-item>
            </el-col>
            <el-col :lg="6" :md="8" :sm="12" :span="24">
              <el-form-item class="flex required" prop="mimeType">
                <el-input
                  v-model="form.mimeType"
                  :placeholder="$t('RuleMsg.PleaseInput') + ' MIME Type'"
                  type="text"
                />
              </el-form-item>
            </el-col>
            <el-col :lg="6" :md="8" :sm="12" :span="24">
              <el-form-item prop="name">
                <el-input
                  v-model="form.name"
                  :placeholder="$t('RuleMsg.PleaseInput') + $t('general.Name')"
                  type="text"
                />
              </el-form-item>
            </el-col>
            <el-col :lg="6" :md="8" :sm="12" :span="24">
              <el-form-item>
                <el-button size="mini" type="primary" @click="handleConfirm">
                  {{ $t('general.Save') }}
                </el-button>
                <el-button size="mini" @click="handleCancel">
                  {{ $t('general.Cancel') }}
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </template>
    <el-form ref="formTable" :model="formTable" :rules="formRules" size="mini">
      <ElTableResponsive
        v-loading="listLoading"
        :columns="tableColumns"
        :data="formTable.pagedData"
        :element-loading-text="$t('Loading')"
        border
        fit
        size="mini"
      >
        <template #fileExtension="{ row }">
          <el-form-item
            v-show="row.edit"
            :prop="'pagedData.' + getRowIndex(row) + '.fileExtension'"
            :rules="formTableRules.fileExtension"
            :style="isSaved ? 'margin-bottom: 0;' : ''"
          >
            <el-input v-model="row.fileExtension" />
          </el-form-item>
          <span v-show="!row.edit">{{ row.fileExtension }}</span>
        </template>
        <template #mimeType="{ row }">
          <el-form-item
            v-show="row.edit"
            :prop="'pagedData.' + getRowIndex(row) + '.mimeType'"
            :rules="formTableRules.mimeType"
            :style="isSaved ? 'margin-bottom: 0;' : ''"
          >
            <el-input v-model="row.mimeType" />
          </el-form-item>
          <span v-show="!row.edit">{{ row.mimeType }}</span>
        </template>
        <template #name="{ row }">
          <el-form-item
            v-show="row.edit"
            :prop="'pagedData.' + getRowIndex(row) + '.name'"
            :rules="formTableRules.name"
            :style="isSaved ? 'margin-bottom: 0;' : ''"
          >
            <el-input v-model="row.name" />
          </el-form-item>
          <span v-show="!row.edit">{{ row.name }}</span>
        </template>
        <template #actions="{ row }">
          <div v-show="!row.edit">
            <el-tooltip :content="$t('general.Edit')" placement="bottom">
              <em
                class="ri-edit-box-line success table-button"
                @click="handleEdit(row)"
              ></em>
            </el-tooltip>
            <el-tooltip :content="$t('general.Delete')" placement="bottom">
              <el-popconfirm
                :cancel-button-text="$t('general.Cancel')"
                :confirm-button-text="$t('general.Delete')"
                :title="$t('Notify.confirmDelete')"
                icon="el-icon-info"
                popper-class="danger"
                @confirm="handleDelete(row.id)"
              >
                <em
                  slot="reference"
                  class="ri-delete-bin-2-line danger table-button"
                ></em>
              </el-popconfirm>
            </el-tooltip>
          </div>
          <div v-show="row.edit">
            <el-tooltip :content="$t('general.ok')" placement="bottom">
              <em
                class="ri-checkbox-circle-line primary table-button"
                @click="handleSaveFile(row)"
              ></em>
            </el-tooltip>
            <el-tooltip :content="$t('general.Cancel')" placement="bottom">
              <em
                class="ri-close-circle-line danger table-button"
                @click="handleCancelFile(row)"
              ></em>
            </el-tooltip>
          </div>
        </template>
      </ElTableResponsive>
    </el-form>
    <Pagination
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :page-sizes="[listQuery.limit]"
      :pager-count="5"
      :small="isMobile"
      :total="filteredData.length"
      @pagination="onPagination"
    />
    <div class="text-xs mt-2">
      *MIME Type IANA :
      <a
        class="el-link el-link--primary is-underline"
        href="https://www.iana.org/assignments/media-types/media-types.xhtml"
        target="_blank"
      >
        https://www.iana.org/assignments/media-types/media-types.xhtml
      </a>
    </div>
  </el-dialog>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import {
  addUploadFileType,
  deleteUploadFileType,
  updateUploadFileType
} from '@/api_v2/systemParameter'
import { getFileConfig } from '@/api_v3/system'

const defaultFormData = () => ({
  name: '',
  mimeType: '',
  fileExtension: ''
})

export default {
  name: 'FileTypeDialog',
  components: {
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination, SearchBar],
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchKeys: ['name', 'mimeType', 'fileExtension'],
      isAdding: false,
      rowCache: null,
      originData: [],
      isSaved: true,
      form: defaultFormData(),
      formRules: {
        fileExtension: [
          {
            required: true,
            message: 'Please input File Extension',
            trigger: 'blur'
          },
          {
            required: true,
            pattern: /^[.]{1}[-\w]+$/,
            message: 'Please follow the format rule',
            trigger: 'blur'
          }
        ],
        mimeType: [
          {
            required: true,
            message: 'Please input Mime Type',
            trigger: 'blur'
          },
          {
            required: true,
            pattern: /^[-.\w]+\/[-.\w]+$/,
            message: 'Please follow the format rule',
            trigger: 'blur'
          }
        ]
      },
      formTableRules: {
        fileExtension: [
          {
            validator: this.validate,
            trigger: 'blur'
          }
        ],
        mimeType: [
          {
            validator: this.validate,
            trigger: 'blur'
          }
        ],
        name: [
          {
            validator: this.validate,
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['device']),
    formTable() {
      return { pagedData: this.pagedData }
    },
    originDataMimeType() {
      return this.originData.map((item) => item.mimeType)
    },
    selectedRowIndex() {
      return this.originData.findIndex((item) => item.id === this.rowCache.id)
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('general.Index'),
          prop: 'id',
          align: 'center',
          minWidth: '60'
        },
        {
          label: this.$t('SystemConfigs.FileExtension'),
          prop: 'fileExtension',
          minWidth: '100',
          slot: 'fileExtension'
        },
        {
          label: 'MIME Type',
          prop: 'mimeType',
          minWidth: '300',
          slot: 'mimeType'
        },
        {
          label: this.$t('general.Name'),
          prop: 'name',
          minWidth: '150',
          slot: 'name'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          minWidth: '80',
          slot: 'actions',
          align: 'center'
        }
      ]
    }
  },
  methods: {
    ...mapActions('app', ['setFileType', 'setFileTypeList']),
    async fetchData() {
      const res = await getFileConfig()
      const uploadFileTypesList = res.data.file_types.map((item) => ({
        id: item.id,
        name: item.name,
        mimeType: item.MIME,
        fileExtension: item.extension,
        edit: false
      }))
      this.setOriginData(uploadFileTypesList)
      return uploadFileTypesList
    },
    setOriginData(data) {
      this.originData = JSON.parse(JSON.stringify(data))
    },
    initForm() {
      this.form = defaultFormData()
    },
    validate(rule, value, callback) {
      const type = rule.field.split('.')[2]
      if (value !== this.originData[this.selectedRowIndex][type]) {
        this.isSaved = false
        callback(new Error('not saved'))
      } else {
        this.isSaved = true
        callback()
      }
    },
    checkIncludesMimeType(mimeType, id = null) {
      if (id) {
        const selectedRow = this.originData.find((item) => item.id === id)
        if (selectedRow.mimeType === mimeType) return false
      }
      if (this.originDataMimeType.includes(mimeType)) {
        this.$message({
          title: this.$t('general.Error'),
          message: this.$t('SystemConfigs.IncludesMimeType', {
            mimeType: mimeType
          }),
          type: 'warning'
        })
      }
      return this.originDataMimeType.includes(mimeType)
    },
    handleShow() {
      this.isAdding = true
    },
    async handleConfirm() {
      this.$refs['form'].validate(async (valid) => {
        if (valid && !this.checkIncludesMimeType(this.form.mimeType)) {
          this.listLoading = true
          const sendData = new FormData()
          sendData.append('name', this.form.name)
          sendData.append('mimetype', this.form.mimeType)
          sendData.append('file_extension', this.form.fileExtension)
          try {
            await addUploadFileType(sendData)
            this.$message({
              title: this.$t('general.Success'),
              message: this.$t('Notify.Added'),
              type: 'success'
            })
            this.updateFileTypeStatus()
            this.handleCancel()
            await this.loadData()
          } catch (error) {
            console.error(error)
          } finally {
            this.listLoading = false
          }
        } else {
          return false
        }
      })
    },
    handleCancel() {
      this.$refs['form'].resetFields()
      this.isSaved = true
      this.isAdding = false
      this.initForm()
    },
    handleEdit(row) {
      if (this.isSaved) {
        if (this.rowCache) {
          this.restoreRow(this.rowCache)
        }
        row.edit = true
        this.rowCache = row
        this.$refs['formTable'].clearValidate()
      }
    },
    async handleDelete(type_id) {
      this.listLoading = true
      try {
        await deleteUploadFileType(type_id)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        this.updateFileTypeStatus()
        await this.loadData()
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    async handleSaveFile(row) {
      if (
        !/^[-.\w]+\/[-.\w]+$/.test(row.mimeType) ||
        !/^[.]{1}[-\w]+$/.test(row.fileExtension)
      ) {
        this.$message({
          title: this.$t('general.Error'),
          message: 'Please follow the format rule',
          type: 'warning'
        })
      } else if (this.checkIncludesMimeType(row.mimeType, row.id)) {
        return false
      } else if (!this.isSaved) {
        this.listLoading = true
        const sendData = new FormData()
        sendData.append('name', row.name)
        sendData.append('mimetype', row.mimeType)
        sendData.append('file_extension', row.fileExtension)
        try {
          await updateUploadFileType(row.id, sendData)
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.updateFileTypeStatus()
          this.isSaved = true
          await this.loadData()
        } catch (error) {
          console.error(error)
        } finally {
          this.listLoading = false
        }
      } else {
        this.restoreRow(row)
        return false
      }
    },
    handleCancelFile(row) {
      this.restoreRow(row)
      this.isSaved = true
    },
    restoreRow(row) {
      const i = this.selectedRowIndex
      row.name = this.originData[i].name
      row.mimeType = this.originData[i].mimeType
      row.fileExtension = this.originData[i].fileExtension
      row.edit = this.originData[i].edit
    },
    updateFileTypeStatus() {
      this.setFileType()
      this.setFileTypeList()
    },
    handleClose() {
      this.$emit('update:dialogVisible', false)
      this.$emit('update')
    },
    getRowIndex(row) {
      return this.formTable.pagedData.indexOf(row)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-dialog__body {
  padding-top: 0;
}

::v-deep .required:before {
  display: inline-block;
  content: '*';
  color: #ff4949;
  margin-right: 4px;
}

.mobile {
  ::v-deep .el-form-item__content {
    width: -webkit-fill-available;
  }
}
</style>
