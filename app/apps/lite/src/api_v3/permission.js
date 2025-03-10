import request from '@/utils/request'

export const getRole = () => request.get('/v3/permission/roles')
export const createRole = () => request.post('/v3/permission/roles')
