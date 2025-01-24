<template>
  <div class="app-container">
    <div :class="!isMobile ? 'flex items-center justify-between' : ''">
      <div>
        <el-button type="primary" icon="el-icon-plus" @click="handleAdding">
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
            @update="updateList"
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
      @expand-change="getProjectChildren"
    >
      <el-table-column type="expand">
        <template slot-scope="{ row }">
          <el-skeleton v-if="row.children.length === 0" :rows="3" class="p-5" />
          <ProjectExpand
            v-else
            :children="row.children"
            :params="params"
            @handleClick="handleClick"
            @handleDelete="handleDelete"
            @handleEdit="handleEdit"
            @handleFix="handleFix"
            @handleToggle="handleToggle"
            @setStar="setStar"
            @updated="updateList"
          />
        </template>
      </el-table-column>
      <el-table-column align="center" prop="is_starred" width="60">
        <template slot-scope="scope">
          <em
            v-if="scope.row.is_starred"
            class="el-icon-star-on text-yellow-500 text-2xl cursor-pointer"
            @click="setStar(scope.row.id, false)"
          ></em>
          <em
            v-else
            class="el-icon-star-off text-gray-400 text-xl cursor-pointer"
            @click="setStar(scope.row.id, true)"
          ></em>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Project.Name') + '/' + $t('Project.Identifier')"
        min-width="230"
        show-overflow-tooltip
      >
        <template slot-scope="scope">
          <div class="flex justify-start">
            <div class="flex items-center mr-5">
              <!-- gitlab button -->
              <el-popover
                v-if="scope.row.git_url && services.gitlab"
                :close-delay="50"
                :disabled="scope.row.is_disabled || scope.row.is_locked"
                :open-delay="300"
                class="mr-1"
                placement="top"
                trigger="hover"
                width="400"
              >
                <p class="text-center">
                  <span class="font-bold text-sm">
                    {{ scope.row.git_url }}
                  </span>
                </p>
                <div class="flex justify-center">
                  <el-button
                    circle
                    class="mr-2"
                    icon="el-icon-copy-document"
                    size="mini"
                    @click="copyUrl(scope.row.git_url)"
                  />
                  <a :href="scope.row.git_url" target="_blank">
                    <el-button circle size="mini">
                      <em class="ri-external-link-line"></em>
                    </el-button>
                  </a>
                </div>
                <el-link
                  slot="reference"
                  :disabled="scope.row.is_disabled || scope.row.is_locked"
                  :underline="false"
                  style="padding: 0 3px"
                >
                  <svg-icon icon-class="gitlab" style="font-size: 18px" />
                </el-link>
              </el-popover>
              <!-- harbor button -->
              <el-link
                v-if="scope.row.harbor_url && services.harbor"
                :disabled="scope.row.is_disabled || scope.row.is_locked"
                :href="scope.row.harbor_url"
                :underline="false"
                style="font-size: 18px; padding: 0 3px"
                target="_blank"
              >
                <svg-icon icon-class="harbor" style="font-size: 18px" />
              </el-link>
            </div>
            <div>
              <el-link
                v-if="userRole !== 'QA'"
                :class="
                  scope.row.is_disabled || scope.row.is_locked
                    ? ''
                    : 'link-text-color'
                "
                :disabled="scope.row.is_disabled || scope.row.is_locked"
                :underline="false"
                @click="handleClick(scope.row)"
              >
                {{ scope.row.display_name }}
              </el-link>
              <template v-else>
                {{ scope.row.display_name }}
              </template>
              <br />
              <span class="text-info text-sm">
                #{{ scope.row.identifier }}
              </span>
            </div>
          </div>
        </template>
      </el-table-column>
      <ElTableColumnTag
        :label="$t('Project.IssueStatus')"
        i18n-key="Project"
        location="projectListPM"
        min-width="130"
        prop="project_status"
        size="small"
      />
      <el-table-column
        :label="$t('Project.IssueProgress')"
        align="center"
        width="140"
      >
        <template slot-scope="scope">
          <div>
            {{
              `${scope.row.issues.closed ? scope.row.issues.closed : '0'} / ${
                scope.row.issues.total ? scope.row.issues.total : '0'
              }`
            }}
          </div>
          <el-progress
            :percentage="
              returnProgress(scope.row.issues.closed, scope.row.issues.total)
            "
            :show-text="false"
            :stroke-width="4"
            status="warning"
          />
        </template>
      </el-table-column>
      <ElTableColumnTime :label="$t('Project.IssueUpdate')" prop="update_at" />
      <el-table-column
        :label="$t('general.owner_name')"
        align="center"
        min-width="90"
        prop="owner_name"
      />
      <el-table-column
        :label="$t('ProjectSettings.Status')"
        align="center"
        min-width="100px"
      >
        <template slot-scope="scope">
          <el-tooltip
            :content="scope.row.lock_reason"
            :disabled="!scope.row.is_locked"
            placement="bottom"
          >
            <el-tag v-if="scope.row.is_locked" type="info">
              {{ $t('errorDetail.locked') }}
            </el-tag>
            <el-tag v-else :type="scope.row.is_disabled ? 'danger' : 'success'">
              {{
                scope.row.is_disabled
                  ? $t('general.Disable')
                  : $t('general.Enable')
              }}
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('general.Actions')"
        align="center"
        fixed="right"
        header-align="center"
        min-width="120"
      >
        <template slot-scope="scope">
          <el-tooltip
            v-if="userRole !== 'QA'"
            :content="$t('general.Edit')"
            placement="bottom"
          >
            <span>
              <em
                :class="
                  scope.row.is_locked || scope.row.is_disabled
                    ? 'disabled'
                    : 'success'
                "
                class="ri-edit-box-line table-button"
                @click="handleEdit(scope.row)"
              ></em>
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="!scope.row.is_locked"
            :content="$t('general.Delete')"
            placement="bottom"
          >
            <span>
              <em
                :class="permission(scope.row) ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click="handleDelete(scope.row)"
              ></em>
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="scope.row.is_locked"
            :content="$t('general.ForceDelete')"
            placement="bottom"
          >
            <span>
              <em
                :class="permission(scope.row) ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click="handleDelete(scope.row, true)"
              ></em>
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="scope.row.is_locked"
            :content="$t('general.Fix')"
            placement="bottom"
          >
            <em
              class="ri-refresh-line primary table-button"
              @click="handleFix(scope.row.id)"
            ></em>
          </el-tooltip>
          <el-tooltip
            v-if="!scope.row.is_locked"
            :content="
              !scope.row.is_disabled
                ? $t('general.Disable')
                : $t('general.Enable')
            "
            placement="bottom"
          >
            <span>
              <em
                :class="disableProjectClass(scope.row)"
                class="table-button"
                @click="handleToggle(scope.row)"
              ></em>
            </span>
          </el-tooltip>
        </template>
      </el-table-column>
      <template slot="empty">
        <el-empty :description="$t('general.NoData')" />
      </template>
    </el-table>
    <Pagination
      :layout="paginationLayout"
      :limit="params.limit"
      :page="params.page"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="projectListTotal"
      @pagination="onPagination"
    />

    <CreateProjectDialog ref="createProjectDialog" @update="updateList" />
    <DeleteProjectDialog
      ref="deleteProjectDialog"
      :delete-project-obj="deleteProject"
      :is-force-delete="forceDelete"
      :project-relation-list="projectRelationList"
      @update="updateList"
    />
    <el-dialog
      v-if="isShowProjectSettingDialog"
      :visible.sync="isShowProjectSettingDialog"
      :width="isMobile ? '95%' : '75%'"
      destroy-on-close
      top="5vh"
      @close="handleCloseDialog"
    >
      <ProjectSettingsDialog @handleCloseDialog="handleCloseDialog" />
    </el-dialog>
  </div>
</template>

<script>
import { syncProject } from '@/api_v2/projects'
import {
  deleteStarProject,
  getProjectChildren,
  getProjectRelation,
  postStarProject
} from '@/api_v3/projects'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import Table from '@/mixins/Table'
import { mapActions, mapGetters } from 'vuex'

const params = () => ({
  limit: 10,
  page: 1,
  root: true
})

export default {
  name: 'ProjectListPM',
  components: {
    ElTableColumnTime: () => import('@shared/components/ElTableColumnTime'),
    ElTableColumnTag: () => import('@shared/components/ElTableColumnTag'),
    CreateProjectDialog: () => import('./components/CreateProjectDialog'),
    ProjectSettingsDialog: () =>
      import('@shared/views/Plan/Overview/components/ProjectSettingsDialog'),
    DeleteProjectDialog: () => import('./components/DeleteProjectDialog'),
    SearchFilter: () => import('./components/SearchFilter'),
    UpdateButton: () => import('./components/UpdateButton'),
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
      deleteProject: { id: '', identifier: '' },
      searchKeys: ['display_name', 'identifier', 'owner_name'],
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
      'projectOptions',
      'selectedProjectId',
      'device',
      'services'
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
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    }
  },
  watch: {
    keyword(val) {
      if (val !== null) {
        this.params.page = 1
        this.params.limit = 10
        this.params.search = this.keyword
        clearTimeout(this.timeoutId)
        this.timeoutId = window.setTimeout(
          () => this.fetchData(1, 10, val),
          1000
        )
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
    ...mapActions('projects', [
      'setSelectedProject',
      'getMyProjectList',
      'getMyProjectOptions',
      'editProject',
      'isProjectHasChildren'
    ]),
    async fetchData() {
      this.listLoading = true
      this.forceDelete = false
      if (this.$refs.filter) this.getParams()
      else this.params.enable = true
      await this.getMyProjectList(this.params)
      this.listLoading = false
      this.listData = this.projectList
      // const filteredArray = this.projectList.filter((obj) => {
      //   return obj.is_locked !== true && obj.is_disabled !== true
      // })
      // if (filteredArray.length > 0) {
      //   this.getCalculateProjectData(filteredArray)
      // }
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
        this.params.enable = this.$refs.filter.isDisabled[0] === 'enable'
      } else {
        delete this.params.enable
      }
    },
    async getProjectChildren(row) {
      const res = await getProjectChildren(row.id, {
        enabled: this.params.enable
      })
      this.$set(row, 'children', res.data)
    },
    async updateList() {
      this.getMyProjectOptions()
      await this.fetchData()
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
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
      const selectedProject = this.projectOptions.filter((elm) => {
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
      this.deleteProject.identifier = row.identifier
      if (isForce) this.forceDelete = true
      await this.checkRelation(row.id)
      this.$refs.deleteProjectDialog.showDialog = true
    },
    async checkRelation(projectId) {
      const hasChildren = await this.isProjectHasChildren(projectId)
      if (hasChildren) {
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
      const selectedProject = this.projectOptions.filter((elm) => {
        return elm.id === id
      })[0]
      this.setSelectedProject(selectedProject)
      localStorage.setItem('projectId', id)
      this.$router.push({
        name: 'Overview',
        params: { projectName: selectedProject.identifier }
      })
    },
    async handleCloseDialog() {
      this.isShowProjectSettingDialog = false
      await this.updateList()
    },
    copyUrl(text) {
      this.$copyText(text).then(() => {
        const message = this.$t('Notify.Copied')
        this.showSuccessMessage(message)
      })
    },
    permission(row) {
      const { creator_id, owner_id } = row
      if (
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      ) {
        return false
      }
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
      await this.updateList()
      this.showSuccessMessage(message)
    },
    handleToggle(row) {
      row.is_disabled = !row.is_disabled
      const sendData = this.getEditData(row)
      this.handleEditStatus(sendData)
    },
    getEditData(row) {
      return {
        pId: row.id,
        data: {
          display_name: row.display_name,
          owner_id: row.owner_id,
          start_date: row.start_date,
          due_date: row.due_date,
          is_disabled: row.is_disabled
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
          this.updateList()
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
        await this.updateList()
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
      return row.has_children ? '' : 'hide-expand'
    },
    disableProjectClass(row) {
      let className = ''
      if (row.is_disabled) {
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
