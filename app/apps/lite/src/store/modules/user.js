import { login, logout } from '@/api_v3/auth'
import { getPinnedRoutes, updatePinnedRoutes } from '@/api_v3/route'
import { getCurrentUser } from '@/api_v3/user'
import { loadRouter, resetRouter } from '@/router/router'
import { getToken, removeToken, setToken } from '@shared/utils/auth'
import { generateAvatarUrl } from '@shared/utils/Avatar'
import VueJwtDecode from 'vue-jwt-decode'

const getDefaultState = () => {
  return {
    token: getToken(),
    userId: 0,
    userRole: '',
    userName: '',
    userAvatar: '',
    userOrgId: '',
    pinnedRoutes: []
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_USER_ID: (state, userId) => {
    state.userId = userId
  },
  SET_USER_ROLE: (state, userRole) => {
    state.userRole = userRole
  },
  SET_USER_NAME: (state, userName) => {
    state.userName = userName
  },
  SET_USER_AVATAR: (state, userAvatar) => {
    state.userAvatar = userAvatar
  },
  SET_USER_ORG_ID: (state, userOrgId) => {
    state.userOrgId = userOrgId
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_PINNED_ROUTES: (state, pinnedRoutes) => {
    state.pinnedRoutes = pinnedRoutes
  }
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { username, password } = userInfo
    return new Promise(async (resolve, reject) => {
      const formData = new FormData()
      formData.append('username', username.trim())
      formData.append('password', password)
      await login(formData)
        .then((response) => {
          const { access_token } = response
          const jwtContent = VueJwtDecode.decode(access_token)
          if (!('sub' in jwtContent)) {
            Promise.reject('userId not exist')
          }

          commit('SET_USER_ID', jwtContent['sub'])
          commit('SET_TOKEN', access_token)
          setToken(access_token)

          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  },

  // get e info
  async getInfo({ commit, state, dispatch, rootState }) {
    const token = getToken()
    const jwtContent = VueJwtDecode.decode(token)
    if (!('sub' in jwtContent)) {
      Promise.reject('userId not exist')
    }
    commit('SET_USER_ID', jwtContent['sub'])
    commit('SET_TOKEN', token)
    const user = await getCurrentUser()
    if (!user.role) {
      throw new Error('role is not exist in user info')
    }
    await getPinnedRoutes(state.userId)
      .then((res) => commit('SET_PINNED_ROUTES', res.data))
      .catch(() => commit('SET_PINNED_ROUTES'), [])

    commit('SET_USER_NAME', user.full_name)
    commit(
      'SET_USER_AVATAR',
      generateAvatarUrl(user.full_name, user.email, 160)
    )
    commit('SET_USER_ORG_ID', user.organization_id)

    await dispatch('projects/getMyProjectOptions', null, { root: true })
    await dispatch('projects/getSelectionOptions', null, { root: true })

    dispatch('app/setRoleList', null, { root: true })
    dispatch('app/setFileConfig', null, { root: true })
    await dispatch('app/setServices', null, { root: true })

    commit('SET_USER_ROLE', user.role.name)
    const myProjects = rootState.projects.options

    if (myProjects.length === 0) {
      commit('projects/SET_SELECTED_PROJECT', { id: -1 }, { root: true })
    }
    if (myProjects.length > 0) {
      const projectStorage = myProjects.find(
        (elm) => String(elm.id) === localStorage.getItem('projectId')
      )
      if (projectStorage) {
        commit('projects/SET_SELECTED_PROJECT', projectStorage, { root: true })
      } else {
        commit('projects/SET_SELECTED_PROJECT', myProjects[0], { root: true })
      }
    }

    loadRouter()
  },

  // user logout
  async logout({ commit }) {
    await logout()
      .then(() => {
        localStorage.clear()
        sessionStorage.clear()
        removeToken()
        resetRouter()
        commit('RESET_STATE')
      })
      .catch((e) => {
        console.error(e)
      })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise((resolve) => {
      removeToken() // must remove  token  first
      commit('RESET_STATE')
      resolve()
    })
  },
  setUserName({ commit }, userName) {
    commit('SET_USER_NAME', userName)
  },
  async setPinnedRoutes({ commit }, data) {
    await updatePinnedRoutes(data).then(() => {
      commit('SET_PINNED_ROUTES', data.route)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
