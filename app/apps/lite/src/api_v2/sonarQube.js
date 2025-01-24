import request from '@shared/utils/request'

export const getSonarQubeData = (project_name) =>
  request.get(`/v2/sonarqube/${project_name}`)
