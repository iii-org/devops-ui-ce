<template>
  <el-dropdown
    trigger="click"
    class="international"
    @command="handleSetLanguage"
  >
    <div>
      <em class="ri-translate-2" />
    </div>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item
        :disabled="language === 'zh-TW'"
        command="zh-TW"
      >
        中文
      </el-dropdown-item>
      <el-dropdown-item
        :disabled="language === 'en'"
        command="en"
      >
        English
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {
  data() {
    return {
      timeout: null
    }
  },
  computed: {
    language() {
      return this.$store.getters.language
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timeout)
  },
  methods: {
    handleSetLanguage(lang) {
      this.resetLanguage()
      window.clearTimeout(this.timeout)
      this.timeout = window.setTimeout(() => {
        this.$i18n.locale = lang
        this.$dayjs.locale(lang.toLowerCase())
        this.$store.dispatch('app/setLanguage', lang)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.SwitchLanguage'),
          type: 'success'
        })
      }, 50)
    },
    resetLanguage() {
      const iframe = document.querySelector('.skiptranslate').children[0].contentWindow
      if (iframe) {
        const resetButton = iframe.document.getElementById(':1.restore')
        if (resetButton) {
          resetButton.click()
        }
      } else {
        console.error('Reset button not found')
      }
    }
  }
}
</script>
