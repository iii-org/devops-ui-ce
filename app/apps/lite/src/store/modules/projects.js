import {
  getProjectIssueProgress,
  getProjectIssueStatistics
} from '@/api/projects'
import {
  getIssuePriority,
  getIssueStatus,
  getIssueTracker
} from '@/api_v3/issues'
import {
  createProject,
  deleteProject,
  getMyProjects,
  getProjectDetails,
  getProjectSelectorList,
  getProjectUserList,
  updateProject
} from '@/api_v3/projects'

const getDefaultState = () => {
  return {
    list: [],
    options: [],
    total: 0,
    selectedProject: { id: -1, repository_id: -1 },
    completeSelectedProject: {},

    tracker: [],
    status: [],
    priority: [],
    strictTracker: [],
    forceTracker: [],
    enableForceTracker: false,

    issueFilter: JSON.parse(sessionStorage.getItem('issueFilter')) || {},
    keyword: JSON.parse(sessionStorage.getItem('keyword')) || {},
    displayClosed: JSON.parse(sessionStorage.getItem('displayClosed')) || {},
    groupBy: JSON.parse(sessionStorage.getItem('groupBy')) || {
      dimension: 'status',
      value: []
    },
    tableExpand: JSON.parse(sessionStorage.getItem('tableExpand')) || {},
    listQuery: {},
    sort: JSON.parse(sessionStorage.getItem('sort')) || {},
    issueListPageInfo: {},
    fixedVersionShowClosed: false,
    graphTheme: JSON.parse(sessionStorage.getItem('graphTheme')) || 'light'
  }
}

const state = getDefaultState()

const mutations = {
  SET_LIST: (state, list) => {
    state.list = list
  },
  SET_OPTIONS: (state, list) => {
    state.options = list
  },
  SET_TOTAL: (state, total) => {
    state.total = total
  },
  SET_SELECTED_PROJECT: (state, project) => {
    state.selectedProject = project
  },
  SET_COMPLETE_SELECTED_PROJECT: (state, project) => {
    state.completeSelectedProject = project
  },
  SET_SELECTION_OPTIONS: (state, list) => {
    state.tracker = list[0]
    state.status = list[1]
    state.priority = list[2]
  },
  SET_STRICT_TRACKER: (state, value) => {
    state.strictTracker = value
  },
  SET_ENABLE_FORCE_TRACKER: (state, value) => {
    state.enableForceTracker = value
  },
  SET_FORCE_TRACKER: (state, value) => {
    state.forceTracker = value
  },
  SET_FILTER: (state, value) => {
    state.issueFilter = value
  },
  SET_KEYWORD: (state, value) => {
    state.keyword = value
  },
  SET_DISPLAY_CLOSED: (state, value) => {
    state.displayClosed = value
  },
  SET_GROUP_BY: (state, value) => {
    state.groupBy = value
  },
  SET_TABLE_EXPAND: (state, value) => {
    state.tableExpand = value
  },
  SET_LIST_QUERY: (state, value) => {
    state.listQuery = value
  },
  SET_SORT: (state, value) => {
    state.sort = value
  },
  // ? not use
  // SET_PAGE_INFO: (state, value) => {
  //   state.pageInfo = value
  // },
  SET_FIXED_VERSION_SHOW_CLOSED: (state, value) => {
    state.fixedVersionShowClosed = value
  },
  SET_GRAPH_THEME: (state, value) => {
    state.graphTheme = value
  }
}

const actions = {
  async getMyProjectList({ commit, dispatch }, params) {
    try {
      const { projects, page } = await getMyProjects(params)
      const projectsSort = projects
        .sort((a, b) => -(new Date(a.updated_at) - new Date(b.updated_at)))
        .sort((a, b) => {
          if (a.is_starred === b.is_starred) {
            return 0
          }
          if (a.is_starred) {
            return -1
          }
          return 1
        })
      // dispatch('getMyProjectOptions') // TODO: check if this is necessary
      commit('SET_LIST', projectsSort)
      if (page) {
        commit('SET_TOTAL', page.total)
        return page
      } else {
        commit('SET_TOTAL', projectsSort.length)
      }
    } catch (error) {
      console.error(error.toString())
    }
  },
  async getMyProjectOptions({ commit }) {
    try {
      const projects = (await getProjectSelectorList()).data
      // projects = projects.sort((a, b) => a.id - b.id).sort((a, b) => (a.starred === b.starred ? 0 : a.starred ? -1 : 1))
      commit('SET_OPTIONS', projects)
    } catch (error) {
      console.error(error.toString())
    }
  },
  async getSelectionOptions({ commit, dispatch }) {
    const selections = await Promise.allSettled([
      getIssueTracker(),
      getIssueStatus(),
      getIssuePriority()
    ])
    commit(
      'SET_SELECTION_OPTIONS',
      selections.map((item) => item.value.data)
    )
  },
  async addNewProject({ commit, dispatch }, data) {
    try {
      const res = await createProject(data)
      dispatch('user/getInfo', null, { root: true })
      return Promise.resolve(res)
    } catch (error) {
      console.error(error.toString())
      return Promise.reject(error)
    }
  },
  async editProject(_, { pId, data }) {
    try {
      return await updateProject(pId, data)
    } catch (error) {
      console.error(error.toString())
    }
  },
  async deleteProject({ dispatch }, { pId, force }) {
    try {
      const res = await deleteProject(pId, { force })
      dispatch('user/getInfo', null, { root: true })
      return res
    } catch (error) {
      console.error(error.toString())
      return Promise.reject(error.response)
    }
  },
  async getProjectIssueProgress({ commit }, pId) {
    try {
      return await getProjectIssueProgress(pId)
    } catch (error) {
      console.error(error.toString())
    }
  },
  async getProjectIssueStatistics({ commit }, pId) {
    try {
      return await getProjectIssueStatistics(pId)
    } catch (error) {
      console.error(error.toString())
    }
  },
  async getProjectUserList({ commit }, pId) {
    try {
      return await getProjectUserList(pId)
    } catch (error) {
      console.error(error.toString())
    }
  },
  async setCompleteSelectedProject({ commit }, pId) {
    try {
      const res = await getProjectDetails(pId)
      commit('SET_COMPLETE_SELECTED_PROJECT', res.data)
    } catch (error) {
      console.error(error.toString())
    }
  },
  setSelectedProject({ commit, dispatch }, project) {
    const { id } = project
    if (localStorage.getItem('projectId') !== id.toString()) {
      sessionStorage.removeItem('listQuery')
      sessionStorage.removeItem('keyword')
      sessionStorage.removeItem('issueFilter')
      sessionStorage.removeItem('groupBy')
      sessionStorage.removeItem('displayClosed')
      sessionStorage.removeItem('sort')
      localStorage.removeItem('pipelineList')
    }
    commit('SET_SELECTED_PROJECT', project)
    commit('SET_LIST_QUERY', {})
    commit('SET_KEYWORD', {})
    commit('SET_FILTER', {})
    commit('SET_GROUP_BY', { dimension: 'status', value: [] })
    commit('SET_DISPLAY_CLOSED', {})
    // dispatch('getIssueStrictTracker')
    // dispatch('getIssueForceTracker')
  },
  getIssueFilter({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('issueFilter')
    if (getSessionValue) {
      commit('SET_FILTER', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.issueFilter
  },
  setIssueFilter({ commit }, value) {
    sessionStorage.setItem('issueFilter', JSON.stringify(value))
    commit('SET_FILTER', value)
  },
  getKeyword({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('keyword')
    if (getSessionValue) {
      commit('SET_KEYWORD', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.keyword
  },
  setKeyword({ commit }, value) {
    sessionStorage.setItem('keyword', JSON.stringify(value))
    commit('SET_KEYWORD', value)
  },
  getDisplayClosed({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('displayClosed')
    if (getSessionValue) {
      commit('SET_DISPLAY_CLOSED', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.displayClosed
  },
  setDisplayClosed({ commit }, value) {
    sessionStorage.setItem('displayClosed', JSON.stringify(value))
    commit('SET_DISPLAY_CLOSED', value)
  },
  getGroupBy({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('groupBy')
    if (getSessionValue) {
      commit('SET_GROUP_BY', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.groupBy
  },
  setGroupBy({ commit }, value) {
    sessionStorage.setItem('groupBy', JSON.stringify(value))
    commit('SET_GROUP_BY', value)
  },
  getListQuery({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('listQuery')
    if (getSessionValue) {
      commit('SET_LIST_QUERY', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.listQuery
  },
  setListQuery({ commit }, value) {
    sessionStorage.setItem('listQuery', JSON.stringify(value))
    commit('SET_LIST_QUERY', value)
  },
  getSort({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('sort')
    if (getSessionValue) {
      commit('SET_SORT', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.sort
  },
  setSort({ commit }, value) {
    sessionStorage.setItem('sort', JSON.stringify(value))
    commit('SET_SORT', value)
  },
  // ? not use
  // getPageInfo({ commit, state }) {
  //   const getSessionValue = sessionStorage.getItem('pageInfo')
  //   if (getSessionValue) {
  //     commit('SET_PAGE_INFO', JSON.parse(getSessionValue))
  //     return JSON.parse(getSessionValue)
  //   }
  //   return state.pageInfo
  // },
  // setPageInfo({ commit }, value) {
  //   sessionStorage.setItem('pageInfo', JSON.stringify(value))
  //   commit('SET_PAGE_INFO', value)
  // },
  getFixedVersionShowClosed({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('fixed_version_show_closed')
    if (getSessionValue) {
      commit('SET_FIXED_VERSION_SHOW_CLOSED', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.fixedVersionShowClosed
  },
  setFixedVersionShowClosed({ commit }, value) {
    sessionStorage.setItem('fixed_version_show_closed', JSON.stringify(value))
    commit('SET_FIXED_VERSION_SHOW_CLOSED', value)
  },
  getTableExpand({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('tableExpand')
    if (getSessionValue) {
      commit('SET_TABLE_EXPAND', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.tableExpand
  },
  setTableExpand({ commit }, value) {
    sessionStorage.setItem('tableExpand', JSON.stringify(value))
    commit('SET_TABLE_EXPAND', value)
  },
  getGraphTheme({ commit, state }) {
    const getSessionValue = sessionStorage.getItem('graphTheme')
    if (getSessionValue) {
      commit('SET_GRAPH_THEME', JSON.parse(getSessionValue))
      return JSON.parse(getSessionValue)
    }
    return state.graphTheme
  },
  setGraphTheme({ commit }, value) {
    sessionStorage.setItem('graphTheme', JSON.stringify(value))
    commit('SET_GRAPH_THEME', value)
  },
  isProjectHasChildren({ state }, projectId) {
    return state.options.find((project) => project.id === projectId)
      ?.has_children
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
