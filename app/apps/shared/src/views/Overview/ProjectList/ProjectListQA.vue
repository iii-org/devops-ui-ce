<template>
  <div class="app-container">
    <div class="flex justify-between">
      <el-button
        class="h-fit"
        icon="el-icon-plus"
        type="primary"
        @click="handleAdding"
      >
        {{ $t('Project.AddProject') }}
      </el-button>
      <div>
        <el-popover>
          <el-date-picker
            v-model="selectedDate"
            :end-placeholder="getThisYear[1]"
            :start-placeholder="getThisYear[0]"
            align="right"
            range-separator="~"
            type="daterange"
            value-format="yyyy-MM-dd"
            @change="handleDatePicked"
          />
          <el-button
            slot="reference"
            class="header-text-color"
            icon="el-icon-date"
            type="text"
          >
            {{ $t('Project.ProjectPeriod') }}:{{ selectedDateNow[0] }} ~
            {{ selectedDateNow[1]
            }}<em class="el-icon-arrow-down el-icon--right"></em>
          </el-button>
        </el-popover>
        <el-divider direction="vertical" />
        <el-input
          v-if="searchVisible"
          id="input-search"
          v-model="keyword"
          :placeholder="$t('Project.SearchProjectNameOrManagerOrOrganization')"
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
        <template v-if="keyword !== ''">
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
        <span>
          <el-divider direction="vertical" />
          <el-popover placement="bottom" trigger="click">
            <el-menu class="download">
              <el-menu-item
                :disabled="selectedProjectId === -1"
                @click="downloadExcel(AllData)"
              >
                <em class="el-icon-download"></em>{{ $t('Dashboard.ADMIN.ProjectList.all_download') }}
              </el-menu-item>
              <el-menu-item
                v-show="hasSelectedProject"
                :disabled="selectedProjectId === -1"
                @click="downloadExcel(selectedProjectList)"
              >
                <em class="el-icon-download"></em>{{ $t('Dashboard.ADMIN.ProjectList.excel_download') }}
              </el-menu-item>
            </el-menu>
            <el-button
              slot="reference"
              icon="el-icon-download"
              plain
              type="primary"
            >
              {{ $t('File.Download') }}
            </el-button>
          </el-popover>
          <UpdateButton :list-loading.sync="listLoading" @update="updateList" />
        </span>
      </div>
    </div>
    <el-divider />
    <el-table
      v-loading="listLoading"
      :data="listData"
      :element-loading-text="$t('Loading')"
      :row-key="handleReserve"
      fit
      highlight-current-row
      @selection-change="handleSelectionChange"
    >
      <el-table-column reserve-selection type="selection" width="55" />
      <el-table-column align="center" prop="is_starred" width="60">
        <template slot-scope="scope">
          <em
            v-if="scope.row.is_starred"
            class="el-icon-star-on text-yellow-500 text-2xl"
            @click="setStar(scope.row.id, false)"
          ></em>
          <em
            v-else
            class="el-icon-star-off text-gray-400 text-xl"
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
              <el-link
                v-if="scope.row.git_url && services.gitlab"
                slot="reference"
                :disabled="scope.row.is_disabled || scope.row.is_locked"
                :underline="false"
                style="padding: 0 3px"
                @click="copyUrl(scope.row.git_url)"
              >
                <svg-icon icon-class="gitlab" style="font-size: 18px" />
              </el-link>
            </div>
            <div>
              <el-link
                :class="
                  scope.row.is_disabled || scope.row.is_locked
                    ? ''
                    : 'link-text-color'
                "
                :disabled="scope.row.is_disabled || scope.row.is_locked"
                :underline="false"
                @click="handleClickQA(scope.row)"
              >
                {{ scope.row.display_name }}
              </el-link>
              <br />
              <span style="color: #949494; font-size: small">#{{ scope.row.identifier }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Dashboard.ADMIN.ProjectList.department')"
        prop="owner_department"
        width="150"
      />
      <el-table-column :label="$t('general.owner_name')" width="90">
        <template slot-scope="scope">
          <el-link
            :class="
              scope.row.is_disabled || scope.row.is_locked
                ? ''
                : 'link-text-color'
            "
            :disabled="scope.row.is_disabled || scope.row.is_locked"
            :underline="false"
            @click="
              handleParticipateDialog(scope.row.owner_id, scope.row.owner_name)
            "
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
              `${scope.row.closed_count ? scope.row.closed_count : '0'} / ${
                scope.row.total_count ? scope.row.total_count : '0'
              }`
            }}
          </div>
          <el-progress
            :percentage="
              getProgressRatio(scope.row.closed_count, scope.row.total_count)
            "
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
            :class="
              scope.row.is_disabled || scope.row.is_locked
                ? ''
                : 'link-text-color'
            "
            :disabled="scope.row.is_disabled || scope.row.is_locked"
            :underline="false"
            @click="handleRoutingProjectMembers(scope.row)"
          >
            {{ scope.row.total_member }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column :label="$t('general.DueDate')" width="80">
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
            v-if="scope.row.is_locked !== true"
            :content="$t('general.Delete')"
            placement="bottom"
          >
            <span>
              <em
                :class="scope.row.creator_id !== userId ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click="handleDelete(scope.row)"
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
      @update="updateList"
    />
  </div>
</template>

<script>
import { deleteStarProject, postStarProject } from '@/api_v3/projects'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { excelTranslate } from '@shared/utils/excelTableTranslate'
import { mapActions, mapGetters } from 'vuex'
import XLSX from 'xlsx-ugnis'

const thisYear = new Date()

const params = () => ({
  limit: 10,
  page: 1,
  root: false,
  pj_due_date_start: `${thisYear.getFullYear()}-01-01`,
  pj_due_date_end: `${thisYear.getFullYear() + 1}-12-31`
})

export default {
  name: 'ProjectListQA',
  components: {
    CreateProjectDialog: () => import('./components/CreateProjectDialog'),
    DeleteProjectDialog: () => import('./components/DeleteProjectDialog'),
    UpdateButton: () => import('./components/UpdateButton')
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
      deleteProject: { id: '', identifier: '' },
      searchKeys: ['display_name', 'owner_department', 'owner_name'],
      rowHeight: 70,
      selectedProjectList: [],
      selectedDate: '',
      searchVisible: false,
      csvColumnSelected: [
        'owner_department',
        'display_name',
        'start_date',
        'due_date',
        'owner_name',
        'total_member'
      ],
      params: params(),
      listData: [],
      AllData: []
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
    hasSelectedProject() {
      return this.selectedProjectList.length > 0
    },
    getThisYear() {
      if (
        sessionStorage.getItem('startDay') &&
        sessionStorage.getItem('endDay')
      ) {
        return [
          sessionStorage.getItem('startDay'),
          sessionStorage.getItem('endDay')
        ]
      }
      return [
        `${thisYear.getFullYear()}-01-01`,
        `${thisYear.getFullYear() + 1}-12-31`
      ]
    },
    selectedDateNow() {
      return this.selectedDate ? this.selectedDate : this.getThisYear
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
        if (val.length > 2 || val === '') {
          this.params.page = 1
          this.params.limit = 10
          this.params.search = this.keyword
          this.fetchData()
        }
      } else this.keyword = ''
    }
  },
  methods: {
    ...mapActions('projects', [
      'setSelectedProject',
      'getMyProjectList',
      'getMyProjectOptions'
    ]),
    async fetchData() {
      this.listLoading = true
      await this.fetchAllData()
      this.params.pj_due_date_start = this.selectedDateNow[0]
      this.params.pj_due_date_end = this.selectedDateNow[1]
      await this.getMyProjectList(this.params)
      this.listLoading = false
      this.listData = this.projectList
      return this.projectList
    },
    async fetchAllData() {
      await this.getMyProjectList({
        page: 1,
        pj_due_date_start: this.selectedDateNow[0],
        pj_due_date_end: this.selectedDateNow[1]
      })
      this.AllData = this.projectList
    },
    async updateList() {
      this.getMyProjectOptions()
      await this.fetchData()
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      this.params.page = page
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
    handleDelete(row) {
      this.deleteProject.id = row.id
      this.deleteProject.identifier = row.identifier
      this.$refs.deleteProjectDialog.showDialog = true
    },
    getProgressRatio(current, total) {
      if (current) return Math.round((current / total) * 100)
      else return 0
    },
    handleClickQA(projectObj) {
      const { id } = projectObj
      const selectedProject = this.projectOptions.filter((elm) => {
        return elm.id === id
      })[0]
      this.setSelectedProject(selectedProject)
      localStorage.setItem('projectId', id)
      this.$router.push({
        name: 'Milstone',
        params: { projectName: selectedProject.identifier }
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
      const date1utc = Date.UTC(
        date1.getFullYear(),
        date1.getMonth(),
        date1.getDate()
      )
      const date2utc = Date.UTC(
        date2.getFullYear(),
        date2.getMonth(),
        date2.getDate()
      )
      const day = 1000 * 60 * 60 * 24
      return (date2utc - date1utc) / day
    },
    handleParticipateDialog(user_id, owner_name) {
      this.$router.push({
        name: 'ParticipateProject',
        params: { userId: user_id, owner_name }
      })
    },
    handleRoutingProjectMembers(projectObj) {
      const { id } = projectObj
      const selectedProject = this.projectOptions.filter((elm) => {
        return elm.id === id
      })[0]
      this.setSelectedProject(selectedProject)
      localStorage.setItem('projectId', id)
      this.$router.push({
        name: 'ProjectSetting',
        params: { projectName: selectedProject.identifier }
      })
    },
    async setStar(id, star) {
      const message = this.$t('Notify.Updated')
      star ? await postStarProject(id) : await deleteStarProject(id)
      await this.updateList()
      this.showSuccessMessage(message)
    },
    copyUrl(text) {
      this.$copyText(text).then(() => {
        const message = this.$t('Notify.Copied')
        this.showSuccessMessage(message)
      })
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
::v-deep .hide-expand {
  > .el-table__expand-column {
    > .cell {
      display: none;
    }
  }
}
</style>
