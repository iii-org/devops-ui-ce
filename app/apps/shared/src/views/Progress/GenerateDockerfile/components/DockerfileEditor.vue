<template>
  <el-card
    body-style="padding: 0px; display:flex; flex-direction:column; height: calc(100% - 57px);"
    class="h-[75vh] min-h-[500px]"
    shadow="never"
  >
    <template slot="header">
      <div class="flex justify-between">
        <div class="text-sm font-bold text-gray-600">
          {{ $t('GenerateDockerfile.GeneratedDockerfile') }}
        </div>
        <el-tag
          v-if="dockerfile.status.length"
          :type="dockerfile.status === 'completed' ? 'success' : 'warning'"
          size="mini"
        >
          <em v-if="isLoading" class="el-icon-loading"></em>
          {{
            dockerfile.status.charAt(0).toUpperCase() +
              dockerfile.status.slice(1)
          }}
        </el-tag>
      </div>
    </template>
    <Editor
      v-show="isEditor"
      v-loading="isLoading"
      :options="editorOptions"
      :value="dockerfile.content"
      class="h-full flex-1"
      class-name="rounded relative"
      language="dockerfile"
      theme="vs-dark"
      @change="handleEditorChange"
    />
    <div v-show="!isEditor" class="h-full flex-1 relative">
      <div class="relative h-full">
        <div
          class="absolute top-0 left-0 right-0 z-20 flex justify-between px-2 py-1 bg-gray-100/80 text-xs text-gray-600 font-code transition-opacity duration-200 hover:opacity-0"
        >
          <div>{{ $t('GenerateDockerfile.PreviousVersion') }}</div>
          <div>{{ $t('GenerateDockerfile.LatestVersion') }}</div>
        </div>
        <DiffEditor
          :modified="dockerfile.content"
          :options="{ ...editorOptions, originalEditable: false }"
          :original="fileText"
          class="h-full"
          class-name="rounded relative"
          language="dockerfile"
          theme="vs-dark"
          @mount="handleMount"
        />
      </div>
      <el-tooltip
        :content="`${$t('general.Close')} Diff`"
        effect="dark"
        placement="right"
      >
        <el-button
          class="p-0 pl-2 py-1 absolute top-[50%] left-[-10px] z-10 border-none"
          plain
          size="mini"
          type="info"
          @click="handleDiffClose"
        >
          <em class="ri-arrow-left-wide-line text-base"></em>
        </el-button>
      </el-tooltip>
      <div class="absolute bottom-1 left-1 z-10 w-[50%] flex justify-end">
        <el-button
          class="py-[6px] mr-9"
          size="mini"
          type="success"
          @click="applyToEditor"
        >
          {{ $t('GenerateDockerfile.ApplyToEditor') }}
          <em class="ri-arrow-right-double-line"></em>
        </el-button>
      </div>
    </div>
    <div
      v-if="['generating', 'pending', 'completed'].includes(dockerfile.status)"
      class="m-[10px] flex justify-end"
    >
      <el-button icon="ri-close-line" plain type="danger" @click="handleCancel">
        {{ $t('general.Cancel') }}
      </el-button>
      <el-dropdown
        v-if="dockerfile.status === 'completed'"
        class="ml-1"
        icon="ri-save-line"
        placement="top-end"
        trigger="click"
        @command="handleSave"
      >
        <el-button type="primary">
          <em class="ri-save-line"></em>
          {{ $t('general.Save') }}
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item :command="true" icon="ri-git-pull-request-line">
            {{ $t('GenerateDockerfile.CreateMR') }}
          </el-dropdown-item>
          <el-dropdown-item
            :command="false"
            divided
            icon="ri-git-repository-commits-line"
          >
            {{ $t('GenerateDockerfile.PushToCurrentBranch') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </el-card>
</template>

<script>
import { DiffEditor, Editor } from '@guolao/vue-monaco-editor'

export default {
  name: 'DockerfileEditor',
  components: {
    Editor,
    DiffEditor
  },
  props: {
    dockerfile: {
      type: Object,
      required: true
    },
    isLoading: {
      type: Boolean,
      required: true
    },
    isEditor: {
      type: Boolean,
      required: true
    },
    fileText: {
      type: String,
      required: true
    },
    editorOptions: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleEditorChange(val) {
      this.$emit('editor-change', val)
    },
    handleDiffClose() {
      this.$emit('diff-close')
    },
    applyToEditor() {
      this.$emit('apply-editor')
    },
    handleMount(editor) {
      this.$emit('mount', editor)
    },
    handleCancel() {
      this.$emit('cancel')
    },
    handleSave(isCreateMR) {
      this.$emit('save', isCreateMR)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-loading-mask {
  border-radius: 0;
  background-color: #52525254;
}

::v-deep .monaco-editor,
::v-deep .overflow-guard {
  height: 100% !important;
}
</style>
