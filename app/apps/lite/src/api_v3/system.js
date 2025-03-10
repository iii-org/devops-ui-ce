import request from '@/utils/request'

export const getFileConfig = () => request.get(`/v3/system/configs/file_limit`)
export const getDBPolicyList = () => {}
export const checkDBPolicyPassword = () => {}
export const getServiceList = () => request.get(`/v3/system/services`)
export const getPluginList = () => request.get(`/v3/system/plugins`)

export const getSystemVersion = () => request.get(`/v3/system/version`)

export const getSystemActivities = (params) =>
  request.get(`/v3/activities`, { params })
export const getProjectActivities = (project_id, params) =>
  request.get(`/v3/projects/${project_id}/activities`, { params })

export const uploadSystemInfo = (data) =>
  request.post(`/v3/system/upload-info`, data)
