<template>
  <el-form
    ref="form"
    :model="form"
    :rules="rules"
    :validate-on-rule-change="false"
    class="flex flex-col h-full"
    label-position="top"
  >
    <el-form-item :label="$t('general.Branch')" prop="branch">
      <el-select
        v-model="form.branch"
        :disabled="dockerfile.status !== '' || isLoading"
        :placeholder="$t('general.Branch')"
        class="w-full"
      >
        <el-option
          v-for="item in branches"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      :label="$t('GenerateDockerfile.ChatHistory')"
      class="flex-1 chat flex flex-col h-full"
    >
      <History :history="history" @file-click="handleFileClick" />
    </el-form-item>
    <div>
      <el-form-item
        :label="$t('GenerateDockerfile.AdditionalPrompt')"
        prop="user_prompt"
      >
        <el-input
          v-model="form.user_prompt"
          :disabled="isLoading"
          :placeholder="$t('GenerateDockerfile.AdditionalPrompt')"
          :rows="3"
          type="textarea"
          @keyup.enter.native="handleGenerate"
        />
      </el-form-item>
      <el-button
        :loading="isLoading"
        class="w-full"
        icon="ri-code-ai-line"
        type="warning"
        @click="handleGenerate"
      >
        <span class="ml-1">
          <span v-if="isSecondAttempt">
            {{ $t('GenerateDockerfile.Regenerate') }}
          </span>
          <span v-else>{{ $t('GenerateDockerfile.Generate') }}</span>
          Dockerfile
        </span>
      </el-button>
    </div>
  </el-form>
</template>

<script>
import History from './History'

export default {
  name: 'DockerfileForm',
  components: {
    History
  },
  props: {
    form: {
      type: Object,
      required: true
    },
    rules: {
      type: Object,
      required: true
    },
    dockerfile: {
      type: Object,
      required: true
    },
    isLoading: {
      type: Boolean,
      required: true
    },
    branches: {
      type: Array,
      required: true
    },
    history: {
      type: Array,
      required: true
    },
    isSecondAttempt: {
      type: Boolean,
      required: true
    }
  },
  methods: {
    handleGenerate() {
      this.$emit('generate')
    },
    handleFileClick(file) {
      this.$emit('file-click', file)
    }
  }
}
</script>

<style lang="scss" scoped>
.chat {
  ::v-deep .el-form-item__content {
    height: 100px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 16px;
    overflow-y: auto;
    flex-grow: 1;
    scroll-behavior: smooth;
  }
}

::v-deep {
  textarea {
    resize: none;
  }
}
</style>