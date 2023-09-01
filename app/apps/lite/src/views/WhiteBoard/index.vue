<template>
  <div class="app-container">
    <ProjectListSelector>
      <div slot="button">
        <el-button
          class="buttonSecondary"
          icon="el-icon-plus"
          :size="isMobile ? 'mini' : 'medium'"
          :disabled="!isAlive"
          @click="handleCreate"
        >
          <span v-if="!isMobile">{{ $t('Excalidraw.CreateBoard') }}</span>
        </el-button>
        <span
          v-if="!isAlive"
          style="font-size: 12px;"
          class="text-danger"
        >
          <em class="ri-error-warning-fill ri-lg" />
          {{ $t('Notify.ExcalidrawAliveWarning') }}
        </span>
      </div>
      <SearchFilter :keyword.sync="keyword" />
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
        <el-link
          type="primary"
          style="font-size: 16px"
          @click="handleEdit(row)"
        >
          {{ row.name }}
        </el-link>
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
          <el-button
            circle
            size="mini"
            class="buttonPrimaryReverse"
            type="primary"
            icon="el-icon-edit"
            @click="handleEdit(row, true)"
          />
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
            <el-button
              circle
              size="mini"
              type="danger"
              icon="el-icon-delete"
            />
          </el-tooltip>
        </el-popconfirm>
        <el-tooltip
          :content="$t('Excalidraw.HistoricalRecord')"
          placement="bottom"
        >
          <el-button
            v-if="isProjectOwnerOrAdministrator"
            circle
            size="mini"
            class="buttonSecondaryReverse"
            type="success"
            icon="el-icon-time"
            @click="handleRestore(row)"
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
  SearchFilter,
  CreateBoardDialog,
  RestoreBoardDialog,
  ShareButton
} from './components'

export default {
  name: 'WhiteBoardList',
  components: {
    ProjectListSelector,
    ElTableResponsive,
    SearchFilter,
    CreateBoardDialog,
    RestoreBoardDialog,
    ShareButton
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      searchKeys: ['name'],
      isAlive: true,
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
          type: 'index',
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
    }
  },
  methods: {
    async fetchData() {
      try {
        await this.getExcalidrawStatus()
        if (!this.isAlive) return []
        await this.getAssignedTo()
        const res = await getExcalidraw({ project_id: this.selectedProjectId })
        return res.data
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
