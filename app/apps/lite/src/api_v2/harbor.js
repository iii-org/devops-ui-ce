import request from '@shared/utils/request'

export const getHarborRepoList = (project_id) =>
  request.get(`/v2/harbor/projects/${project_id}`)
export const getRepoArtifacts = (params) =>
  request.get(`/v2/harbor/artifacts`, { params })
