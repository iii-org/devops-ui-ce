import request from '@/utils/request'

export const getExcalidraw = (params) => request.get(`/v2/excalidraw`, { params })
export const getExcalidrawDataById = (excalidraw_id) => request.get(`/v2/excalidraw/data/${excalidraw_id}`)
export const createExcalidraw = (data) => request.post(`/v2/excalidraw`, data,
  { headers: { 'Content-Type': 'multipart/form-data' }}
)
export const updateExcalidraw = (excalidraw_id, data) => request.patch(`/v2/excalidraw/data/${excalidraw_id}`,
  data, { headers: { 'Content-Type': 'multipart/form-data' }}
)
export const deleteExcalidraw = (excalidraw_id) => request.delete(`/v2/excalidraw/data/${excalidraw_id}`)
export const getExcalidrawHistory = (excalidraw_id) => request.get(`/v2/excalidraw/${excalidraw_id}/historys`)
export const postExcalidrawHistory = (excalidraw_id) => request.post(`/v2/excalidraw/${excalidraw_id}/historys`)
export const patchExcalidrawHistory = (excalidraw_id) => request.patch(`/v2/excalidraw/${excalidraw_id}/historys`)
export const restoreExcalidrawHistory = (history_id) => request.put(`/v2/excalidraw/${history_id}/restore`)
