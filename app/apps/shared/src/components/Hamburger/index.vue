<template>
  <div style="padding: 0 15px;" @click="toggleClick">
    <em
      :class="{'is-active':isActive}"
      class="ri-indent-increase text-xl hamburger"
    />
  </div>
</template>

<script>
export default {
  name: 'Hamburger',
  props: {
    isActive: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    toggleClick() {
      this.$emit('toggleClick')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
.hamburger {
  display: inline-block;
  vertical-align: middle;
}

.hamburger.is-active {
  transform: rotate(180deg);
}
</style>
