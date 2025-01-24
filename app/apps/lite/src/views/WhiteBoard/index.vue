<template>
  <div class="app-container">
    <ProjectListSelector>
      <div slot="button">
        <el-button
          :disabled="!isAlive"
          :size="isMobile ? 'mini' : 'medium'"
          icon="el-icon-plus"
          type="primary"
          @click="handleCreate"
        >
          <span v-if="!isMobile">
            {{ $t('Plugins.excalidraw.CreateBoard') }}
          </span>
        </el-button>
        <span v-if="!isAlive" class="text-danger" style="font-size: 12px">
          <em class="ri-error-warning-fill ri-lg"></em>
          {{ $t('Notify.ExcalidrawAliveWarning') }}
        </span>
      </div>
      <div>
        <el-input
          v-if="searchVisible"
          v-model="keyword"
          :placeholder="$t('general.Search')"
          clearable
          prefix-icon="el-icon-search"
          style="width: 250px"
          @blur="searchVisible = !searchVisible"
        />
        <el-button
          v-else
          class="header-text-color"
          icon="el-icon-search"
          type="text"
          @click="searchVisible = !searchVisible"
        >
          {{ $t('general.Search') + (keyword ? ': ' + keyword : '') }}
        </el-button>
        <template v-if="isFilterChanged">
          <el-divider direction="vertical" />
          <el-button
            icon="el-icon-close"
            plain
            size="small"
            type="warning"
            @click="cleanFilter"
          >
            {{ $t('Issue.CleanFilter') }}
          </el-button>
        </template>
      </div>
    </ProjectListSelector>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :columns="tableColumns"
      :data="pagedData"
      :element-loading-text="$t('Loading')"
      fit
    >
      <template #name="{ row }">
        <span class="text link-text-color" @click="handleEdit(row)">
          {{ row.name }}
        </span>
        <ShareButton
          :assigned-to="assigned_to"
          :row="row"
          @loadData="row = row"
        />
      </template>
      <template #issue_ids="{ row }">
        <el-tag
          v-for="item in row.issue_ids"
          :key="item"
          class="mr-1"
          size="mini"
          @click="enterDetail(item)"
        >
          {{ item }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <el-tooltip :content="$t('general.Edit')" placement="bottom">
          <em
            class="ri-edit-box-line success table-button"
            @click="handleEdit(row, true)"
          ></em>
        </el-tooltip>
        <el-popconfirm
          :cancel-button-text="$t('general.Cancel')"
          :confirm-button-text="$t('general.Delete')"
          :title="$t('Notify.confirmDelete')"
          icon="el-icon-info"
          popper-class="danger"
          @confirm="handleDelete(row)"
        >
          <el-tooltip
            slot="reference"
            :content="$t('general.Delete')"
            placement="bottom"
          >
            <em class="ri-delete-bin-2-line danger table-button"></em>
          </el-tooltip>
        </el-popconfirm>
        <el-tooltip
          :content="$t('Plugins.excalidraw.HistoricalRecord')"
          placement="bottom"
        >
          <em
            v-if="isProjectOwnerOrAdministrator"
            class="el-icon-time primary table-button"
            @click="handleRestore(row)"
          ></em>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="listQuery.total"
      @pagination="onPagination"
    />
    <CreateBoardDialog
      v-if="CreateBoardDialogVisible"
      :dialog-visible.sync="CreateBoardDialogVisible"
      @handleError="handleError"
    />
    <RestoreBoardDialog
      v-if="RestoreBoardDialogVisible"
      :dialog-visible.sync="RestoreBoardDialogVisible"
      :row="row"
      @handleError="handleError"
      @update="loadData"
    />
  </div>
</template>

<script>
import { getProjectAssignable } from '@/api/projects'
import { deleteExcalidraw, getExcalidraw } from '@/api_v2/excalidraw'
import { getServerStatus } from '@/api_v2/monitoring'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { mapGetters } from 'vuex'
import CreateBoardDialog from './components/CreateBoardDialog'
import RestoreBoardDialog from './components/RestoreBoardDialog'
import ShareButton from './components/ShareButton'

export default {
  name: 'WhiteBoardList',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    ElTableResponsive: () => import('@shared/components/ElTableResponsive'),
    CreateBoardDialog,
    RestoreBoardDialog,
    ShareButton
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      storageName: 'whiteboardList',
      storageType: ['SearchBar', 'Pagination'],
      searchKeys: ['name'],
      isAlive: true,
      searchVisible: false,
      CreateBoardDialogVisible: false,
      RestoreBoardDialogVisible: false,
      row: {},
      assigned_to: []
    }
  },
  computed: {
    ...mapGetters(['userId', 'userRole', 'selectedProject', 'device']),
    isProjectOwnerOrAdministrator() {
      return (
        this.userId === this.selectedProject.owner_id ||
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      )
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
          prop: 'index',
          width: 70,
          align: 'center'
        },
        {
          label: this.$t('general.Name'),
          prop: 'name',
          align: 'center',
          minWidth: 200,
          slot: 'name'
        },
        {
          label: this.$t('general.CreateTime'),
          prop: 'created_at',
          align: 'center',
          minWidth: 130,
          type: 'time'
        },
        {
          label: this.$t('general.Creator'),
          prop: 'operator.name',
          align: 'center',
          minWidth: 150
        },
        {
          label: this.$t('Issue.Issue'),
          prop: 'issue_ids',
          align: 'center',
          showOverflowTooltip: true,
          slot: 'issue_ids'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          minWidth: 150,
          slot: 'actions'
        }
      ]
    },
    isFilterChanged() {
      return !!this.keyword
    }
  },
  watch: {
    keyword(val) {
      if (val !== null) this.resetListQuery()
    },
    filteredData(val) {
      this.setNewListQuery({
        ...this.listQuery,
        current: this.listQuery.page,
        total: val.length
      })
    }
  },
  methods: {
    async fetchData() {
      try {
        await this.getExcalidrawStatus()
        if (!this.isAlive) return []
        await this.getAssignedTo()
        const res = await getExcalidraw({ project_id: this.selectedProjectId })
        return res.data.map((item, index) => ({ ...item, index: index + 1 }))
      } catch (error) {
        console.error(error)
        this.handleError()
      }
    },
    async getAssignedTo() {
      this.assigned_to = (
        await getProjectAssignable(this.selectedProjectId)
      ).data.user_list
    },
    async getExcalidrawStatus() {
      this.isAlive = (await getServerStatus('excalidraw')).status
    },
    handleError() {
      this.isAlive = false
      this.listData = []
    },
    handleCreate() {
      this.CreateBoardDialogVisible = true
    },
    handleEdit(row, isEdit = false) {
      const route = {
        name: 'Excalidraw',
        params: {
          projectName: row.project.name,
          excalidrawId: row.id
        }
      }
      if (isEdit) route.query = { isEdit: true }
      this.$router.push(route)
    },
    async handleDelete(row) {
      try {
        await deleteExcalidraw(row.id)
        const message = this.$t('Notify.Deleted')
        this.showSuccessMessage(message)
        await this.loadData()
      } catch (error) {
        console.error(error)
        this.handleError()
      }
    },
    handleRestore(row) {
      this.row = row
      this.RestoreBoardDialogVisible = true
    },
    enterDetail(issueId) {
      this.$router.push({ name: 'IssueDetail', params: { issueId }})
    },
    cleanFilter() {
      this.keyword = ''
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.el-tag {
  cursor: pointer;
}
</style>
