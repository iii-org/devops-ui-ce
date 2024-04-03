<template>
  <el-popover
    placement="bottom"
    width="200"
    trigger="click"
    popper-class="translate-popper"
  >
    <svg-icon slot="reference" icon-class="google-translate" class="text-md" />
    <el-button type="text" @click="resetLanguage">{{ $t('general.Reset') }}</el-button>
    <Translator :countries="countries" />
  </el-popover>
</template>

<script>
import { Translator } from 'vue-google-translate'

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
  methods: {
    resetLanguage() {
      const iframe = document.querySelector('.skiptranslate').children[0].contentWindow
      if (iframe) {
        const resetButton = iframe.document.getElementById(':1.restore')
        if (resetButton) resetButton.click()
      } else {
        console.error('Reset button not found')
      }
    }
  }
}
</script>

<style lang="scss">
.translate-popper {
  max-height: 50vh;
  overflow: auto;
  div {
    .shadow {
      box-shadow: none !important;
      div {
        span > span {
          align-items: center;
          .flag {
            height: 30px;
          }
          .language__text {
            word-break: break-word;
            margin-top: 0;
          }
        }
      }
    }
  }
}
</style>
