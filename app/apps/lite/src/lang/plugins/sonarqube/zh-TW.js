export default {
  description: 'Sonarqube 原始碼掃描',
  arguments: {
    SONAR_URL: {
      title: '伺服器位址',
      hint: '請輸入伺服器位址',
      placeholder: 'Sonarqube 伺服器的 URL'
    }
  },

  ViewReport: '檢視報告',
  Bugs: 'Bugs',
  Vulnerabilities: '安全漏洞',
  CodeSmells: '程式異味',
  Duplicates: '重複程式碼',
  Coverage: '覆蓋率',
  ScanLogs: '掃描記錄',

  code_smell: '程式異味',
  duplicates: '重複程式碼',

  code_smells: '代碼異味',
  sqale_index: '技術債務',
  vulnerabilities: '漏洞',
  duplicated_lines_density: '重複行數(%)',
  bugs: '程式錯誤',
  coverage: '覆蓋率',
  reliability_rating: '可靠性評分',
  duplicated_blocks: '重複程式碼',
  sqale_rating: '可維護性等級',
  security_rating: '安全等級',
  security_hotspots: '安全熱點',
  alert_status: '品質狀態'
}
