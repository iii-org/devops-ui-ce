module.exports = {
  mode: 'jit', // just-in-time mode: https://tailwindcss.com/docs/just-in-time-mode
  purge: {
    enabled: true,
    content: ['./public/**/*.html', './src/**/*.vue', '../shared/src/**/*.vue'],
    options: {
      safelist: {
        standard: [/^el-/],
        deep: [/^el-/]
      }
    }
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      minWidth: {
        '300': '300px'
      },
      colors: {
        custom: {
          black: '#606206'
        },
        success: '#2ec7c9',
        danger: '#d87c7c',
        warning: '#d7ab82',
        slow: '#61a0a8',
        light: '#c1c3c5',
        info: '#606260',
        primary: '#6e7074',
        secondary: '#61a0a8',
        active: '#5AB1EF',
        assigned: '#D87A80',
        closed: '#8D98B3',
        solved: '#C6B38E',
        inProgress: '#2EC7C9',
        finished: '#5f6769',
        verified: '#B6A2DE',
        document: '#005f73',
        research: '#0a9396',
        epic: '#61a0a8',
        audit: '#51557E',
        feature: '#89c9b8',
        bug: '#d87c7c',
        issue: '#6e7074',
        changeRequest: '#816797',
        risk: '#e3CCae',
        testPlan: '#a57548',
        failManagement: '#d7ab82'
      },
      backgroundColor: theme => ({
        ...theme('colors')
      })
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
