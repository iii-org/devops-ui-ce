import request from '@/utils/request'

export const getSideexReport = (sideex_id) =>
  request.get(`/sideex_report/${sideex_id}`)
