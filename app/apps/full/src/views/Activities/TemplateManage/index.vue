<template>
  <div class="app-container">
    <div class="flex justify-between">
      <el-button
        class="buttonPrimary"
        icon="el-icon-plus"
        :size="isMobile ? 'small' : 'medium'"
        @click="handleCreate"
      >
        {{ $t('Activities.AddTemplate') }}
      </el-button>
    </div>
    <el-divider />
    <el-table-responsive
      v-loading="listLoading"
      :data="pagedData"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      fit
    >
      <template v-slot:template_name="{row}">
        <el-popover
          placement="top"
          :width="isMobile ? 250 : 400"
          trigger="hover"
          :open-delay="300"
          :close-delay="50"
        >
          <p
            :id="`copy-${getRowIndex(row)}`"
            class="text-center"
          >
            <span class="text-title">
              {{ row.template_repository_url }}
            </span>
          </p>
          <div class="flex justify-center">
            <el-button
              class="mr-2"
              icon="el-icon-copy-document"
              circle
              size="mini"
              @click="copyUrl(`copy-${getRowIndex(row)}`)"
            />
            <a
              :href="row.template_repository_url"
              target="_blank"
            >
              <el-button
                circle
                size="mini"
              >
                <em class="ri-external-link-line" />
              </el-button>
            </a>
          </div>
          <el-link
            slot="reference"
            type="primary"
            :disabled="row.disabled || row.is_lock"
            style="font-size: 16px"
          >
            {{ row.template_repository_name }}
          </el-link>
        </el-popover>
      </template>
      <template v-slot:project_name="{row}">
        <el-popover
          placement="top"
          :width="isMobile ? 250 : 400"
          trigger="hover"
          :open-delay="300"
          :close-delay="50"
        >
          <p
            :id="`copy-${row.from_project_name}`"
            class="text-center"
          >
            <span class="text-title">
              {{ row.from_project_repo_url }}
            </span>
          </p>
          <div class="flex justify-center">
            <el-button
              class="mr-2"
              icon="el-icon-copy-document"
              circle
              size="mini"
              @click="copyUrl(`copy-${row.from_project_name}`)"
            />
            <a
              :href="row.from_project_repo_url"
              target="_blank"
            >
              <el-button
                circle
                size="mini"
              >
                <em class="ri-external-link-line" />
              </el-button>
            </a>
          </div>
          <template slot="reference">
            <span v-if="!isMobile">{{ row.from_project_name }}</span>
            <el-link
              size="small"
              :underline="false"
              :disabled="row.disabled || row.is_lock"
            >
              <em class="ri-external-link-line" />
            </el-link>
            <span v-if="isMobile">{{ row.from_project_name }}</span>
          </template>
        </el-popover>
      </template>
      <template v-slot:actions="{row}">
        <el-tooltip
          placement="bottom"
          :content="allProjectIds.includes(row.from_project_id) ?
            $t('general.Edit') : $t('Activities.OriginalProjectNotExist')"
        >
          <span :class="allProjectIds.includes(row.from_project_id) ? '' : 'disabled'">
            <em
              class="ri-file-edit-line operate-button"
              :class="allProjectIds.includes(row.from_project_id) ? 'finished' : 'disabled'"
              @click=" allProjectIds.includes(row.from_project_id) ? handleEdit(row) : null"
            />
          </span>
        </el-tooltip>
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
      </template>
    </el-table-responsive>
    <Pagination
      :total="filteredData.length"
      :page.sync="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
    <TemplateDialog
      ref="templateDialog"
      :existed-template-ids="existedTemplateIds"
      :title="title"
      @update="loadData"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  getTemplateFromProject,
  deleteTemplateFromProject
} from '@/api_v2/template'
import {
  BasicData,
  Pagination,
  SearchBar
} from '@/mixins'
import { ElTableResponsive } from '@/components'
import TemplateDialog from './components/TemplateDialog'

export default {
  name: 'TemplateManage',
  components: {
    TemplateDialog,
    ElTableResponsive
  },
  mixins: [
    BasicData,
    Pagination,
    SearchBar
  ],
  data() {
    return {
      dialogVisible: false,
      title: '',
      searchKeys: ['from_project_name']
    }
  },
  computed: {
    ...mapGetters(['projectOptions', 'device']),
    allProjectIds() {
      return this.projectOptions.filter((obj) =>
        obj.is_lock !== true && obj.disabled !== true
      ).map((item) => item.id)
    },
    existedTemplateIds() {
      return this.listData.map((item) => item.from_project_id)
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
          label: this.$t('general.Index'),
          prop: 'index',
          align: 'center',
          width: 80,
          type: 'index'
        },
        {
          label: this.$t('Activities.TemplateName'),
          prop: 'template_name',
          align: 'center',
          slot: 'template_name'
        },
        {
          label: this.$t('Activities.OriginalProject'),
          prop: 'project_name',
          align: 'center',
          minWidth: '150',
          slot: 'project_name'
        },
        {
          label: this.$t('Activities.OriginalProjectUpdatedTime'),
          prop: 'the_last_update_time',
          align: 'center',
          width: '150',
          type: 'time'
        },
        {
          label: this.$t('Activities.SyncTime'),
          prop: 'updated_at',
          align: 'center',
          width: '120',
          type: 'time'
        },
        {
          label: this.$t('general.Creator'),
          prop: 'creator_name',
          align: 'center',
          width: '100'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          width: '100',
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      return (await getTemplateFromProject()).data
    },
    copyUrl(id) {
      const message = this.$t('Notify.Copied')
      const target = document.getElementById(id)
      window.getSelection().selectAllChildren(target)
      document.execCommand('Copy')
      this.showSuccessMessage(message)
    },
    handleCreate() {
      this.$refs.templateDialog.dialogVisible = true
      this.title = this.$t('Activities.CreateTemplate')
    },
    handleEdit(row) {
      this.title = this.$t('Activities.EditTemplate')
      this.$refs.templateDialog.dialogVisible = true
      this.$refs.templateDialog.row = row
    },
    async handleDelete(row) {
      try {
        await deleteTemplateFromProject(row.id)
        const message = this.$t('Notify.Deleted')
        this.showSuccessMessage(message)
      } catch (error) {
        console.error(error)
      } finally {
        this.loadData()
      }
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    },
    getRowIndex(row) {
      return this.pagedData.indexOf(row)
    }
  }
}
</script>

<style lang="scss" scoped>
.disabled {
  cursor: not-allowed;
}
</style>
