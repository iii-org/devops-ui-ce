import request from '@shared/utils/request'

export const getCmasReport = (task_id, file_type) =>
  request.get(`/cmas/${task_id}/${file_type}`, { responseType: 'blob' })
