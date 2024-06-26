import request from '@shared/utils/request'
import User from '@/data/user'

export const login = (data) => request.post('/user/login', data)
export const logout = () => request.post(`/user/logout`)
export const addUser = (data) => request.post(`/user`, data)
export const updateUser = (userId, data) => request.put(`/user/${userId}`, data)
export const deleteUser = (userId) => request.delete(`/user/${userId}`)
export const getK8SConfig = (userId) => request.get(`/user/${userId}/config`)
export const getRoleList = () => request.get('/user/role/list')
export const getUserIssueList = (userId, params, config) => request.get(`/user/${userId}/issues`, { params, ...config })
export const getUserWatchList = (userId, params, config) => request.get(`/user/${userId}/issues/watch/list`, { params, ...config })
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
export const getAllUser = async () => {
  const res = await request.post(`/user/list`)
  const userList = []
  for (const user of res.data.user_list) {
    userList.push({ id: user.id, name: user.name, login: user.login })
  }
  return userList
}
export const getUserListByFilter = (data) => request.post('/user/list', data)
export const downloadUserList = (data) => request.post('/user/list', data, { responseType: 'blob' })

export const getRouter = () => request.get(`/ui_router`)
