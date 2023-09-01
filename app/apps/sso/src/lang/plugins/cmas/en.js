export default {
  'description': 'CMAS Mobile Application SCAN',
  'arguments': {
    'CMAS_AUTHKEY': {
      title: 'Auth Key',
      hint: 'system provide auth key',
      placeholder: ''
    },
    'CMAS_URL': {
      title: 'location of cmas server',
      hint: 'https://localhost:port',
      placeholder: ''
    },
    'CMAS_A_REPORT_TYPE': {
      title: 'report type',
      hint: 'type of report, defalut is 2 ( owasp + Government ScanRule)',
      placeholder: '2'
    }
  }
}
