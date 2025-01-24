import Vue from 'vue'
import SvgIcon from '@shared/components/SvgIcon'

// register globally
Vue.component('SvgIcon', SvgIcon)

const svgImports = import.meta.glob('./svg/*.svg', { eager: false })

const requireAll = async (importFunctions) => {
  const modules = []
  for (const path in importFunctions) {
    const module = await importFunctions[path]()
    modules.push(module)
  }
  return modules
}
requireAll(svgImports)
