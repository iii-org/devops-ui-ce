<template>
  <transition name="viewer-fade">
    <div
      ref="el-image-viewer__wrapper"
      :style="{ 'z-index': viewerZIndex }"
      class="el-image-viewer__wrapper"
      tabindex="-1"
    >
      <div class="el-image-viewer__mask"></div>
      <div v-touch:swipe="swipeHandler">
        <span
          class="el-image-viewer__btn el-image-viewer__close z-[5000]"
          @click="hide"
        >
          <em class="el-icon-close"></em>
        </span>
        <el-carousel
          ref="carousel"
          :arrow="mediaList.length === 1 ? 'never' : 'hover'"
          :autoplay="false"
          :initial-index="previewIndex"
          class="block m-auto"
          height="100vh"
          indicator-position="none"
          trigger="click"
          @change="changeCarousel"
        >
          <el-carousel-item
            v-for="item in mediaList"
            :key="item.id"
            class="max-w-[100%] max-h-[100%] flex m-auto"
          >
            <img
              v-if="item.content_type.includes('image')"
              ref="image"
              :alt="item.filename"
              :class="device === 'mobile' ? 'carousel-image' : ''"
              :src="item.content_url"
              :style="imgStyle"
              class="block m-auto max-w-[80%] max-h-[80%] bg-cover"
              @error="handleImgError"
              @load="handleImgLoad"
              @mousedown="handleMouseDown"
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
              class="block m-auto max-w-[80%] max-h-[80%] z-10"
              controls
            >
              <source :src="item.content_url" :type="item.type" />
            </video>
            <el-empty
              v-else
              :image-size="100"
              class="m-auto"
              description="No preview available"
            />
            <div
              v-if="item.content_type.includes('image')"
              :key="`${item.content_url}_actions`"
              class="el-image-viewer__btn el-image-viewer__actions"
            >
              <div class="el-image-viewer__actions__inner">
                <em
                  class="el-icon-zoom-out cursor-pointer"
                  @click="handleActions('zoomOut')"
                ></em>
                <em
                  class="el-icon-zoom-in cursor-pointer"
                  @click="handleActions('zoomIn')"
                ></em>
                <em class="el-image-viewer__actions__divider"></em>
                <em
                  class="el-icon-download cursor-pointer"
                  @click="handleDownload(item)"
                ></em>
                <em class="el-image-viewer__actions__divider"></em>
                <em
                  class="el-icon-refresh-left cursor-pointer"
                  @click="handleActions('anticlockwise')"
                ></em>
                <em
                  class="el-icon-refresh-right cursor-pointer"
                  @click="handleActions('clockwise')"
                ></em>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>
  </transition>
</template>
<script>
import { mapGetters } from 'vuex'
import { off, on } from 'element-ui/src/utils/dom'
import { isFirefox, rafThrottle } from 'element-ui/src/utils/util'
import { PopupManager } from 'element-ui/src/utils/popup'

const mousewheelEventName = isFirefox() ? 'DOMMouseScroll' : 'mousewheel'

export default {
  props: {
    mediaList: {
      type: Array,
      default: () => []
    },
    onClose: {
      type: Function,
      default: () => {}
    },
    maskClosable: {
      type: Boolean,
      default: true
    },
    zIndex: {
      type: Number,
      default: 3000
    },
    initialIndex: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      previewIndex: this.initialIndex,
      preview: {
        filename: '',
        content_type: '',
        content_url: ''
      },
      infinite: true,
      loading: false,
      transform: {
        scale: 1,
        deg: 0,
        offsetX: 0,
        offsetY: 0,
        enableTransition: false
      }
    }
  },
  computed: {
    ...mapGetters(['device']),
    imgStyle() {
      const { scale, deg, offsetX, offsetY, enableTransition } = this.transform
      const style = {
        transform: `scale(${scale}) rotate(${deg}deg)`,
        transition: enableTransition ? 'transform .3s' : '',
        'margin-left': `${offsetX}px`,
        'margin-top': `${offsetY}px`
      }
      return style
    },
    viewerZIndex() {
      const nextZIndex = PopupManager.nextZIndex()
      return this.zIndex > nextZIndex ? this.zIndex : nextZIndex
    }
  },
  mounted() {
    this.deviceSupportInstall()
  },
  methods: {
    swipeHandler(direction) {
      switch (direction) {
        case 'left':
          this.next()
          break
        case 'right':
          this.prev()
          break
        default:
          break
      }
    },
    changeCarousel(index) {
      this.previewIndex = index
      this.preview = this.mediaList[index]
      this.reset()
    },
    hide() {
      this.deviceSupportUninstall()
      this.onClose()
    },
    deviceSupportInstall() {
      this._keyDownHandler = (e) => {
        e.stopPropagation()
        const keyCode = e.keyCode
        switch (keyCode) {
          // ESC
          case 27:
            this.hide()
            break
          // LEFT_ARROW
          case 37:
            this.prev()
            break
          // UP_ARROW
          case 38:
            this.handleActions('zoomIn')
            break
          // RIGHT_ARROW
          case 39:
            this.next()
            break
          // DOWN_ARROW
          case 40:
            this.handleActions('zoomOut')
            break
        }
      }
      this._mouseWheelHandler = rafThrottle((e) => {
        const delta = e.wheelDelta ? e.wheelDelta : -e.detail
        if (delta > 0) {
          this.handleActions('zoomIn', {
            zoomRate: 0.015,
            enableTransition: false
          })
        } else {
          this.handleActions('zoomOut', {
            zoomRate: 0.015,
            enableTransition: false
          })
        }
      })
      on(document, 'keydown', this._keyDownHandler)
      on(document, mousewheelEventName, this._mouseWheelHandler)
    },
    deviceSupportUninstall() {
      off(document, 'keydown', this._keyDownHandler)
      off(document, mousewheelEventName, this._mouseWheelHandler)
      this._keyDownHandler = null
      this._mouseWheelHandler = null
    },
    handleImgLoad() {
      this.loading = false
    },
    handleImgError(e) {
      this.loading = false
      e.target.alt = 'Failed to load'
    },
    handleMouseDown(e) {
      if (this.loading || e.button !== 0) return

      const { offsetX, offsetY } = this.transform
      const startX = e.pageX
      const startY = e.pageY
      this._dragHandler = rafThrottle((ev) => {
        this.transform.offsetX = offsetX + ev.pageX - startX
        this.transform.offsetY = offsetY + ev.pageY - startY
      })
      on(document, 'mousemove', this._dragHandler)
      on(document, 'mouseup', () => {
        off(document, 'mousemove', this._dragHandler)
      })

      e.preventDefault()
    },
    reset() {
      this.transform = {
        scale: 1,
        deg: 0,
        offsetX: 0,
        offsetY: 0,
        enableTransition: false
      }
    },
    prev() {
      if (!this.$refs.carousel) return
      this.$refs.carousel.prev()
    },
    next() {
      if (!this.$refs.carousel) return
      this.$refs.carousel.next()
    },
    handleActions(action, options = {}) {
      if (this.loading) return
      const { zoomRate, rotateDeg, enableTransition } = {
        zoomRate: 0.2,
        rotateDeg: 90,
        enableTransition: true,
        ...options
      }
      const { transform } = this
      switch (action) {
        case 'zoomOut':
          if (transform.scale > 0.2) {
            transform.scale = parseFloat(
              (transform.scale - zoomRate).toFixed(3)
            )
          }
          break
        case 'zoomIn':
          transform.scale = parseFloat((transform.scale + zoomRate).toFixed(3))
          break
        case 'clockwise':
          transform.deg += rotateDeg
          break
        case 'anticlockwise':
          transform.deg -= rotateDeg
          break
      }
      transform.enableTransition = enableTransition
    },
    async handleDownload(row) {
      this.isDownloading = true
      const url = row.content_url
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', row.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      this.isDownloading = false
    }
  }
}
</script>
<style lang="scss" scoped>
::v-deep .el-carousel__arrow {
  background-color: whitesmoke;
  color: #2d3a4b;
}
</style>
