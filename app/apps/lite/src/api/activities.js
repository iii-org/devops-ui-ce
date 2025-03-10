import request from '@/utils/request'

export const getProjectActivities = (pId, params) =>
  request.get(`/project/${pId}/activities`, { params })
