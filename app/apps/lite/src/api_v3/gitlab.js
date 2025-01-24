import request from '@shared/utils/request'

export const getRepositoryBranches = (repo_id) =>
  request.get(`/v3/gitlab/${repo_id}/branches`)

// Gitlab Template
export const getGitlabTemplateList = () => request.get(`/v3/gitlab/templates`)
export const syncGitlabTemplate = () =>
  request.post(`/v3/gitlab/templates/refresh`)
export const getTemplateDetail = (id, params) =>
  request.get(`/v3/gitlab/templates/${id}`, { params })

// Pipelines
export const getPipelines = (repo_id) =>
  request.get(`/v3/gitlab/${repo_id}/pipeline`)
export const createNewPipeline = (repo_id, data) =>
  request.post(`/v3/gitlab/${repo_id}/pipeline`, data)
export const getPipelineBranches = (repo_id, params) =>
  request.get(`/v3/gitlab/${repo_id}/pipeline/branches`, { params })
export const updatePipelineBranches = (repo_id, data) =>
  request.put(`/v3/gitlab/${repo_id}/pipeline/branches`, data)
export const generateCiYaml = (repo_id, data) =>
  request.post(`/v3/gitlab/${repo_id}/ci/regen`, data)
export const executePipeline = (repo_id, data) =>
  request.post(`/v3/gitlab/${repo_id}/pipeline/exec`, data)
export const getPipelinesJobsStatus = (repo_id, params) =>
  request.get(`/v3/gitlab/${repo_id}/jobs/status`, { params })

// Issue Hook
export const getCommitHooksByBranch = (repo_id, params) =>
  request.get(`/v3/gitlab/${repo_id}/commits/hooks`, { params })
export const getIssueCommitHookList = (params) =>
  request.get(`/v3/gitlab/issue/hooks`, { params })
export const batchCreateIssueCommitHook = (data) =>
  request.post(`/v3/gitlab/issue/hooks`, data)
export const batchUpdateIssueCommitHook = (data) =>
  request.patch(`/v3/gitlab/issue/hooks`, data)
export const batchDeleteIssueCommitHook = (data) =>
  request.delete(`/v3/gitlab/issue/hooks`, { data })
export const getIssueCommitHooksIds = (params) =>
  request.get(`/v3/gitlab/issue/hooks/ids`, { params })

export const getUserCommitList = (repo_id, params) =>
  request.get(`/v3/gitlab/${repo_id}/commits/user`, { params })

export const getGitGraph = (repo_id) =>
  request.get(`/v3/gitlab/${repo_id}/graph`)
