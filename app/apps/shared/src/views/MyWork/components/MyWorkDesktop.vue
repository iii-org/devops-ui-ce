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

        <IssueTable
          :ref="tab.id"
          :from="tab.id"
          :project-id="projectId"
          :filter-conditions-props="filterConditions"
          :display-closed-props="displayClosedIssue"
          :keyword-props="keyword"
          :list-data-props="listData"
          @list-data="setListData"
          @update="updateIssueTables"
          @total="updateTotalCount(tab.id, $event)"
        />
      </el-tab-pane>
    </el-tabs>

    <CreateProjectDialog
      ref="createProjectDialog"
      v-permission="['Administrator', 'Project Manager']"
      @update="$router.push({name: 'ProjectList'})"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { IssueTable } from '.'
import { CreateProjectDialog } from '@shared/views/Overview/ProjectList/components'

export default {
  name: 'MyWorkDesktop',
  components: {
    IssueTable,
    CreateProjectDialog
  },
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
    }
  },
  data() {
    return {
      tabs: [
        { id: 'assigned_to_id', name: 'AssignedToMe', count: '-' },
        { id: 'author_id', name: 'ReportedIssue', count: '-' },
        { id: 'watcher_id', name: 'WatcherList', count: '-' }
      ]
    }
  },
  computed: {
    ...mapGetters(['projectOptions', 'userId', 'device']),
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
      deep: true,
      immediate: true
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
    handleCreateProjectClick() {
      this.$refs.createProjectDialog.showDialog = true
    },
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
      Object.assign({}, this.filterConditions)
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
    async setListData() {
      const listData = {
        assigned_to_id: {},
        author_id: {},
        watcher_id: {}
      }

      this.tabs.forEach(async (tab) => {
        if (listData[tab.id]) {
          listData[tab.id].data = this.$refs[tab.id][0].listData
          listData[tab.id].query = this.$refs[tab.id][0].listQuery
        }
      })
      this.$emit('list-data', listData)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

::v-deep .el-tabs__header {
  margin: 0;
  .el-tabs__item.is-active {
    background: #e4ecf7;
    color: #138ea2;
    border-top: 5px solid #3e3f41;
    border-bottom-color: #e4ecf7 ;
    height: 45px;
    font-size: 16px;
    font-weight: bold;
  }
  .el-tabs__nav {
    border: none;
  }
  .el-tabs__item {
    padding: 0 0 0 20px;
    background: #3e3f41;
    color: #b0b1b3;
    border-radius: 5px;
    width: 70%;
    &:hover {
      color: $linkTextColor;
    }
    &.is-top:nth-child(2) {
      padding: 0 0 0 20px;
    }
  }
}

::v-deep .el-tabs__active-bar {
  display: none;
}

::v-deep .el-tabs__content {
  background: #e4ecf7 ;
  border-radius: 3px;
}

::v-deep .el-tab-pane {
  margin: 15px;
  background: #e4ecf7 ;
}
</style>
