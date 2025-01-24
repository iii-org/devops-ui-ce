<template>
  <div
    :style="[style, customStyle]"
    class="vue-avatar--wrapper"
    aria-hidden="true"
  >
    <!-- this img is not displayed; it is used to detect failure-to-load of div background image -->
    <img
      v-if="isImage"
      :src="src"
      style="display: none"
      alt=""
      @error="onImgError"
    />
    <span v-show="!isImage">{{ userInitial }}</span>
  </div>
</template>

<script>
const getInitials = (username) => {
  const parts = username.split(/[ -]/)
  let initials = ''
  for (const element of parts) {
    initials += element.charAt(0)
  }
  if (initials.length > 3 && initials.search(/[A-Z]/) !== -1) {
    initials = initials.replace(/[a-z]+/g, '')
  }
  initials = initials.substring(0, 3).toUpperCase()
  return initials
}

export default {
  name: 'Avatar',
  props: {
    username: {
      type: String,
      default: ''
    },
    initials: {
      type: String,
      default: ''
    },
    backgroundColor: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: ''
    },
    customStyle: {
      type: Object,
      default: () => {}
    },
    inline: {
      type: Boolean,
      default: false
    },
    size: {
      type: Number,
      default: 50
    },
    src: {
      type: String,
      default: ''
    },
    rounded: {
      type: Boolean,
      default: true
    },
    parser: {
      type: Function,
      default: getInitials,
      validator: (parser) => typeof parser('John', getInitials) === 'string'
    }
  },

  data() {
    return {
      backgroundColors: [
        '#F44336',
        '#FF4081',
        '#9C27B0',
        '#673AB7',
        '#3F51B5',
        '#2196F3',
        '#03A9F4',
        '#00BCD4',
        '#009688',
        '#4CAF50',
        '#8BC34A',
        '#CDDC39',
        /* '#FFEB3B' , */ '#FFC107',
        '#FF9800',
        '#FF5722',
        '#795548',
        '#9E9E9E',
        '#607D8B'
      ],
      imgError: false
    }
  },

  computed: {
    background() {
      if (!this.isImage) {
        return this.backgroundColor || this.randomBackgroundColor(this.username.length, this.backgroundColors)
      }
      return ''
    },
    fontColor() {
      if (!this.isImage) {
        return this.color || this.lightenColor(this.background)
      }
      return ''
    },
    isImage() {
      return !this.imgError && Boolean(this.src)
    },

    style() {
      const style = {
        display: this.inline ? 'inline-flex' : 'flex',
        width: `${this.size}px`,
        height: `${this.size}px`,
        borderRadius: this.rounded ? '50%' : 0,
        lineHeight: `${this.size + Math.floor(this.size / 20)}px`,
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        userSelect: 'none'
      }
      const imgBackgroundAndFontStyle = {
        background: `transparent url('${this.src}') no-repeat scroll 0% 0% / ${this.size}px ${this.size}px content-box border-box`
      }
      const initialBackgroundAndFontStyle = {
        backgroundColor: this.background,
        font: `${Math.floor(this.size / 2.5)}px/${this.size}px Helvetica, Arial, sans-serif`,
        color: this.fontColor
      }
      const backgroundAndFontStyle = this.isImage ? imgBackgroundAndFontStyle : initialBackgroundAndFontStyle
      Object.assign(style, backgroundAndFontStyle)
      return style
    },
    userInitial() {
      if (!this.isImage) {
        const initials = this.initials || this.parser(this.username, getInitials)
        return initials
      }
      return ''
    }
  },

  mounted() {
    if (!this.isImage) {
      this.$emit('avatar-initials', this.username, this.userInitial)
    }
  },

  methods: {
    initial: getInitials,

    onImgError(evt) {
      this.imgError = true
    },
    randomBackgroundColor(seed, colors) {
      return colors[seed % colors.length]
    },
    lightenColor(hex) {
      if (hex[0] === '#') {
        hex = hex.slice(1)
      }
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 2), 16)
      const b = parseInt(hex.substring(4, 2), 16)
      const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))
      const theshold = 160
      // sets the foreground color
      if (hsp > theshold) return '#000000'
      return '#ffffff'
    }
  }
}
</script>
