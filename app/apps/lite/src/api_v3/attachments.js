import request from '@shared/utils/request'

// Plain Attachments
export const getPlainAttachment = (attachment_id) =>
  request.get(`/v3/attachments/${attachment_id}`)
export const createPlainAttachment = (data) =>
  request.post(`/v3/attachments`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const deletePlainAttachment = (attachment_id) =>
  request.delete(`/v3/attachments/${attachment_id}`)
export const downloadPlainAttachment = (url) =>
  request.get(url, { responseType: 'blob' })

// Project Attachments
export const getProjectAttachmentList = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/attachments`, { params })
export const getProjectAttachment = (project_id, attachment_id) =>
  request.get(`/v3/projects/${project_id}/attachments/${attachment_id}`)
export const createProjectAttachment = (project_id, data) =>
  request.post(`/v3/projects/${project_id}/attachments`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const deleteProjectAttachment = (project_id, attachment_id) =>
  request.delete(`/v3/projects/${project_id}/attachments/${attachment_id}`)

// Issue Attachments
export const getIssueAttachmentList = (issue_id) =>
  request.get(`/v3/issues/${issue_id}/attachments`)
export const getIssueAttachment = (issue_id, attachment_id) =>
  request.get(`/v3/issues/${issue_id}/attachments/${attachment_id}`)
export const createIssueAttachment = (issue_id, data) =>
  request.post(`/v3/issues/${issue_id}/attachments`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const deleteIssueAttachment = (issue_id, attachment_id) =>
  request.delete(`/v3/issues/${issue_id}/attachments/${attachment_id}`)
export const linkProjectIssueAttachment = (issue_id, attachment_id) =>
  request.post(`/v3/issues/${issue_id}/attachments/${attachment_id}`)
