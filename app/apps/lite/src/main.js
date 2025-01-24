import Vue from 'vue'
import '@/assets/tailwind.css'
import 'normalize.css/normalize.css'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import 'remixicon/fonts/remixicon.css'
import i18n, { getLanguage } from './lang'
import VueGtag from 'vue-gtag'
import '@/styles/theme/index.scss'
import permission from '@/directive/permission/index.js'
import 'virtual:svg-icons-register'

import App from './App'
import store from './store'
import router from './router/router'

import '@/icons'
import '@/permission'
import '@iiidevops/shared'

import * as filters from './filters'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-tw'
import Vue2TouchEvents from 'vue2-touch-events'
import { CSV, EXCEL } from '@shared/utils/downloadCsvOrExcel'
import { PDF } from '@shared/utils/downloadPdf'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(duration)

dayjs.locale(getLanguage().toLowerCase())
document.documentElement.setAttribute('lang', getLanguage())
Vue.prototype.$dayjs = dayjs

Vue.use(CSV)
Vue.use(EXCEL)
Vue.use(PDF)

Vue.use(permission)
Vue.use(ElementUI, { i18n: (key, value) => i18n.t(key, value) })
Vue.use(VueGtag, {
  config: { id: import.meta.env.VITE_APP_GTM_TAG }
})
Vue.use(Vue2TouchEvents)

// Vue Filters
// check https://v2.vuejs.org/v2/guide/filters.html to see more details
Object.keys(filters).forEach((key) => {
  Vue.filter(key, filters[key])
})

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: (h) => h(App)
})
