import request from '@/utils/request'

// pod
export const getPodLog = (project_id, pod_name, params, config) =>
  request.get(`/project/${project_id}/resource/pods/${pod_name}/log`, {
    params,
    ...config
  })
