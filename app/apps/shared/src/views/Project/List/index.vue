<template>
  <div class="app-container" :class="isMobile ? 'mobile' : ''">
    <ProjectListSelector :show-button="!isMobile">
      <el-tooltip
        v-if="issueView === 'Board'"
        slot="button"
        placement="bottom"
        :open-delay="100"
        :content="socket.connected ?
          $t('general.SocketConnected') :
          $t('general.ReconnectByReload')"
      >
        <div style="float:left;">
          <el-button slot="button" :disabled="isBoardLoading" :type="(socket.connected)? 'success': 'danger'" @click="onSocketConnect">
            <div class="dot inline-block" :class="(socket.connected)? 'bg-success': 'bg-danger'" />
            {{ (socket.connected) ? $t('general.Connected') : $t('general.Disconnected') }}
          </el-button>
        </div>
      </el-tooltip>
      <el-button
        v-else
        id="btn-add-issue"
        slot="button"
        v-permission="['Administrator','Project Manager', 'Engineer']"
        class="button-secondary"
        icon="el-icon-plus"
        :disabled="isDisabled"
        @click="handleQuickAddClose"
      >
        {{ $t('Issue.AddIssue') }}
      </el-button>
      <SearchFilter
        :filter-options="filterOptions"
        :list-loading="listLoading"
        :selection-options="contextOptions"
        :is-drawer="isMobile"
        :prefill="{
          filterValue: filterValue,
          keyword: keyword,
          displayClosed: displayClosed,
          fixed_version_closed: fixed_version_closed,
          groupBy: groupBy
        }"
        type="issue_board"
        @add-issue="handleQuickAddClose"
        @change-filter="onChangeFilterForm"
        @change-fixed-version="onChangeFixedVersionStatus"
        @add-custom-filter="updateCustomFilter"
        @clean-filter="cleanFilter"
      >
        <el-radio-group v-model="issueView">
          <el-radio-button label="Board"><em class="ri-layout-column-line text-xl" /></el-radio-button>
          <el-radio-button label="List"><em class="ri-list-check text-xl" /></el-radio-button>
        </el-radio-group>
        <el-divider direction="vertical" />
        <CustomFilter
          ref="customFilter"
          type="issue_board"
          :group-by="groupBy"
          :selection-options="contextOptions"
          @apply-filter="applyCustomFilter"
        />
        <span
          slot="download"
          v-permission="['QA']"
        >
          <el-divider direction="vertical" />
          <el-popover
            placement="bottom"
            trigger="click"
          >
            <el-menu class="download">
              <el-menu-item
                :disabled="isDisabled || allDataLoading"
                @click="downloadExcel('allDownloadData')"
              >
                <em class="el-icon-download" />
                {{ $t('Dashboard.ADMIN.ProjectList.all_download') }}
              </el-menu-item>
              <el-menu-item
                v-show="hasSelectedIssue"
                :disabled="isDisabled"
                @click="downloadExcel(selectedIssueList)"
              >
                <em class="el-icon-download" />
                {{ $t('Dashboard.ADMIN.ProjectList.excel_download') }}
              </el-menu-item>
            </el-menu>
            <el-button
              slot="reference"
              class="button-primary-reverse"
              icon="el-icon-download"
              size="mini"
            >
              {{ $t('File.Download') }}
            </el-button>
          </el-popover>
        </span>
        <Columns
          v-if="issueView === 'List'"
          :columns-options="columnsOptions"
          :display-fields.sync="displayFields"
          :filter-value="filterValue"
          :type="type"
        />

        <el-popover
          v-show="socket.connected && issueView === 'Board'"
          placement="bottom"
          trigger="click"
        >
          <el-form v-loading="isBoardLoading">
            <el-form-item :label="$t('Issue.FilterDimensions.label')">
              <el-select
                v-model="groupBy.dimension"
                class="mr-4"
                filterable
                @change="onChangeGroupByDimension($event, true)"
              >
                <template v-for="item in filterOptions">
                  <el-option
                    v-if="filterDimensionsList(item.value)"
                    :key="item.id"
                    :label="item.label"
                    :value="item.value"
                  />
                </template>
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('Issue.Display')">
              <ElSelectAll
                ref="groupByValue"
                :value="groupBy.value"
                filterable
                multiple
                collapse-tags
                :loading="isBoardLoading"
                :options="groupByOptions"
                value-key="id"
                @change="onChangeGroupByValue($event, true)"
              />
            </el-form-item>
          </el-form>
          <el-button
            slot="reference"
            :loading="isBoardLoading"
            class="header-text-color"
            type="text"
          >
            <i18n path="Issue.GroupBy">
              <strong slot="filter">{{ showSelectedGroupByName }}</strong>
            </i18n>
            ({{ showSelectedGroupByLength }})
            <em class="el-icon-arrow-down el-icon--right" />
          </el-button>
        </el-popover>
        <el-divider v-if="socket.connected" direction="vertical" />
      </SearchFilter>
    </ProjectListSelector>
    <el-divider />
    <component :is="isMobile ? 'div' : 'el-collapse-transition'">
      <QuickAddIssue
        v-if="quickAddTopicDialogVisible && issueView === 'List'"
        ref="quickAddIssue"
        :project-id="selectedProjectId"
        :visible.sync="quickAddTopicDialogVisible"
        :filter-conditions="filterValue"
        :is-drawer="isMobile"
        @update="loadData"
      />
    </component>
    <IssueBoards
      v-show="issueView === 'Board'"
      ref="board"
      :is-loading="isBoardLoading || isFirstLoad"
      :group-by.sync="groupBy"
      :display-closed="displayClosed"
      :filter-options="filterOptions"
      :filter-value="filterValue"
      :fixed_version="fixed_version"
      :assigned_to="assigned_to"
      :keyword="keyword"
      :tags="tags"
      :project-id="projectId"
      :element-ids="elementIds"
      :relative-issue-list="relativeIssueList"
      :classify-issue-list="classifyIssueList"
      :project-issue-list="projectIssueList"
      :context-options="contextOptions"
      @getRelativeList="getRelativeList"
      @updateIssueList="updateIssueList"
      @loadData="loadData"
    />
    <IssueList
      v-show="issueView === 'List'"
      ref="list"
      :list-loading-prop.sync="listLoading"
      :all-data-loading-prop.sync="allDataLoading"
      :has-selected-issue.sync="hasSelectedIssue"
      :quick-add-topic-dialog-visible="quickAddTopicDialogVisible"
      :columns-options="columnsOptions"
      :display-fields-prop="displayFields"
      :main-selected-project-id="mainSelectedProjectId"
      :filter-value="filterValue"
      :keyword-prop="keyword"
      :socket-update="socketUpdate"
      :type="type"
      @setListQuery="setListQuery"
      @setDisplayField="setDisplayField"
    />
    <SearchFilter
      v-if="isMobile"
      ref="searchFilterDrawer"
      :filter-options="filterOptions"
      :list-loading="listLoading"
      :selection-options="contextOptions"
      :is-drawer="isMobile"
      :prefill="{
        filterValue: filterValue,
        keyword: keyword,
        displayClosed: displayClosed,
        fixed_version_closed: fixed_version_closed
      }"
      @add-issue="handleQuickAddClose"
      @change-filter="onChangeFilterForm"
      @filter-label="filterSelected = $event"
      @change-fixed-version="onChangeFixedVersionStatus"
      @add-custom-filter="updateCustomFilter"
      @clean-filter="cleanFilter"
    />
  </div>
</template>

<script>
import { ProjectListSelector, ElSelectAll } from '@shared/components'
import { SearchFilter } from '@/mixins'
import mixinBoard from './mixins/mixinBoard'
import { mapGetters } from 'vuex'
import { Columns } from '@/components/Issue'

/**
 * @param row.relations  row maybe have parent or children issue
 * @param data.issue_list get paged data from api
 */

export default {
  name: 'ProjectIssueList',
  components: {
    ProjectListSelector,
    ElSelectAll,
    QuickAddIssue: () => import('@shared/views/MyWork/components/QuickAddIssue'),
    IssueBoards: () => import('./components/Boards'),
    IssueList: () => import('./components/List'),
    Columns
  },
  mixins: [
    SearchFilter,
    mixinBoard
  ],
  data() {
    return {
      issueView: JSON.parse(sessionStorage.getItem('board_list_view')) || 'Board',
      storageName: 'issue_board',
      listLoading: false,
      allDataLoading: false,
      hasSelectedIssue: false,
      quickAddTopicDialogVisible: false,
      listBoardQuery: {
        offset: 0,
        limit: 10,
        total: 0,
        page: 1
      },
      groupBy: {
        dimension: 'status',
        value: []
      },
      columnsOptions: Object.freeze([
        { display: this.$t('Issue.project'), field: 'project' },
        { display: this.$t('Issue.name'), field: 'name' },
        { display: this.$t('Issue.tracker'), field: 'tracker' },
        { display: this.$t('Issue.status'), field: 'status' },
        { display: this.$t('Issue.fixed_version'), field: 'fixed_version' },
        { display: this.$t('Issue.StartDate'), field: 'StartDate' },
        { display: this.$t('Issue.EndDate'), field: 'EndDate' },
        { display: this.$t('Issue.priority'), field: 'priority' },
        { display: this.$t('Issue.assigned_to'), field: 'assigned_to' },
        { display: this.$t('Issue.DoneRatio'), field: 'DoneRatio' }
      ]),
      displayFields: [],
      socketUpdate: {
        type: '',
        elements: []
      },
      type: 'issue_list'
    }
  },
  computed: {
    ...mapGetters(['device']),
    isBoard() {
      return this.issueView === 'Board'
    },
    filterDimensionsList() {
      return (value) => value !== 'tags' && value !== 'due_date_start' && value !== 'due_date_end'
    },
    contextOptions() {
      const result = {}
      const getOptions = ['assigned_to', 'fixed_version', 'tags']
      getOptions.forEach((item) => {
        result[item] = this[item]
      })
      return result
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    isMobile: {
      handler(val) {
        if (val) {
          this.issueView = 'Board'
        }
      },
      immediate: true
    },
    selectedProjectId: {
      async handler(newId, oldId) {
        this.socket.emit('leave', { project_id: oldId })
        this.socket.emit('join', { project_id: newId })
        await this.onCleanKeyWord()
        this.projectId = this.selectedProjectId
        this.filterValue = {}
        await this.fetchInitData()
        if (oldId) sessionStorage.removeItem('board_list_view')
      },
      immediate: true
    },
    async 'filterValue.project'(value) {
      if (value) this.projectId = value
      else this.projectId = this.selectedProjectId
      await this.onCleanKeyWord()
      if (value) this.filterValue.project = value
      await this.loadSelectionList()
      await this.getInitStoredData()
      await this.loadVersionList()
    },
    issueView(val) {
      sessionStorage.setItem('board_list_view', JSON.stringify(val))
    }
  },
  created() {
    this.isFirstLoad = true
    this.connectSocket()
    this.projectId = this.selectedProjectId
    this.connectSocket()
    this.intervalTimer = window.setInterval(() => this.connectSocket(), 30000)
  },
  methods: {
    handleQuickAddClose() {
      this.quickAddTopicDialogVisible = !this.quickAddTopicDialogVisible
    },
    fetchListData() {
      this.$refs.list.fetchData()
    },
    setListQuery(val) {
      this.listBoardQuery = val
    },
    setDisplayField(val) {
      this.displayFields = val
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-radio-button__inner{
    padding: 4px 14px;
  }
}
</style>
