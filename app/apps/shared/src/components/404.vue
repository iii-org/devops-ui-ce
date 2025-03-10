<template>
  <div class="error-container">
    <h1 class="text-primary mb-1">喔哦！找不到網頁</h1>
    <h4 class="text-gray-500 mt-1">Oops! Page not found.</h4>
    <img alt="404 error image" src="../assets/404_images/NotFound.svg" />
    <el-button round type="primary" @click="onClick">
      {{ $t('general.BackToHome') }}
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'Page404',
  methods: {
    onClick() {
      this.$router.push('/')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: $appMainBg;
}
</style>
