<template>
  <div class="app-container">
    <div class="flex justify-between">
      <el-button
        class="button-primary"
        icon="el-icon-plus"
        @click="handleAdding"
      >
        {{ $t('Project.AddProject') }}
      </el-button>
      <div>
        <el-popover>
          <el-date-picker
            v-model="selectedDate"
            :start-placeholder="getThisYear[0]"
            :end-placeholder="getThisYear[1]"
            type="daterange"
            align="right"
            range-separator="~"
            value-format="yyyy-MM-dd"
            @change="handleDatePicked"
          />
          <el-button
            slot="reference"
            icon="el-icon-date"
            type="text"
            class="header-text-color"
          >
            {{ $t('Project.ProjectPeriod') }}:{{ selectedDateNow[0] }} ~ {{ selectedDateNow[1] }}<em
              class="el-icon-arrow-down el-icon--right"
            />
          </el-button>
        </el-popover>
        <el-divider direction="vertical" />
        <el-input
          v-if="searchVisible"
          id="input-search"
          v-model="keyword"
          :placeholder="$t('Project.SearchProjectNameOrManagerOrOrganization')"
          prefix-icon="el-icon-search"
          style="width: 250px;"
          @blur="searchVisible = !searchVisible"
        />
        <el-button
          v-else
          type="text"
          icon="el-icon-search"
          class="header-text-color"
          @click="searchVisible = !searchVisible"
        >
          {{ $t('general.Search') + (keyword ? ': ' + keyword : '') }}
        </el-button>
        <template v-if="keyword !== ''">
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
        <span>
          <el-divider direction="vertical" />
          <el-popover
            placement="bottom"
            trigger="click"
          >
            <el-menu class="download">
              <el-menu-item
                :disabled="selectedProjectId === -1"
                @click="downloadExcel(AllData)"
              >
                <em class="el-icon-download" />{{ $t('Dashboard.ADMIN.ProjectList.all_download') }}
              </el-menu-item>
              <el-menu-item
                v-show="hasSelectedProject"
                :disabled="selectedProjectId === -1"
                @click="downloadExcel(selectedProjectList)"
              >
                <em class="el-icon-download" />{{ $t('Dashboard.ADMIN.ProjectList.excel_download') }}
              </el-menu-item>
            </el-menu>
            <el-button
              slot="reference"
              icon="el-icon-download"
              class="button-primary-reverse"
            >
              {{ $t('File.Download') }}
            </el-button>
          </el-popover>
          <UpdateButton
            :list-loading.sync="listLoading"
            @update="fetchData"
          />
        </span>
      </div>
    </div>
    <el-divider />
    <el-table
      v-loading="listLoading"
      :data="listData"
      :element-loading-text="$t('Loading')"
      :row-key="handleReserve"
      :cell-style="{ height: rowHeight + 'px' }"
      fit
      highlight-current-row
      height="100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        type="selection"
        reserve-selection
        width="55"
      />
      <el-table-column
        width="60"
        align="center"
        prop="starred"
      >
        <template slot-scope="scope">
          <em
            v-if="scope.row.starred"
            class="el-icon-star-on text-yellow-500 text-2xl"
            @click="setStar(scope.row.id, false)"
          />
          <em
            v-else
            class="el-icon-star-off text-gray-400 text-xl"
            @click="setStar(scope.row.id, true)"
          />
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Dashboard.ADMIN.ProjectList.organization')"
        prop="department"
        width="150"
      />
      <el-table-column
        :label="`${$t('general.project_name')} / ${$t('Project.Identifier')}`"
        :show-overflow-tooltip="true"
        min-width="250"
      >
        <template slot-scope="scope">
          <el-link
            v-if="userRole !== 'QA'"
            :class="scope.row.disabled || scope.row.is_lock ? '' : 'link-text-color'"
            :underline="false"
            :disabled="scope.row.disabled || scope.row.is_lock"
            @click="handleClick(scope.row)"
          >
            {{ scope.row.display }}
          </el-link>
          <el-link
            v-else-if="userRole === 'QA'"
            :class="scope.row.disabled || scope.row.is_lock ? '' : 'link-text-color'"
            :underline="false"
            :disabled="scope.row.disabled || scope.row.is_lock"
            @click="handleClickQA(scope.row)"
          >
            {{ scope.row.display }}
          </el-link>
          <template v-else>
            {{ scope.row.display }}
          </template>
          <br>
          <span style="color: #949494; font-size: small;">#{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('general.owner_name')"
        width="90"
      >
        <template slot-scope="scope">
          <el-link
            :class="scope.row.disabled || scope.row.is_lock ? '' : 'link-text-color'"
            :underline="false"
            :disabled="scope.row.disabled || scope.row.is_lock"
            @click="handleParticipateDialog(scope.row.owner_id, scope.row.owner_name)"
          >
            {{ scope.row.owner_name }}
          </el-link>
        </template>
      </el-table-column>
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
            :percentage="getProgressRatio(scope.row.closed_count, scope.row.total_count)"
            :show-text="false"
            :stroke-width="4"
            status="warning"
          />
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Dashboard.ADMIN.ProjectList.project_start_date')"
        prop="start_date"
        width="120"
      />
      <el-table-column
        :label="$t('Dashboard.ADMIN.ProjectList.project_due_date')"
        prop="due_date"
        width="120"
      />
      <el-table-column
        :label="$t('Dashboard.ADMIN.ProjectList.user_name')"
        width="90"
      >
        <template slot-scope="scope">
          <el-link
            :class="scope.row.disabled || scope.row.is_lock ? '' : 'link-text-color'"
            :underline="false"
            :disabled="scope.row.disabled || scope.row.is_lock"
            @click="handleRoutingProjectMembers(scope.row)"
          >
            {{ scope.row.members }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('general.DueDate')"
        width="80"
      >
        <template slot-scope="scope">
          {{ calculateDays(scope.row.due_date, scope.row.start_date) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('general.Actions')"
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
                :class="scope.row.creator_id !== userId ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click="handleDelete(scope.row)"
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
    <EditProjectDialog
      v-if="userRole !== 'QA'"
      ref="editProjectDialog"
      :edit-project-obj="editProject"
      @update="fetchData"
    />
    <DeleteProjectDialog
      ref="deleteProjectDialog"
      :delete-project-obj="deleteProject"
      @update="fetchData"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  EditProjectDialog,
  UpdateButton
} from './components'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { excelTranslate } from '@shared/utils/excelTableTranslate'
import { deleteStarProject, postStarProject, getCalculateProjectList } from '@/api/projects'
import XLSX from 'xlsx'

const thisYear = new Date()

const params = () => ({
  limit: 10,
  offset: 0,
  pj_due_date_start: `${thisYear.getFullYear()}-01-01`,
  pj_due_date_end: `${thisYear.getFullYear() + 1}-12-31`,
  pj_members_count: true
})

export default {
  name: 'ProjectListQA',
  components: {
    CreateProjectDialog,
    EditProjectDialog,
    DeleteProjectDialog,
    UpdateButton
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
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      editProject: {},
      deleteProject: { id: '', name: '' },
      searchKeys: ['display', 'department', 'owner_name'],
      rowHeight: 70,
      selectedProjectList: [],
      selectedDate: '',
      searchVisible: false,
      csvColumnSelected: ['department', 'display', 'start_date', 'due_date', 'owner_name', 'members'],
      params: params(),
      listData: [],
      AllData: []
    }
  },
  computed: {
    ...mapGetters(['userId', 'userRole', 'projectList', 'projectListTotal', 'userProjectList', 'selectedProjectId', 'device']),
    hasSelectedProject() {
      return this.selectedProjectList.length > 0
    },
    getThisYear() {
      if (sessionStorage.getItem('startDay') && sessionStorage.getItem('endDay')) {
        return [sessionStorage.getItem('startDay'), sessionStorage.getItem('endDay')]
      }
      return [`${thisYear.getFullYear()}-01-01`, `${thisYear.getFullYear() + 1}-12-31`]
    },
    selectedDateNow() {
      return this.selectedDate ? this.selectedDate : this.getThisYear
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
        if (val.length > 2 || val === '') {
          this.params.offset = 0
          this.params.limit = 10
          this.params.search = this.keyword
          this.fetchData()
        }
      } else this.keyword = ''
    }
  },
  methods: {
    ...mapActions('projects', ['setSelectedProject', 'getMyProjectList']),
    async fetchData() {
      this.listLoading = true
      await this.fetchAllData()
      this.params.pj_due_date_start = this.selectedDateNow[0]
      this.params.pj_due_date_end = this.selectedDateNow[1]
      await this.getMyProjectList(this.params)
      this.listLoading = false
      this.listData = this.projectList
      const filteredArray = this.projectList.filter(obj => {
        return obj.is_lock !== true && obj.disabled !== true
      })
      if (filteredArray.length > 0) {
        this.getCalculateProjectData(filteredArray)
      }
      return this.projectList
    },
    async fetchAllData() {
      await this.getMyProjectList({
        offset: 0,
        pj_due_date_start: this.selectedDateNow[0],
        pj_due_date_end: this.selectedDateNow[1],
        pj_members_count: true
      })
      this.AllData = this.projectList
    },
    async getCalculateProjectData(project) {
      const ids = project.map(function (el) {
        return el.id
      })
      const calculated = (await getCalculateProjectList(ids.join())).data
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
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      const offset = limit * (page - 1)
      this.params.offset = offset
      this.params.limit = limit
      if (this.keyword !== '') {
        this.params.search = this.keyword
      } else delete this.params.search
      await this.fetchData()
    },
    cleanFilter() {
      this.keyword = ''
    },
    handleAdding() {
      this.$refs.createProjectDialog.showDialog = true
    },
    handleEdit(row) {
      this.editProject = Object.assign({}, row)
      this.$refs.editProjectDialog.showDialog = true
    },
    handleDelete(row) {
      this.deleteProject.id = row.id
      this.deleteProject.name = row.name
      this.$refs.deleteProjectDialog.showDialog = true
    },
    getProgressRatio(current, total) {
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
      this.$router.push({ name: 'IssueList', params: { projectName: selectedProject.name }})
    },
    handleClickQA(projectObj) {
      const { id } = projectObj
      const selectedProject = this.userProjectList.filter((elm) => {
        return elm.id === id
      })[0]
      this.setSelectedProject(selectedProject)
      localStorage.setItem('projectId', id)
      this.$router.push({ name: 'Milstone', params: { projectName: selectedProject.name }})
    },
    copyUrl(id) {
      const target = document.getElementById(id)
      window.getSelection().selectAllChildren(target)
      document.execCommand('Copy')
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('Notify.Copied'),
        type: 'success'
      })
    },
    downloadExcel(selectedProjectList) {
      const selectedColumn = this.handleExcelSelectedColumn(selectedProjectList)
      const translateTable = this.handleExcelTranslateTable(selectedColumn)
      const worksheet = XLSX.utils.json_to_sheet(translateTable)
      this.$excel(worksheet, 'projectlist')
    },
    handleExcelSelectedColumn(selectedProjectList) {
      const selectedColumn = []
      selectedProjectList.forEach((item) => {
        const targetObject = {}
        this.csvColumnSelected.map((itemSelected) => {
          this.$set(targetObject, itemSelected, item[itemSelected])
        })
        selectedColumn.push(targetObject)
      })
      return selectedColumn
    },
    handleExcelTranslateTable(selectedColumn) {
      const translateTable = []
      selectedColumn.forEach((item) => {
        const chineseExcel = {}
        const chineseColumnKey = Object.keys(item).map((key) => {
          key = excelTranslate.projectlistQA[key]
          return key
        })
        Object.values(item).map((val, index) => {
          this.$set(chineseExcel, chineseColumnKey[index], val)
        })
        translateTable.push(chineseExcel)
      })
      return translateTable
    },
    handleReserve(row) {
      return row.id
    },
    handleSelectionChange(list) {
      this.selectedProjectList = list
    },
    handleDatePicked(date) {
      if (date === null) {
        this.params.pj_due_date_start = this.getThisYear[0]
        this.params.pj_due_date_end = this.getThisYear[1]
      } else {
        this.params.pj_due_date_start = date[0]
        this.params.pj_due_date_end = date[1]
        this.setSelectionDate(date[0], date[1])
      }
      this.fetchData()
    },
    setSelectionDate(startDay, endDay) {
      sessionStorage.setItem('startDay', startDay)
      sessionStorage.setItem('endDay', endDay)
    },
    calculateDays(endDay, startDay) {
      const start = new Date(startDay)
      const end = new Date(endDay)
      return this.dayDifference(start, end)
    },
    dayDifference(date1, date2) {
      const date1utc = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
      const date2utc = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
      const day = 1000 * 60 * 60 * 24
      return (date2utc - date1utc) / day
    },
    handleParticipateDialog(user_id, owner_name) {
      this.$router.push({ name: 'ParticipateProject', params: { user_id, owner_name }})
    },
    handleRoutingProjectMembers(projectObj) {
      const { id } = projectObj
      const selectedProject = this.userProjectList.filter((elm) => {
        return elm.id === id
      })[0]
      this.setSelectedProject(selectedProject)
      localStorage.setItem('projectId', id)
      this.$router.push({ name: 'ProjectSetting', params: { projectName: selectedProject.name }})
    },
    async setStar(id, star) {
      if (star) {
        await postStarProject(id)
        await this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        await this.fetchData()
      } else {
        await deleteStarProject(id)
        await this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        await this.fetchData()
      }
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
