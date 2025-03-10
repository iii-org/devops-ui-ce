<template>
  <div class="app-container">
    <ProjectListSelector />
    <el-divider />
    <el-card
      v-loading="isInitLoading"
      body-style="padding:26px;"
      class="border-none"
    >
      <div v-if="!enabled" class="notification-warning">
        <p>{{ $t('GenerateDockerfile.EnableAITokenWarning') }}</p>
        <el-button type="primary" @click="gotoProjectSettings">
          {{ $t('AISettings.EnableAI') }}
        </el-button>
      </div>
      <el-row v-else :gutter="20">
        <el-col :md="8" :sm="24" class="h-[75vh] min-h-[500px] mb-2">
          <DockerfileForm
            ref="dockerfileForm"
            :branches="branches"
            :dockerfile="dockerfile"
            :form="form"
            :history="history"
            :is-loading="isLoading"
            :is-second-attempt="isSecondAttempt"
            :rules="rules"
            @generate="generateDockerfile"
            @file-click="handleFileClick"
          />
        </el-col>
        <el-col :md="16" :sm="24">
          <DockerfileEditor
            :dockerfile="dockerfile"
            :editor-options="editorOptions"
            :file-text="fileText"
            :is-editor="isEditor"
            :is-loading="isLoading"
            @cancel="handleCancel"
            @mount="handleMount"
            @save="handleSave"
            @editor-change="handleEditorChange"
            @diff-close="handleDiffClose"
            @apply-editor="applyToEditor"
          />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
import {
  cancelGenerateDockerfile,
  generateDockerfile,
  getGenerateDockerfileHistory,
  getGenerateDockerfileStatus,
  regerateDockerfile,
  saveDockerfile
} from '@/api_v3/dockerfile'
import { getProjectTokens } from '@/api_v3/aiToken'
import { getRepositoryBranches } from '@/api_v3/gitlab'
import { mapGetters } from 'vuex'
import DockerfileEditor from './components/DockerfileEditor'
import DockerfileForm from './components/DockerfileForm'

export default {
  name: 'GenerateDockerfile',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    DockerfileForm,
    DockerfileEditor
  },
  data() {
    return {
      isLoading: false,
      form: {
        user_prompt: '',
        branch: ''
      },
      branches: [],
      dockerfile: {
        status: '',
        content: ''
      },
      currentTaskId: '',
      timer: null,
      history: [],
      fileText: '',
      isEditor: true,
      diffEditorRef: null,
      isSecondAttempt: false,
      previousDockerfile: '',
      enabled: false,
      isInitLoading: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject']),
    editorOptions() {
      return {
        automaticLayout: true,
        fontFamily: 'Source Code Pro, JetBrains Mono, monospace',
        fontLigatures: true,
        fontSize: 13,
        formatOnType: true,
        formatOnPaste: true,
        originalEditable: true,
        readOnly: this.dockerfile.status === ''
      }
    },
    rules() {
      return {
        branch: [
          {
            required: this.dockerfile.status !== 'completed',
            message: 'Please select a branch',
            trigger: 'blur'
          }
        ],
        user_prompt: [
          {
            required: this.dockerfile.status === 'completed',
            message: 'Please input additional prompt',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  mounted() {
    this.fetchProjectTokens()
  },
  beforeDestroy() {
    this.clearTimer()
  },
  methods: {
    async fetchProjectTokens() {
      this.isInitLoading = true
      await getProjectTokens(this.selectedProject.id).then((res) => {
        this.isInitLoading = false
        if (res.data.token_id) {
          this.enabled = true
          this.checkStatus()
          this.getRepositoryBranches()
        }
      })
    },
    async getRepositoryBranches() {
      try {
        const res = await getRepositoryBranches(
          this.selectedProject.repository_id
        )
        this.branches = res.data.branches.map((branch) => branch.name)
      } catch (err) {
        console.error(err)
      }
    },
    checkStatus() {
      const storedTask = JSON.parse(
        localStorage.getItem(`task_${this.selectedProject.id}`)
      )

      if (
        storedTask &&
        new Date().getTime() - storedTask.timestamp <= 7200000
      ) {
        this.currentTaskId = storedTask.task_id
        this.form.branch = storedTask.branch
        this.checkTaskStatus()
        this.setTimer()
      } else {
        localStorage.removeItem(`task_${this.selectedProject.id}`)
      }
    },
    setTimer() {
      this.timer = setInterval(this.checkTaskStatus, 5000)
    },
    clearTimer() {
      clearInterval(this.timer)
    },
    async checkTaskStatus() {
      this.isLoading = true
      try {
        const historyRes = await getGenerateDockerfileHistory(
          this.currentTaskId
        )
        this.history = historyRes.data
        this.$nextTick(() => this.scrollTo('bottom'))

        const statusRes = await getGenerateDockerfileStatus(this.currentTaskId)
        this.dockerfile.status = statusRes.data.status

        if (
          ['completed', 'canceled', 'failed'].includes(statusRes.data.status)
        ) {
          this.isLoading = false
          if (statusRes.data.status === 'failed') {
            this.removeLocalStorage()
            this.history.push({ role: 'error', text: statusRes.data.error })
          } else if (statusRes.data.status === 'completed') {
            this.dockerfile.content = statusRes.data.dockerfile
            this.form.user_prompt = ''
            if (this.isSecondAttempt && this.previousDockerfile) {
              this.fileText = this.previousDockerfile
              this.isEditor = false
            }
          }

          this.clearTimer()
        }
      } catch (err) {
        console.error(err)
      }
    },
    generateDockerfile() {
      this.$refs.dockerfileForm.$refs.form.validate(async (valid) => {
        if (valid) {
          this.isLoading = true

          if (this.dockerfile.status === 'completed') {
            this.isSecondAttempt = true
            this.previousDockerfile = this.dockerfile.content
            this.history.push({
              role: 'user',
              text: this.form.user_prompt,
              created: Math.floor(Date.now() / 1000)
            })
            this.scrollTo('bottom')
          }

          const data = {
            branch: this.form.branch,
            additional_hints: this.form.user_prompt
          }
          const API =
            this.dockerfile.status === 'completed'
              ? regerateDockerfile(this.currentTaskId, data)
              : generateDockerfile(this.selectedProject.id, data)

          try {
            const res = await API
            this.currentTaskId = res.data.task_id

            localStorage.setItem(
              `task_${this.selectedProject.id}`,
              JSON.stringify({
                task_id: this.currentTaskId,
                branch: this.form.branch,
                timestamp: new Date().getTime()
              })
            )

            this.dockerfile.status = res.data.status
            this.setTimer()
          } catch (err) {
            console.error(err)
            this.dockerfile.status = 'failed'
            this.isLoading = false
          }
        }
      })
    },
    async handleCancel() {
      this.isLoading = true
      try {
        await cancelGenerateDockerfile(this.currentTaskId)
        this.isLoading = false
        this.resetData()
        this.clearTimer()
        this.removeLocalStorage()
      } catch (err) {
        console.error(err)
      }
      this.isLoading = false
    },
    async handleSave(isCreateMR = false) {
      if (!this.isEditor) {
        this.dockerfile.content = this.diffEditorRef
          .getModifiedEditor()
          .getValue()
      }

      const data = {
        content: this.dockerfile.content,
        branch: this.form.branch,
        create_mr: isCreateMR,
        task_id: this.currentTaskId
      }

      try {
        await saveDockerfile(this.selectedProject.id, data)
        this.$message({
          message: this.$t('general.Success'),
          type: 'success'
        })
        this.removeLocalStorage()
        this.resetData()
      } catch (err) {
        console.error(err)
      }
    },
    removeLocalStorage() {
      localStorage.removeItem(`task_${this.selectedProject.id}`)
      localStorage.removeItem(`dockerfiles_${this.selectedProject.id}`)
    },
    handleEditorChange(val) {
      this.dockerfile.content = val
      this.isEditor = true
    },
    scrollTo(target) {
      this.$nextTick(() => {
        const node = this.$el.querySelector('.chat').childNodes[1]
        const anchor = target === 'bottom' ? node.scrollHeight : 0
        node.scrollTop = anchor
      })
    },
    handleFileClick(file) {
      this.fileText = file
      this.isEditor = false
    },
    handleMount(editor) {
      this.diffEditorRef = editor
    },
    handleDiffClose() {
      this.dockerfile.content = this.diffEditorRef
        .getModifiedEditor()
        .getValue()
      this.isEditor = true
    },
    applyToEditor() {
      this.dockerfile.content = this.fileText
    },
    resetData() {
      this.$refs.dockerfileForm.$refs.form.resetFields()
      this.dockerfile.status = ''
      this.dockerfile.content = ''
      this.history = []
      this.fileText = ''
      this.isEditor = true
      this.isSecondAttempt = false
      this.previousDockerfile = ''
    },
    gotoProjectSettings() {
      this.$router.push({
        name: 'Overview',
        params: { settings: true, tab: 'aiTokenSettings' }
      })
    }
  }
}
</script>
