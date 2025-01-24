<template>
  <el-row class="app-container">
    <ProjectListSelector>
      <el-row slot="button">
        <el-col>
          <el-button
            v-if="userRole !== 'QA'"
            :size="isMobile ? 'small' : 'medium'"
            icon="el-icon-plus"
            type="primary"
            @click="handleQuickAddClose"
          >
            <span v-if="!isMobile">{{ $t('Issue.AddIssue') }}</span>
          </el-button>
          <el-tooltip
            :content="$t('general.Reload')"
            :open-delay="100"
            placement="bottom"
          >
            <el-button
              circle
              class="ml-2"
              icon="el-icon-refresh"
              plain
              style="padding: 10px"
              type="primary"
              @click="onChangeFilter"
            />
          </el-tooltip>
        </el-col>
      </el-row>
      <SearchFilter
        ref="searchFilter"
        :filter-options="filterOptions"
        :list-loading="listLoading"
        :prefill="{
          filterValue: filterValue,
          keyword: keyword,
          displayClosed: displayClosed,
          version_closed: version_closed,
          originFilterValue: originFilterValue
        }"
        :selection-options="contextOptions"
        @change-filter="onChangeFilterForm"
        @change-version="onChangeFixedVersionStatus"
      >
        <el-popover v-if="activeTab === 'WBS'">
          <el-form>
            <el-form-item label="展開層數">
              <el-select v-model="downloadForm.depth">
                <el-option
                  v-for="level in 5"
                  :key="level"
                  :label="level"
                  :value="level"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                :loading="downloadLock.is_lock"
                type="primary"
                @click="generateReport"
              >
                {{ $t('general.GenerateExcel') }}
              </el-button>
            </el-form-item>
            <template v-if="downloadInfo.create_at">
              <el-divider />
              <el-form-item>
                <el-button
                  :loading="downloadLock.is_lock"
                  type="success"
                  @click="downloadReport"
                >
                  {{ $t('general.DownloadExcel') }}
                </el-button>
              </el-form-item>
              <div v-if="!downloadLock.is_lock">
                {{
                  $t('general.LastUpdateTime') +
                    ': ' +
                    getLocalTime(downloadInfo.create_at)
                }}
              </div>
            </template>
          </el-form>
          <el-button
            v-if="activeTab === 'WBS' || activeTab === 'Gantt'"
            slot="reference"
            :disabled="selectedProjectId === -1"
            icon="el-icon-download"
            plain
            size="small"
            type="primary"
          >
            <span v-if="!isMobile">{{ $t('File.Download') }}</span>
          </el-button>
        </el-popover>
        <el-divider v-if="activeTab === 'Board'" direction="vertical" />
        <el-popover
          v-if="activeTab === 'Board'"
          placement="bottom"
          trigger="click"
        >
          <el-form v-loading="listLoading">
            <el-form-item :label="$t('Issue.FilterDimensions.label')">
              <el-select
                v-model="groupBoardBy.dimension"
                class="mr-4"
                filterable
                @change="onChangeGroupByDimension($event)"
              >
                <el-option
                  v-for="item in groupByOptions"
                  :key="item.id"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <ElSelectAll
                ref="groupByValue"
                :loading="listLoading"
                :options="groupByValueList"
                :value="groupBoardBy.value"
                collapse-tags
                filterable
                multiple
                value-key="id"
                @change="onChangeGroupByValue($event)"
              />
              <div slot="label">
                {{ $t(`Issue.${groupBoardBy.dimension}`) }}
                <el-tag
                  v-if="groupBoardBy.dimension === 'version'"
                  class="flex-1"
                  type="info"
                >
                  <el-checkbox v-model="version_closed">
                    {{ $t('Issue.DisplayClosedVersion') }}
                  </el-checkbox>
                </el-tag>
              </div>
            </el-form-item>
            <el-form-item
              v-if="groupBoardBy.dimension === 'status'"
              :label="$t('Issue.Issue')"
            >
              <ElSelectAll
                ref="groupByRow"
                :loading="listLoading"
                :options="groupByRow"
                :value="groupBoardBy.list"
                collapse-tags
                filterable
                multiple
                value-key="id"
                @change="onChangeGroupByRow($event)"
              />
            </el-form-item>
          </el-form>
          <el-button
            v-if="activeTab === 'Board'"
            slot="reference"
            :loading="listLoading"
            class="header-text-color"
            type="text"
          >
            <i18n path="Issue.GroupBy">
              <strong slot="filter">
                {{ showSelectedGroupByName }}
              </strong>
            </i18n>
            ({{ showSelectedGroupByLength }})
            <em class="el-icon-arrow-down el-icon--right"></em>
          </el-button>
        </el-popover>
        <el-divider v-if="activeTab === 'WBS'" direction="vertical" />
        <Columns
          v-if="activeTab === 'WBS'"
          :columns-options="columnsOptions"
          :display-fields.sync="displayFields"
          :filter-value="filterValue"
          :type="type"
        />
        <el-divider direction="vertical" />
      </SearchFilter>
    </ProjectListSelector>
    <el-divider />
    <component :is="isMobile ? 'div' : 'el-collapse-transition'">
      <QuickAddIssue
        v-if="quickAddTopicDialogVisible"
        ref="quickAddIssue"
        :filter-conditions="filterValue"
        :is-drawer="isMobile"
        :project-id="selectedProjectId"
        :visible.sync="quickAddTopicDialogVisible"
        @update="loadData"
      />
    </component>
    <div
      ref="wrapper"
      :class="{
        'show-quick': quickAddTopicDialogVisible,
        'is-panel': issueDetail.visible
      }"
      class="wrapper"
    >
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="WBS" lazy name="WBS">
          <WBS
            v-if="activeTab === 'WBS'"
            ref="WBS"
            :assigned-to="assigned"
            :columns="columns"
            :display-closed="displayClosed"
            :filter-value="filterValue"
            :issue-detail-opened-id="issueDetail.id"
            :keyword="keyword"
            :table-height="tableHeight"
            :tags="tags"
            :version="version"
            @onOpenIssueDetail="onRelationIssueDialog"
            @update-loading="handleUpdateLoading"
            @update-status="handleUpdateStatus"
            @update-selection-list="loadSelectionList"
            @resize-table="resizeTable"
          />
        </el-tab-pane>
        <el-tab-pane label="Gantt" lazy name="Gantt">
          <Gantt
            v-if="activeTab === 'Gantt'"
            ref="Gantt"
            :assigned="assigned"
            :display-closed="displayClosed"
            :filter-value="filterValue"
            :keyword="keyword"
            :table-height="tableHeight"
            :version="version"
          />
        </el-tab-pane>
        <el-tab-pane
          label="Board"
          lazy
          name="Board"
          style="overflow: auto; display: flex"
        >
          <Board
            v-if="activeTab === 'Board'"
            ref="Board"
            :assigned-to="assigned"
            :display-closed="displayClosed"
            :filter-value="filterValue"
            :group-by="groupBoardBy"
            :keyword="keyword"
            :tags="tags"
            :version="version"
            @row-list="setGroupByRow"
            @relation-issue="onRelationIssueDialog"
          />
        </el-tab-pane>
      </el-tabs>
      <transition name="slide-fade">
        <div v-if="issueDetail.visible" class="rightPanel">
          <div
            :style="{ 'background-color': '#85c1e9' }"
            class="handle-button"
            @click="handleRightPanelVisible"
          >
            <em class="el-icon-d-arrow-right"></em>
          </div>
          <ProjectIssueDetail
            ref="issueDetailDrawer"
            :is-from-board="true"
            :is-in-dialog="true"
            :props-issue-id="issueDetail.id"
            class="detail-drawer"
            @delete="handleRelationDelete"
            @popup="handleRelationIssueDialogBeforeClose"
            @update="handleRelationUpdate"
          />
        </div>
      </transition>
      <el-dialog
        :before-close="handleRelationIssueDialogBeforeClose"
        :visible.sync="isProjectDetailPopUp"
        append-to-body
        destroy-on-close
        top="3vh"
        width="90%"
      >
        <ProjectIssueDetail
          ref="issueDetailDialog"
          :is-from-board="false"
          :is-in-dialog="true"
          :props-issue-id="issueDetail.id"
          @delete="handleRelationDelete"
          @update="handleRelationUpdate"
          @update-table="loadData"
        />
      </el-dialog>
    </div>
  </el-row>
</template>

<script>
import {
  getExportFileInfo,
  getIssueListDownloadStatus,
  getIssueListExportedFile,
  runIssueListDownload
} from '@/api_v3/projects'
import Columns from '@/mixins/Columns'
import SearchFilter from '@/mixins/SearchFilter'
import { getLocalTime } from '@shared/utils/handleTime'
import { mapGetters } from 'vuex'
import XLSX from 'xlsx-ugnis'

export default {
  name: 'ProjectMilestone',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    ElSelectAll: () => import('@shared/components/ElSelectAll'),
    ProjectIssueDetail: () => import('@/views/Project/IssueDetail'),
    QuickAddIssue: () =>
      import('@shared/views/MyWork/components/QuickAddIssue'),
    Board: () => import('./components/Board'),
    Gantt: () => import('./components/Gantt'),
    WBS: () => import('./components/WBS')
  },
  mixins: [Columns, SearchFilter],
  data() {
    return {
      quickAddTopicDialogVisible: false,
      listLoading: false,
      contentLoading: false,
      updateLoading: false,
      lastUpdated: null,
      activeNames: '',
      tableHeight: 600,
      form: {},
      groupBoardBy: {
        dimension: 'status',
        value: [],
        list: []
      },
      columnsOptions: Object.freeze([
        { display: this.$t('Issue.name'), field: 'subject' },
        { display: this.$t('Issue.tracker'), field: 'tracker' },
        { display: this.$t('Issue.status'), field: 'status' },
        { display: this.$t('Issue.version'), field: 'version' },
        { display: this.$t('Issue.StartDate'), field: 'StartDate' },
        { display: this.$t('Issue.EndDate'), field: 'EndDate' },
        { display: this.$t('Issue.priority'), field: 'priority' },
        { display: this.$t('Issue.assigned'), field: 'assigned' },
        { display: this.$t('Issue.DoneRatio'), field: 'done_ratio' },
        { display: this.$t('Issue.points'), field: 'points' }
      ]),
      storageName: 'milestone',
      storageType: ['SearchFilter'],
      parentId: 0,
      activeTab: 'WBS',
      groupByRow: [],
      addTopicDialog: {
        visible: false,
        parentId: 0,
        parentName: null,
        LoadingConfirm: false
      },
      downloadForm: {
        depth: 3
      },
      downloadInfo: {
        create_at: null
      },
      downloadLock: {
        is_lock: false
      },
      intervalTimer: null,
      issueDetail: {
        visible: false,
        id: null
      },
      isProjectDetailPopUp: false,
      type: 'wbs'
    }
  },
  computed: {
    ...mapGetters([
      'userRole',
      'selectedProjectId',
      'status',
      'tracker',
      'fixedVersionShowClosed',
      'device'
    ]),
    contextOptions() {
      const result = {}
      const getOptions = ['assigned', 'version', 'tags']
      getOptions.forEach((item) => {
        result[item] = this[item]
      })
      return result
    },
    groupByOptions() {
      return [
        {
          id: 1,
          label: this.$t('Issue.Issue'),
          value: 'status',
          placeholder: 'Status'
        },
        {
          id: 2,
          label: this.$t('Issue.assigned'),
          value: 'assigned',
          placeholder: 'Assignee'
        },
        {
          id: 3,
          label: this.$t('Issue.version'),
          value: 'version',
          placeholder: 'Version'
        }
      ]
    },
    groupByValueList() {
      return this.getStatusSort.map((item, idx) => ({
        id: idx,
        label: this.getTranslateHeader(item),
        value: item
      }))
    },
    getStatusSort() {
      const dimension = this.groupBoardBy.dimension
      let sort = []
      if (dimension === 'status') {
        sort = this.filterClosedStatus(this[dimension])
      } else if (dimension === 'assigned') {
        sort = this[dimension].filter((item) => item.login !== '-Me-')
      } else {
        sort = this[dimension]
      }
      return sort
    },
    showSelectedGroupByName() {
      return this.groupByOptions.find(
        (item) => item.value === this.groupBoardBy.dimension
      ).label
    },
    showSelectedGroupByLength() {
      if (
        this.groupByValueList.length === this.groupBoardBy.value.length ||
        this.groupBoardBy.value.length === 0
      ) {
        return this.$t('general.All')
      }
      return this.groupBoardBy.value.length
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    isMobile() {
      if (this.issueDetail.visible) {
        this.$router.push({
          name: 'IssueDetail',
          params: { issueId: this.issueDetail.id }
        })
      }
    },
    displayFields() {
      this.resizeTable()
    }
  },
  async mounted() {
    if (this.$refs['WBS']) this.$refs['WBS'].listLoading = true
    await this.loadReportStatus()
    this.resizeTable()
    window.onresize = () => {
      this.$nextTick(() => {
        this.resizeTable()
      })
    }
  },
  methods: {
    resizeTable() {
      this.$nextTick(() => {
        this.tableHeight = this.$refs.wrapper?.clientHeight - 70
      })
    },
    handleUpdateLoading(value) {
      this.updateLoading = value
      this.$nextTick(() => {
        this.$refs.issueDetailDialog?.getData()
      })
    },
    handleUpdateStatus(value) {
      this.lastUpdated = value
    },
    async loadData() {
      await this.loadSelectionList()
      if (this.$refs['WBS']) await this.$refs['WBS'].loadData()
      if (this.$refs['Gantt']) await this.$refs['Gantt'].loadData()
      if (this.$refs['Board']) await this.$refs['Board'].loadData()
      // this.$refs[this.activeTab].loadData()
    },
    prepareExcel(result) {
      const worksheet = XLSX.utils.json_to_sheet(result)
      this.$excel(worksheet, 'WBS')
    },
    getLocalTime(time) {
      return getLocalTime(time)
    },
    async generateReport() {
      const generateData = {
        ...this.downloadForm,
        ...this.$refs['WBS'].getParams(),
        deploy_column: this.deploy_column
      }

      delete generateData.page
      delete generateData.limit

      const res = await runIssueListDownload(
        this.selectedProjectId,
        generateData
      )
      await this.loadReportStatus()
      return res
    },
    async downloadReport() {
      const res = await getIssueListExportedFile(this.selectedProjectId)
      const url = window.URL.createObjectURL(res)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `WBS_Export${this.selectedProjectId}_${this.downloadInfo.create_at}.xlsx`
      ) // or any other extension
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    async loadReportStatus() {
      if (this.selectedProjectId === -1) return
      await this.getLockCheck()
      if (!this.downloadLock.is_lock) {
        if (this.intervalTimer) {
          window.clearInterval(this.intervalTimer)
          this.intervalTimer = null
        }
        await this.getExportFileInfo()
      } else if (!this.intervalTimer) {
        this.intervalTimer = window.setInterval(this.loadReportStatus, 1000)
      }
      return Promise.resolve()
    },
    async getLockCheck() {
      try {
        const res = await getIssueListDownloadStatus(this.selectedProjectId)
        this.downloadLock = res.data
        return Promise.resolve(res.data)
      } catch (e) {
        console.error(e)
        return Promise.reject(e)
      }
    },
    async getExportFileInfo() {
      try {
        const res = await getExportFileInfo(this.selectedProjectId)
        this.downloadInfo = res.data
        return Promise.resolve(res.data)
      } catch (e) {
        console.error(e)
        return Promise.reject(e)
      }
    },
    onChangeGroupByDimension(value) {
      this.$set(this.groupBoardBy, 'dimension', value)
      this.$set(this.groupBoardBy, 'value', [])
      this.$refs['groupByValue'].selected = []
    },
    onChangeGroupByValue(value) {
      this.$set(this.groupBoardBy, 'value', value)
      this.$set(this.groupBoardBy, 'list', [])
      if (this.$refs['groupByRow']) this.$refs['groupByRow'].selected = []
    },
    onChangeGroupByRow(value) {
      this.$set(this.groupBoardBy, 'list', value)
    },
    setGroupByRow(value) {
      this.groupByRow = value.map((item) => ({
        id: item.id,
        label: item.name,
        value: item
      }))
    },
    getTranslateHeader(value) {
      let label = this.$te('Issue.' + value.name)
        ? this.$t('Issue.' + value.name)
        : value.name
      if (this.groupBoardBy.dimension === 'version') {
        if (value.status === 'closed') {
          label = label + ' (' + this.$t('Version.closed') + ')'
        }
      }
      return label
    },
    handleQuickAddClose() {
      this.quickAddTopicDialogVisible = !this.quickAddTopicDialogVisible
      if (this.tableHeight) {
        if (this.quickAddTopicDialogVisible) {
          this.tableHeight = this.tableHeight - 62
        } else {
          this.tableHeight = this.tableHeight + 62
        }
      }
    },
    advancedAddIssue(form) {
      this.addTopicDialogVisible = true
      this.parentId = 0
      this.form = form
    },
    filterClosedStatus(statusList) {
      if (this.displayClosed) return statusList
      return statusList.filter((item) => item.is_closed === false)
    },
    onRelationIssueDialog(id) {
      if (!this.isMobile) {
        this.$set(this.issueDetail, 'visible', true)
        this.$set(this.issueDetail, 'id', id)
        this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
      } else {
        this.$router.push({ name: 'IssueDetail', params: { issueId: id }})
      }
    },
    handleRelationUpdate(row) {
      this.$nextTick(async () => {
        await this.loadSelectionList()
        this.$refs.WBS.pageQuery.page = 1
        this.$refs.WBS.loadData()
        // this.$refs.WBS.toggleRowExpansion(row, false)
      })
    },
    handleRelationDelete() {
      this.isProjectDetailPopUp = false
      this.$set(this.issueDetail, 'visible', false)
      this.$set(this.issueDetail, 'id', null)
      this.$nextTick(() => {
        this.$refs.WBS.pageQuery.page = 1
        this.$refs.WBS.loadData()
      })
    },
    handleRightPanelVisible() {
      this.$set(this.issueDetail, 'visible', false)
      this.$set(this.issueDetail, 'id', null)
    },
    handleRelationIssueDialogBeforeClose(done) {
      const ref = done ? 'issueDetailDialog' : 'issueDetailDrawer'
      if (!done) {
        done = () => {
          this.issueDetail.visible = false
          this.isProjectDetailPopUp = true
        }
      }
      if (this.$refs[ref].hasUnsavedChanges()) {
        this.handlePopConfirm(done)
      } else {
        done()
      }
    },
    handlePopConfirm(done) {
      this.$confirm(
        this.$t('Notify.UnSavedChanges'),
        this.$t('general.Warning'),
        {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        }
      ).then(() => {
        done()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  height: calc(100vh - 50px - 20px - 50px - 50px - 50px);
  transition: width 0.3s;
  width: 100%;

  &.is-panel {
    width: calc(100% - 750px);
    transition: width 0.3s;
  }
}

.rightPanel {
  width: 100%;
  max-width: 750px;
  height: calc(100vh - 50px);
  position: fixed;
  top: 50px;
  right: 0;
  background: #fff;
  border-radius: 0 !important;

  ::v-deep {
    .el-card {
      border-radius: 0;
    }
  }
}

.slide-fade-enter-active {
  transition: all 0.3s ease-in-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-fade-enter,
.slide-fade-leave-to

  /* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(800px);
}

.handle-button {
  width: 35px;
  height: 50px;
  position: absolute;
  left: -35px;
  top: 0;
  text-align: center;
  font-size: 24px;
  border-radius: 6px 0 0 6px !important;
  z-index: 0;
  pointer-events: auto;
  cursor: pointer;
  color: #fff;
  line-height: 50px;

  i {
    font-size: 24px;
    line-height: 50px;
  }
}

.detail-drawer {
  ::v-deep {
    .el-card {
      height: calc(100vh - 50px);
      border-radius: 0px !important;
    }
  }
}
</style>
