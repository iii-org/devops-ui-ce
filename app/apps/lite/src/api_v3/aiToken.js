import request from '@/utils/request'

export const getListUserTokens = () => request.get(`/v3/ai/tokens`)
export const createAiToken = (data) => request.post(`/v3/ai/tokens`, data)
export const updateAiToken = (token_id, data) =>
  request.patch(`/v3/ai/tokens/${token_id}`, data)
export const deleteAiToken = (token_id) =>
  request.delete(`/v3/ai/tokens/${token_id}`)
export const getAiTokenProjects = (token_id) =>
  request.get(`/v3/ai/tokens/${token_id}/projects`)

// Project Tokens
export const getProjectTokens = (project_id) =>
  request.get(`/v3/ai/token-management/project/${project_id}`)
export const createProjectToken = (token_id, project_id, data) =>
  request.post(`/v3/ai/token-management/${token_id}/bind/${project_id}`, data)
export const deleteProjectToken = (token_id, project_id) =>
  request.delete(`/v3/ai/token-management/${token_id}/unbind/${project_id}`)
export const enableProjectToken = (token_id, data) =>
  request.patch(`/v3/ai/token-management/${token_id}/enable`, data)
