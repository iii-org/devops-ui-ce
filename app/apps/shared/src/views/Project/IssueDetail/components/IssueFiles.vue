<template>
  <el-row class="el-upload-list">
    <el-row
      v-for="file in issueFile"
      :key="file.id"
      class="el-upload-list__item is-ready"
    >
      <el-col :lg="16" :span="14">
        <el-tooltip :disabled="clientWidth >= scrollWidth" placement="bottom">
          <div slot="content">
            {{ file.filename + `(${getLocalTime(file.create_at)})` }}
          </div>
          <a
            class="el-upload-list__item-name"
            @click="handlePreview(file)"
            @mouseover="checkWidth"
          >
            <em :class="getFileIcon(file.content_type)"></em>
            {{ file.filename + `(${getLocalTime(file.create_at)})` }}
          </a>
        </el-tooltip>
      </el-col>
      <el-col :lg="8" :span="10" class="text-right">
        <span>
          <el-button
            :disabled="isButtonDisabled"
            :loading="isLoading"
            type="primary"
            icon="el-icon-download"
            size="mini"
            @click="handleDownload(file)"
          >
            <span v-if="device === 'desktop'">{{ $t('File.Download') }}</span>
          </el-button>
        </span>
        <el-popconfirm
          :cancel-button-text="$t('general.Cancel')"
          :confirm-button-text="$t('general.Delete')"
          :title="$t('Issue.DeleteFile')"
          icon="el-icon-info"
          popper-class="danger"
          @confirm="deleteIssueFile(file)"
        >
          <el-button
            slot="reference"
            :disabled="isButtonDisabled"
            :loading="isLoading"
            icon="el-icon-delete"
            size="mini"
            type="danger"
          >
            <span v-if="device === 'desktop'">{{ $t('general.Delete') }}</span>
          </el-button>
        </el-popconfirm>
      </el-col>
    </el-row>
    <component
      :is="device === 'desktop' ? 'el-dialog' : 'el-drawer'"
      :class="device === 'mobile' ? 'mobile' : ''"
      :close-on-click-modal="device === 'desktop'"
      :title="preview.filename"
      :top="device === 'desktop' ? '3vh' : 'auto'"
      :visible.sync="dialogVisible"
      :width="device === 'desktop' ? '80%' : 'auto'"
      append-to-body
      destroy-on-close
      direction="btt"
      size="auto"
    >
      <div v-touch:swipe="swipeHandler">
        <el-carousel
          ref="carousel"
          :arrow="issueFile.length === 1 ? 'never' : 'hover'"
          :autoplay="false"
          :height="device === 'desktop' ? '70vh' : 'calc(100vh - 150px)'"
          :initial-index="previewIndex"
          indicator-position="none"
          trigger="click"
          @change="changeCarousel"
        >
          <el-carousel-item
            v-for="item in issueFile"
            :key="item.id"
            class="max-w-[100%] max-h-[100%]"
          >
            <img
              v-if="item.content_type.includes('image')"
              ref="image"
              :alt="item.filename"
              :class="device === 'mobile' ? 'carousel-image' : ''"
              :src="item.content_url"
              class="block m-auto max-w-[100%] max-h-[100%]"
              @load="resizeImageHeight"
            />
            <audio
              v-else-if="item.content_type.includes('audio')"
              class="block m-auto"
              controls
            >
              <source :src="item.content_url" :type="item.type" />
            </audio>
            <video
              v-else-if="item.content_type.includes('video')"
              class="block m-auto max-w-[90%] max-h-[90%] z-10"
              controls
            >
              <source :src="item.content_url" :type="item.type" />
            </video>
            <el-empty
              v-else
              :image-size="100"
              description="No preview available"
            />
          </el-carousel-item>
        </el-carousel>
      </div>
      <span slot="footer">
        <el-button v-if="device === 'desktop'" @click="dialogVisible = false">{{
          $t('general.Close')
        }}</el-button>
        <el-button
          :class="device === 'mobile' ? 'w-full' : ''"
          type="primary"
          @click="downloadImage"
        >
          <span>{{ $t('File.Download') }}</span>
        </el-button>
      </span>
    </component>
  </el-row>
</template>

<script>
import { deleteIssueAttachment } from '@/api_v3/attachments'
import { getLocalTime } from '@shared/utils/handleTime'
import { mapGetters } from 'vuex'

export default {
  name: 'IssueFiles',
  props: {
    issueId: {
      type: Number,
      default: null
    },
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
      preview: {
        filename: '',
        content_type: '',
        content_url: ''
      },
      previewIndex: 0,
      imageHeight: 0,
      clientWidth: 0,
      scrollWidth: 0
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device'])
  },
  watch: {
    // issueFile(value) {
    //   if (value.length === 0) return
    //   this.handleImageArray()
    // }
  },
  mounted() {
    // this.handleImageArray()
    this.resizeImageHeight()
    window.addEventListener('resize', this.resizeImageHeight)
    window.addEventListener('keydown', this.handleCarousel)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeImageHeight)
    window.removeEventListener('keydown', this.handleCarousel)
  },
  methods: {
    async handleDownload(row) {
      const url = row.content_url
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', row.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    async deleteIssueFile(row) {
      this.isLoading = true
      await deleteIssueAttachment(this.issueId, row.id)
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
    handlePreview(row) {
      this.previewIndex = this.issueFile.findIndex((item) => item.id === row.id)
      this.preview = this.issueFile[this.previewIndex]
      this.dialogVisible = true
      if (this.$refs.carousel !== undefined) {
        this.$refs.carousel.setActiveItem(this.previewIndex)
      }
    },
    resizeImageHeight() {
      if (this.$refs.image === undefined) return
      this.$nextTick(() => {
        this.imageHeight = this.$refs.image[this.previewIndex].height
      })
    },
    changeCarousel(index) {
      this.previewIndex = index
      this.preview = this.issueFile[index]
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
      const { content_url, filename } = this.preview
      const link = document.createElement('a')
      link.href = content_url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
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
    swipeHandler(direction) {
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
    },
    getFileIcon(fileType) {
      const type = fileType.split('/')[0]
      const iconMap = {
        image: 'el-icon-picture',
        video: 'el-icon-video-camera',
        audio: 'el-icon-headset'
      }
      return iconMap[type] || 'el-icon-document'
    }
  }
}
</script>

<style lang="scss" scoped>
.el-carousel__item {
  background-color: white;
  align-content: center;
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
