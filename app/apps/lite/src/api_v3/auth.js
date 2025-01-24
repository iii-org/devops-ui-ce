import request from '@shared/utils/request'

export const login = (data) => request.post('/v3/users/auth/login', data)
export const logout = () => request.post('/v3/users/auth/logout')
