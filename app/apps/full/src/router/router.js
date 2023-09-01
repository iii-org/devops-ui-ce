import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store'
import Login from '@/components/Login'
import Page404 from '@/components/404'

Vue.use(Router)

/**
 * @summary route naming rules
 * 1. Upper Camel case if component and name, ex. UpperCamelCase
 * 2. Lower Camel case if other conditions ex. lowerCamelCase
 */
export const constantRoutes = [
  {
    path: '/login',
    component: Login,
    hidden: true
  },
  {
    path: '/404',
    component: Page404,
    name: '404',
    hidden: true
  }
]

const createRouter = () =>
  new Router({
    // mode: 'history',
    scrollBehavior: () => ({ y: 0 }),
    routes: constantRoutes
  })

const router = createRouter()

export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher
}

export async function loadRouter() {
  const accessRoutes = await store.dispatch('permission/generateRoutes', store.getters.userRole)
  router.addRoutes(accessRoutes)
}

export function reloadRouter() {
  resetRouter()
  loadRouter()
}

export default router
