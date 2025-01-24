import request from '@shared/utils/request'

export const getPipelines = (repository_id, params, config) =>
  request.get(`/pipelines/${repository_id}/pipelines_exec`, {
    params,
    ...config
  })
export const changePipelineByAction = (repository_id, data) =>
  request.post(`/pipelines/${repository_id}/pipelines_exec/action`, data)
export const getPipelinesConfig = (rId, params) =>
  request.get(`/pipelines/${rId}/config`, { params })
