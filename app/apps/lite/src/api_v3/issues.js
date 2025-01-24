import request from '@shared/utils/request'

// Issue Manager
export const getIssueStatus = () => request.get(`/v3/issue-manager/status`)
export const getIssueTracker = () => request.get(`/v3/issue-manager/trackers`)
export const getIssuePriority = () => request.get(`/v3/issue-manager/priority`)

// Issue
export const getIssueDetails = (issue_id) =>
  request.get(`/v3/issues/${issue_id}`)
export const updateIssue = (issue_id, data) => {
  const keys = ['parent_id', 'version_id', 'assigned_id']
  keys.forEach((key) => {
    if (data[key] === '' || data[key] === null) {
      data[key] = 'null'
    }
  })
  return request.patch(`/v3/issues/${issue_id}`, data)
}
export const deleteIssue = (issue_id, params) =>
  request.delete(`/v3/issues/${issue_id}`, { params })

// Issue Watcher
export const addIssueWatcher = (issue_id) =>
  request.post(`/v3/issues/${issue_id}/watcher`, null)
export const removeIssueWatcher = (issue_id) =>
  request.delete(`/v3/issues/${issue_id}/watcher`)

// Time Entries
export const getTimeEntryActivities = () =>
  request.get(`/v3/issue-manager/time-entry/activities`)
export const getIssueTimeEntries = (issue_id) =>
  request.get(`/v3/issue/${issue_id}/time-entry`)
export const createTimeEntry = (issue_id, data) =>
  request.post(`/v3/issue/${issue_id}/time-entry`, data)
export const updateTimeEntry = (time_entry_id, data) =>
  request.put(`/v3/issue/time-entry/${time_entry_id}`, data)
export const deleteTimeEntry = (time_entry_id) =>
  request.delete(`/v3/issue/time-entry/${time_entry_id}`)

// Issue Relation
export const updateIssueRelation = (issue_id, data) =>
  request.put(`/v3/issues/${issue_id}/relation`, data)
export const deleteIssueRelation = (relation_id) =>
  request.delete(`/v3/issues/relation/${relation_id}`)
export const getIssueFamily = (issue_id, params) =>
  request.get(`/v3/issues/${issue_id}/family`, { params })

export const closeAllIssuesByIds = (issue_ids) =>
  request.delete(`/v3/issues/close_all`, { data: issue_ids })

export const checkIssueClosable = (issue_id) =>
  request.get(`/v3/issue/${issue_id}/check_closable`)
