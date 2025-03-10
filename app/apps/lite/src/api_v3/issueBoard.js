import request from '@/utils/request'

export const getBoardList = (project_id) =>
  request.get(`/v3/projects/${project_id}/boards`)
export const createBoard = (project_id, data) =>
  request.post(`/v3/projects/${project_id}/boards`, data)
export const getBoard = (board_id) => request.get(`/v3/boards/${board_id}`)
export const deleteBoard = (board_id) =>
  request.delete(`/v3/boards/${board_id}`)
export const updateBoard = (board_id, data) =>
  request.put(`/v3/boards/${board_id}`, data)
export const getBoardItemList = (board_id) =>
  request.get(`/v3/boards/${board_id}/board_item`)
export const createBoardItem = (board_id, data) =>
  request.post(`/v3/boards/${board_id}/board_item`, data)
export const getBoardItem = (board_id, item_id) =>
  request.get(`/v3/boards/${board_id}/board_item/${item_id}`)
export const updateBoardItem = (board_id, item_id, data) =>
  request.put(`/v3/boards/${board_id}/board_item/${item_id}`, data)
export const deleteBoardItem = (board_id, item_id) =>
  request.delete(`/v3/boards/${board_id}/board_item/${item_id}`)
export const createBoardItemIssue = (board_id, item_id, data) =>
  request.post(`/v3/boards/${board_id}/board_item/${item_id}`, data)
export const deleteBoardItemIssue = (board_id, item_issue_id) =>
  request.delete(`/v3/boards/${board_id}/board_item_issue/${item_issue_id}`)
