import request from '@/utils/request'

export const getProjectUserList = (project_id) =>
  request.get(`/v2/project/${project_id}/user/list`)
export const getProjectVersion = (project_id, params) =>
  request.get(`/v2/project/${project_id}/version/list`, { params })
export const getProjectIssueList = (project_id, params, config) =>
  request.get(`/v2/project/${project_id}/issues`, {
    params: { ...params },
    ...config
  })
export const getMyProjectSimpleList = () =>
  request.get(`/v2/project/simple/list`)
export const addProjectTags = (data) =>
  request.post(`/v2/tags`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const getTagsByProject = (project_id) =>
  request.get(`/v2/tags?project_id=${project_id}`)
export const getTagsByName = (params, config) =>
  request.get(`/v2/tags`, { params: { ...params }, ...config })
export const deleteProjectTags = (tag_id) =>
  request.delete(`/v2/tags/${tag_id}`)
export const updateProjectTags = (tag_id, data) =>
  request.put(`/v2/tags/${tag_id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const updateProjectTagsOrder = (data) =>
  request.put(`/v2/tags/order`, data)
export const getIssueByTagId = (project_id, tag_id) =>
  request.get(
    `/v2/project/${project_id}/issues?only_superproject_issues=false&status_id=open&tags=${tag_id}`
  )
export const getHasRelation = (project_id) =>
  request.get(`/v2/project/${project_id}/has_relation`)
export const getAllRelation = (project_id) =>
  request.get(`/v2/project/${project_id}/all_relation`)
export const getHasSon = (project_id) =>
  request.get(`/v2/project/${project_id}/has_son`)
export const getProjectRelation = (project_id) =>
  request.get(`/v2/project/${project_id}/relation`)

export const forceDeleteProject = (project_id) =>
  request.delete(`/v2/project/${project_id}?force_delete_project=true`)
export const syncProject = (project_id) =>
  request.patch(`/v2/sync_projects/${project_id}`)

export const getProjectPluginStatus = (project_id) =>
  request.get(`/v2/project/${project_id}/pipeline_version`)

export const getGitlabIntegrations = (repository_id) =>
  request.get(`/v2/project/${repository_id}/integrations`)
export const getSlackNotification = (repository_id) =>
  request.get(`/v2/project/${repository_id}/slack/notifications`)
export const updateSlackNotification = (repository_id, data) =>
  request.put(`/v2/project/${repository_id}/slack/notifications`, data)
export const disableSlackNotification = (repository_id) =>
  request.delete(`/v2/project/${repository_id}/slack/notifications`)

export const syncUserData = (user_id) =>
  request.patch(`/v2/user/update_base_keycloak/${user_id}`)

export const batchAddCommitRelation = (data) =>
  request.post(`/v2/issue/relation/batch`, data)

export const batchUpdateCommitRelation = (data) =>
  request.patch(`/v2/issue/relation/batch`, { data })

export const batchDeleteCommitRelation = (data) =>
  request.delete(`/v2/issue/relation/batch`, { data })
