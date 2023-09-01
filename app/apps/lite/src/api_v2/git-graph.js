import request from '@shared/utils/request'

export const getGitGraphByRepo = (repository_id) => request.get(`/v2/repositories/${repository_id}/overview`)
