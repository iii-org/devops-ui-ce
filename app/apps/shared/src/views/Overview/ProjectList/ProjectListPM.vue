<template>
  <div class="app-container">
    <div :class="!isMobile ? 'flex items-center justify-between' : ''">
      <div>
        <el-button
          icon="el-icon-plus"
          class="button-primary"
          @click="handleAdding"
        >
          {{ $t('Project.AddProject') }}
        </el-button>
      </div>
      <div class="text-right">
        <SearchFilter
          ref="filter"
          :keyword.sync="keyword"
          @changeFilter="fetchData"
        >
          <UpdateButton
            slot="updateButton"
            :list-loading.sync="listLoading"
            @update="fetchData"
          />
        </SearchFilter>
      </div>
    </div>
    <el-divider />
    <el-table
      v-loading="listLoading"
      :data="listData"
      :element-loading-text="$t('Loading')"
      :row-class-name="getRowClass"
      fit
    >
      <el-table-column type="expand">
        <template slot-scope="scope">
          <ProjectExpand
            :children="scope.row.children"
            @setStar="setStar"
            @updated="fetchData"
            @handleClick="handleClick"
            @handleEdit="handleEdit"
            @handleDelete="handleDelete"
            @handleFix="handleFix"
            @handleToggle="handleToggle"
          />
        </template>
      </el-table-column>
      <el-table-column
        width="60"
        align="center"
        prop="starred"
      >
        <template slot-scope="scope">
          <em
            v-if="scope.row.starred"
            class="el-icon-star-on text-yellow-500 text-2xl cursor-pointer"
            @click="setStar(scope.row.id, false)"
          />
          <em
            v-else
            class="el-icon-star-off text-gray-400 text-xl cursor-pointer"
            @click="setStar(scope.row.id, true)"
          />
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Project.Name') + '/' + $t('Project.Identifier')"
        show-overflow-tooltip
        min-width="230"
      >
        <template slot-scope="scope">
          <div class="flex justify-start">
            <div class="flex items-center mr-5">
              <!-- gitlab button -->
              <el-popover
                v-if="scope.row.git_url"
                :disabled="scope.row.disabled || scope.row.is_lock"
                :open-delay="300"
                :close-delay="50"
                class="mr-1"
                placement="top"
                width="400"
                trigger="hover"
              >
                <p
                  :id="`copy-${scope.$index}`"
                  class="text-center"
                >
                  <span class="font-bold text-sm">{{ scope.row.git_url }}</span>
                </p>
                <div class="flex justify-center">
                  <el-button
                    class="mr-2"
                    icon="el-icon-copy-document"
                    circle
                    size="mini"
                    @click="copyUrl(`copy-${scope.$index}`)"
                  />
                  <a
                    :href="scope.row.git_url"
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
                  :underline="false"
                  :disabled="scope.row.disabled || scope.row.is_lock"
                  style="padding: 0 3px;"
                >
                  <svg-icon icon-class="gitlab" style="font-size: 18px;" />
                </el-link>
              </el-popover>
              <!-- harbor button -->
              <el-link
                v-if="scope.row.harbor_url"
                :underline="false"
                :disabled="scope.row.disabled || scope.row.is_lock"
                :href="scope.row.harbor_url"
                target="_blank"
                style="font-size: 18px; padding: 0 3px;"
              >
                <svg-icon icon-class="harbor" style="font-size: 18px;" />
              </el-link>
            </div>
            <div>
              <el-link
                v-if="userRole !== 'QA'"
                :class="scope.row.disabled || scope.row.is_lock ? '' : 'link-text-color'"
                :underline="false"
                :disabled="scope.row.disabled || scope.row.is_lock"
                @click="handleClick(scope.row)"
              >
                {{ scope.row.display }}
              </el-link>
              <template v-else>
                {{ scope.row.display }}
              </template>
              <br>
              <span class="text-info text-sm">#{{ scope.row.name }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <ElTableColumnTag
        :label="$t('Project.IssueStatus')"
        prop="project_status"
        i18n-key="Project"
        location="projectListPM"
        min-width="130"
      />
      <el-table-column
        :label="$t('Project.IssueProgress')"
        align="center"
        width="140"
      >
        <template slot-scope="scope">
          <div>
            {{
              `${scope.row.closed_count ? scope.row.closed_count : "0"} / ${
                scope.row.total_count ? scope.row.total_count : "0"
              }`
            }}
          </div>
          <el-progress
            :percentage="returnProgress(scope.row.closed_count, scope.row.total_count)"
            :show-text="false"
            :stroke-width="4"
            status="warning"
          />
        </template>
      </el-table-column>
      <ElTableColumnTime
        :label="$t('Project.IssueUpdate')"
        prop="updated_time"
      />
      <el-table-column
        :label="$t('general.owner_name')"
        align="center"
        prop="owner_name"
        min-width="90"
      />
      <el-table-column
        :label="$t('ProjectSettings.Status')"
        align="center"
        min-width="100px"
      >
        <template slot-scope="scope">
          <el-tooltip
            :disabled="!scope.row.is_lock"
            :content="scope.row.lock_reason"
            placement="bottom"
          >
            <el-tag v-if="scope.row.is_lock" type="info">
              {{ $t('errorDetail.locked') }}
            </el-tag>
            <el-tag v-else :type="scope.row.disabled ? 'danger' : 'success'">
              {{ scope.row.disabled ? $t('general.Disable') : $t('general.Enable') }}
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('general.Actions')"
        header-align="center"
        align="center"
        min-width="120"
      >
        <template slot-scope="scope">
          <el-tooltip
            v-if="userRole !== 'QA' && scope.row.is_lock !== true"
            :content="$t('general.Edit')"
            placement="bottom"
          >
            <em class="ri-edit-box-line success table-button" @click="handleEdit(scope.row)" />
          </el-tooltip>
          <el-tooltip
            v-if="scope.row.is_lock !== true"
            :content="$t('general.Delete')"
            placement="bottom"
          >
            <span>
              <em
                :class="permission(scope.row) ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click="handleDelete(scope.row)"
              />
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="scope.row.is_lock === true"
            :content="$t('general.ForceDelete')"
            placement="bottom"
          >
            <span>
              <em
                :class="permission(scope.row) ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click="handleDelete(scope.row, true)"
              />
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="scope.row.is_lock === true"
            :content="$t('general.Fix')"
            placement="bottom"
          >
            <em class="ri-refresh-line primary table-button" @click="handleFix(scope.row.id)" />
          </el-tooltip>
          <el-tooltip
            v-if="scope.row.is_lock !== true"
            :content="!scope.row.disabled ? $t('general.Disable') : $t('general.Enable')"
            placement="bottom"
          >
            <span>
              <em
                :class="disableProjectClass(scope.row)"
                class="table-button"
                @click="handleToggle(scope.row)"
              />
            </span>
          </el-tooltip>
        </template>
      </el-table-column>
      <template slot="empty">
        <el-empty :description="$t('general.NoData')" />
      </template>
    </el-table>
    <Pagination
      :total="projectListTotal"
      :page="params.page"
      :limit="params.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />

    <CreateProjectDialog
      ref="createProjectDialog"
      @update="fetchData"
    />
    <DeleteProjectDialog
      ref="deleteProjectDialog"
      :delete-project-obj="deleteProject"
      :is-force-delete="forceDelete"
      :project-relation-list="projectRelationList"
      @update="fetchData"
    />
    <el-dialog
      v-if="isShowProjectSettingDialog"
      :visible.sync="isShowProjectSettingDialog"
      :width="isMobile ? '95%' : '75%'"
      destroy-on-close
      top="5vh"
      @close="handleCloseDialog"
    >
      <ProjectSettingsDialog
        @handleCloseDialog="handleCloseDialog"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { deleteStarProject, postStarProject, getCalculateProjectList } from '@/api/projects'
import { syncProject, getHasSon, getProjectRelation } from '@/api_v2/projects'
import { BasicData, SearchBar, Pagination, Table } from '@/mixins'
import { ElTableColumnTime, ElTableColumnTag } from '@shared/components'
import { ProjectSettingsDialog } from '@shared/views/Plan/Overview/components'
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  SearchFilter,
  UpdateButton
} from './components'

const params = () => ({
  limit: 10,
  offset: 0,
  parent_son: true,
  root: true
})

export default {
  name: 'ProjectListPM',
  components: {
    ElTableColumnTime,
    ElTableColumnTag,
    CreateProjectDialog,
    ProjectSettingsDialog,
    DeleteProjectDialog,
    SearchFilter,
    UpdateButton,
    ProjectExpand: () => import('./components/ProjectExpand')
  },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'gray',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  mixins: [BasicData, SearchBar, Pagination, Table],
  data() {
    return {
      editProjectObject: {},
      deleteProject: { id: '', name: '' },
      searchKeys: ['display', 'name', 'owner_name'],
      params: params(),
      listData: [],
      forceDelete: false,
      timeoutId: -1,
      projectRelationList: [],
      isShowProjectSettingDialog: false
    }
  },
  computed: {
    ...mapGetters([
      'userId',
      'userRole',
      'projectList',
      'projectListTotal',
      'userProjectList',
      'selectedProjectId',
      'device'
    ]),
    getButtonType() {
      return function (disabled) {
        return disabled ? 'success' : 'danger'
      }
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    }
  },
  watch: {
    keyword(val) {
      if (val !== null) {
        this.params.offset = 0
        this.params.limit = 10
        this.params.search = this.keyword
        clearTimeout(this.timeoutId)
        this.timeoutId = window.setTimeout(() => this.fetchData(1, 10, val), 1000)
      } else this.keyword = ''
    },
    selectedProjectId: {
      handler(id) {
        if (id > -1) {
          this.isShowProjectSettingDialog = false
        }
      }
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timeoutId)
  },
  methods: {
    ...mapActions('projects', ['setSelectedProject', 'getMyProjectList', 'editProject']),
    async fetchData() {
      this.listLoading = true
      this.forceDelete = false
      if (this.$refs.filter) this.getParams()
      else this.params.disabled = 0
      await this.getMyProjectList(this.params)
      this.listLoading = false
      this.listData = this.projectList
      const filteredArray = this.projectList.filter(obj => {
        return obj.is_lock !== true && obj.disabled !== true
      })
      if (filteredArray.length > 0) {
        this.getCalculateProjectData(filteredArray)
      }
      return this.listData
    },
    getParams() {
      if (this.keyword !== '') {
        delete this.params.root
        this.params.search = this.keyword
      } else {
        delete this.params.search
        this.params.root = true
      }
      if (this.$refs.filter.isDisabled.length === 1) {
        this.params.disabled = this.$refs.filter.isDisabled[0]
      } else {
        delete this.params.disabled
      }
    },
    async getCalculateProjectData(project) {
      const ids = project.map(function (el) {
        return el.id
      })
      const calculated = await this.getCalculateProjectList(ids.join())
      for (const i in calculated.project_list) {
        calculated.project_list[i].id = parseInt(calculated.project_list[i].id)
      }
      const merged = []
      for (const item of this.listData) {
        merged.push({
          ...item,
          ...calculated.project_list.find(
            (itmInner) => itmInner.id === item.id
          )
        })
      }
      this.listData = merged
    },
    async getCalculateProjectList(ids) {
      this.listLoading = true
      return await getCalculateProjectList(ids)
        .then((res) => {
          return res.data
        })
        .finally(() => {
          this.listLoading = false
        })
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      const offset = limit * (page - 1)
      this.params.offset = offset
      this.params.limit = limit
      this.params.page = page
      await this.fetchData()
    },
    initParams() {
      this.params = params()
    },
    handleAdding() {
      this.$refs.createProjectDialog.showDialog = true
    },
    handleEdit(row) {
      const { id } = row
      const selectedProject = this.userProjectList.filter((elm) => {
        return elm.id === id
      })[0]
      localStorage.setItem('projectId', id)
      this.setSelectedProject(selectedProject)
      if (selectedProject.id === this.selectedProjectId) {
        this.$nextTick(() => {
          this.isShowProjectSettingDialog = true
        })
      }
    },
    async handleDelete(row, isForce) {
      this.deleteProject.id = row.id
      this.deleteProject.name = row.name
      if (isForce) this.forceDelete = true
      await this.isHasSon(row.id)
      this.$refs.deleteProjectDialog.showDialog = true
    },
    async isHasSon(projectId) {
      const hasSon = await getHasSon(projectId)
      if (hasSon.has_child) {
        const projectRelation = await getProjectRelation(projectId)
        this.projectRelationList = projectRelation.data[0].child
      } else {
        this.projectRelationList = []
      }
    },
    returnProgress(current, total) {
      if (current) return Math.round((current / total) * 100)
      else return 0
    },
    handleClick(projectObj) {
      const { id } = projectObj
      const selectedProject = this.userProjectList.filter((elm) => {
        return elm.id === id
      })[0]
      this.setSelectedProject(selectedProject)
      localStorage.setItem('projectId', id)
      this.$router.push({ name: 'Overview', params: { projectName: selectedProject.name }})
    },
    async handleCloseDialog() {
      this.isShowProjectSettingDialog = false
      await this.fetchData()
    },
    copyUrl(id) {
      const message = this.$t('Notify.Copied')
      const target = document.getElementById(id)
      window.getSelection().selectAllChildren(target)
      document.execCommand('Copy')
      this.showSuccessMessage(message)
    },
    permission(row) {
      const { creator_id, owner_id } = row
      if (this.userRole === 'Administrator') return false
      if (this.userRole === 'QA') {
        if (creator_id !== this.userId) return true
      } else {
        if (owner_id !== this.userId) return true
      }
    },
    async setStar(id, star) {
      const message = this.$t('Notify.Updated')
      star ? await postStarProject(id) : await deleteStarProject(id)
      this.initParams()
      await this.fetchData()
      this.showSuccessMessage(message)
    },
    handleToggle(row) {
      row.disabled = !row.disabled
      const sendData = this.getEditData(row)
      this.handleEditStatus(sendData)
    },
    getEditData(row) {
      return {
        pId: row.id,
        data: {
          display: row.display,
          owner_id: row.owner_id,
          start_date: row.start_date,
          due_date: row.due_date,
          disabled: row.disabled
        }
      }
    },
    handleEditStatus(sendData) {
      this.listLoading = true
      const message = this.$t('Notify.Updated')
      this.editProject(sendData).then((res) => {
        this.listLoading = false
        if (res.message === 'success') {
          this.showSuccessMessage(message)
          this.fetchData()
        } else {
          const error = res.error.message
          this.showErrorMessage(error)
        }
      })
    },
    async handleFix(project_id) {
      this.listLoading = true
      const res = await syncProject(project_id)
      if (res.message === 'success') {
        this.showSuccessMessage(res.message)
        this.fetchData()
      } else {
        const error = res.error.message
        this.showErrorMessage(error)
      }
      this.listLoading = false
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    },
    showErrorMessage(error) {
      this.$message({
        title: this.$t('general.Warning'),
        message: error,
        type: 'warning'
      })
    },
    getRowClass({ row }) {
      return row.has_son ? '' : 'hide-expand'
    },
    disableProjectClass(row) {
      let className = ''
      if (row.disabled) {
        className = 'ri-play-circle-line success'
      } else {
        className = 'ri-pause-circle-line warning'
      }
      if (this.permission(row)) {
        className += ' disabled'
      }
      return className
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .hide-expand {
  > .el-table__expand-column {
    > .cell {
      display: none;
    }
  }
}
</style>
