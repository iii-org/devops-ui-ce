<template>
  <el-popover
    placement="bottom"
    width="230"
    trigger="click"
    popper-class="translate-popper"
  >
    <em
      slot="reference"
      class="ri-translate-2"
    ></em>
    <div class="text-xs font-bold mb-1">{{ $t('general.PlatformLanguage') }}</div>
    <div
      class="grid p-1 list notranslate"
      @click="handleSetLanguage('zh-TW')"
    >
      <span class="language-item">
        <img
          alt="台灣 flag icon`"
          src="https://cdn.jsdelivr.net/gh/lewis-kori/vue-google-translate/src/assets/images/flags/__Chinese (Traditional).png"
          class="flag"
        />
        <span class="language__text">中文(台灣)</span>
      </span>
    </div>
    <div
      class="grid p-1 list notranslate"
      @click="handleSetLanguage('en')"
    >
      <span class="language-item">
        <img
          alt="台灣 flag icon`"
          src="https://cdn.jsdelivr.net/gh/lewis-kori/vue-google-translate/src/assets/images/flags/__English.png"
          class="flag"
        />
        <span class="language__text">English</span>
      </span>
    </div>
    <el-divider />
    <div class="text-xs font-bold mb-1">Google Translate</div>
    <Translator
      :countries="countries"
      class="notranslate"
    />
  </el-popover>
</template>

<script>
import { Translator } from 'vue-google-translate'
import { mapGetters } from 'vuex'

export default {
  components: {
    Translator
  },
  data() {
    return {
      countries: [
        {
          code: 'en|af',
          title: 'Afrikaans'
        },
        {
          code: 'en|sq',
          title: 'Albanian'
        },
        {
          code: 'en|ar',
          title: 'Arabic'
        },
        {
          code: 'en|hy',
          title: 'Armenian'
        },
        {
          code: 'en|az',
          title: 'Azerbaijani'
        },
        {
          code: 'en|eu',
          title: 'Basque'
        },
        {
          code: 'en|be',
          title: 'Belarusian'
        },
        {
          code: 'en|bg',
          title: 'Bulgarian'
        },
        {
          code: 'en|ca',
          title: 'Catalan'
        },
        {
          code: 'en|zh-CN',
          title: 'Chinese (Simplified)'
        },
        // {
        //   code: 'en|zh-TW',
        //   title: 'Chinese (Traditional)'
        // },
        {
          code: 'en|hr',
          title: 'Croatian'
        },
        {
          code: 'en|cs',
          title: 'Czech'
        },

        {
          code: 'en|da',
          title: 'Danish'
        },
        {
          code: 'en|nl',
          title: 'Dutch'
        },
        // {
        //   code: 'en|en',
        //   title: 'English'
        // },
        {
          code: 'en|et',
          title: 'Estonian'
        },
        {
          code: 'en|tl',
          title: 'Filipino'
        },
        {
          code: 'en|fi',
          title: 'Finnish'
        },
        {
          code: 'en|fr',
          title: 'French'
        },

        {
          code: 'en|de',
          title: 'German'
        },
        {
          code: 'en|el',
          title: 'Greek'
        },
        {
          code: 'en|hu',
          title: 'Hungarian'
        },
        {
          code: 'en|id',
          title: 'Indonesian'
        },
        {
          code: 'en|ga',
          title: 'Irish'
        },
        {
          code: 'en|it',
          title: 'Italian'
        },
        {
          code: 'en|ja',
          title: 'Japanese'
        },
        {
          code: 'en|ko',
          title: 'Korean'
        },
        {
          code: 'en|lt',
          title: 'Lithuanian'
        },
        {
          code: 'en|ms',
          title: 'Malay'
        },
        {
          code: 'en|no',
          title: 'Norwegian'
        },
        {
          code: 'en|pl',
          title: 'Polish'
        },

        {
          code: 'en|pt',
          title: 'Portuguese'
        },
        {
          code: '"en|ro',
          title: 'Romanian'
        },
        {
          code: 'en|ru',
          title: 'Russian'
        },
        {
          code: 'en|es',
          title: 'Spanish'
        },
        {
          code: 'en|sv',
          title: 'Swedish'
        },
        {
          code: 'en|th',
          title: 'Thai'
        },
        {
          code: 'en|tr',
          title: 'Turkish'
        },
        {
          code: 'en|uk',
          title: 'Ukrainian'
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['language'])
  },
  beforeDestroy() {
    window.clearTimeout(this.timeout)
    window.clearTimeout(this.timeout2)
  },
  methods: {
    handleSetLanguage(lang) {
      this.resetLanguage()
      window.clearTimeout(this.timeout)
      this.timeout = window.setTimeout(() => {
        this.$i18n.locale = lang
        this.$dayjs.locale(lang.toLowerCase())
        this.$store.dispatch('app/setLanguage', lang)
        document.documentElement.lang = lang
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
        if (resetButton) resetButton.click()
        this.timeout2 = window.setTimeout(() => {
          document.documentElement.lang = this.language
        }, 50)
      }
    }
  }
}
</script>

<style lang="scss">
.translate-popper {
  max-height: 50vh;
  overflow: auto;
  padding: 8px;
  div {
    .md\:grid-cols-2, .lg\:grid-cols-3 {
      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
    }
    .shadow {
      box-shadow: none !important;
      div {
        padding: 0.25rem !important;
        &:hover {
          background-color: #f2f2f2;
          cursor: pointer;
          border-radius: 6px;
        }
        span > span {
          align-items: center;
          .flag {
            height: 30px;
            filter: drop-shadow(0px 0px 2px grey);
          }
          .language__text {
            word-break: break-word;
            margin-top: 0;
            color: #606266;
          }
          &:hover {
            text-decoration: none !important;
          }
        }
      }
    }
  }
}
</style>
<style lang="scss" scoped>
.language-item {
  display: flex;
  align-items: center;
}
.language__text {
  color: #606266;
  padding-left: 5px;
  text-decoration: none;
  word-break: break-word;
}
.flag {
  height: 30px;
  filter: drop-shadow(0px 0px 2px grey);
}
.list:hover {
  background-color: #f2f2f2;
  cursor: pointer;
  border-radius: 6px;
}
</style>
