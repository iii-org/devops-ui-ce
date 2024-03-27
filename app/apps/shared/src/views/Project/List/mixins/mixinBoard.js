import { mapGetters, mapActions } from 'vuex'
import {
  getProjectIssueList,
  getProjectIssueListByTree
} from '@/api/projects'
import axios from 'axios'
import Fuse from 'fuse.js'
import { getHasSon, getProjectRelation } from '@/api_v2/projects'
import { io } from 'socket.io-client'

export default {
  data() {
    return {
      isBoardLoading: false,
      syncLoad: false,
      projectIssueList: [],
      projectIssueQueue: {},
      classifyIssueList: {},
      relativeIssueList: [],
      socket: io(`/issues/websocket`, { // production socket
        reconnectionAttempts: 5,
        forceNew: true
      }),
      projectId: null,
      elementIds: [],
      hasChildren: false,
      triggerLoad: 0,
      isFirstLoad: false,
      customOptions: [{
        id: 'zzz',
        label: 'zzz',
        value: 'zzz'
      }],
      customSort: [{
        name: 'zzz',
        sort: [
          { id: 9, name: 'study', color: '#000000' },
          { id: 10, name: 'work', color: '#000000' }
        ]
      }]
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'userId', 'tracker', 'status', 'priority', 'fixedVersionShowClosed']),
    groupByOptions() {
      return this.getStatusSort.map((item, idx) => ({
        id: idx,
        label: this.getTranslateHeader(item.name),
        value: item
      }))
    },
    getStatusSort() {
      const defaultStatus = ['tracker', 'status', 'priority', 'assigned_to', 'fixed_version']
      const dimension = this.groupBy.dimension
      if (defaultStatus.includes(dimension)) {
        let sort = dimension === 'status' ? this.filterClosedStatus(this[dimension]) : this[dimension]
        sort = dimension === 'assigned_to' ? this.filterMe(sort) : sort
        return sort
      } else {
        return this.customSort.find((item) => item.name === dimension).sort
      }
    },
    filterClosedStatus() {
      return function (statusList) {
        if (this.displayClosed) return statusList
        return statusList.filter((item) => item.is_closed === false)
      }
    },
    showSelectedGroupByName() {
      const defaultStatus = ['tracker', 'status', 'priority', 'assigned_to', 'fixed_version']
      const dimension = this.groupBy.dimension
      if (defaultStatus.includes(dimension)) {
        return this.filterOptions.find((item) => item.value === this.groupBy.dimension).label
      } else {
        return this.customOptions.find((item) => item.value === dimension).label
      }
    },
    showSelectedGroupByLength() {
      if (this.groupByOptions.length === this.groupBy.value.length || this.groupBy.value.length === 0) {
        return this.$t('general.All')
      }
      return this.groupBy.value.length
    },
    groupByValueOnBoard() {
      if (this.groupBy.value.length <= 0) {
        return this.getStatusSort.map((item) => item)
      }
      return this.groupBy.dimension === 'assignedTo' ? this.filterMe(this.groupBy.value) : this.groupBy.value
    },
    checkInFilterValue() {
      return function (value) {
        if (this.groupBy.value.length <= 0) return true
        return this.groupBy.value.find((item) => item.id === value)
      }
    }
  },
  watch: {
    triggerLoad(val) {
      this.updateData()
    }
  },
  beforeDestroy() {
    this.socket.disconnect()
    window.clearInterval(this.intervalTimer)
  },
  methods: {
    addCustomOption(name) {
      this.customOptions.push({
        id: name,
        label: name,
        value: name
      })
    },
    addCustomBoard(board) {
      this.customSort.push({
        id: this.customSort.length + 1,
        sort: JSON.parse(JSON.stringify(board))
      })
    },
    // fetchCustomBoard() {
    //   this.customOptions = []
    // },
    deleteCustomBoard () {
      this.$refs.groupByDimensionSelect.visible = true
    },
    ...mapActions('projects', [
      'getProjectUserList',
      'getGroupBy',
      'setGroupBy'
    ]),
    async loadData() {
      try {
        // this.isFirstLoad = true
        await this.fetchBoardData()
        this.fetchListData()
        // this.fetchCustomBoard()
        this.isFirstLoad = false
      } catch (e) {
        // null
      }
    },
    async fetchBoardData() {
      this.resetClassifyIssue()
      this.projectIssueList = []
      await this.syncLoadFilterData()
      await this.getRelativeList()
    },
    async fetchInitData() {
      await this.checkProjectHasChildren()
      await this.getInitStoredData()
    },
    async checkProjectHasChildren() {
      this.hasChildren = (await getHasSon(this.projectId)).has_child
      if (this.hasChildren) {
        const res = (await getProjectRelation(this.projectId)).data
        this.project = res[0].child
        this.project.unshift(res[0].parent)
      }
    },
    async getRelativeList() {
      const hasClosed = await this.groupByValueOnBoard.filter((item) => item.hasOwnProperty('is_closed') && item.is_closed)
      if (hasClosed.length > 0) {
        const projectIssueListRes = await getProjectIssueListByTree(this.projectId)
        this.relativeIssueList = await this.createRelativeList(projectIssueListRes.data)
      }
    },
    classifyIssue() {
      const issueList = this.projectIssueList
      this.checkGroupByValueOnBoard()
      issueList.forEach((issue) => {
        if (issue) {
          const defaultStatus = ['tracker', 'status', 'priority', 'assigned_to', 'fixed_version']
          if (defaultStatus.includes(this.groupBy.dimension)) {
            let dimensionName = issue[this.groupBy.dimension].id
            dimensionName = dimensionName || 'null'
            if (!this.classifyIssueList[dimensionName]) return
            if (this.checkInFilterValue(dimensionName)) this.classifyIssueList[dimensionName].push(issue)
          } else if (issue.tags.length > 0) {
            issue.tags.forEach((tag) => {
              const dimensionName = tag.id
              if (!this.classifyIssueList[dimensionName]) return
              if (this.checkInFilterValue(dimensionName)) this.classifyIssueList[dimensionName].push(issue)
            })
          }
        }
      })
      this.sortIssue()
    },
    checkGroupByValueOnBoard() {
      this.groupByValueOnBoard.forEach((dimension) => {
        if (!this.classifyIssueList.hasOwnProperty(dimension.id)) {
          this.classifyIssueList[dimension.id] = []
        }
      })
    },
    getBoardParams() {
      const result = {}
      if (!this.displayClosed && this.groupBy.dimension !== 'status') result['status_id'] = 'open'
      if (this.keyword) result['search'] = this.keyword
      Object.keys(this.filterValue).forEach((param) => {
        if (this.filterValue[param]) {
          const isArray = param === 'tags' && this.filterValue[param].length > 0
          if (isArray) {
            result[param] = this.filterValue[param].join(',')
          } else {
            result[`${param}_id`] = this.filterValue[param]
          }
        }
      })
      return result
    },
    async syncLoadFilterData() {
      await this.cancelLoadFilterData()
      this.projectIssueQueue = {}
      this.isBoardLoading = true
      const getIssueList = this.getIssueList()
      this.projectIssueList = []
      await this.setIssueList(getIssueList)
      // this.updateData()
      this.projectIssueQueue = {}
      this.isBoardLoading = false
      this.triggerLoad++
    },
    getIssueList() {
      const issueList = []
      this.groupByValueOnBoard.forEach((item) => {
        const { CancelToken, config } = this.getCancelToken()
        this.$set(this.projectIssueQueue, item.id, CancelToken)
        const dimension = this.groupBy.dimension === 'tags' ? this.groupBy.dimension : `${this.groupBy.dimension}_id`
        const params = { ...this.getBoardParams(), [dimension]: item.id }
        const getIssueList = getProjectIssueList(this.projectId, params, config)
        issueList.push(getIssueList)
      })
      return issueList
    },
    getCancelToken() {
      const CancelToken = axios.CancelToken.source()
      const config = { cancelToken: CancelToken.token }
      return { CancelToken, config }
    },
    async setIssueList(getIssueList) {
      await Promise.allSettled(getIssueList)
        .then((res) => {
          const issueList = res.map((item) => item.value.data)
          const list = [].concat(...issueList)
          this.$set(this.$data, 'projectIssueList', list)
        })
        .catch((e) => {
          console.error(e)
        })
    },
    updateIssueList(index, issue) {
      this.$set(this.projectIssueList, index, issue)
    },
    cancelLoadFilterData() {
      Object.values(this.projectIssueQueue).forEach((item) => {
        item.cancel()
      })
    },
    getOptionsData(option_name) {
      return this[option_name]
    },
    resetClassifyIssue() {
      this.classifyIssueList = {}
    },
    getTranslateHeader(value) {
      return this.$te('Issue.' + value) ? this.$t('Issue.' + value) : value
    },
    searchKanbanCard(value, searchBy) {
      if (!value || value === '') return true
      Object.keys(this.classifyIssueList).forEach((item) => {
        value === 'null'
          ? this.searchUnassignedOrNoVersionIssues(item, searchBy)
          : this.searchByKeys(item, value, searchBy)
      })
    },
    searchUnassignedOrNoVersionIssues(item, searchBy) {
      this.classifyIssueList[item] = this.classifyIssueList[item].filter((subItem) => {
        const findKey = searchBy['keys'][0].split('.')
        const findName = findKey.reduce((total, current) => total[current], subItem)
        return findName === undefined && findKey[0] !== ''
      })
    },
    searchByKeys(item, value, searchBy) {
      const fuse = new Fuse(this.classifyIssueList[item], searchBy)
      let pattern = `="${value}"`
      if (Array.isArray(value) && value.length > 0) {
        pattern = { $or: value.map((items) => ({ $path: [searchBy['keys']], $val: `="${items}"` })) }
      }
      const res = fuse.search(pattern)
      this.classifyIssueList[item] = res.map((items) => items.item)
    },
    async updateData() {
      this.resetClassifyIssue()
      this.classifyIssue()
      Object.keys(this.filterValue).forEach((item) => {
        const searchOpt = {
          keys: [`${item}.id`],
          useExtendedSearch: true
        }
        this.searchKanbanCard(this.filterValue[item], searchOpt)
      })
    },
    sortIssue() {
      const sortUpdateOn = (a, b) => new Date(b.updated_on) - new Date(a.updated_on)
      Object.keys(this.classifyIssueList).forEach((item) => {
        this.$set(this.classifyIssueList, item, this.classifyIssueList[item].sort(sortUpdateOn))
      })
    },
    async createRelativeList(list) {
      const result = []
      async function flatList(parent) {
        for (const item of parent) {
          result.push(item)
          const children = item.children
          if (item.children.length) flatList(children)
        }
      }
      await flatList(list)
      return result
    },
    async connectSocket() {
      this.setSocketListener()
      await this.socket.connect()
      await this.socket.emit('join', { project_id: this.projectId })
    },
    async onSocketConnect() {
      this.isBoardLoading = true
      await this.connectSocket()
      this.isBoardLoading = false
      this.triggerLoad++
    },
    setSocketListener() {
      const _this = this
      this.socket.on('connect', () => {
        console.log('connect')
      })
      this.socket.on('update_issue', async (data) => {
        this.$set(this, 'socketUpdate', { type: 'update', elements: data })
        for (const idx in data) {
          data[idx] = _this.socketDataFormat(data[idx])
          const findChangeIndex = this.projectIssueList.findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
          this.$set(this.projectIssueList, findChangeIndex, data[idx])
          this.updateData()
        }
        this.elementIds = data.map(s => s.id)
      })
      this.socket.on('delete_issue', async (data) => {
        this.$set(this, 'socketUpdate', { type: 'delete', elements: [data] })
        const findChangeIndex = this.projectIssueList.findIndex(issue => parseInt(data.id) === parseInt(issue.id))
        this.$delete(this.projectIssueList, findChangeIndex)
        this.updateData()
      })
      this.socket.on('add_issue', async data => {
        this.$set(this, 'socketUpdate', { type: 'create', elements: data })
        for (const idx in data) {
          if ((this.filterValue.project) && (this.filterValue.project === data[idx].project.id) || !this.filterValue.project) {
            data[idx] = _this.socketDataFormat(data[idx])
            const findChangeIndex = this.projectIssueList.findIndex(issue => parseInt(data[idx].id) === parseInt(issue.id))
            if (findChangeIndex !== -1) {
              this.$set(this.projectIssueList, findChangeIndex, data[idx])
            } else {
              this.$set(this.projectIssueList, this.projectIssueList.length, data[idx])
            }
            this.updateData()
          }
        }
        this.elementIds = data.map(s => s.id)
      })
      this.socket.on('disconnect', (reason) => {
        if (reason !== 'io client disconnect') {
          this.connectSocket()
        }
      })
      this.socket.on('connect_error', () => {
        console.log('connection error')
      })
    },
    socketDataFormat(data) {
      Object.keys(data).forEach(key => {
        const splitKey = key.split('_id')
        if (splitKey.length > 1) {
          if (this[splitKey[0]]) {
            const findObject = this[splitKey[0]].find(item => item.id === parseInt(data[key]) && item.login !== '-Me-')
            if (findObject) {
              data[splitKey[0]] = findObject
            }
          }
        }
      })
      return data
    },
    filterMe(userList) {
      return userList.filter((item) => item.login !== '-Me-')
    },
    async onCleanKeyWord() {
      this.keyword = ''
      const storedData = await this.fetchStoredData()
      storedData.storedKeyword['issue_board'] = this.keyword
      await this.setKeyword(storedData.storedKeyword)
    }
  }
}
