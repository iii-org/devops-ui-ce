import request from '@/utils/request'

export const generateDockerfile = (project_id, data) =>
  request.post(`/v3/ai/dockerfile/${project_id}/start`, data)
export const cancelGenerateDockerfile = (task_id) =>
  request.post(`/v3/ai/dockerfile/${task_id}/cancel`)
export const regerateDockerfile = (task_id, data) =>
  request.post(`/v3/ai/dockerfile/${task_id}/regenerate`, data)
export const getGenerateDockerfileStatus = (task_id) =>
  request.get(`/v3/ai/dockerfile/${task_id}/status`)
export const saveDockerfile = (project_id, data) =>
  request.post(`/v3/ai/dockerfile/${project_id}/save`, data)
export const getGenerateDockerfileHistory = (project_id) =>
  request.get(`/v3/ai/dockerfile/${project_id}/history`)
