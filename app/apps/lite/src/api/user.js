import request from '@shared/utils/request'
import User from '@/data/user'

export const login = (data) => request.post('/user/login', data)
export const addUser = (data) => request.post(`/user`, data)
export const updateUser = (userId, data) => request.put(`/user/${userId}`, data)
export const deleteUser = (userId) => request.delete(`/user/${userId}`)
export const getRoleList = () => request.get('/user/role/list')
export const getUserIssueList = (userId, params, config) =>
  request.get(`/user/${userId}/issues`, { params, ...config })
export const getRoutes = () => request.get(`/router`)
export const getUserInfo = async (userId) => {
  const res = await request.get(`/user/${userId}`)
  return new User(res.data)
}
export const getUser = async (data) => {
  const res = await request.post(`/user/list`, data)
  const userList = []
  for (const user of res.data.user_list) {
    userList.push(new User(user))
  }
  return {
    page: res.data.page,
    user_list: userList
  }
}
export const getUserListByFilter = (data) => request.post('/user/list', data)
export const downloadUserList = (data) =>
  request.post('/user/list', data, { responseType: 'blob' })

// export const getRouter = () => request.get(`/ui_router`)
export const getPinnedRoutes = (userId) =>
  request.get(`/user/user_route?user_id=${userId}`)
export const updatePinnedRoutes = (data) =>
  request.post(`/user/user_route`, data)
