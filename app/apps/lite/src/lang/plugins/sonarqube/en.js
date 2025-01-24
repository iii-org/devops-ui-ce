export default {
  description: 'Sonarqube source code scan',
  arguments: {
    SONAR_URL: {
      title: 'Server URL',
      hint: 'Please enter Server URL',
      placeholder: 'The server URL of Sonarqube.'
    }
  },

  ViewReport: 'View Report',
  Bugs: 'Bugs',
  Vulnerabilities: 'Vulnerabilities',
  CodeSmells: 'Code Smells',
  Duplicates: 'Duplicates',
  Coverage: 'Coverage',
  ScanLogs: 'Scan Logs',

  code_smell: 'Code Smells',
  duplicates: 'Duplicates',

  code_smells: 'Code Smells',
  sqale_index: 'Technical Debt',
  vulnerabilities: 'Vulnerabilities',
  duplicated_lines_density: 'Duplicated lines (%)',
  bugs: 'Bugs',
  coverage: 'Coverage',
  reliability_rating: 'Reliability Rating',
  duplicated_blocks: 'Duplicated blocks',
  sqale_rating: 'Maintainability Rating',
  security_rating: 'Security Rating',
  security_hotspots: 'Security Hotspots',
  alert_status: 'Quality Gate Status'
}
