const title = import.meta.env.VITE_APP_SER_TITLE
export default {
  title: title && String(title) !== '' ? title : 'III DevSecOps Community',
  type: import.meta.env.VITE_APP_PROJECT || 'FULL',
  fixedHeader: false,
  sidebarLogo: true
}
