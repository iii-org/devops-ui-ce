<template>
  <el-tooltip
    :content="$t('SystemVersion.hasUpdate')"
    placement="bottom"
    popper-class="update-tooltip"
  >
    <!--    <span class="flex items-center right-menu" @click="toPage">-->
    <!--      <em-->
    <!--        class="ri-price-tag-2-fill text-xl text-success cursor-pointer swing"-->
    <!--      ></em>-->
    <!--    </span>-->
    <el-button
      class="px-2 py-1 font-semibold"
      plain
      round
      size="mini"
      type="success"
      @click="toPage"
    >
      Update Version
    </el-button>
  </el-tooltip>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'VersionChecker',
  data() {
    return {}
  },
  computed: {
    ...mapGetters(['userRole', 'hasSystemUpdate', 'updateVersionName']),
    showUpdateButton() {
      return (
        this.userRole === 'sysadmin' &&
        this.hasSystemUpdate &&
        this.$route.name !== 'SystemVersion' &&
        this.updateVersionName !== 'develop'
      )
    }
  },
  mounted() {
    if (this.userRole === 'sysadmin') this.checkApiVersion()
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
@import 'src/styles/theme/variables.module.scss';

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
