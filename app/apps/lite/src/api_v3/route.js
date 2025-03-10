import request from '@/utils/request'

// export const getRouter = () => request.get(`/v3/routers/ui_routes`)
export const getPinnedRoutes = () => request.get(`/v3/routers/pinned`)
export const updatePinnedRoutes = (data) => request.post(`/v3/routers/pinned`, data)
