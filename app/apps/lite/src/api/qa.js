import request from '@/utils/request'

export const getTestFileList = (projectId) =>
  request.get('/quality/' + projectId + '/testfile_list')
export const getTestFileByTestPlan = (projectId, testPlanId) =>
  request.get(`/quality/${projectId}/testfile_by_testplan/${testPlanId}`)
export const putTestPlanWithTestFile = (projectId, data) =>
  request.put('/quality/' + projectId + '/testplan_with_testfile', data)
