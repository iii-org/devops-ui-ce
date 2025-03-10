import request from '@/utils/request'

export const getUserWatchList = (userId, params, config) =>
  request.get(`/v2/user/${userId}/issues/watch/list`, { params, ...config })
export const getUserMessageInfo = (user_id) =>
  request.get(`/v2/user/message_type/${user_id}`)
export const getServerPasswordInfo = (user_id) =>
  request.get(`/v2/user/${user_id}/newpasswordinfo`)
