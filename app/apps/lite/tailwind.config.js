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
        success: {
          DEFAULT: '#36b3c3ff',
          50: '#f1fdffff',
          100: '#b6edf2ff',
          200: '#89e2ebff',
          300: '#5ed5e2ff',
          400: '#45ccdcff',
          500: '#3ac3d6ff',
          600: '#36b3c3ff',
          700: '#319da9ff',
          800: '#2d8991ff',
          900: '#256567ff',
          950: '#133d3eff'
        },
        danger: {
          DEFAULT: '#d64a66ff',
          50: '#fff5f8ff',
          100: '#f2bfceff',
          200: '#eb97afff',
          300: '#e37291ff',
          400: '#dc5a7aff',
          500: '#d64a66ff',
          600: '#c54562ff',
          700: '#af405cff',
          800: '#9a3b57ff',
          900: '#73334cff',
          950: '#4e1d32ff'
        },
        warning: {
          DEFAULT: '#F0B100FF',
          50: '#FEFCE8FF',
          100: '#FEF9C2FF',
          200: '#FFF085FF',
          300: '#FFDF20FF',
          400: '#FDC700FF',
          500: '#F0B100FF',
          600: '#D08700FF',
          700: '#A65F00FF',
          800: '#894B00FF',
          900: '#733E0AFF',
          950: '#432004FF'
        },
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
