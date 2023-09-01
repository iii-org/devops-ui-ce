export default {
  'description': 'Active Directory',
  'arguments': {
    'AD_HOST': {
      title: 'AD host',
      hint: 'localhost:port',
      placeholder: ''
    },
    'AD_OU': {
      title: 'AD OU ',
      hint: 'please enter sync organization unit',
      placeholder: ''
    },
    'AD_DOMAIN': {
      title: 'AD base DN',
      hint: 'cn=admin,dc=example.com',
      placeholder: ''
    },
    'AD_ACCOUNT': {
      title: 'account',
      hint: 'please enter connect ad account',
      placeholder: 'account'
    },
    'AD_PASSWORD': {
      title: 'password',
      hint: 'please enter connect ad account password',
      placeholder: 'password'
    },
    'AD_DEFAULT_PASSWORD': {
      title: 'System Default Password',
      hint: 'password',
      placeholder: 'password'
    },
    'AD_CONNECT_TIMEOUT': {
      title: 'AD Connect time',
      hint: 'connection time',
      placeholder: '5s'
    },
    'AD_DEFAULT_ROLE_ID': {
      title: 'Default User Role',
      hint: 'default user role in system',
      placeholder: '3'
    },
    'AD_SSL': {
      title: 'Connection by SSL',
      hint: 'SSL basic authentication with the use_ssl parameter of the Server object',
      placeholder: true
    },
    'AD_SSL_VALIDATE': {
      title: 'Validate server certificate',
      hint: ' specifies if the server certificate must be validated',
      placeholder: 'NONE'
    },
    'AD_SSL_PROTOCOL': {
      title: 'ldap ssl protocol',
      hint: ' SSL or TLS version',
      placeholder: 'NONE'
    },
    'AD_CA_CERTS_DATA': {
      title: 'Server Certificate ',
      hint: 'Base64 encode server certificate string',
      placeholder: ''
    }
  }
}
