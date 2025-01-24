import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'

Vue.use(Vuex)

const moduleFiles = import.meta.glob('./modules/*.js', { eager: true })

const modules = Object.keys(moduleFiles).reduce((acc, path) => {
  const moduleName = path.match(/\.\/modules\/(.*)\.js$/)[1]
  const moduleConfig = moduleFiles[path].default
  acc[moduleName] = moduleConfig
  return acc
}, {})

export default new Vuex.Store({ modules, getters })
