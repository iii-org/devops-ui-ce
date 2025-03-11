import request from '@/utils/request'

// sysadmin or org owner
export const createNewNotification = (data) =>
  request.post(`/v3/notifications`, data)
export const updateNotification = (notification_id, data) =>
  request.put(`/v3/notifications/${notification_id}`, data)
export const deleteNotification = (notification_id) =>
  request.delete(`/v3/notifications/${notification_id}`)
export const getCreatedNotificationList = (params) =>
  request.get(`/v3/notifications/created`, { params })

// general user
export const getNotifications = (params) =>
  request.get(`/v3/user/notifications`, { params })
export const readNotification = (notification_id) =>
  request.put(`/v3/user/notifications/${notification_id}/read`)
export const readAllNotifications = () =>
  request.put(`/v3/user/notifications/read_all`)
export const deleteNotificationByUser = (notification_id) =>
  request.delete(`/v3/user/notifications/${notification_id}`)

// notification channel
// user
export const getUserNotificationChannelList = () =>
  request.get(`/v3/user/notifications/channels`)
export const createUserNotificationChannel = (data) =>
  request.post(`/v3/user/notifications/channels`, data)
export const getUserNotificationChannel = (channel_id) =>
  request.get(`/v3/user/notifications/channels/${channel_id}`)
export const updateUserNotificationChannel = (channel_id, data) =>
  request.patch(`/v3/user/notifications/channels/${channel_id}`, data)
export const deleteUserNotificationChannel = (channel_id) =>
  request.delete(`/v3/user/notifications/channels/${channel_id}`)

// project
export const getProjectNotificationChannelList = () =>
  request.get(`/v3/project/notifications/channels`)
export const createProjectNotificationChannel = (data) =>
  request.post(`/v3/project/notifications/channels`, data)
export const getProjectNotificationChannel = (channel_id) =>
  request.get(`/v3/project/notifications/channels/${channel_id}`)
export const updateProjectNotificationChannel = (channel_id, data) =>
  request.patch(`/v3/project/notifications/channels/${channel_id}`, data)
export const deleteProjectNotificationChannel = (channel_id) =>
  request.delete(`/v3/project/notifications/channels/${channel_id}`)
