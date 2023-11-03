<template>
  <div class="app-container" :class="device === 'mobile' ? 'mobile' : ''">
    <PageHeader
      ref="pageHeader"
      :project-id.sync="projectId"
      :filter-conditions.sync="filterConditions"
      :keyword.sync="keyword"
      :display-closed-issue.sync="displayClosedIssue"
      :display-closed-version.sync="displayClosedVersion"
      :active-tab.sync="activeTab"
      @create-project="handleCreateProjectClick"
      @add-issue="showQuickAddIssue = !showQuickAddIssue"
      @filter-name="handleFilterName"
    />

    <el-divider />
    <component :is="device === 'mobile' ? 'div' : 'el-collapse-transition'">
      <QuickAddIssue
        v-if="showQuickAddIssue"
        :project-id="projectId"
        :visible.sync="showQuickAddIssue"
        :filter-conditions="filterConditions"
        :is-drawer="device === 'mobile'"
        @close="showQuickAddIssue = false"
        @update="updateIssueTables"
      />
    </component>
    <template v-if="dataLoaded">
      <MyWorkDesktop
        v-if="device !== 'mobile'"
        ref="desktop"
        :list-data.sync="listData"
        :from-props.sync="activeTab"
        :project-id-props.sync="projectId"
        :filter-conditions-props.sync="filterConditions"
        :display-closed-props.sync="displayClosedIssue"
        :display-closed-version-props.sync="displayClosedVersion"
        :keyword-props.sync="keyword"
        @from="setTab"
        @project-id="setProjectId"
        @filter-conditions="setFilterConditions"
        @display-closed="setDisplayClosedIssue"
        @display-closed-version="setDisplayClosedVersion"
        @keyword="setKeyword"
        @list-data="setListData"
      />
      <MyWorkMobile
        v-else
        ref="mobile"
        :list-data.sync="listData"
        :from-props.sync="activeTab"
        :project-id-props.sync="projectId"
        :filter-conditions-props.sync="filterConditions"
        :display-closed-props.sync="displayClosedIssue"
        :display-closed-version-props.sync="displayClosedVersion"
        :keyword-props.sync="keyword"
        :filter-selected="filterSelected"
        @from="setTab"
        @project-id="setProjectId"
        @filter-conditions="setFilterConditions"
        @display-closed="setDisplayClosedIssue"
        @display-closed-version="setDisplayClosedVersion"
        @keyword="setKeyword"
        @list-data="setListData"
      />
    </template>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { MyWorkDesktop, PageHeader } from './components'

export default {
  name: 'MyWork',
  components: {
    MyWorkDesktop,
    MyWorkMobile: () => import('@shared/views/Mobile/MyWork'),
    PageHeader,
    QuickAddIssue: () => import('./components/QuickAddIssue')
  },
  data() {
    return {
      listData: undefined,
      activeTab: 'assigned_to_id',
      projectId: '',
      filterConditions: {},
      keyword: '',
      displayClosedIssue: false,
      displayClosedVersion: false,
      showQuickAddIssue: false,
      filterSelected: '',
      dataLoaded: false
    }
  },
  computed: {
    ...mapGetters(['device'])
  },
  mounted() {
    this.getStoredData()
  },
  methods: {
    ...mapActions('projects', [
      'getIssueFilter',
      'getKeyword',
      'getDisplayClosed'
    ]),
    async getStoredData() {
      const key = 'work'
      const storedData = await this.fetchStoredData()
      const { storedFilterValue, storedKeyword, storedDisplayClosed } = storedData
      if (storedFilterValue[key]) this.filterConditions = storedFilterValue[key]
      if (storedKeyword[key]) this.keyword = storedKeyword[key]
      if (storedDisplayClosed[key]) this.displayClosedIssue = storedDisplayClosed[key]
      await this.getMyWorkStoredData()
      this.dataLoaded = true
    },
    async fetchStoredData() {
      const res = await Promise.allSettled([
        this.getIssueFilter(),
        this.getKeyword(),
        this.getDisplayClosed()
      ])
      const [
        storedFilterValue,
        storedKeyword,
        storedDisplayClosed
      ] = res.map((item) => item.value)
      return {
        storedFilterValue,
        storedKeyword,
        storedDisplayClosed
      }
    },
    getMyWorkStoredData() {
      const storedProjectId = Number(sessionStorage.getItem('workProjectId'))
      const storedActiveTab = sessionStorage.getItem('activeTab')
      const storedDisplayClosedVersion = JSON.parse(sessionStorage.getItem('displayClosedVersion'))
      if (storedProjectId) this.projectId = storedProjectId
      if (storedActiveTab) this.activeTab = storedActiveTab
      if (storedDisplayClosedVersion) this.displayClosedVersion = storedDisplayClosedVersion
    },
    setTab(val) {
      this.activeTab = val
    },
    setProjectId(val) {
      this.projectId = val
    },
    setFilterConditions(val) {
      this.filterConditions = val
    },
    setDisplayClosedIssue(val) {
      this.displayClosedIssue = val
    },
    setDisplayClosedVersion(val) {
      this.displayClosedVersion = val
    },
    setKeyword(val) {
      this.keyword = val
    },
    setListData(val) {
      this.listData = val
      this.$refs.pageHeader.isShowFloatingSearch = false
      // this.$refs.pageHeader.isShowFloatingFilter = false
      const element = document.querySelector('.app-container')
      this.$nextTick(() => {
        element.scrollTo({ top: 0, behavior: 'smooth' })
      })
    },
    handleCreateProjectClick() {
      this.$refs[this.device].handleCreateProjectClick()
    },
    updateIssueTables(assigned_to_id) {
      this.$refs[this.device].updateIssueTables(assigned_to_id)
      this.showQuickAddIssue = false
    },
    handleFilterName(val) {
      this.filterSelected = val
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.mobile::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera*/
}
</style>
