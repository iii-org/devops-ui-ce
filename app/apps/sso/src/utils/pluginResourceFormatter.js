import colorVariables from '@/styles/theme/variables.scss'

const handleLeftQuota = (item) => {
  const quotaValue = item.quota.value === '' ? 0 : Number(item.quota.value)
  const usedValue = item.used.value === '' ? 0 : Number(item.used.value)
  return quotaValue - usedValue
}
const formatValue = (title, value) => {
  if (title === 'Harbor') return (value / 1024 / 1024 / 1024).toFixed(2)
  if (title === 'GitLab') return (value / 1024 / 1024 / 1024).toFixed(2)
}
const getValueUnit = (title) => {
  if (title === 'Harbor') return 'GB'
  if (title === 'GitLab') return 'GB'
}

const formatChartData = (item) => {
  const result = []
  if (item.quota.value === '') {
    result.push({
      value: formatValue(item.title, item.used.value),
      name: `Usage (${getValueUnit(item.title)})`,
      itemStyle: { color: colorVariables.danger, emphasis: { color: colorVariables.danger }}
    })
  } else {
    result.push({
      value: formatValue(item.title, handleLeftQuota(item)),
      name: `Left Quota (${getValueUnit(item.title)})`,
      itemStyle: { color: colorVariables.secondary, emphasis: { color: colorVariables.secondary }}
    })
    result.push({
      value: formatValue(item.title, item.used.value),
      name: `Usage (${getValueUnit(item.title)})`,
      itemStyle: { color: colorVariables.danger, emphasis: { color: colorVariables.danger }}
    })
  }
  return result
}

const getQuotaString = (item) =>
  item.quota.value !== '' ? `（${formatValue(item.title, item.quota.value)}${getValueUnit(item.title)}）` : ''

export const handlePluginData = (data) =>
  data.map((item) => {
    return {
      title: item.title,
      data: formatChartData(item),
      quota: getQuotaString(item)
    }
  })
