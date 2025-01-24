<template>
  <div class="wheel-item-container">
    <div class="wheel-item-line"></div>
    <div class="wheel-item-list">
      <div ref="list">
        <div
          v-for="(el, idx) in renderData"
          :key="idx"
          class="list-block truncate"
        >
          {{ el.value }}
        </div>
      </div>
    </div>
    <div ref="wheel" class="wheel-item">
      <div
        v-for="(el, index) in renderData"
        :key="index"
        :class="{ hidden: setHidden(el.index) }"
        :style="setWheelItemDeg(el.index)"
        class="list-block truncate"
      >
        {{ el.value }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WheelItem',
  props: {
    listData: {
      type: Array,
      required: true
    },
    type: {
      type: String,
      default: 'line'
    },
    value: {
      type: [String, Number],
      default: ''
    },
    dataType: {
      type: String,
      default: 'String'
    }
  },
  data() {
    return {
      finger: { startY: 0, lastY: 0, startTime: 0, lastTime: 0, translateY: 0 },
      spin: { start: -9, end: 9, branch: 9 }
    }
  },
  computed: {
    renderData() {
      const temp = []
      for (let k = this.spin.start; k <= this.spin.end; k++) {
        const data = {
          value: this.getSpinData(k),
          index: k
        }
        temp.push(data)
      }
      return temp
    }
  },
  // watch: {
  //   listData: {
  //     handler(newVal) {
  //       if (this.dataType === 'number') {
  //         this.autoUpdate()
  //       } else {
  //         this.autoUpdate(newVal)
  //       }
  //     },
  //     deep: true
  //   }
  // },
  mounted() {
    this.$el.addEventListener('touchstart', this.itemTouchStart)
    this.$el.addEventListener('touchmove', this.itemTouchMove)
    this.$el.addEventListener('touchend', this.itemTouchEnd)
    this.autoUpdate(this.value)
  },
  beforeDestroy() {
    this.$el.removeEventListener('touchstart', this.itemTouchStart)
    this.$el.removeEventListener('touchmove', this.itemTouchMove)
    this.$el.removeEventListener('touchend', this.itemTouchEnd)
  },
  methods: {
    autoUpdate(val) {
      if (val || val === '' || val === undefined) {
        if (this.listData.length > 0) {
          const index = this.listData.indexOf(val)
          if (index === -1) {
            this.setListTransform()
            this.getPickValue(0)
          } else {
            const move = index * 34
            /* 因为往上滑动所以是负 */
            this.setStyle(-move)
            this.setListTransform(-move, -move)
            this.getPickValue(move)
          }
        }
      } else {
        if (
          this.listData.length < Number(this.value) &&
          this.dataType === 'number'
        ) {
          const move = this.listData.length * 34
          this.setStyle(-move)
          this.setListTransform(-move, -move)
          this.$emit('input', this.listData[this.listData.length - 1])
        }
      }
    },
    setHidden(index) {
      if (this.type === 'line') {
        return index < 0 || index > this.listData.length - 1
      } else {
        return false
      }
    },
    setWheelItemDeg(index) {
      return {
        transform: `rotate3d(1, 0, 0, ${
          (-index * 20) % 360
        }deg) translate3d(0px, 0px, 100px)`
      }
    },
    setWheelDeg(updateDeg, type, time = 1000) {
      if (type === 'end') {
        this.$refs.wheel.style.webkitTransition = `transform ${time}ms cubic-bezier(0.19, 1, 0.22, 1)`
        this.$refs.wheel.style.webkitTransform = `rotate3d(1, 0, 0, ${updateDeg}deg)`
      } else {
        this.$refs.wheel.style.webkitTransition = ''
        this.$refs.wheel.style.webkitTransform = `rotate3d(1, 0, 0, ${updateDeg}deg)`
      }
    },
    setListTransform(translateY = 0, marginTop = 0, type = '', time = 1000) {
      if (type === 'end') {
        this.$refs.list.style.webkitTransition = `transform ${time}ms cubic-bezier(0.19, 1, 0.22, 1)`
        this.$refs.list.style.webkitTransform = `translateY(${
          translateY - this.spin.branch * 34
        }px)`
        this.$refs.list.style.marginTop = `${-marginTop}px`
        this.$refs.list.setAttribute('scroll', translateY)
      } else {
        this.$refs.list.style.webkitTransition = ''
        this.$refs.list.style.webkitTransform = `translateY(${
          translateY - this.spin.branch * 34
        }px)`
        this.$refs.list.style.marginTop = `${-marginTop}px`
        this.$refs.list.setAttribute('scroll', translateY)
      }
    },
    itemTouchStart(evt) {
      const finger = evt.changedTouches[0]
      this.finger.startY = finger.pageY
      this.finger.startTime = evt.timestamp || Date.now()
      this.finger.transformY = this.$refs.list.getAttribute('scroll')
      evt.preventDefault()
    },
    itemTouchMove(evt) {
      const finger = evt.changedTouches[0]
      this.finger.lastY = finger.pageY
      this.finger.lastTime = evt.timestamp || Date.now()
      /* 设置css */
      const move = this.finger.lastY - this.finger.startY
      this.setStyle(move)
      evt.preventDefault()
    },
    itemTouchEnd(evt) {
      const finger = evt.changedTouches[0]
      this.finger.lastY = finger.pageY
      this.finger.lastTime = evt.timestamp || Date.now()
      let move = this.finger.lastY - this.finger.startY
      /* 计算速度 */
      /* 速度计算说明
       * 当时间小于300毫秒 最后的移动距离等于 move + 减速运动距离
       * */
      let time = this.finger.lastTime - this.finger.startTime
      const v = move / time
      /* 减速加速度a */
      const a = 1.8
      /* 设置css */
      if (time <= 300) {
        move = v * a * time
        time = 1000 + time * a
        this.setStyle(move, 'end', time)
      } else {
        this.setStyle(move, 'end')
      }
    },
    setStyle(move, type, time) {
      const singleHeight = 34
      const deg = 20
      const singleDeg = deg / singleHeight
      const currentListMove = this.finger.transformY || 0
      let updateMove = move + Number(currentListMove)
      /* 根据滚轮类型 line or cycle 判断 updateMove最大距离 */
      if (this.type === 'line') {
        if (updateMove > 0) {
          updateMove = 0
        }
        if (updateMove < -(this.listData.length - 1) * singleHeight) {
          updateMove = -(this.listData.length - 1) * singleHeight
        }
      }
      const updateDeg = -updateMove * singleDeg
      const spinAim = Math.round(updateDeg / 20)
      const margin = Math.round(updateMove / singleHeight) * singleHeight // 如果不这么写 会导致没有滚动效果
      /* 计算touchEnd移动的整数距离 */
      const endMove = margin
      const endDeg = Math.round(updateDeg / deg) * deg
      if (type === 'end') {
        this.setListTransform(endMove, margin, type, time)
        this.setWheelDeg(endDeg, type, time)
        /* 设置$emit 延迟 */
        setTimeout(() => this.getPickValue(endMove), 500)
      } else {
        this.setListTransform(updateMove, margin)
        this.setWheelDeg(updateDeg)
      }
      this.updateSpin(spinAim)
    },
    /* 更新spin */
    updateSpin(spinAim) {
      this.spin.start = this.spin.branch * -1 + spinAim
      this.spin.end = this.spin.start + this.spin.branch * 2
    },
    /* 获取spin 数据 */
    getSpinData(index) {
      index = index % this.listData.length
      return this.listData[index >= 0 ? index : index + this.listData.length]
    },
    /* 获取选中值 */
    getPickValue(move) {
      const index = Math.abs(move / 34)
      const pickValue = this.getSpinData(index)
      this.$emit('input', pickValue)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

.wheel-item-container {
  position: relative;
  height: 220px;
  line-height: 1.8;
  overflow: hidden;
  text-align: center;
  background: #fff;
  width: 100%;
}

.wheel-item-container > .wheel-item-line,
.wheel-item-container > .wheel-item-list,
.wheel-item-container > .wheel-item {
  position: absolute;
  left: 0;
  right: 0;
  top: 93px;
  transform-style: preserve-3d;
  height: 34px;
  z-index: 1;
}

.wheel-item-container > .wheel-item-line:before,
.wheel-item-container > .wheel-item-line:after {
  @include css-prefix(transform, scaleY(0.5));
  @include css-prefix(transform-origin, 0 0);
  position: absolute;
  top: 0;
  content: '';
  display: table;
  background: #2c97f1;
  height: 2px;
}

.wheel-item-container > .wheel-item-line:before {
  bottom: -1px;
  top: auto;
}

.wheel-item-container > .wheel-item-line {
  z-index: 3;
}

.wheel-item-container > .wheel-item-list {
  z-index: 2;
  background: #fff;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}

.wheel-item-container > .wheel-item-line,
.wheel-item-container > .wheel-item-list {
  height: 34px;
  transform: translate3d(0px, 0px, 110px);
  overflow: hidden;
}

.wheel-item-container > .wheel-item-list .list-block,
.wheel-item-container > .wheel-item > .list-block {
  line-height: 34px;
  font-size: 20px;
  font-family: 'JetBrains Mono', sans-serif;
}

.wheel-item-container > .wheel-item-list > .list-block.hidden,
.wheel-item-container > .wheel-item > .list-block.hidden {
  visibility: hidden;
  opacity: 0;
}

.wheel-item-container > .wheel-item > .list-block {
  backface-visibility: hidden;
  position: absolute;
  top: 0;
  width: 100%;
  color: #a8a8a8;
  font-size: 18px;
  font-weight: lighter;
}
</style>
