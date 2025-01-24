import request from '@shared/utils/request'

export const getProjectActivities = (pId, params) =>
  request.get(`/project/${pId}/activities`, { params })
