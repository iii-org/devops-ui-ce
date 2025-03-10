import request from '@/utils/request'

// Semgrep
export const getSemgrepResult = (params) =>
  request.get(`/v3/summaries/semgrep`, { params })
export const getSemgrepReport = (params) =>
  request.get(`/v3/summaries/semgrep/result`, { params })

// Sonarqube
export const getSonarqubeResult = (params) =>
  request.get(`/v3/summaries/sonarqube`, { params })
