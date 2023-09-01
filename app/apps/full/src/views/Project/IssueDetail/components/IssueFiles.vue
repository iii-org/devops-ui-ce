<template>
  <el-row class="el-upload-list">
    <el-row
      v-for="file in issueFile"
      :key="file.id"
      class="el-upload-list__item is-ready"
    >
      <el-col
        :span="14"
        :lg="16"
      >
        <el-tooltip
          :disabled="clientWidth >= scrollWidth"
          placement="bottom"
        >
          <div slot="content">
            {{ file.filename + `(${getLocalTime(file.created_on)})` }}
          </div>
          <a
            class="el-upload-list__item-name"
            @mouseover="checkWidth"
            @click="handlePreview(file)"
          >
            <em class="el-icon-document" />
            {{ file.filename + `(${getLocalTime(file.created_on)})` }}
          </a>
        </el-tooltip>
      </el-col>
      <el-col
        :span="10"
        :lg="8"
        class="text-right"
      >
        <span>
          <el-button
            class="buttonPrimary"
            size="mini"
            icon="el-icon-download"
            :loading="isLoading"
            :disabled="isButtonDisabled"
            @click="handleDownload(file)"
          >
            <span v-if="device === 'desktop'">{{ $t('File.Download') }}</span>
          </el-button>
        </span>
        <el-popconfirm
          :confirm-button-text="$t('general.Delete')"
          :cancel-button-text="$t('general.Cancel')"
          icon="el-icon-info"
          icon-color="red"
          :title="$t('Issue.DeleteFile')"
          @confirm="deleteIssueFile(file)"
        >
          <el-button
            slot="reference"
            type="danger"
            size="mini"
            icon="el-icon-delete"
            :loading="isLoading"
            :disabled="isButtonDisabled"
          >
            <span v-if="device === 'desktop'">{{ $t('general.Delete') }}</span>
          </el-button>
        </el-popconfirm>
      </el-col>
    </el-row>
    <component
      :is="device === 'desktop' ? 'el-dialog' : 'el-drawer'"
      :title="image.filename"
      :visible.sync="dialogVisible"
      :width="device === 'desktop' ? '80%' : 'auto'"
      :top="device === 'desktop' ? '3vh' : 'auto'"
      :class="device === 'mobile' ? 'mobile' : ''"
      :close-on-click-modal="device === 'desktop'"
      direction="btt"
      size="auto"
      append-to-body
      destroy-on-close
    >
      <div v-touch:swipe="swipeHandler">
        <el-carousel
          ref="carousel"
          trigger="click"
          indicator-position="none"
          :arrow="imageArray.length === 1 ? 'never' : 'hover'"
          :autoplay="false"
          :initial-index="imageIndex"
          :height="device === 'desktop' ? imageHeight+'px' : 'calc(100vh - 150px)'"
          @change="changeCarousel"
        >
          <el-carousel-item v-for="item in imageArray" :key="item.id">
            <img
              ref="image"
              :src="item.src"
              :alt="item.filename"
              style="display: block; margin: auto; max-width: 100%;"
              :class="device === 'mobile' ? 'carousel-image' : ''"
              @load="resizeImageHeight"
            >
          </el-carousel-item>
        </el-carousel>
      </div>
      <span slot="footer">
        <el-button v-if="device === 'desktop'" @click="dialogVisible = false">{{ $t('general.Close') }}</el-button>
        <el-button
          class="buttonPrimary"
          :class="device === 'mobile' ? 'w-full' : ''"
          @click="downloadImage"
        >
          <span>{{ $t('File.Download') }}</span>
        </el-button>
      </span>
    </component>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { deleteIssueFile } from '@/api/issue'
import { downloadProjectFile } from '@/api/projects'
import { getLocalTime } from '@/utils/handleTime'
import { btoa } from '@/utils/base64'

export default {
  name: 'IssueFiles',
  props: {
    issueFile: {
      type: Array,
      default: () => []
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoading: false,
      dialogVisible: false,
      image: {
        filename: '',
        content_type: '',
        src: ''
      },
      imageArray: [],
      imageIndex: 0,
      imageHeight: 0,
      clientWidth: 0,
      scrollWidth: 0
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device'])
  },
  watch: {
    issueFile(value) {
      if (value.length === 0) return
      this.handleImageArray()
    }
  },
  mounted() {
    this.handleImageArray()
    this.resizeImageHeight()
    window.addEventListener('resize', this.resizeImageHeight)
    window.addEventListener('keydown', this.handleCarousel)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.resizeImageHeight)
    window.removeEventListener('keydown', this.handleCarousel)
  },
  methods: {
    async handleDownload(row) {
      const res = await downloadProjectFile({ id: row.id, filename: row.filename, project_id: this.selectedProject.id })
      const url = window.URL.createObjectURL(new Blob([res]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', row.filename) // or any other extension
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    deleteIssueFile(row) {
      this.isLoading = true
      deleteIssueFile(row.id)
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Deleted'),
            type: 'success'
          })
          this.removeFile(row.id)
        })
        .catch((err) => {
          this.showErrorMessage(err)
        })
        .then(() => {
          this.isLoading = false
        })
    },
    removeFile(id) {
      const idx = this.issueFile.findIndex((item) => item.id === id)
      this.issueFile.splice(idx, 1)
    },
    checkWidth(e) {
      this.clientWidth = e.target.clientWidth
      this.scrollWidth = e.target.scrollWidth
    },
    async handleImageArray() {
      if (this.imageArray.length !== 0) this.imageArray = []
      for (const item of this.issueFile) {
        const { id, content_type, filename } = item
        if (this.isAllowPreview(content_type)) {
          await downloadProjectFile({ id, filename, project_id: this.selectedProject.id })
            .then((res) => {
              const base64String = btoa(new Uint8Array(res).reduce((data, byte) => data + String.fromCharCode(byte), ''))
              this.imageArray.push({
                id: id,
                content_type: content_type,
                filename: filename,
                src: `data:${content_type};base64, ${base64String}`
              })
            })
            .catch((err) => {
              this.showErrorMessage(err)
            })
        }
      }
    },
    handlePreview(row) {
      if (!this.isAllowPreview(row.content_type)) return
      this.imageIndex = this.imageArray.findIndex((item) => item.id === row.id)
      this.image = this.imageArray[this.imageIndex]
      this.dialogVisible = true
      if (this.$refs.carousel !== undefined) {
        this.$refs.carousel.setActiveItem(this.imageIndex)
      }
    },
    resizeImageHeight() {
      if (this.$refs.image === undefined) return
      this.$nextTick(() => {
        this.imageHeight = this.$refs.image[this.imageIndex].height
      })
    },
    changeCarousel(index) {
      this.imageIndex = index
      this.image = this.imageArray[index]
      this.resizeImageHeight()
    },
    handleCarousel(e) {
      if (this.$refs.carousel === undefined) return
      switch (e.key) {
        case 'ArrowLeft':
          this.$refs.carousel.prev()
          break
        case 'ArrowRight':
          this.$refs.carousel.next()
          break
      }
    },
    downloadImage() {
      const { src, filename } = this.image
      const link = document.createElement('a')
      link.href = src
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    isAllowPreview(content_type) {
      if (content_type === null) return false
      else return content_type.includes('image')
    },
    showErrorMessage(err) {
      this.$message({
        message: err,
        type: 'error'
      })
    },
    getLocalTime(time, format) {
      return getLocalTime(time, format)
    },
    swipeHandler (direction) {
      if (!this.$refs.carousel) return
      switch (direction) {
        case 'left':
          this.$refs.carousel.next()
          break
        case 'right':
          this.$refs.carousel.prev()
          break
        default:
          break
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.el-carousel__item {
  background-color:white;
}
.mobile {
  max-height: 100vh;
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }
  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
  }
  ::v-deep .el-carousel__item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .carousel-image {
      max-height: 100%;
    }
  }
}
</style>
