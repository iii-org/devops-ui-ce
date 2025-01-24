import i18n from '@/lang'

const postmanFormatter = (testResult) => {
  const ret = {}
  const status = testResult.status
  if (Object.keys(testResult.result).length === 0) {
    Object.assign(ret, {
      Software: 'postman',
      runAt: '',
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status: testResult.status
    })
  } else {
    const { passed, failed, total } = testResult.result
    Object.assign(ret, {
      Software: 'postman',
      runAt: testResult.run_at,
      informationText: [
        { status: i18n.t('Plugins.postman.TestPass'), count: passed },
        { status: i18n.t('Plugins.postman.TestFail'), count: failed },
        { status: i18n.t('Plugins.postman.TestTotal'), count: total }
      ]
    })
  }
  return ret
}

const getCheckmarxStatusText = (status) => {
  const statusString = String(status)
  const mapText = {
    // '-1': i18n.t('CheckMarx.noScan'),
    // '1': i18n.t('CheckMarx.notCompletedScan'),
    // '2': i18n.t('CheckMarx.generatingReportScan'),
    // '4': i18n.t('CheckMarx.canceledScan'),
    // '5': i18n.t('CheckMarx.failedScan'),
    // '6': i18n.t('CheckMarx.removedScan')
    '-1': i18n.t('Plugins.checkmarx.failedScan'),
    0: i18n.t('general.NoData'),
    2: i18n.t('Plugins.checkmarx.Scanning'),
    success: i18n.t('general.Success'),
    failed: i18n.t('Plugins.checkmarx.failedScan'),
    error: i18n.t('general.Error'),
    'not found': i18n.t('general.NoData')
  }
  return mapText[statusString] || i18n.t('general.NoData')
}

const checkmarxFormatter = (testResult) => {
  const { highSeverity, mediumSeverity, lowSeverity, infoSeverity } =
    testResult.result
  const { report_id } = testResult
  const status = testResult.status
  const ret = {}
  if (status === 1) {
    Object.assign(ret, {
      Software: 'checkmarx',
      report_id: report_id,
      runAt: testResult.run_at,
      informationText: [
        {
          status: i18n.t('Plugins.checkmarx.High'),
          count: highSeverity
        },
        {
          status: i18n.t('Plugins.checkmarx.Medium'),
          count: mediumSeverity
        },
        { status: i18n.t('Plugins.checkmarx.Low'), count: lowSeverity },
        {
          status: i18n.t('Plugins.checkmarx.Info'),
          count: infoSeverity
        }
      ]
    })
  } else {
    Object.assign(ret, {
      Software: 'checkmarx',
      runAt: '',
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status: testResult.status
    })
  }
  return ret
}

const webinspectFormatter = (testResult) => {
  const ret = {}
  const status = testResult.status
  if (status <= 0) {
    Object.assign(ret, {
      Software: 'webinspect',
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status: testResult.status
    })
  } else {
    const {
      bpCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount
    } = testResult.result
    Object.assign(ret, {
      Software: 'webinspect',
      runAt: testResult.run_at,
      informationText: [
        { status: i18n.t('Plugins.webinspect.BpSeverity'), count: bpCount },
        { status: i18n.t('Plugins.webinspect.Critical'), count: criticalCount },
        { status: i18n.t('Plugins.webinspect.High'), count: highCount },
        { status: i18n.t('Plugins.webinspect.Medium'), count: mediumCount },
        { status: i18n.t('Plugins.webinspect.Low'), count: lowCount },
        { status: i18n.t('Plugins.webinspect.Info'), count: infoCount }
      ]
    })
  }
  return ret
}

const sbomFormatter = (testResult, type) => {
  const ret = {}
  const status = testResult.status
  const softwareName = type ? 'SBOM Code' : 'SBOM Image'
  if (Object.keys(testResult.result).length === 0) {
    Object.assign(ret, {
      Software: softwareName,
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status: testResult.status
    })
  } else {
    const packageNums = testResult.result.package_nums
    const { Critical, High, Medium, Low } = testResult.result.scan_overview
    Object.assign(ret, {
      Software: softwareName,
      runAt: testResult.run_at,
      informationText: [
        { status: i18n.t('Plugins.sbom.PackageCount'), count: packageNums },
        { status: i18n.t('Plugins.sbom.CriticalSeverity'), count: Critical },
        { status: i18n.t('Plugins.sbom.HighSeverity'), count: High },
        { status: i18n.t('Plugins.sbom.MediumSeverity'), count: Medium },
        { status: i18n.t('Plugins.sbom.LowSeverity'), count: Low }
      ]
    })
  }
  return ret
}

const sonarqubeFormatter = (testResult) => {
  const ret = {}
  const status = testResult.status
  if (Object.keys(testResult.result).length === 0) {
    Object.assign(ret, {
      Software: 'sonarqube',
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status: testResult.status
    })
  } else {
    Object.assign(ret, {
      Software: 'sonarqube',
      runAt: !!testResult['run_at'] > -1 ? testResult['run_at'] : undefined,
      informationText: Object.keys(testResult.result).map((key) => ({
        status: i18n.t(`Plugins.sonarqube.${key}`),
        count: testResult.result[key]
      }))
    })
  }
  return ret
}
const sideexFormatter = (testResult) => {
  const ret = {}
  const status = testResult.status
  if (Object.keys(testResult.result).length === 0) {
    Object.assign(ret, {
      Software: 'sideex',
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status: testResult.status
    })
  } else {
    const { suitesPassed, suitesTotal, casesPassed, casesTotal } =
      testResult.result
    Object.assign(ret, {
      Software: 'sideex',
      runAt: testResult.run_at,
      informationText: [
        {
          status: i18n.t('Plugins.sideex.suitesPassedRatio'),
          count: suitesPassed
        },
        {
          status: i18n.t('Plugins.sideex.suitesPassedTotal'),
          count: suitesTotal
        },
        {
          status: i18n.t('Plugins.sideex.casesPassedRatio'),
          count: casesPassed
        },
        { status: i18n.t('Plugins.sideex.casesPassedTotal'), count: casesTotal }
      ]
    })
  }
  return ret
}

const zapFormatter = (testResult) => {
  const ret = {}
  const status = testResult.status
  if (
    testResult.result !== 'None' &&
    Object.keys(testResult.result).length !== 0
  ) {
    const result = testResult.result
    Object.assign(ret, {
      Software: 'zap',
      runAt: testResult.run_at,
      informationText: [
        { status: i18n.t('Plugins.zap.high'), count: result['3'] },
        { status: i18n.t('Plugins.zap.medium'), count: result['2'] },
        { status: i18n.t('Plugins.zap.low'), count: result['1'] },
        { status: i18n.t('general.Info'), count: result['0'] }
      ]
    })
  } else {
    Object.assign(ret, {
      Software: 'zap',
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status: testResult.status
    })
  }
  return ret
}

const cmasFormatter = (testResult) => {
  const ret = {}
  const status = testResult.status
  if (
    !testResult.hasOwnProperty('result') ||
    Object.keys(testResult.result).length === 0
  ) {
    Object.assign(ret, {
      Software: 'cmas',
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status
    })
  } else {
    const { MOEA, OWASP } = testResult.result
    Object.assign(ret, {
      Software: 'cmas',
      runAt: testResult.run_at,
      informationText: [
        { status: 'MOEA', count: MOEA['summary'] },
        { status: 'L3', count: MOEA['High'] },
        { status: 'L2', count: MOEA['Medium'] },
        { status: 'L1', count: MOEA['Low'] },
        { status: 'OWASP', count: OWASP['summary'] },
        { status: i18n.t('general.High'), count: OWASP['High'] },
        { status: i18n.t('general.Medium'), count: OWASP['Medium'] },
        { status: i18n.t('general.Low'), count: OWASP['Low'] }
      ]
    })
  }
  return ret
}

const clairFormatter = (testResult) => {
  const ret = {}
  const status = testResult.status
  if (Object.keys(testResult.result).length === 0) {
    Object.assign(ret, {
      Software: 'Docker Image',
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status
    })
  } else {
    const { Critical, High, Low, Medium, Negligible, Unknown } =
      testResult.result
    Object.assign(ret, {
      Software: 'Docker Image',
      runAt: testResult.run_at,
      informationText: [
        { status: i18n.t('Plugins.harbor.Critical'), count: Critical },
        { status: i18n.t('Plugins.harbor.High'), count: High },
        { status: i18n.t('Plugins.harbor.Low'), count: Low },
        { status: i18n.t('Plugins.harbor.Medium'), count: Medium },
        { status: i18n.t('Plugins.harbor.Negligible'), count: Negligible },
        { status: i18n.t('Plugins.harbor.Unknown'), count: Unknown }
      ]
    })
  }
  return ret
}

const testFormatter = (testResult) => {
  const ret = {}
  const status = testResult.status
  if (Object.keys(testResult.result).length === 0) {
    Object.assign(ret, {
      Software: testResult.name,
      informationText: [{ status: getCheckmarxStatusText(status), count: '' }],
      status: testResult.status
    })
  } else {
    let softwareName = testResult.name
    if (testResult.name === 'sbom_code') {
      softwareName = 'SBOM Code'
    } else if (testResult.name === 'sbom') {
      softwareName = 'SBOM Image'
    }
    Object.assign(ret, {
      Software: softwareName,
      runAt: testResult['run_at'],
      informationText: Object.keys(testResult.result).map((key) => ({
        status: i18n.t(
          `Plugins.${
            testResult.name === 'sbom_code' ? 'sbom' : testResult.name
          }.${key}`
        ),
        count: testResult.result[key]
      }))
    })
  }
  return ret
}

export {
  postmanFormatter,
  checkmarxFormatter,
  webinspectFormatter,
  sbomFormatter,
  sonarqubeFormatter,
  sideexFormatter,
  zapFormatter,
  cmasFormatter,
  clairFormatter,
  testFormatter
}
