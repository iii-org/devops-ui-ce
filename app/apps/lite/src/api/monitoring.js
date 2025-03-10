import request from '@/utils/request'

export const getSystemServerStatus = () => request.get(`/monitoring/alive`)
export const getHarborUsage = () => request.get(`/monitoring/harbor/usage`)
export const getMessageList = (params) =>
  request.get(`/notification_message_list`, { params })
export const getMessageListAdmin = (params) =>
  request.get(`/notification_message_list/admin`, { params })
