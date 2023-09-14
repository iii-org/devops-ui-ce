<template>
  <div class="app-container">
    <el-tabs
      v-model="activeName"
      :tab-position="isMobile ? 'bottom' : 'left'"
      :class="isMobile ? 'mobile' : 'h-full'"
      :type="isMobile ? 'border-card' : ''"
      :stretch="isMobile"
    >
      <el-tab-pane :label="$t('System.SystemConfigs')" name="configs">
        <span slot="label">
          <em v-if="isMobile" class="ri-tools-line text-xl align-middle" />
          <span v-else>{{ $t('System.SystemConfigs') }}</span>
        </span>
        <SystemConfigs ref="configs" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import SystemConfigs from './components/SystemConfigs'

export default {
  name: 'SystemArguments',
  components: {
    SystemConfigs
  },
  data() {
    return {
      activeName: 'configs'
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

/* To make el-tab content fill space, or table will not expand */
::v-deep .el-tabs__content {
  height: 100%;
}

::v-deep .el-tab-pane {
  height: 100%;
}

@import 'src/styles/theme/variables.scss';
::v-deep .el-tabs__item {
  &:hover {
    color: $linkTextColor;
  }
  &.is-active{
    color: $linkTextColor !important;
  }
}

::v-deep .el-tabs__active-bar {
  background-color: $linkTextColor;
}

::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
  @include background-border-color($linkTextColor, $linkTextColor);
}

::v-deep .el-radio.is-bordered.is-checked {
  border-color: $linkTextColor;
}

::v-deep .el-radio__input.is-checked .el-radio__inner {
  @include background-border-color($linkTextColor, $linkTextColor);
}

::v-deep .el-radio__input.is-checked+.el-radio__label {
  color: $linkTextColor;
}

::v-deep .el-radio__inner:hover {
  border-color: $linkTextColor;
}
.mobile {
  ::v-deep .el-tabs__content {
    height: auto;
    padding-bottom: 60px;
  }
  ::v-deep .el-tab-pane {
    height: auto;
  }
  ::v-deep .el-tabs__header {
    position: fixed;
    bottom: 0px;
    left: 0px;
    z-index: 1000;
    width: 100%;
    padding: 0;
  }
  ::v-deep .el-tabs__item{
    padding: 0 12px !important;
    height: 50px;
  }
}
</style>
