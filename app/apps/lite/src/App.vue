<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { getLanguage } from './lang'

export default {
  name: 'App',
  created() {
    window.googleTranslateElementInit = this.googleTranslateElementInit
    this.loadGoogleTranslate()
  },
  methods: {
    googleTranslateElementInit() {
      new window.google.translate.TranslateElement(
        { pageLanguage: getLanguage(), autoDisplay: false },
        'app'
      )
    },
    loadGoogleTranslate() {
      if (!document.querySelector('.goog-te-banner-frame')) {
        var script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        document.head.appendChild(script)
      } else {
        this.googleTranslateElementInit()
      }
    }
  }
}
</script>

<style lang="scss">
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background-color: transparent;
}
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(104, 104, 104, 0.2);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background-color: rgb(211, 211, 211);
  border-radius: 4px;
}
.skiptranslate {
  display: none !important;
}
body {
  top: 0 !important;
}
</style>
