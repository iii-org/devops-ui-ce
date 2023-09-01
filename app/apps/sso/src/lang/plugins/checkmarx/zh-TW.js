export default {
  'description': 'Checkmarx 原始碼掃描',
  'arguments': {
    'CMX_SECRET': { title: 'Client Secret', hint: '請輸入 Client Secret', placeholder: 'Checkmarx client 的 secret' },
    'CMX_URL': { title: '伺服器位置', hint: '請輸入伺服器位置', placeholder: 'Checkmarx 伺服器的網址' },
    'CMX_USERNAME': { title: '使用者名稱', hint: '請輸入使用者名稱', placeholder: 'Checkmarx 的使用者名稱' },
    'CMX_PASSWORD': { title: '密碼', hint: '請輸入密碼', placeholder: 'Checkmarx 的使用者密碼' }
  }
}
