import request from '@/utils/request'

export const getServerStatus = (server) =>
  request.get(`/v2/monitoring/${server}/alive`)
export const getMessageList = (params) =>
  request.get(`/v2/notification_message_list`, { params })
export const getMessageListAdmin = (params) =>
  request.get(`/v2/notification_message_list/admin`, { params })
export const createMessage = (params) =>
  request.post(`/v2/notification_message`, params)
