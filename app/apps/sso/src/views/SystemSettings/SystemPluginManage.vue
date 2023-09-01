<template>
  <el-row
    v-loading="isLoading"
    :element-loading-text="$t('Loading')"
    class="app-container"
  >
    <el-col>
      <el-row type="flex" justify="end">
        <el-input
          v-model="keyword"
          :placeholder="$t('general.SearchName')"
          prefix-icon="el-icon-search"
          :style="{ width: isMobile ? '-webkit-fill-available' : '250px' }"
          :size="isMobile ? 'small' : 'medium'"
        />
      </el-row>
      <el-divider />
      <ElTableResponsive
        v-loading="listLoading"
        :data="pagedData"
        :columns="tableColumns"
        :element-loading-text="$t('Loading')"
        :cell-style="{ 'text-align': 'center' }"
        :header-cell-style="{ 'text-align': 'center' }"
        fit
      >
        <template v-slot:description="{ row }">
          {{ $t(`Plugins.${row.name}.description`) }}
        </template>
        <template v-slot:status="{ row }">
          <el-tag :type="row.disabled ? 'danger' : 'success'" :size="isMobile ? 'small' : 'medium'">
            {{ row.disabled ? $t('general.Disable') : $t('general.Enable') }}
          </el-tag>
        </template>
        <template v-slot:actions="{ row }">
          <el-tooltip
            v-if="!row.disabled"
            placement="bottom"
            :content="$t('general.Edit')"
          >
            <em
              class="ri-file-edit-line finished operate-button"
              @click="handleEditClick(row.name)"
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
              @click="handleActiveClick(row)"
            />
          </el-tooltip>
        </template>
      </ElTableResponsive>
      <Pagination
        :total="filteredData.length"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
    </el-col>

    <el-dialog
      :visible.sync="isDialogVisible"
      :width="isMobile ? '95%' : '50%'"
      top="2vh"
      :show-close="false"
      @close="handleClose"
    >
      <span slot="title">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-title capitalize">
              {{ pluginName }}
            </div>
            <div v-if="pluginName">
              {{ $t(`Plugins.${pluginName}.description`) }}
            </div>
          </div>
          <div style="text-align: right;">
            <el-popconfirm
              v-if="isRemovable"
              :confirm-button-text="$t('general.Remove')"
              :cancel-button-text="$t('general.Cancel')"
              icon="el-icon-info"
              popper-class="danger"
              class="mr-3"
              :title="$t('Member.confirmRemove')"
              @confirm="handleDelete(pluginName)"
            >
              <el-button
                slot="reference"
                size="mini"
                type="danger"
              >
                {{ $t('general.Remove') }}
              </el-button>
            </el-popconfirm>
            <el-button
              class="buttonSecondaryReverse"
              size="mini"
              @click="handleClose"
            >
              {{ $t('general.Cancel') }}
            </el-button>
            <el-button
              class="buttonPrimary"
              size="mini"
              :disabled="!isFormFilled"
              @click="handleConfirm"
            >
              {{ form.disabled ? $t('general.Enable') : $t('general.Save') }}
            </el-button>
          </div>
        </div>
      </span>

      <el-form
        v-if="hasArguments"
        ref="form"
        :model="form"
        :label-width="isMobile ? 'auto' : '120px'"
        :label-position="isMobile ? 'top' : 'left'"
        :size="isMobile ? 'small' : 'medium'"
      >
        <template v-for="(arg, argIdx) in form.arguments">
          <el-form-item
            :key="argIdx"
            :label="$t(`Plugins.${pluginName}.arguments.${arg.key}.title`)"
            :prop="'arguments.' + argIdx + '.value'"
            :rules="[
              {
                required: true,
                message: $t(`Plugins.${pluginName}.arguments.${arg.key}.hint`),
                trigger: 'blur'
              }
            ]"
          >
            <el-input
              v-if="arg.type === 'string'"
              v-model="form.arguments[argIdx].value"
              :placeholder="$t(`Plugins.${pluginName}.arguments.${arg.key}.placeholder`)"
            />
            <el-input
              v-if="arg.type === 'password'"
              v-model="form.arguments[argIdx].value"
              :placeholder="$t(`Plugins.${pluginName}.arguments.${arg.key}.placeholder`)"
              show-password
            />
            <el-select
              v-if="arg.type === 'select'"
              v-model="form.arguments[argIdx].value"
              :placeholder="$t(`Plugins.${pluginName}.arguments.${arg.key}.placeholder`)"
            >
              <el-option
                v-for="option in form.arguments[argIdx].options"
                :key="option.value"
                :label="option.name"
                :value="String(option.value)"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <div v-else>
        {{ $t('Plugins.NoArguments') }}
      </div>
    </el-dialog>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { reloadRouter } from '@/router/router'
import { getPlugins, getPluginDetails, updatePlugin, deletePlugin } from '@/api/systemPlugin'
import { SearchBar, Pagination } from '@/mixins'
import { ElTableResponsive } from '@shared/components'

const formTemplate = () => ({
  disabled: false,
  arguments: []
})

export default {
  name: 'SystemPluginManage',
  components: { ElTableResponsive },
  mixins: [SearchBar, Pagination],
  data() {
    return {
      listLoading: false,
      listData: [],
      isLoading: false,
      isDialogVisible: false,
      pluginName: '',
      form: formTemplate(),
      isRemovable: false
    }
  },
  computed: {
    ...mapGetters(['device']),
    hasArguments() {
      return this.form.arguments.length > 0
    },
    isFormFilled() {
      return this.form.arguments.every((item) => item.value !== '')
    },
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
          prop: 'name'
        },
        {
          label: this.$t('general.Description'),
          prop: 'description',
          slot: 'description'
        },
        {
          label: this.$t('general.Status'),
          prop: 'disabled',
          minWidth: 80,
          slot: 'status'
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'update_at',
          minWidth: 100,
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          minWidth: 80,
          slot: 'actions'
        }
      ]
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      const res = await getPlugins()
      this.listData = res.data.sort((a, b) => (a.name < b.name ? -1 : 1))
      this.listLoading = false
    },
    async handleEditClick(pluginName) {
      this.isAddPlugin = false
      this.isLoading = true
      const res = await getPluginDetails(pluginName)
      const { name, disabled } = res.data
      this.pluginName = name
      Object.assign(this.form, { disabled, arguments: res.data.arguments })
      this.isLoading = false
      this.isDialogVisible = true
    },
    async handleActiveClick(row) {
      const { name, disabled } = row
      if (disabled) {
        this.handleEditClick(name)
      } else {
        this.isLoading = true
        await updatePlugin(name, { disabled: true })
        this.fetchData()
        this.isLoading = false
        reloadRouter()
      }
    },
    handleClose() {
      this.isDialogVisible = false
      if (!this.hasArguments) return
      this.$nextTick(() => {
        this.$refs['form'].resetFields()
        this.form = formTemplate()
      })
    },
    async handleConfirm() {
      if (!this.hasArguments) {
        if (this.form.disabled) {
          await updatePlugin(this.pluginName, { disabled: !this.form.disabled })
        }
        this.handleClose()
        this.fetchData()
        reloadRouter()
      } else {
        this.$refs['form'].validate(async (valid) => {
          if (valid) {
            const sendData = Object.assign({}, this.form)
            sendData.arguments = this.form.arguments.reduce(
              (result, cur) => Object.assign(result, { [cur.key]: cur.value }),
              {}
            )
            if (this.form.disabled) {
              sendData.disabled = !this.form.disabled
            }
            await updatePlugin(this.pluginName, sendData)
            this.handleClose()
            this.fetchData()
            reloadRouter()
          }
        })
      }
    },
    handleDelete(pluginName) {
      this.isLoading = true
      deletePlugin(pluginName)
        .then(() => {
          this.$message({
            message: this.$t('Notify.Deleted'),
            type: 'success'
          })
        })
        .catch(err => {
          this.$message({
            message: err,
            type: 'error'
          })
        })
        .then(() => {
          this.fetchData()
          this.isLoading = false
        })
    }
  }
}
</script>
