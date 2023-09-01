<template>
  <div class="redirect-page-container">
    <img src="@/assets/logo.png" class="redirect-page-logo" alt="">
    <h1 class="redirect-page-title">{{ title }} </h1>
  </div>
</template>

<script>
import { checkLogin } from '@/api_v2/user'

export default {
  name: 'RedirectPage',
  data() {
    this.title = 'III DevOps'
    return {}
  },
  watch: {
    '$route': {
      async handler(route) {
        if (route.fullPath === '/login?redirect=%2F') {
          await checkLogin()
        }
      },
      immediate: true
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

.redirect-page-container {
  position: relative;
  min-height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #010a01;
  background-image: url("https://cdn.pixabay.com/photo/2017/02/12/12/42/wall-2059909_640.png");
  background-position: center; /* Center the image */
  background-repeat: no-repeat; /* Do not repeat the image */
  background-size: cover;
  > .redirect-page-logo {
    height: 120px;
    width: 120px;
    filter: drop-shadow(10px 10px 10px #222)
  }
  > .redirect-page-title {
    letter-spacing: 4px;
    color: #fff;
    text-shadow:
      0 0 7px #fff,
      0 0 10px #fff,
      0 0 21px #fff,
      0 0 42px #0fa,
      0 0 82px #0fa,
      0 0 92px #0fa,
      0 0 102px #0fa,
      0 0 151px #0fa;
  }
  h1 {
    animation: flicker 1.5s infinite alternate;
  }

  /* Flickering animation */
  @keyframes flicker {
    0%, 18%, 22%, 25%, 53%, 57%, 100% {
      text-shadow:
        0 0 4px #fff,
        0 0 11px #fff,
        0 0 19px #fff,
        0 0 40px #0fa,
        0 0 80px #0fa,
        0 0 90px #0fa,
        0 0 100px #0fa,
        0 0 150px #0fa;

    }

    20%, 24%, 55% {
      text-shadow: none;
    }
  }
}
</style>
