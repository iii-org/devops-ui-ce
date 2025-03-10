import request from '@/utils/request'

export const getCmasReport = (task_id, file_type) =>
  request.get(`/cmas/${task_id}/${file_type}`, { responseType: 'blob' })
