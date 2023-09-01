<template>
  <el-tooltip :content="$t('SystemVersion.hasUpdate')" placement="bottom" popper-class="update-tooltip">
    <span class="flex items-center right-menu" @click="toPage">
      <em class="ri-notification-4-fill text-2xl text-success cursor-pointer swing" />
    </span>
  </el-tooltip>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'VersionChecker',
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters(['userRole', 'hasSystemUpdate', 'updateVersionName']),
    showUpdateButton() {
      return this.userRole === 'Administrator' && this.hasSystemUpdate && this.$route.name !== 'SystemVersion' && this.updateVersionName !== 'develop'
    }
  },
  mounted() {
    if (this.userRole === 'Administrator') this.checkApiVersion()
  },
  methods: {
    ...mapActions('settings', ['checkApiVersion']),
    toPage() {
      this.$router.push({ name: 'SystemVersion' })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
.swing {
  animation: swing 1.5s infinite;
}
.right-menu {
  padding: 0 7px;
  height: 100%;
  &:hover {
    background: $navbarHover;
    border-radius: 6px;
    transition: background 0.3s;
  }
}
</style>
