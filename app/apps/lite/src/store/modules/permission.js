import { asyncRoutes, constantRoutes } from '@/router/router'
import Layout from '@shared/layout'
import ParentBlank from '@shared/layout/components/parentBlank'
import store from '@/store'

/**
 * Check if user has permission to access the route
 * @param {Array} roles - User roles
 * @param {Object} route - Route object
 * @returns {boolean} - Whether user has permission
 */
function hasPermission(roles, route) {
  if (route?.meta?.roles) {
    return roles.some((role) => route.meta.roles.includes(role))
  }
  return true
}

/**
 * Resolve component based on component path
 * @param {string} componentPath - Path to component
 * @param {Object} componentImports - Glob of component imports
 * @returns {Promise<Object>} - Resolved component
 * @throws {Error} - If component not found
 */
async function resolveComponent(componentPath, componentImports) {
  if (componentPath === 'layout') {
    return Layout
  }

  if (componentPath === 'layout/components/parentBlank') {
    return ParentBlank
  }

  const fullPath = `/src/${componentPath}`
  const possiblePaths = [
    fullPath.includes('.vue') ? fullPath : `${fullPath}.vue`,
    `${fullPath}/index.js`,
    `${fullPath}/index.vue`
  ]

  for (const path of possiblePaths) {
    const matchedPath = Object.keys(componentImports).find((key) =>
      key.includes(path)
    )
    if (matchedPath) {
      return (await componentImports[matchedPath]()).default
    }
  }

  throw new Error(`Component not found: ${componentPath}`)
}

/**
 * Process routes and resolve components
 * @param {Array} routes - Routes to process
 * @returns {Promise<Array>} - Processed routes with resolved components
 */
export async function getAsyncRoutes(routes) {
  const res = []
  const allowedKeys = ['path', 'name', 'children', 'redirect', 'meta', 'hidden']
  const componentImports = import.meta.glob('@/views/**/*.{vue,js}')

  for (const item of routes) {
    const newItem = {}

    // Handle component resolution
    if (item.component) {
      try {
        newItem.component = await resolveComponent(
          item.component,
          componentImports
        )
      } catch (error) {
        console.error(error)
        continue // Skip this route if component can't be resolved
      }
    }

    // Copy allowed properties
    for (const key in item) {
      if (allowedKeys.includes(key)) {
        newItem[key] = item[key]
      }
    }

    // Process children recursively
    if (newItem?.children?.length) {
      newItem.children = await getAsyncRoutes(item.children)
    }

    res.push(newItem)
  }

  return res
}

/**
 * Filter routes based on user roles
 * @param {Array} routes - Routes to filter
 * @param {Array} roles - User roles
 * @returns {Array} - Filtered routes
 */
export function filterAsyncRoutes(routes, roles) {
  return routes.reduce((acc, route) => {
    const routeCopy = { ...route }

    if (hasPermission(roles, routeCopy)) {
      if (routeCopy.children) {
        routeCopy.children = filterAsyncRoutes(routeCopy.children, roles)
      }
      acc.push(routeCopy)
    }

    return acc
  }, [])
}

/**
 * Filter routes based on available services
 * @param {Array} routes - Routes to filter
 * @returns {Array} - Filtered routes
 */
export function filterAsyncPluginRoutes(routes) {
  const services = store.getters.services

  /**
   * Determine if a route should be included based on service availability
   * @param {Object} route - Route object
   * @returns {boolean} - Whether route should be included
   */
  function shouldIncludeRoute(route) {
    const routeName = route.name.toLowerCase()

    if (Object.keys(services).includes(routeName)) {
      return services[routeName]
    }

    // Special case routes
    if (route.name === 'PostmanParent') return services.postman
    if (route.name === 'GenerateDockerfileParent') {
      return services['ai-dockerfile']
    }

    // Gitlab dependent routes
    const gitlabDependentRoutes = ['Scan', 'GitGraph', 'DevBranch', 'Pipeline']
    if (gitlabDependentRoutes.includes(route.name)) {
      return services.gitlab
    }

    return true
  }

  /**
   * Filter routes recursively
   * @param {Array} routesToFilter - Routes to filter
   * @returns {Array} - Filtered routes
   */
  function filterRoutesRecursively(routesToFilter) {
    return routesToFilter.filter((route) => {
      if (!shouldIncludeRoute(route)) {
        return false
      }

      if (route.children?.length) {
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
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  /**
   * Generate routes based on user roles
   * @param {Object} context - Vuex context
   * @param {string} roles - User role
   * @returns {Promise<Array>} - Generated routes
   */
  async generateRoutes({ commit }, roles) {
    const result = asyncRoutes(roles)
    const routes = await getAsyncRoutes(result)

    return new Promise(async (resolve) => {
      let accessedRoutes = filterAsyncRoutes(routes, [roles])
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
