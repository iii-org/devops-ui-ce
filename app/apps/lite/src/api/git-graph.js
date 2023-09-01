import request from '@shared/utils/request'

export const getGitGraphByRepo = (rId) => request.get('/repositories/' + rId + '/overview')
