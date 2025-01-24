import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store'
import pmRoute from './pm.json'
import adRoute from './ad.json'
import ooRoute from './oo.json'

Vue.use(Router)

/**
 * @summary route naming rules
 * 1. Upper Camel case if component and name, ex. UpperCamelCase
 * 2. Lower Camel case if other conditions ex. lowerCamelCase
 */

export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/components/Login'),
    hidden: true
  },

  {
    path: '/404',
    component: () => import('@shared/components/404'),
    name: '404',
    hidden: true
  }
]

export const asyncRoutes = (role) => {
  if (role === 'sysadmin') return adRoute
  else if (role === 'Organization Owner') return ooRoute
  else if (role === 'Project Manager') return pmRoute
}

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
  resetRouter()
  const accessRoutes = await store.dispatch(
    'permission/generateRoutes',
    store.getters.userRole
  )
  router.addRoutes(accessRoutes)
}

export default router
