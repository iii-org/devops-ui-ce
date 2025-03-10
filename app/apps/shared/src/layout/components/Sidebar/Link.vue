<template>
  <component
    :is="type"
    v-bind="linkProps()"
  >
    <slot></slot>
  </component>
</template>

<script>
import { isExternal } from '@shared/utils/validate'

export default {
  props: {
    to: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ''
    },
    params: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    isExternal() {
      return isExternal(this.to)
    },
    type() {
      if (this.isExternal) {
        return 'a'
      }
      return 'router-link'
    }
  },
  methods: {
    linkProps() {
      if (this.isExternal) {
        return {
          href: this.to,
          target: '_blank',
          rel: 'noopener'
        }
      }
      return {
        to: {
          name: this.name,
          params: this.params
        }
      }
    }
  }
}
</script>
