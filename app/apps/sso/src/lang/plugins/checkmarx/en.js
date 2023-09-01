export default {
  'description': 'Checkmarx source code scan',
  'arguments': {
    'CMX_SECRET': { title: 'Client Secret', placeholder: 'Secret of the Checkmarx client.' },
    'CMX_URL': { title: 'Server URL', hint: 'please enter Server URL', placeholder: 'Server URL of the Checkmarx server.' },
    'CMX_USERNAME': { title: 'Username', hint: 'please enter username', placeholder: 'Username of Checkmarx.' },
    'CMX_PASSWORD': { title: 'Password', hint: 'please enter password', placeholder: 'Password of Checkmarx.' }
  }
}
