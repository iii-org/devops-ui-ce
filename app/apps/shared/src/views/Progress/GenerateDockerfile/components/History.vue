<template>
  <div class="h-full">
    <template v-if="history.length">
      <div v-for="item in history" :key="item.created" class="bubble">
        <div v-if="item.role === 'error'" class="notification-danger text-xs">
          {{ item.text }}
        </div>
        <template v-else>
          <div
            :class="item.role === 'user' ? 'justify-end' : 'justify-start'"
            class="flex text-xs"
          >
            <span class="mr-1 font-bold">
              {{
                item.role === 'user'
                  ? $t('GenerateDockerfile.You')
                  : $t('GenerateDockerfile.AIAssistant')
              }}
            </span>
            <el-tooltip
              :content="getLocalTime(item.created)"
              :open-delay="200"
              placement="top"
            >
              <span> ({{ getRelativeTime(item.created) }}) </span>
            </el-tooltip>
          </div>
          <div
            :class="
              item.role === 'user'
                ? 'bg-gray-100 justify-self-end'
                : 'bg-blue-50'
            "
            class="text w-fit max-w-[100%]"
          >
            <Viewer v-if="item.text" :initial-value="item.text" />
            <div v-if="item.command" class="command">
              <span class="font-code text-xs">>> {{ item.command }}</span>
              <el-tooltip
                :content="$t('GenerateDockerfile.ClickToView')"
                placement="top"
              >
                <el-link
                  v-if="item.file_text"
                  class="text-primary font-code"
                  @click="handleFileClick(item.file_text)"
                >
                  <em class="ri-file-code-line"></em>Dockerfile
                </el-link>
              </el-tooltip>
            </div>
          </div>
        </template>
      </div>
    </template>
    <el-empty v-else />
  </div>
</template>

<script>
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'

export default {
  name: 'History',
  components: {
    Viewer: () => import('@toast-ui/vue-editor').then(({ Viewer }) => Viewer)
  },
  props: {
    history: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getLocalTime(time) {
      const date = new Date(time * 1000).toISOString()
      return getLocalTime(date)
    },
    getRelativeTime(time) {
      const date = new Date(time * 1000).toISOString()
      return getRelativeTime(date)
    },
    handleFileClick(fileText) {
      this.$emit('file-click', fileText)
    }
  }
}
</script>
<style lang="scss" scoped>
.bubble {
  padding: 10px;
  margin-bottom: 10px;

  .text {
    padding: 4px 10px;
    background: #f1f1f1;
    border-radius: 10px;
  }

  .command {
    padding: 10px 18px;
    border-radius: 4px;
    margin-bottom: 10px;
    line-height: 1.3;
    background: #f4f7f8;
  }
}

::v-deep {
  .toastui-editor-contents pre,
  .toastui-editor-contents code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }
}
</style>
