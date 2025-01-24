<template>
  <div :style="{ ...style['header'] }">
    <div>
      <div v-if="!opts.title.html">
        {{ opts.title.label }}
      </div>
      <div v-if="opts.title.html" v-html="opts.title.label"></div>
    </div>
    <div>
      <el-row :gutter="10">
        <el-col :lg="2" class="col">
          <el-button size="small" type="primary" @click="recenterPosition">
            {{ opts.locale.Now }}
          </el-button>
        </el-col>
        <el-col :lg="4" :md="6" :sm="8" :xs="24" class="col">
          <el-col :span="10" class="title">
            {{ opts.locale['X-Scale'] }}
          </el-col>
          <el-col :span="14">
            <el-slider v-model="scale" :max="24" :min="2" />
          </el-col>
        </el-col>
        <el-col :lg="4" :md="6" :sm="8" :xs="24" class="col">
          <el-col :span="10" class="title">
            {{ opts.locale['Y-Scale'] }}
          </el-col>
          <el-col :span="14">
            <el-slider v-model="height" :max="100" :min="7" />
          </el-col>
        </el-col>
        <el-col :lg="4" :md="6" :sm="8" :xs="24" class="col">
          <el-col :span="10" class="title">
            {{ opts.locale['Before/After'] }}
          </el-col>
          <el-col :span="14">
            <el-slider v-model="scope" :max="31" :min="0" />
          </el-col>
        </el-col>
        <el-col :lg="4" :md="6" :sm="8" :xs="24" class="col">
          <el-col :span="10" class="title">
            {{ opts.locale['Task list width'] }}
          </el-col>
          <el-col :span="14">
            <el-slider v-model="divider" :max="100" :min="0" />
          </el-col>
        </el-col>
        <el-col :lg="4" :md="6" :sm="8" :xs="24" class="col">
          <el-col :span="10" class="title">
            {{ opts.locale['Display task list'] }}
          </el-col>
          <el-col :span="14">
            <el-switch v-model="root.state.options.taskList.display" />
          </el-col>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
const defaultStyle = {
  header: {
    padding: '10px',
    'font-size': '14px'
  }
}
const defaultOptions = {
  title: {
    label: 'gantt-elastic',
    html: false
  },
  locale: {
    Now: 'Now',
    'X-Scale': 'Zoom-X',
    'Y-Scale': 'Zoom-Y',
    'Task list width': 'Task list',
    'Before/After': 'Expand',
    'Display task list': 'Show task list'
  }
}
export default {
  name: 'GanttHeader',
  inject: ['root'],
  props: {
    options: {
      type: Object,
      default: () => ({})
    },
    dynamicStyle: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      scaleTimeoutId: null,
      firstScale: false,
      localScale: 0,
      localHeight: 0,
      localBefore: 0,
      localPercent: 0,
      sliderOptions: {
        xScale: {
          value: 0
        }
      },
      style: {},
      opts: {}
    }
  },
  computed: {
    beforeOptionsIsComponent() {
      const headerSlot = this.options.slots.header
      return (
        typeof headerSlot.beforeOptions === 'object' &&
        !Array.isArray(headerSlot.beforeOptions)
      )
    },
    beforeOptionsIsHtml() {
      return typeof this.options.slots.header.beforeOptions === 'string'
    },
    scale: {
      get() {
        return this.localScale
      },
      set(value) {
        this.localScale = Number(value)
        this.setScale(this.localScale)
      }
    },
    height: {
      get() {
        return this.localHeight
      },
      set(value) {
        this.localHeight = Number(value)
        this.root.$emit('row-height-change', Number(value))
      }
    },
    scope: {
      get() {
        return this.localBefore
      },
      set(value) {
        this.localBefore = Number(value)
        this.root.$emit('scope-change', Number(value))
      }
    },
    divider: {
      get() {
        return this.localPercent
      },
      set(value) {
        this.localPercent = Number(value)
        this.root.$emit('taskList-width-change', Number(value))
      }
    }
  },
  created() {
    this.localScale = this.root.state.options.times.timeZoom
    this.localHeight = this.root.state.options.row.height
    this.localBefore = this.root.state.options.scope.before
    this.localPercent = this.root.state.options.taskList.percent
    this.sliderOptions.xScale.value = this.root.state.options.times.timeZoom
    this.style = this.root.mergeDeep({}, defaultStyle, this.dynamicStyle)
    this.opts = this.root.mergeDeep({}, defaultOptions, this.options)
  },
  methods: {
    getImage() {
      this.root.getImage('image/png').then((imgB64) => {
        const link = document.createElement('a')
        link.href = imgB64
        link.download = 'gantt-elastic.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    },
    recenterPosition() {
      this.root.$emit('recenterPosition')
    },
    setScale(value) {
      if (this.scaleTimeoutId !== null) {
        clearTimeout(this.scaleTimeoutId)
        this.scaleTimeoutId = null
      }
      if (this.firstScale) {
        this.scaleTimeoutId = setTimeout(() => {
          this.root.$emit('times-timeZoom-change', value)
          this.scaleTimeoutId = null
        }, 50)
      } else {
        this.root.$emit('times-timeZoom-change', value)
        this.firstScale = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .col {
    display: flex;
    align-items: center;
    height: 38px;

    .title {
      font-weight: bold;
      height: 38px;
      display: flex;
      align-items: center;
      text-align: end;
      justify-content: right;
    }
  }
}
</style>
