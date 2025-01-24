<template>
  <div>
    <section class="text-center">
      <div class="text-subtitle-1 font-weight-bold">
        {{ dockerCommand }}
      </div>
    </section>
    <el-select
      v-model="selectedTag"
      class="ml-3"
      size="mini"
    >
      <el-option
        v-for="tag in image.tags"
        :key="tag"
        :label="tag"
        :value="tag"
      />
    </el-select>
    <el-button
      class="ml-3"
      icon="el-icon-copy-document"
      circle
      size="mini"
      @click="copyUrl()"
    />
    <el-popconfirm
      :confirm-button-text="$t('general.Delete')"
      :cancel-button-text="$t('general.Cancel')"
      icon="el-icon-info"
      popper-class="danger"
      :title="$t('Notify.confirmDelete')"
      @confirm="deleteTag"
    >
      <el-button
        slot="reference"
        class="ml-3"
        :style="getStyle('danger')"
        :disabled="image.default"
        icon="el-icon-error"
        circle
        size="mini"
      />
    </el-popconfirm>
  </div>
</template>

<script>
import { deleteReleaseRepo } from '@/api_v2/release'
import variables from '@/styles/theme/variables.module.scss'

export default {
  name: 'CommandSelector',
  props: {
    row: {
      type: Object,
      default: () => ({})
    },
    image: {
      type: Object,
      default: () => ({})
    },
    idx: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      selectedTag: this.image.tags[0]
    }
  },
  computed: {
    projectId() {
      return this.row.project_id
    },
    releaseId() {
      return this.row.id
    },
    projectName() {
      return this.image.project
    },
    repoName() {
      return this.image.repo
    },
    dockerCommand() {
      const baseUrl = this.row.harbor_external_base_url
      return `docker pull ${baseUrl}/${this.projectName}/${this.repoName}:${this.selectedTag}`
    }
  },
  methods: {
    getStyle(colorCode) {
      const color = variables[`${colorCode}`]
      return {
        color
      }
    },
    copyUrl() {
      this.$copyText(this.dockerCommand).then(() => {
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Copied'),
          type: 'success'
        })
      })
    },
    async deleteTag() {
      await deleteReleaseRepo(this.projectId, this.releaseId, this.repoName)
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Deleted'),
            type: 'success'
          })
          this.$emit('onUpdated')
        })
    }
  }
}
</script>
