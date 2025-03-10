import Cookies from 'js-cookie'
import { getLanguage } from '@/lang'
import { getRole } from '@/api_v3/permission'
import {
  getUploadFileSize,
  getUploadFileType,
  getUploadFileTypeList,
  updateUploadFileSize
} from '@/api_v2/systemParameter'
import { getFileConfig, getPluginList, getServiceList } from '@/api_v3/system'

const defaultServices = {
  //services
  gitlab: false,
  redmine: false,
  harbor: false,
  redis: false
}
const defaultTestingTools = {
  semgrep: false,
  sonarqube: false,
  'ai-dockerfile': false
}

const state = {
  sidebar: {
    opened: Cookies.get('sidebarStatus')
      ? !!+Cookies.get('sidebarStatus')
      : true,
    withoutAnimation: false
  },
  device: 'desktop',
  language: getLanguage(),
  roleList: [],
  fileSize: '',
  fileType: '',
  fileTypeList: '',
  services: []
}

const mutations = {
  TOGGLE_SIDEBAR: (state) => {
    state.sidebar.opened = !state.sidebar.opened
    state.sidebar.withoutAnimation = false
    if (state.sidebar.opened) {
      Cookies.set('sidebarStatus', 1)
    } else {
      Cookies.set('sidebarStatus', 0)
    }
  },
  CLOSE_SIDEBAR: (state, withoutAnimation) => {
    Cookies.set('sidebarStatus', 0)
    state.sidebar.opened = false
    state.sidebar.withoutAnimation = withoutAnimation
  },
  TOGGLE_DEVICE: (state, device) => {
    state.device = device
  },
  SET_LANGUAGE: (state, language) => {
    state.language = language
    Cookies.set('language', language)
  },
  SET_ROLE_LIST: (state, roleList) => {
    state.roleList = roleList
  },
  SET_FILE_SIZE: (state, fileSize) => {
    state.fileSize = fileSize
  },
  SET_FILE_TYPE: (state, fileType) => {
    state.fileType = fileType
  },
  SET_FILE_TYPE_LIST: (state, fileTypeList) => {
    state.fileTypeList = fileTypeList
  },
  SET_SERVICES: (state, services) => {
    state.services = services
  }
}

const actions = {
  toggleSideBar({ commit }) {
    commit('TOGGLE_SIDEBAR')
  },
  closeSideBar({ commit }, { withoutAnimation }) {
    commit('CLOSE_SIDEBAR', withoutAnimation)
  },
  toggleDevice({ commit }, device) {
    commit('TOGGLE_DEVICE', device)
  },
  setLanguage({ commit }, language) {
    commit('SET_LANGUAGE', language)
  },
  async setRoleList({ commit }) {
    const result = await getRole()
      .then((res) => {
        return Promise.resolve(res.data)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
    commit('SET_ROLE_LIST', result)
  },
  async setFileConfig({ commit }) {
    await getFileConfig()
      .then((res) => {
        commit('SET_FILE_SIZE', res.data.size + 'MB')
        commit('SET_FILE_TYPE', res.data.names)
        commit(
          'SET_FILE_TYPE_LIST',
          Object.assign(
            {},
            ...res.data.file_types.map((item) => ({
              [item['MIME']]: item['extension']
            }))
          )
        )
      })
      .catch((e) => {
        console.error(e.toString())
      })
  },
  async setFileSize({ commit }) {
    const result = await getUploadFileSize()
      .then((res) => {
        return Promise.resolve(res.upload_file_size)
      })
      .catch((e) => {
        return Promise.reject(e)
      })
    commit('SET_FILE_SIZE', result + 'MB')
  },
  async updateFileSize({ commit }, data) {
    await updateUploadFileSize(data)
      .then(() => {
        commit('SET_FILE_SIZE', data.upload_file_size + 'MB')
      })
      .catch((error) => {
        console.error(error.toString())
      })
  },
  async setFileType({ commit }) {
    const result = await getUploadFileType()
      .then((res) => {
        return Promise.resolve(
          res.data.filter((item) => item !== '').toString()
        )
      })
      .catch((e) => {
        return Promise.reject(e)
      })
    commit('SET_FILE_TYPE', result)
  },
  async setFileTypeList({ commit }) {
    const result = await getUploadFileTypeList()
      .then((res) => {
        return Promise.resolve(
          Object.assign(
            {},
            ...res.data.upload_file_types.map((item) => ({
              [item['MIME']]: item['extension']
            }))
          )
        )
      })
      .catch((e) => {
        return Promise.reject(e)
      })
    commit('SET_FILE_TYPE_LIST', result)
  },
  async setServices({ commit, dispatch }) {
    try {
      const [pluginResponse, serviceResponse] = await Promise.allSettled([
        getPluginList(),
        getServiceList()
      ])

      const services = pluginResponse.value?.data || []
      const plugins = serviceResponse.value?.data || []
      const allServices = [...services, ...plugins]
      const servicesList = { ...defaultServices, ...defaultTestingTools }

      allServices.forEach((item) => {
        servicesList[item.name] = item?.enabled || false
      })

      if (!servicesList.gitlab) {
        Object.keys(defaultTestingTools).forEach((key) => {
          servicesList[key] = false
        })
      }
      
      commit('SET_SERVICES', servicesList)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
