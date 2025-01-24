import { getRepositoryBranches as GBBP } from '@/api_v3/gitlab'

const getDefaultState = () => {
  return {
    list: [],
    total: 0,
    defaultBranch: ''
  }
}

const state = getDefaultState()

const mutations = {
  SET_LIST: (state, list) => {
    state.list = list
  },
  SET_TOTAL: (state, total) => {
    state.total = total
  },
  SET_DEFAULT_BRANCH: (state, defaultBranch) => {
    state.defaultBranch = defaultBranch
  }
}

const actions = {
  async getBranchesByProject({ commit }, pId) {
    try {
      const response = await GBBP(pId)
      const { data } = response
      commit('SET_LIST', data.branches)
      commit('SET_TOTAL', data.branches.length)
      commit('SET_DEFAULT_BRANCH', data.main)
    } catch (error) {
      console.error(error.toString())
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
