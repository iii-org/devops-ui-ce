<template>
  <div>
    <slot name="description"></slot>
    <el-card shadow="never">
      <el-form label-position="left" label-width="120px">
        <el-row>
          <el-col :span="24">
            <el-form-item :label="$t('Release.IssueVersion')">
              <span>{{ $t('Release.issueCount') }}</span>
              <span
                class="cursor-pointer"
                style="color: #409eff"
                @click="openIssueDialog"
              >
                {{ updateData.issues.length }}
              </span>
              <span>{{ $t('Issue.Issue') }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item :label="$t('Release.CommitAndImage')">
              <template v-if="releaseData.commit || releaseData.branch">
                <em class="ri-git-commit-line"></em>
                <span class="font-code">{{ releaseData.commit }}</span>
                <span v-if="releaseData.branch">
                  ({{ releaseData.branch }})
                </span>
              </template>
              <span v-else>{{ $t('general.Nothing') }}</span>
              <span> / </span>
              <span
                v-if="updateData.image !== 'noImage'"
                class="custom-black font-code"
                style="line-height: 40px"
              >
                <em class="ri-git-commit-line"></em>
                {{ updateData.image }}
              </span>
              <span v-else>
                <span class="text-danger mr-3">
                  <em class="el-icon-warning"></em>
                  <span>{{ $t('Issue.NoImage') }}</span>
                </span>
              </span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :lg="8" :md="10" :sm="12" :xs="24">
            <el-form-item :label="$t('Release.releaseVersionName')">
              <el-select
                v-model="mainVersion"
                :placeholder="$t('Release.selectMainVersion')"
                filterable
              >
                <el-option
                  v-for="item in releaseVersionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :lg="16" :md="14" :sm="12" :xs="24">
            <el-form-item
              v-if="updateData.image !== 'noImage'"
              :label="$t('Release.ImagePath')"
              class="cursor-pointer"
            >
              <el-input
                v-model="imagePath"
                :placeholder="$t('Release.ImagePath')"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item :label="$t('Release.releaseNote')">
              <editor
                ref="mdEditor"
                :options="editorOptions"
                height="auto"
                initial-edit-type="wysiwyg"
                @change="onMessageChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div class="el-alert el-alert--error is-light mb-3">
        <em class="el-alert__icon el-icon-warning"></em>
        <div class="el-alert__content">
          <span class="el-alert__title">{{
            $t('Release.ReleaseWarning')
          }}</span>
        </div>
      </div>
      <div class="text-right">
        <el-button :disabled="isLoading" @click="onBack">
          <em class="el-icon-back"></em>
          {{ $t('Release.Previous') }}
        </el-button>
        <el-button :disabled="!main || isLoading" @click="release">
          {{ $t('Release.startRelease') }}
        </el-button>
      </div>
      <IssueListDialog ref="issueDialog" />
    </el-card>
  </div>
</template>

<script>
import { createProjectRelease } from '@/api_v3/projects'
import { mapGetters } from 'vuex'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/i18n/zh-tw'

export default {
  name: 'PackageVersion',
  components: {
    IssueListDialog: () => import('./IssueListDialog'),
    Editor: () => import('@toast-ui/vue-editor').then(({ Editor }) => Editor)
  },
  props: {
    releaseData: {
      type: Object,
      default: () => ({})
    },
    updateData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isLoading: false,
      mainVersion: '',
      imagePath: '',
      note: '',
      releaseVersionOptions: []
    }
  },
  computed: {
    ...mapGetters([
      'selectedProjectId',
      'selectedProject',
      'language',
      'device'
    ]),
    imageProject() {
      return !this.mainVersion
        ? `{{ project }}`
        : `${this.selectedProject.identifier}`
    },
    main() {
      if (!this.mainVersion) return null
      const versionData = this.releaseVersionOptions.find((version) => {
        return version.value === this.mainVersion
      })
      return versionData.value
    },
    editorOptions() {
      return {
        minHeight: '200px',
        language: this.language
      }
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    mainVersion: {
      handler(val) {
        if (!val || !this.releaseData.branch) return ''
        const version = this.releaseVersionOptions.find(
          (option) => option.value === val
        )
        this.imagePath = `${this.imageProject}:${version.label}`
      },
      immediate: true
    }
  },
  mounted() {
    if (this.releaseData.versions && this.releaseData.versions.length > 0) {
      this.updateReleaseVersions()
      this.imagePath = this.releaseData.extra_image_path
      this.mainVersion = this.releaseData.main
      this.note = this.releaseData.note
    }
  },
  methods: {
    async release() {
      const releaseData = this.setReleaseData()
      if (!this.checkImagePath(releaseData)) {
        this.stopRelease()
        return
      }
      this.isLoading = true
      await createProjectRelease(this.selectedProjectId, releaseData)
        .then(() => {
          this.$emit('initState')
          this.$message({
            message: this.$t('Release.releaseDone', [this.main]),
            type: 'success'
          })
        })
        .catch(() => {
          this.isLoading = false
        })
    },
    setReleaseData() {
      const releaseData = JSON.parse(JSON.stringify(this.releaseData))
      releaseData.extra_image_path = this.imagePath
      releaseData.main = this.main
      releaseData.note = this.note
      releaseData.version_ids = releaseData.versions
      delete releaseData.versions
      return releaseData
    },
    checkImagePath(releaseData) {
      if (releaseData.extra_image_path === '') return true
      return /:/.test(releaseData.extra_image_path)
    },
    stopRelease() {
      this.$message({
        message: this.$t('Release.StopReleaseWarning'),
        type: 'error'
      })
    },
    onBack() {
      const releaseData = {
        extra_image_path: this.imagePath,
        main: this.main,
        note: this.note
      }
      this.$emit('onBack', releaseData, this.updateData)
    },
    updateReleaseVersions() {
      this.releaseVersionOptions = []
      for (const ver of this.updateData.projectVersions) {
        if (this.releaseData.versions.indexOf(ver.id) >= 0) {
          this.releaseVersionOptions.push({
            value: ver.id,
            label: ver.name
          })
        }
      }
    },
    openIssueDialog() {
      const com = this.$refs.issueDialog
      com.setData(this.updateData.issues, null)
      com.visible = true
    },
    onMessageChange() {
      this.note = this.$refs.mdEditor.invoke('getMarkdown')
    }
  }
}
</script>
