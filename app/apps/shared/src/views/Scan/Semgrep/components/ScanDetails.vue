<template>
  <div>
    <h2 class="text-[#199ba9]">{{ $t('Plugins.semgrep.ScanResultDetail') }}</h2>
    <template v-for="detail in scanDetailsData">
      <div :key="detail.id" class="mb-[100px]">
        <div class="block">
          <h3 class="text-primary title">{{ $t('File.File') }}</h3>
          <el-link
            :disabled="!commitUrl"
            :href="getHref(detail)"
            :underline="false"
            class="mb-4 break-words text-base"
            target="_blank"
            type="primary"
          >
            {{ detail.location.file }}
          </el-link>
          <table class="test-report">
            <tbody>
              <tr>
                <th id=""></th>
                <th id="">{{ $t('Plugins.semgrep.Start') }}</th>
                <th id="">{{ $t('Plugins.semgrep.End') }}</th>
              </tr>
              <tr>
                <td>{{ $t('Plugins.semgrep.Line') }}</td>
                <td :data-label="$t('Plugins.semgrep.Start')">
                  {{ detail.location.start_line || '-' }}
                </td>
                <td :data-label="$t('Plugins.semgrep.End')">
                  {{ detail.location.end_line || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="block">
          <h3 class="text-primary title">
            {{ $t('Plugins.semgrep.Severity') }}
          </h3>
          <h4 class="text-danger font-bold">
            {{ $t(`Plugins.semgrep.${detail.severity}`) }}
          </h4>
        </div>
        <div class="block">
          <h3 class="text-primary title">
            {{ $t('Plugins.semgrep.Vulnerability') }}
          </h3>
          <div>{{ detail.name }}</div>
        </div>
        <div class="block">
          <h3 class="text-primary title">
            {{ $t('Plugins.semgrep.Description') }}
          </h3>
          <div class="w-full" v-html="markdownToHtml(detail.description)"></div>
        </div>
        <div class="block">
          <h3 class="text-primary title">
            {{ $t('Plugins.semgrep.Categories') }}
          </h3>
          <el-collapse accordion>
            <template v-for="identifier in detail.identifiers">
              <el-collapse-item
                :key="identifier.name"
                :disabled="!identifier.url"
              >
                <template slot="title">
                  <div class="w-full flex justify-between items-center">
                    <el-tooltip :content="identifier.type" placement="top">
                      <div class="w-[300px] truncate">
                        {{ identifier.type }}
                      </div>
                    </el-tooltip>
                    <el-tooltip :content="identifier.name" placement="top">
                      <div
                        :class="[identifier.url ? 'text-primary' : '']"
                        class="w-full truncate"
                      >
                        {{ identifier.name }}
                      </div>
                    </el-tooltip>
                  </div>
                </template>
                <div
                  v-if="identifier.url"
                  class="ml-5 flex items-center flex-wrap"
                >
                  <div class="mr-2">{{ $t('Plugins.semgrep.Reference') }}:</div>
                  <el-link
                    :href="identifier.url"
                    :underline="false"
                    class="break-all"
                    target="_blank"
                    type="primary"
                  >
                    {{ identifier.url }}
                  </el-link>
                </div>
              </el-collapse-item>
            </template>
          </el-collapse>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as marked from 'marked'

export default {
  name: 'ScanDetails',
  props: {
    scanDetailsData: {
      type: Array,
      default: () => []
    },
    commitUrl: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapGetters(['device']),
    getHref() {
      return (detail) => {
        const { file, start_line, end_line } = detail.location
        let line = ''
        if (start_line) {
          line = end_line ? `L${start_line}-L${end_line}` : `L${start_line}`
        }
        return `${this.commitUrl}/${file}#${line}`
      }
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    markdownToHtml(markdown) {
      return marked.parse(markdown)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.block {
  margin: 30px 0;

  .title {
    margin-bottom: 10px !important;
  }
}

.is-disabled {
  ::v-deep .el-icon-arrow-right {
    display: none !important;
  }

  ::v-deep .el-collapse-item__header {
    color: #303133;
  }
}

// style for v-html content
::v-deep code:not(pre code) {
  @apply inline-block font-code text-[0.9em] rounded-sm whitespace-pre-wrap break-words;
  background-color: #e8e8e8;
  padding: 0.2em 0.4em;
}

::v-deep pre code {
  @apply block p-[1em] font-code text-[0.9em] leading-5 rounded whitespace-pre-wrap break-words
  overflow-x-auto max-w-full;
  background-color: #e8e8e8;
}

::v-deep a {
  @apply inline-block max-w-full break-words whitespace-normal no-underline cursor-pointer;
  color: $buttonPrimary;

  &:hover {
    color: #479edc;
    font-weight: bold;
  }
}
</style>
