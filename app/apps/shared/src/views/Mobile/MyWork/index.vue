<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.id"
        :name="tab.id"
      >
        <span slot="label">
          <span>{{ $t(`MyWork.${tab.name}`) }}</span>
          <span class="font-bold">
            ({{ tab.count !== '-' ? tab.count : 0 }})
          </span>
        </span>
        <div class="filter-selected">
          <span>{{ filterSelected }}</span>
          <span v-if="filterSelected !== '' && keyword !== ''">; </span>
          <span>{{ keyword !== '' ? $t('general.Search') + ': ' + keyword : '' }}</span>
          <el-button
            v-if="filterSelected !== '' || keyword !== ''"
            size="small"
            icon="el-icon-close"
            type="text"
            @click="clearFilter"
          />
        </div>
        <Card
          :ref="tab.id"
          :from="tab.id"
          :project-id="projectId"
          :filter-conditions-props.sync="filterConditions"
          :display-closed-props="displayClosedIssue"
          :keyword-props="keyword"
          :show-quick-add-issue="showQuickAddIssue"
          :list-data-props="listData"
          @list-data="setListData"
          @update="updateIssueTables"
          @total="updateTotalCount(tab.id, $event)"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { Card } from './components'

export default {
  name: 'MyWorkMobile',
  components: { Card },
  props: {
    listData: {
      type: Object,
      default: () => {}
    },
    fromProps: {
      type: String,
      default: 'assigned_to_id'
    },
    projectIdProps: {
      type: [String, Number],
      default: ''
    },
    filterConditionsProps: {
      type: Object,
      default: () => ({})
    },
    displayClosedProps: {
      type: Boolean,
      default: false
    },
    displayClosedVersionProps: {
      type: Boolean,
      default: false
    },
    keywordProps: {
      type: String,
      default: ''
    },
    filterSelected: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      tabs: [
        { id: 'assigned_to_id', name: 'AssignedToMe', count: '-' },
        { id: 'author_id', name: 'ReportedIssue', count: '-' },
        { id: 'watcher_id', name: 'WatcherList', count: '-' }
      ],
      showQuickAddIssue: false
    }
  },
  computed: {
    ...mapGetters(['projectOptions', 'userId', 'device', 'status']),
    projectId: {
      get() {
        return this.projectIdProps
      },
      set(val) {
        this.$emit('project-id', val)
        return val
      }
    },
    filterConditions: {
      get() {
        return this.filterConditionsProps
      },
      set(val) {
        this.$emit('filter-conditions', val)
        return val
      }
    },
    displayClosedIssue: {
      get() {
        return this.displayClosedProps
      },
      set(val) {
        this.$emit('display-closed', val)
        return val
      }
    },
    displayClosedVersion: {
      get() {
        return this.displayClosedVersionProps
      },
      set(val) {
        this.$emit('display-closed-version', val)
        return val
      }
    },
    keyword: {
      get() {
        return this.keywordProps
      },
      set(val) {
        this.$emit('keyword', val)
        return val
      }
    },
    activeTab: {
      get() {
        this.scrollToView(this.fromProps)
        return this.fromProps
      },
      set(val) {
        this.$emit('from', val)
        return val
      }
    }
  },
  watch: {
    projectId: {
      handler(id) {
        this.setStoredData('workProjectId', id)
        if (id) {
          this.setSelectedProject(this.projectOptions.find((elm) => elm.id === id))
          localStorage.setItem('projectId', id)
        } else {
          this.clearFilter()
          this.$router.push({ name: this.$route.name })
          sessionStorage.removeItem('workProjectId')
          return
        }
        const projectName = this.projectOptions.find((elm) => elm.id === id).name
        this.clearFilter()
        this.$router.push({ name: this.$route.name, params: { projectName }})
      },
      deep: true
    },
    filterConditions: {
      handler() {
        this.onFilterChanged()
      },
      deep: true
    },
    displayClosedIssue: {
      handler() {
        this.onFilterChanged()
      },
      deep: true
    },
    keyword: {
      handler() {
        this.onFilterChanged()
      },
      deep: true
    },
    activeTab: {
      handler(value) {
        this.setStoredData('activeTab', value)
      },
      deep: true
    },
    displayClosedVersion: {
      handler(value) {
        this.setStoredData('displayClosedVersion', value)
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('projects', [
      'getIssueFilter',
      'getKeyword',
      'getDisplayClosed',
      'setKeyword',
      'setIssueFilter',
      'setDisplayClosed',
      'setSelectedProject'
    ]),
    updateTotalCount(tabId, $event) {
      this.tabs.find((tab) => tab.id === tabId).count = $event
    },
    updateIssueTables(assignedToId) {
      if (assignedToId !== undefined && this.userId !== assignedToId) this.activeTab = 'author_id'
      this.tabs.forEach((tab) => {
        this.$refs[tab.id][0].fetchData()
      })
    },
    async fetchStoredData() {
      let storedFilterValue, storedKeyword, storedDisplayClosed
      await Promise.all([this.getIssueFilter(), this.getKeyword(), this.getDisplayClosed()]).then((res) => {
        const [filterValue, keyword, displayClosed] = res
        storedFilterValue = filterValue
        storedKeyword = keyword
        storedDisplayClosed = displayClosed
      })
      return { storedFilterValue, storedKeyword, storedDisplayClosed }
    },
    clearFilter() {
      this.clearKeyword()
      this.clearIssueFilter()
      this.clearDisplayClosed()
      this.clearDisplayClosedVersion()
    },
    clearKeyword() {
      this.keyword = ''
      this.setStoredData('keyword', JSON.stringify({ work: '' }))
    },
    clearIssueFilter() {
      this.filterConditions = {}
      this.setStoredData('issueFilter', JSON.stringify({ work: {}}))
    },
    clearDisplayClosed() {
      this.displayClosedIssue = false
      this.setStoredData('displayClosed', JSON.stringify({ work: false }))
    },
    clearDisplayClosedVersion() {
      this.displayClosedVersion = false
      this.setStoredData('displayClosedVersion', false)
    },
    async onFilterChanged() {
      const key = 'work'
      const storedData = await this.fetchStoredData()
      const { storedFilterValue, storedKeyword, storedDisplayClosed } = storedData
      storedFilterValue[key] = this.filterConditions
      storedKeyword[key] = this.keyword
      storedDisplayClosed[key] = this.displayClosedIssue
      await this.setIssueFilter(storedFilterValue)
      await this.setKeyword(storedKeyword)
      await this.setDisplayClosed(storedDisplayClosed)
    },
    setStoredData(key, value) {
      sessionStorage.setItem(key, value)
    },
    setListData() {
      const listData = {
        assigned_to_id: {},
        author_id: {},
        watcher_id: {}
      }
      this.tabs.forEach((tab) => {
        listData[tab.id].data = this.$refs[tab.id][0].listData
        listData[tab.id].query = this.$refs[tab.id][0].listQuery
      })
      this.$emit('list-data', listData)
    },
    handleCellClick(issue) {
      this.$router.push({ name: 'IssueDetail', params: { issueId: issue.id, project: issue.project }})
    },
    scrollToView(value) {
      this.$nextTick(() => {
        const element = document.getElementById('tab-' + value)
        this.$nextTick(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
::v-deep .el-tabs__nav-scroll {
  padding: 0 10px !important;
}
::v-deep .el-tabs__nav::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera*/
}
::v-deep .el-tabs__content {
  color: #303133;
}
::v-deep .el-tabs__header {
  position: sticky;
  position: -webkit-sticky;
  top: -5px;
  right: -5px;
  left: -5px;
  z-index: 99;
  background-color: $appMainBg;
}

::v-deep .el-tabs__nav {
  --n: 1;
  display: flex;
  align-items: center;
  overflow-y: hidden;
  width: 100%; // fallback
  width: calc(var(--n)*100%);
  transform: translate(calc(var(--i)/var(--n) * -100%));
  padding-bottom: 5px;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  ::v-deep .el-tabs__item {
    width: 100%; // fallback
    width: calc(100%/var(--n));
  }
}
.filter-selected {
  margin: 0 5px;
  color: #409EFF;
  font-weight: bold;
  font-size: 12px;
}
</style>
