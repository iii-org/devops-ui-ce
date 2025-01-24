export default {
  mode: 'jit', // just-in-time mode: https://tailwindcss.com/docs/just-in-time-mode
  content: ['./public/**/*.html', './src/**/*.vue', '../shared/src/**/*.vue'],
  theme: {
    extend: {
      minWidth: {
        300: '300px'
      },
      colors: {
        custom: {
          black: '#606206'
        },
        success: '#36b2c3',
        danger: '#d64a66',
        warning: '#e6a23c',
        slow: '#56b1e8',
        light: '#c1c3c5',
        info: '#606260',
        primary: '#0E8A74',
        secondary: '#FB3E7A',
        active: '#80A2B6',
        assigned: '#d64a66',
        closed: '#909399',
        solved: '#DDDBE2',
        inProgress: '#EFE7E6',
        finished: '#8C79A7',
        verified: '#8C79A7',
        document: '#005f73',
        research: '#0a9396',
        epic: '#409EEF',
        audit: '#82DDF0',
        feature: '#A0DA2C',
        bug: '#E84855',
        issue: '#5296A5',
        changeRequest: '#A06CD5',
        risk: '#FCD7AD',
        testPlan: '#A57548',
        failManagement: '#FF7033'
      },
      backgroundColor: (theme) => ({
        ...theme('colors')
      }),
      fontFamily: {
        code: ['"Jetbrains Mono"', 'monospace']
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: [],
  corePlugins: {
    preflight: false
  },
  important: true
}
