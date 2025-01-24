const getters = {
  sidebar: (state) => state.app.sidebar,
  language: (state) => state.app.language,
  device: (state) => state.app.device,
  roleList: (state) => state.app.roleList,
  fileSizeLimit: (state) => state.app.fileSize,
  fileTypeLimit: (state) => state.app.fileType,
  allowedFileType: (state) => state.app.fileTypeList,
  services: (state) => state.app.services,
  token: (state) => state.user.token,
  userId: (state) => state.user.userId,
  userName: (state) => state.user.userName,
  userAvatar: (state) => state.user.userAvatar,
  userRole: (state) => state.user.userRole,
  userOrgId: (state) => state.user.userOrgId,
  pinnedRoutes: (state) => state.user.pinnedRoutes,
  // isExcalidrawEnable: (state) => state.permission.isExcalidrawEnable,
  permission_routes: (state) => state.permission.routes,
  projectOptions: (state) => state.projects.options,
  projectList: (state) => state.projects.list,
  projectListTotal: (state) => state.projects.total,
  branchesByProject: (state) => state.branches.list,
  branchesTotalNumByProject: (state) => state.branches.total,
  defaultBranch: (state) => state.branches.defaultBranch,
  fileListByBranch: (state) => state.fileList.list,
  fileListTotalByBranch: (state) => state.fileList.total,
  commitListByBranch: (state) => state.commitList.list,
  commitListTotalByBranch: (state) => state.commitList.total,
  selectedProjectId: (state) => state.projects.selectedProject.id,
  selectedProject: (state) => state.projects.selectedProject,
  completeSelectedProject: (state) => state.projects.completeSelectedProject,
  enableForceTracker: (state) => state.projects.enableForceTracker,
  forceTracker: (state) => state.projects.forceTracker,
  strictTracker: (state) => state.projects.strictTracker,
  tracker: (state) => state.projects.tracker,
  status: (state) => state.projects.status,
  priority: (state) => state.projects.priority,
  issueFilter: (state) => state.projects.issueFilter,
  groupBy: (state) => state.projects.groupBy,
  displayClosed: (state) => state.projects.displayClosed,
  keyword: (state) => state.projects.keyword,
  listQuery: (state) => state.projects.listQuery,
  pageInfo: (state) => state.projects.pageInfo,
  fixedVersionShowClosed: (state) => state.projects.fixedVersionShowClosed,
  test_filename: (state) => state.qa.test_filename,
  hasSystemUpdate: (state) => state.settings.hasSystemUpdate,
  updateVersionName: (state) => state.settings.updateVersionName,
  serverStatus: (state) => state.monitoring.serverStatus,
  tableExpand: (state) => state.project.tableExpand
}
export default getters
