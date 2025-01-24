import User from '@/data/user'
import request from '@shared/utils/request'

// Current User
export const getCurrentUser = async () => {
  const res = await request.get(`/v3/users/me`)
  return new User(res.data)
}
export const updateCurrentUser = async (data) => {
  return request.patch(`/v3/users/me`, data)
}
export const updateCurrentUserPassword = async (data) => {
  return request.patch(`/v3/users/password`, data)
}

// Users
export const getUserList = async (params) => {
  const res = await request.get(`/v3/users`, { params })
  if (res.data.items) {
    res.data.items = res.data.items.map((user) => new User(user))
  } else {
    res.data = res.data.map((user) => new User(user))
  }
  return res
}
export const getUserDetails = async (userId) => {
  const res = await request.get(`/v3/users/${userId}`)
  return new User(res.data)
}
export const createUser = async (data) => {
  return request.post(`/v3/users`, data)
}
export const preCheckPassword = async (data) => {
  return request.post(`/v3/users/password/complexity`, data)
}
export const updateUser = async (userId, data) => {
  return request.patch(`/v3/users/${userId}`, data)
}
export const deleteUser = async (userId) => {
  return request.delete(`/v3/users/${userId}`)
}

// User Issues
export const getUserIssueList = async (userId, params) => {
  return request.get(`/v3/users/${userId}/issues`, { params })
}
export const getCustomIssueFilter = () => request.get(`/v3/users/issue_filter`)
export const createCustomIssueFilter = (data) =>
  request.post(`/v3/users/issue_filter`, data)
export const updateCustomIssueFilter = (filter_id, data) =>
  request.patch(`/v3/users/issue_filter/${filter_id}`, data)
export const deleteCustomIssueFilter = (filter_id) =>
  request.delete(`/v3/users/issue_filter/${filter_id}`)
export const getIssueFieldDisplay = (params) =>
  request.get(`/v3/users/field_display`, { params })
export const updateIssueFieldDisplay = (data) =>
  request.put(`/v3/users/field_display`, data)
