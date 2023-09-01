import request from '@shared/utils/request'

export const getBranchesByProject = (rId) => request.get('/repositories/' + rId + '/branches')
