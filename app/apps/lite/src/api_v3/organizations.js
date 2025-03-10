import request from '@/utils/request'

export const getOrganizationList = () => request.get(`/v3/organizations`)
export const createOrganization = (data) =>
  request.post(`/v3/organizations`, data)
export const updateOrganization = (organization_id, data) =>
  request.patch(`/v3/organizations/${organization_id}`, data)
export const deleteOrganization = (organization_id) =>
  request.delete(`/v3/organizations/${organization_id}`)
