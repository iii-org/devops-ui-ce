import request from '@shared/utils/request'

// Board
export const getAllBoard = (project_id) => request.get(`/v2/project/${project_id}/board`)
export const createNewBoard = (project_id, data) => request.post(`/v2/project/${project_id}/board`, data)
export const getSingleBoard = (project_id, board_id) => request.get(`/v2/project/${project_id}/board/${board_id}`)
export const updateBoard = (project_id, board_id, data) => request.put(`/v2/project/${project_id}/board/${board_id}`, data)
export const removeBoard = (project_id, board_id) => request.delete(`/v2/project/${project_id}/board/${board_id}`)

// Board Item
export const getAllBoardItem = (project_id, board_id) => request.get(`/v2/project/${project_id}/board/${board_id}/item`)
export const getAllBoardItemByName = (project_id, board_id, item_name) => request.get(`/v2/project/${project_id}/board/${board_id}/item?search=${item_name}`)
export const createBoardItem = (project_id, board_id, data) => request.post(`/v2/project/${project_id}/board/${board_id}/item`, data)
export const getSingleBoardItem = (project_id, board_id, item_id) => request.get(`/v2/project/${project_id}/board/${board_id}/item/${item_id}`)
export const updateBoardItem = (project_id, board_id, item_id, data) => request.put(`/v2/project/${project_id}/board/${board_id}/item/${item_id}`, data)
export const removeBoardItem = (project_id, board_id, item_id) => request.delete(`/v2/project/${project_id}/board/${board_id}/item/${item_id}`)

// Board Item Issue
export const createBoardItemIssue = (project_id, board_id, item_id, data) => request.post(`/v2/project/${project_id}/board/${board_id}/item/${item_id}/issue`, data)
export const removeBoardItemIssue = (project_id, board_id, item_id, issue_id) => request.delete(`/v2/project/${project_id}/board/${board_id}/item/${item_id}/issue/${issue_id}`)
