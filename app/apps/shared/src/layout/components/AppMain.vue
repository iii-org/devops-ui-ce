<template>
  <section class="app-main">
    <transition
      name="fade-transform"
      mode="out-in"
    >
      <router-view :key="key" />
    </transition>
  </section>
</template>

<script>
export default {
  name: 'AppMain',
  computed: {
    key() {
      return this.$route.path
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
.app-main {
  height: calc(100% - 50px); /* 50px is the nav bar */
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: $appMainBg; /* theme_discussion main background*/
}

.fixed-header + .app-main {
  padding-top: 50px;
}

.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
