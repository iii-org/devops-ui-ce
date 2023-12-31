export default {
  'description': 'Active Directory',
  'arguments': {
    'host': {
      title: '主機位址',
      hint: '請輸入 AD 伺服器位址',
      placeholder: '127.0.0.1:389'
    },
    'ou': {
      title: '組織',
      hint: '請輸入 OU',
      placeholder: '部門名稱'
    },
    'domain': {
      title: '網域',
      hint: '請輸入 base dn',
      placeholder: 'test-ad.corp'
    },
    'account': {
      title: '帳號',
      hint: '請輸入 AD 連線帳號',
      placeholder: 'account'
    },
    'password': {
      title: '密碼',
      hint: '請輸入 AD 連線密碼',
      placeholder: 'password'
    },
    'default_password': {
      title: '新建帳號預設密碼',
      hint: '請輸入預設密碼',
      placeholder: 'password'
    },
    'connect_timeout': {
      title: '與AD連線時間',
      hint: '請輸入 Connect timeout',
      placeholder: '5'
    },
    'default_role_id': {
      title: '預設角色 ID',
      hint: '請輸入預設角色 ID',
      placeholder: '3'
    },
    'ssl': {
      title: '使用SSL連線',
      hint: '請確定是否需要使用SSL連線',
      placeholder: true
    },
    'ssl_validate': {
      title: '驗證伺服器憑證',
      hint: '是否需要驗證伺服器憑證',
      placeholder: 'NONE'
    },
    'ca_certs_data': {
      title: '伺服器憑證',
      hint: '伺服器憑證以Base64編譯方式輸入',
      placeholder: ''
    },
    'ssl_protocol': {
      title: 'SSL 通訊協定',
      hint: ' SSL or TLS 版本',
      placeholder: 'NONE'
    }
  }
}
