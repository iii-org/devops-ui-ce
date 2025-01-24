import { asyncRoutes, constantRoutes } from '@/router/router'
import Layout from '@shared/layout'
import ParentBlank from '@shared/layout/components/parentBlank'
import store from '@/store'

function hasPermission(roles, route) {
  if (route?.meta?.roles) {
    return roles.some((role) => route.meta.roles.includes(role))
  } else {
    return true
  }
}

export async function getAsyncRoutes(routes) {
  const res = []
  const keys = ['path', 'name', 'children', 'redirect', 'meta', 'hidden']
  const componentImports = import.meta.glob('@/views/**/*.{vue,js}')

  for (const item of routes) {
    const newItem = {}
    if (item.component) {
      if (item.component === 'layout') {
        newItem.component = Layout
      } else if (item.component === 'layout/components/parentBlank') {
        newItem.component = ParentBlank
      } else {
        const componentPath = `/src/${item.component}`
        let componentPath2 = componentPath.includes('.vue')
          ? componentPath
          : componentPath + '.vue'
        componentPath2 = Object.keys(componentImports).filter((key) =>
          key.includes(componentPath2)
        )[0]
        if (!componentPath2) {
          componentPath2 = componentPath + '/index.js'
          componentPath2 = Object.keys(componentImports).filter((key) =>
            key.includes(componentPath2)
          )[0]
          if (!componentPath2) {
            componentPath2 = componentPath + '/index.vue'
            componentPath2 = Object.keys(componentImports).filter((key) =>
              key.includes(componentPath2)
            )[0]
          }
        }
        if (componentPath2) {
          newItem.component = (await componentImports[componentPath2]()).default
        } else {
          throw new Error('Component not found: ' + componentPath)
        }
      }
    }
    for (const key in item) {
      if (keys.includes(key)) {
        newItem[key] = item[key]
      }
    }
    if (newItem?.children?.length) {
      newItem.children = await getAsyncRoutes(item.children)
    }
    res.push(newItem)
  }
  return res
}

export function filterAsyncRoutes(routes, roles) {
  const res = []
  routes.forEach((route) => {
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

export function filterAsyncPluginRoutes(routes) {
  const services = store.getters.services

  function shouldIncludeRoute(item) {
    if (Object.keys(services).includes(item.name.toLowerCase())) {
      return services[item.name.toLowerCase()]
    } else if (item.name === 'PostmanParent') return services.postman
    else if (
      item.name === 'Scan' ||
      item.name === 'GitGraph' ||
      item.name === 'DevBranch' ||
      item.name === 'Pipeline'
    ) {
      return services.gitlab
    }
    return true
  }

  function filterRoutesRecursively(routes) {
    return routes.filter((route) => {
      const include = shouldIncludeRoute(route)

      if (!include) {
        return false
      }

      if (route.children && route.children.length > 0) {
        route.children = filterRoutesRecursively(route.children)
      }

      return true
    })
  }

  return filterRoutesRecursively(routes)
}

const state = {
  isExcalidrawEnable: false,
  addRoutes: [],
  routes: []
}

const mutations = {
  SET_ROUTES: (states, routes) => {
    states.addRoutes = routes
    states.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  async generateRoutes({ commit }, roles) {
    // commit('SET_EXCALIDRAW_STATUS', false)
    // const disabledPluginRoutes = (await getRoutes()).data.map((route) => {
    //   if (route.name === 'excalidraw') commit('SET_EXCALIDRAW_STATUS', !route.disabled)
    //   if (route.disabled) return route.name
    // })
    // views Plugin
    const result = asyncRoutes(roles) // Constant Router
    // const result = (await getRouter()).data // Dynamic Router
    const routes = await getAsyncRoutes(result)
    let accessedRoutes
    return new Promise(async (resolve) => {
      // if (roles.includes('admin')) {
      //   accessedRoutes = routes || []
      // } else {
      //   accessedRoutes = filterAsyncRoutes(routes, [roles])
      //   accessedRoutes = filterAsyncPluginRoutes(accessedRoutes)
      // }
      accessedRoutes = filterAsyncRoutes(routes, [roles])
      accessedRoutes = filterAsyncPluginRoutes(accessedRoutes)
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
