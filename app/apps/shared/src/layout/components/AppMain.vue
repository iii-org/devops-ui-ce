<template>
  <section class="app-main">
    <transition mode="out-in" name="fade-transform">
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
  width: 100%;
  position: relative;
  overflow: hidden;
  //background-color: $appMainBg; /* theme_discussion main background*/
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
