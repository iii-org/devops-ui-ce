import colorVariables from '@/styles/theme/variables.scss'

const roundValue = value => Math.round(value * 100) / 100

const getQuotaUnit = (title, quotaItem) => {
  if (title === 'CPU') return 'CPUs'
  if (title === 'Memory') return getMemoryQuotaUnit(quotaItem)
  else return ''
}
// const getCpuQuotaUnit = () => 'CPUs'
const getMemoryQuotaUnit = quotaItem => quotaItem.slice(quotaItem.length - 1) // 'K','M','G','T'

const getUsedUnit = (title, usedItem) => {
  if (title === 'CPU') return getCpuUsedUnit(usedItem)
  if (title === 'Memory') return getMemoryUsedUnit(usedItem)
  else return ''
}
const getCpuUsedUnit = usedItem => {
  if (usedItem.indexOf('cpu') > -1) return 'cpu'
  if (usedItem.indexOf('m') > -1) return 'm'
  else return ''
} // 'cpu','m'
const getMemoryUsedUnit = usedItem => usedItem.slice(usedItem.length - 2, usedItem.length - 1) // 'Ki','Mi','Gi','Ti'

const formateUsedQuota = (title, quotaItem, usedItem) => {
  const quota = { value: parseInt(quotaItem), unit: getQuotaUnit(title, quotaItem) }
  const used = { value: parseInt(usedItem), unit: getUsedUnit(title, usedItem) }
  if (title === 'CPU') return formatCpuUsedQuota(quota, used)
  if (title === 'Memory') return formatMemoryUsedQuota(quota, used)
  else return used.value
}
const formatCpuUsedQuota = (quota, used) => {
  if (used.unit === 'm') return roundValue(used.value / 1000)
  // '0', 'cpu', 'm'  1m = 0.001 cpu
  else return used.value
}

const formatMemoryUsedQuota = (quota, used) => {
  if (used.unit === 'M') return roundValue(used.value / 1000)
  if (used.unit === 'K') return roundValue(used.value / 1000 / 1000)
  else return used.value
}

const formatChartDataResult = result =>
  result.map(item => ({
    title: item.title,
    data: formatData(item),
    quota: item.quota.value === null ? '' : `（${item.quota.value}${item.quota.unit}）`
  }))

const formatData = item => {
  const result = []
  if (item.leftQuota.value) {
    result.push({
      value: item.leftQuota.value,
      name: item.leftQuota.unit ? `Left Quota (${item.leftQuota.unit})` : 'Left Quota',
      itemStyle: { color: colorVariables.secondary, emphasis: { color: colorVariables.secondary }}
    })
  }
  if (item.used.value !== null) {
    result.push({
      value: item.used.value,
      name: item.used.unit ? `Usage (${item.used.unit})` : 'Usage',
      itemStyle: { color: colorVariables.danger, emphasis: { color: colorVariables.danger }}
    })
  }
  return result
}

export const handleK8sData = (data, plugins) => {
  const { titles, keys } = plugins
  const result = titles.map((title, idx) => {
    const quotaItem = data.quota[keys[idx]]
    const usedItem = data.used[keys[idx]]
    return {
      title: title,
      quota: {
        value: quotaItem ? parseInt(quotaItem) : null, // deployment, ingresses null, '0'
        unit: quotaItem ? getQuotaUnit(title, quotaItem) : ''
      },
      used: {
        value: formateUsedQuota(title, quotaItem, usedItem),
        unit: quotaItem ? getQuotaUnit(title, quotaItem) : ''
      }
    }
  })
  result.forEach((i) => {
    i.leftQuota = {
      value: i.quota.value === null ? null : roundValue(i.quota.value - i.used.value),
      unit: i.quota.unit
    }
  })
  return formatChartDataResult(result)
}
