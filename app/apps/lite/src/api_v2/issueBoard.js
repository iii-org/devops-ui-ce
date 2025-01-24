import request from '@shared/utils/request'

// Board
export const getAllBoard = (project_id) =>
  request.get(`/v2/project/${project_id}/board`)
export const createNewBoard = (project_id, data) =>
  request.post(`/v2/project/${project_id}/board`, data)
export const removeBoard = (project_id, board_id) =>
  request.delete(`/v2/project/${project_id}/board/${board_id}`)

// Board Item
export const getAllBoardItem = (project_id, board_id, params) =>
  request.get(`/v2/project/${project_id}/board/${board_id}/item`, { params })
export const createBoardItem = (project_id, board_id, data) =>
  request.post(`/v2/project/${project_id}/board/${board_id}/item`, data)
export const updateBoardItem = (project_id, board_id, item_id, data) =>
  request.put(
    `/v2/project/${project_id}/board/${board_id}/item/${item_id}`,
    data
  )
export const removeBoardItem = (project_id, board_id, item_id) =>
  request.delete(`/v2/project/${project_id}/board/${board_id}/item/${item_id}`)

// Board Item Issue
export const createBoardItemIssue = (project_id, board_id, item_id, data) =>
  request.post(
    `/v2/project/${project_id}/board/${board_id}/item/${item_id}/issue`,
    data
  )
export const removeBoardItemIssue = (project_id, board_id, item_id, issue_id) =>
  request.delete(
    `/v2/project/${project_id}/board/${board_id}/item/${item_id}/issue/${issue_id}`
  )
