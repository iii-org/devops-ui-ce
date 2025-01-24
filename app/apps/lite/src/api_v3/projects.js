import request from '@shared/utils/request'
import Project from '@/data/project'

export const getMyProjects = async (params) => {
  if (!params) params = {}
  const res = await request.get('/v3/projects', { params })
  const ret = []
  if (Object.prototype.hasOwnProperty.call(res.data, 'pagination')) {
    for (const project of res.data.items) {
      ret.push(new Project(project))
    }
    return {
      projects: ret,
      page: res.data.pagination
    }
  } else {
    for (const project of res.data) {
      ret.push(new Project(project))
    }
    return { data: ret }
  }
}
export const getProjectChildren = async (project_id, params) => {
  const res = await request.get(`/v3/projects/${project_id}/children`, {
    params
  })
  return { data: res.data.map((project) => new Project(project)) }
}
export const createProject = (data) => request.post('/v3/projects', data)
export const updateProject = (project_id, data) =>
  request.patch(`/v3/projects/${project_id}`, data)
export const deleteProject = (project_id, params) =>
  request.delete(`/v3/projects/${project_id}`, { params })
export const getProjectDetails = (project_id) =>
  request.get(`/v3/projects/${project_id}`)

// Project Selector
export const getProjectSelectorList = () =>
  request.get(`/v3/project-manager/selector`)

// Project Issues
export const getProjectIssueList = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/issues`, { params })
export const createProjectIssue = (project_id, data) =>
  request.post(`/v3/projects/${project_id}/issues`, data)
export const getProjectIssueChildren = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/issues/children`, { params })

// Project Versions
export const getProjectVersion = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/versions`, { params })
export const createProjectVersion = (project_id, data) =>
  request.post(`/v3/projects/${project_id}/versions`, data)
export const updateProjectVersion = (version_id, data) =>
  request.patch(`/v3/projects/versions/${version_id}`, data)
export const deleteProjectVersion = (version_id) =>
  request.delete(`/v3/projects/versions/${version_id}`)

// Project Star
export const postStarProject = (project_id) =>
  request.post(`/v3/projects/${project_id}/star`)
export const deleteStarProject = (project_id) =>
  request.delete(`/v3/projects/${project_id}/star`)

// Tags
export const getTagList = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/tags`, { params })
export const createTag = (project_id, data) =>
  request.post(`/v3/projects/${project_id}/tags`, data)
export const updateTagOrder = (project_id, data) =>
  request.patch(`/v3/projects/${project_id}/tags/order`, data)
export const getTag = (tag_id) => request.get(`/v3/projects/tags/${tag_id}`)
export const updateTag = (tag_id, data) =>
  request.patch(`/v3/projects/tags/${tag_id}`, data)
export const deleteTag = (tag_id, params) =>
  request.delete(`/v3/projects/tags/${tag_id}`, { params })

// Project Member
export const getProjectUserList = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/users`, { params })
export const addProjectMember = (project_id, data) =>
  request.post(`/v3/projects/${project_id}/member`, data)
export const removeProjectMember = (project_id, user_id) =>
  request.delete(`/v3/projects/${project_id}/member/${user_id}`)

// Project Relation
export const getProjectRelation = (project_id) =>
  request.get(`/v3/projects/${project_id}/relation`)
export const getHasProjectRelation = (project_id) =>
  request.get(`/v3/projects/${project_id}/has_relation`)
export const getRootProjectId = (project_id) =>
  request.get(`/v3/projects/${project_id}/root_project`)
export const getProjectAllRelation = (project_id) =>
  request.get(`/v3/projects/${project_id}/all_relation`)

// Project Download
export const getExportFileInfo = (project_id) =>
  request.get(`/v3/projects/${project_id}/download/is_exist`)
export const getIssueListDownloadStatus = (project_id) =>
  request.get(`/v3/projects/${project_id}/locked`)
export const runIssueListDownload = (project_id, data) =>
  request.post(`/v3/projects/${project_id}/download/compile`, data)
export const getIssueListExportedFile = (project_id) =>
  request.get(`/v3/projects/${project_id}/download`, { responseType: 'blob' })

// Project Release
export const getProjectReleaseList = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/releases`, { params })
export const createProjectRelease = (project_id, data) =>
  request.post(`/v3/projects/${project_id}/releases`, data)
export const getProjectImageList = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/releases/image_list`, { params })

// Project Overview
export const getTrackingOverview = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/overview/tracking`, { params })
export const getWorkloadOverview = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/overview/workload`, { params })
export const getProjectTestResultOverview = (project_id) =>
  request.get(`/v3/projects/${project_id}/overview/plugins`)
export const getProjectTestResult = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/summary`, { params })
