<template>
  <div :class="device === 'mobile' ? 'mobile' : ''" class="app-container">
    <PageHeader
      ref="pageHeader"
      :active-tab.sync="activeTab"
      :display-closed-issue.sync="displayClosedIssue"
      :display-closed-version.sync="displayClosedVersion"
      :filter-conditions.sync="filterConditions"
      :keyword.sync="keyword"
      :project-id.sync="projectId"
      @create-project="handleCreateProjectClick"
      @add-issue="showQuickAddIssue = !showQuickAddIssue"
      @filter-name="handleFilterName"
    />

    <el-divider />
    <component :is="device === 'mobile' ? 'div' : 'el-collapse-transition'">
      <QuickAddIssue
        v-if="showQuickAddIssue"
        :filter-conditions="filterConditions"
        :is-drawer="device === 'mobile'"
        :project-id="projectId"
        :visible.sync="showQuickAddIssue"
        @close="showQuickAddIssue = false"
        @update="updateIssueTables"
      />
    </component>
    <template v-if="dataLoaded">
      <MyWorkDesktop
        v-if="device !== 'mobile'"
        ref="desktop"
        :display-closed-props.sync="displayClosedIssue"
        :display-closed-version-props.sync="displayClosedVersion"
        :filter-conditions-props.sync="filterConditions"
        :from-props.sync="activeTab"
        :keyword-props.sync="keyword"
        :list-data.sync="listData"
        :project-id-props.sync="projectId"
        @from="setTab"
        @keyword="setKeyword"
        @project-id="setProjectId"
        @filter-conditions="setFilterConditions"
        @display-closed="setDisplayClosedIssue"
        @display-closed-version="setDisplayClosedVersion"
        @list-data="setListData"
      />
      <MyWorkMobile
        v-else
        ref="mobile"
        :display-closed-props.sync="displayClosedIssue"
        :display-closed-version-props.sync="displayClosedVersion"
        :filter-conditions-props.sync="filterConditions"
        :filter-selected="filterSelected"
        :from-props.sync="activeTab"
        :keyword-props.sync="keyword"
        :list-data.sync="listData"
        :project-id-props.sync="projectId"
        @from="setTab"
        @keyword="setKeyword"
        @project-id="setProjectId"
        @filter-conditions="setFilterConditions"
        @display-closed="setDisplayClosedIssue"
        @display-closed-version="setDisplayClosedVersion"
        @list-data="setListData"
      />
    </template>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'MyWork',
  components: {
    MyWorkDesktop: () => import('./components/MyWorkDesktop'),
    MyWorkMobile: () => import('@shared/views/Mobile/MyWork'),
    PageHeader: () => import('./components/PageHeader'),
    QuickAddIssue: () => import('./components/QuickAddIssue')
  },
  data() {
    return {
      listData: undefined,
      activeTab: 'assigned',
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
      const key = 'my_work'
      const storedData = await this.fetchStoredData()
      const { storedFilterValue, storedKeyword, storedDisplayClosed } =
        storedData
      if (storedFilterValue[key]) this.filterConditions = storedFilterValue[key]
      if (storedKeyword[key]) this.keyword = storedKeyword[key]
      if (storedDisplayClosed[key]) {
        this.displayClosedIssue = storedDisplayClosed[key]
      }
      await this.getMyWorkStoredData()
      this.dataLoaded = true
    },
    async fetchStoredData() {
      const res = await Promise.allSettled([
        this.getIssueFilter(),
        this.getKeyword(),
        this.getDisplayClosed()
      ])
      const [storedFilterValue, storedKeyword, storedDisplayClosed] = res.map(
        (item) => item.value
      )
      return {
        storedFilterValue,
        storedKeyword,
        storedDisplayClosed
      }
    },
    getMyWorkStoredData() {
      const storedProjectId = Number(sessionStorage.getItem('workProjectId'))
      const storedActiveTab = sessionStorage.getItem('activeTab')
      const storedDisplayClosedVersion = JSON.parse(
        sessionStorage.getItem('displayClosedVersion')
      )
      if (storedProjectId) this.projectId = storedProjectId
      if (storedActiveTab) this.activeTab = storedActiveTab
      if (storedDisplayClosedVersion) {
        this.displayClosedVersion = storedDisplayClosedVersion
      }
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
    updateIssueTables(assigned) {
      this.$refs[this.device].updateIssueTables(assigned)
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
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.mobile::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera*/
}
</style>
