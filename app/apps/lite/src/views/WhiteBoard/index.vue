<template>
  <div class="app-container">
    <ProjectListSelector>
      <div slot="button">
        <el-button
          class="button-primary"
          icon="el-icon-plus"
          :size="isMobile ? 'mini' : 'medium'"
          :disabled="!isAlive"
          @click="handleCreate"
        >
          <span v-if="!isMobile">
            {{ $t('Excalidraw.CreateBoard') }}
          </span>
        </el-button>
        <span
          v-if="!isAlive"
          style="font-size: 12px;"
          class="text-danger"
        >
          <em class="ri-error-warning-fill ri-lg"></em>
          {{ $t('Notify.ExcalidrawAliveWarning') }}
        </span>
      </div>
      <div>
        <el-input
          v-if="searchVisible"
          v-model="keyword"
          style="width: 250px"
          :placeholder="$t('general.Search')"
          prefix-icon="el-icon-search"
          clearable
          @blur="searchVisible =! searchVisible"
        />
        <el-button
          v-else
          type="text"
          icon="el-icon-search"
          class="header-text-color"
          @click="searchVisible =! searchVisible"
        >
          {{ $t('general.Search') + ((keyword) ? ': ' + keyword : '') }}
        </el-button>
        <template v-if="isFilterChanged">
          <el-divider direction="vertical" />
          <el-button
            size="small"
            icon="el-icon-close"
            class="button-secondary-reverse"
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
      :data="pagedData"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      fit
    >
      <template v-slot:name="{row}">
        <span
          class="text link-text-color"
          @click="handleEdit(row)"
        >
          {{ row.name }}
        </span>
        <ShareButton
          :row="row"
          :assigned-to="assigned_to"
          @loadData="row = row"
        />
      </template>
      <template v-slot:issue_ids="{row}">
        <el-tag
          v-for="item in row.issue_ids"
          :key="item"
          size="mini"
          class="mr-1"
          @click="enterDetail(item)"
        >
          {{ item }}
        </el-tag>
      </template>
      <template v-slot:actions="{row}">
        <el-tooltip
          :content="$t('general.Edit')"
          placement="bottom"
        >
          <em class="ri-edit-box-line success table-button" @click="handleEdit(row, true)"></em>
        </el-tooltip>
        <el-popconfirm
          :title="$t('Notify.confirmDelete')"
          :confirm-button-text="$t('general.Delete')"
          :cancel-button-text="$t('general.Cancel')"
          popper-class="danger"
          icon="el-icon-info"
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
          :content="$t('Excalidraw.HistoricalRecord')"
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
      :total="listQuery.total"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
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
      @update="loadData"
      @handleError="handleError"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectAssignable } from '@/api/projects'
import { getExcalidraw, deleteExcalidraw } from '@/api_v2/excalidraw'
import { getServerStatus } from '@/api_v2/monitoring'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@shared/components'
import {
  CreateBoardDialog,
  RestoreBoardDialog,
  ShareButton
} from './components'

export default {
  name: 'WhiteBoardList',
  components: {
    ProjectListSelector,
    ElTableResponsive,
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
      return this.userId === this.selectedProject.owner_id || this.userRole === 'Administrator'
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
      this.assigned_to = (await getProjectAssignable(this.selectedProjectId)).data.user_list
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
