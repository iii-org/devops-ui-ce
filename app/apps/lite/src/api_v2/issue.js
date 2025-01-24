import request from '@shared/utils/request'

export const getIssue = (issue_id) => request.get(`/v2/issues/${issue_id}`)
export const getIssueStrictTracker = (params) => request.get(`/v2/issues_tracker`, { params })
export const getIssueForceTracker = (project_id) => request.get(`/v2/project/${project_id}/force_trackers`)
export const createIssueForceTracker = (project_id) => request.post(`/v2/project/${project_id}/force_trackers`)
export const updateIssueForceTracker = (project_id, params) =>
  request.patch(`/v2/project/${project_id}/force_trackers`, params)
export const deleteIssueForceTracker = (project_id) => request.delete(`/v2/project/${project_id}/force_trackers`)
export const addWatcher = (issue_id, params) => request.post(`/v2/${issue_id}/watchers`, null, { params })
export const removeWatcher = (issue_id, user_id) => request.delete(`/v2/${issue_id}/watchers/${user_id}`)
export const getActivityList = () => null
