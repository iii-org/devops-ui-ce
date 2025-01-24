<template>
  <div
    :id="position + '-wrapper'"
    :style="[pos, { zIndex: zIndex }, { position: positionType }]"
    class="fab-wrapper"
  >
    <div :id="position + '-action'" :style="listPos" class="actions-container">
      <transition
        :enter-active-class="transitionEnter"
        :leave-active-class="transitionLeave"
        name="fab-actions-appear"
      >
        <ul v-show="toggle" class="fab-list">
          <transition
            v-for="action in actions"
            :key="action.name"
            enter-active-class="animated quick zoomIn"
            leave-active-class="animated quick zoomOut"
            name="fab-actions-appear"
          >
            <template>
              <li
                v-if="toggle"
                :style="{ 'background-color': action.color || bgColor }"
                class="pointer"
                @click="toParent(action.name)"
              >
                <em
                  :class="[action.icon, 'text-white icons', actionIconSize]"
                ></em>
              </li>
            </template>
          </transition>
        </ul>
      </transition>
    </div>
    <template v-if="rippleShow">
      <template>
        <div
          :style="{ 'background-color': bgColor, padding: paddingAmount }"
          class="fab-main pointer"
          @click="toggle = !toggle"
        >
          <em
            :class="[
              mainIconSize,
              { rotate: toggle && allowRotation },
              mainIcon,
              'text-white icons main'
            ]"
          ></em>
          <em
            :class="[
              mainIconSize,
              { rotate: toggle && allowRotation },
              'ri-add-large-line text-white icons close'
            ]"
          ></em>
        </div>
      </template>
    </template>
    <template v-else>
      <template>
        <div
          :style="{ 'background-color': bgColor, padding: paddingAmount }"
          class="fab-main pointer"
        >
          <em
            :class="[{ rotate: toggle && allowRotation }, mainIcon]"
            class="md-36 text-white icons main"
          ></em>
          <em
            :class="{ rotate: toggle && allowRotation }"
            class="md-36 ri-add-large-line text-white icons close"
          ></em>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
import Ripple from 'vue-ripple-directive'

export default {
  directives: { Ripple },
  props: {
    bgColor: {
      type: String,
      default: '#333333'
    },
    position: {
      type: String,
      default: 'bottom-right'
    },
    positionType: {
      type: String,
      default: 'fixed'
    },
    zIndex: {
      type: String,
      default: '999'
    },
    rippleShow: {
      type: Boolean,
      default: true
    },
    rippleColor: {
      type: String,
      default: 'light'
    },
    mainIcon: {
      type: String,
      default: 'add'
    },
    iconSize: {
      type: String,
      default: 'medium'
    },
    enableRotation: {
      type: Boolean,
      default: true
    },
    actions: {
      type: Array,
      default: () => []
    },
    startOpened: {
      type: Boolean,
      default: false
    },
    toggleWhenAway: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      toggle: this.startOpened,
      pos: {},
      tooltipPosition: 'left'
    }
  },
  computed: {
    actionIconSize() {
      switch (this.iconSize) {
        case 'small':
          return 'md-18'
        case 'medium':
          return 'md-24'
        case 'large':
          return 'md-36'
        default:
          return 'md-24'
      }
    },
    allowRotation() {
      return this.enableRotation && this.actions && !!this.actions.length
    },
    mainIconSize() {
      switch (this.iconSize) {
        case 'small':
          return 'md-18'
        case 'medium':
          return 'md-24'
        case 'large':
          return 'md-36'
        default:
          return 'md-24'
      }
    },
    paddingAmount() {
      switch (this.iconSize) {
        case 'small':
          return '28px'
        case 'medium':
          return '32px'
        case 'large':
          return '38px'
        default:
          return '32px'
      }
    },
    listPos() {
      if (this.position === 'top-right' || this.position === 'top-left') {
        return {
          top: '-20px',
          paddingTop: '20px'
        }
      }
      return {
        bottom: '-20px',
        paddingBottom: '20px'
      }
    },
    transitionEnter() {
      const animation = this.animation
      return animation.enter
    },
    transitionLeave() {
      const animation = this.animation
      return animation.leave
    },
    animation() {
      if (this.position === 'top-right' || this.position === 'top-left') {
        return {
          enter: 'animated quick fadeInDown',
          leave: 'animated quick fadeOutUp'
        }
      } else if (
        this.position === 'bottom-right' ||
        this.position === 'bottom-left'
      ) {
        return {
          enter: 'animated quick fadeInUp',
          leave: 'animated quick fadeOutDown'
        }
      } else {
        return {
          enter: 'animated fadeInUp',
          leave: 'animated fadeOutDown'
        }
      }
    },
    tooltipTrigger() {
      if (this.fixedTooltip) {
        return 'manual'
      }

      return 'hover'
    }
  },
  watch: {
    position(val) {
      this.setPosition()

      this.$nextTick(() => {
        this.moveTransition()
        this.tooltipPos()
      })
    }
  },
  mounted() {
    this.moveTransition()
  },
  created() {
    this.setPosition()

    if (this.startOpened) {
      this.showTooltip(this.tooltipTimeOutWhenStartOpened)
    }
  },
  methods: {
    tooltipPos() {
      if (this.position === 'top-right' || this.position === 'bottom-right') {
        this.tooltipPosition = 'left'
      } else {
        this.tooltipPosition = 'right'
      }
    },
    toParent(name) {
      this.$emit(name)
      this.toggle = false
    },
    away() {
      if (this.toggleWhenAway) {
        this.toggle = false
      }
    },
    setPosition() {
      this.pos = {}
      switch (this.position) {
        case 'bottom-left':
          this.pos.left = '5vw'
          this.pos.bottom = '4vh'
          break
        case 'top-left':
          this.pos.left = '5vw'
          this.pos.top = '4vh'
          break
        case 'top-right':
          this.pos.right = '5vw'
          this.pos.top = '4vh'
          break
        default:
          this.pos.right = '5vw'
          this.pos.bottom = '4vh'
      }
    },
    moveTransition() {
      const wrapper = document.getElementById(this.position + '-wrapper')
      const el = document.getElementById(this.position + '-action')

      if (this.position === 'top-right' || this.position === 'top-left') {
        wrapper.appendChild(el)
      } else {
        wrapper.insertBefore(el, wrapper.childNodes[0])
      }
    },
    showTooltip(timeOut = 0) {
      if (this.toggle && this.actions.length && this.fixedTooltip) {
        setTimeout(() => {
          this.$refs.actions.forEach((item) => {
            if (this.toggle) {
              item._tooltip.show()
            }
          })
        }, timeOut)
      }
    },
    afterActionsTransitionEnter() {
      this.showTooltip()
    }
  }
}
</script>

<style lang="scss" scoped>
.animated.quick {
  -webkit-animation-duration: 0.7s !important;
  animation-duration: 0.7s !important;
}

.fab-wrapper {
  z-index: 999;
  bottom: 40px !important;
}

.fab-main {
  border-radius: 100px;
  /*width: 65px;*/
  /*height: 65px;*/
  padding: 22px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2), 0 4px 4px rgba(0, 0, 0, 0.15);
  z-index: 2;
  justify-content: center;
}

.fab-main .icons {
  color: white;
  -webkit-transition: 0.4s all;
  -moz-transition: 0.4s all;
  transition: 0.4s all;
  margin: 0px auto;
}

.fab-main .icons.main {
  opacity: 1;
  position: absolute;
}

.fab-main .icons.close {
  opacity: 0;
  position: absolute;
}

.fab-main .icons.main.rotate {
  -ms-transform: rotate(315deg); /* IE 9 */
  -webkit-transform: rotate(315deg); /* Chrome, Safari, Opera */
  transform: rotate(315deg);
  opacity: 0;
  -webkit-transition: opacity 0.3s ease-in, -webkit-transform 0.4s; /* Safari */
  transition: opacity 0.3s ease-in, transform 0.4s;
}

.fab-main .icons.close.rotate {
  -ms-transform: rotate(315deg); /* IE 9 */
  -webkit-transform: rotate(315deg); /* Chrome, Safari, Opera */
  transform: rotate(315deg);
  opacity: 1;
  -webkit-transition: opacity 0.3s ease-in, -webkit-transform 0.4s; /* Safari */
  transition: opacity 0.3s ease-in, transform 0.4s;
}

.fab-list {
  position: relative;
  z-index: 1;
  margin: 2vh 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fab-list li {
  /*width: 50px;*/
  /*height: 50px;*/
  padding: 10px;
  margin-top: 2vh;
  display: flex;
  align-items: center;
  border-radius: 100px;
  box-shadow: 0 5px 5px rgba(0, 0, 0, 0.2), 0 4px 4px rgba(0, 0, 0, 0.15);
}

.fab-list li .icons {
  color: white;
  margin: 0px auto;
}

.pointer {
  cursor: pointer;
}

ul {
  list-style-type: none;
  padding: 0 !important;
}

.fab-wrapper .actions-container {
  overflow: hidden;
  z-index: 0;
  position: relative;
}

/* Rules for sizing the icon. */
.icons.md-18 {
  font-size: 18px;
  height: 18px;
  width: 18px;
}

.icons.md-24 {
  font-size: 24px;
  height: 24px;
  width: 24px;
}

.icons.md-36 {
  font-size: 36px;
  height: 36px;
  width: 36px;
}

.icons.md-48 {
  font-size: 48px;
  height: 48px;
  width: 48px;
}

/* Rules for using icons as black on a light background. */
.icons.md-dark {
  color: rgba(0, 0, 0, 0.54);
}

.icons.md-dark.md-inactive {
  color: rgba(0, 0, 0, 0.26);
}

/* Rules for using icons as white on a dark background. */
.icons.md-light {
  color: rgba(255, 255, 255, 1);
}

.icons.md-light.md-inactive {
  color: rgba(255, 255, 255, 0.3);
}

@media screen and (max-width: 768px) {
  .fab-list {
    margin: 2vh 0;
  }
}
</style>
