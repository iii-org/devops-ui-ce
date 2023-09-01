import { constantRoutes } from '@/router/router'
import { getRoutes, getRouter } from '@/api/user'
import Layout from '@shared/layout'
import ParentBlank from '@shared/layout/components/parentBlank'

function hasPermission(roles, route) {
  if (route?.meta?.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

export function getAsyncRoutes(routes) {
  const res = []
  const keys = ['path', 'name', 'children', 'redirect', 'meta', 'hidden']
  routes.forEach((item) => {
    const newItem = {}
    if (item.component) {
      if (item.component === 'layout') {
        newItem.component = Layout
      } else if (item.component === 'layout/components/parentBlank') {
        newItem.component = ParentBlank
      } else {
        // comment this condition if you want to separate issue board and issue list
        if (item.component === 'views/Project/IssueBoards') {
          item.component = 'views/Project/List'
        }

        newItem.component = (resolve) => require([`@/${item.component}`], resolve)
      }
    }
    for (const key in item) {
      if (keys.includes(key)) {
        newItem[key] = item[key]
      }
    }
    if (newItem?.children?.length) {
      newItem.children = getAsyncRoutes(item.children)
    }
    res.push(newItem)
  })
  return res
}

export function filterAsyncRoutes(routes, roles) {
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })
  return res
}

export function filterAsyncPluginRoutes(accessedRoutes, disabledPluginRoutes) {
  const result = accessedRoutes.map(item => item)
  const idx = result.map((item, index) => {
    if (item.name === 'Scan' || item.name === 'Works') return index
  }).filter(item => item)

  for (const id of idx) {
    result[id].children = result[id].children.filter(item => {
      return !disabledPluginRoutes.includes(item.name.toLowerCase())
    })
    if (result[id].children.length === 0) result.splice(id, 1)
  }
  return result
}

const state = {
  isExcalidrawEnable: false,
  addRoutes: [],
  routes: []
}

const mutations = {
  SET_EXCALIDRAW_STATUS: (states, status) => {
    states.isExcalidrawEnable = status
  },
  SET_ROUTES: (states, routes) => {
    states.addRoutes = routes
    states.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  async generateRoutes({ commit }, roles) {
    commit('SET_EXCALIDRAW_STATUS', false)
    const disabledPluginRoutes = (await getRoutes()).data.map(route => {
      if (route.name === 'excalidraw') commit('SET_EXCALIDRAW_STATUS', !route.disabled)
      if (route.disabled) return route.name
    })
    // views Plugin
    // const result = asyncRoutes(roles)
    const result = (await getRouter()).data
    const routes = getAsyncRoutes(result)
    let accessedRoutes
    return new Promise(async resolve => {
      if (roles.includes('admin')) {
        accessedRoutes = routes || []
      } else {
        accessedRoutes = filterAsyncRoutes(routes, [roles])
        accessedRoutes = filterAsyncPluginRoutes(accessedRoutes, disabledPluginRoutes)
      }
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
