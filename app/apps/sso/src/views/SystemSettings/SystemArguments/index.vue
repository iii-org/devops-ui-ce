<template>
  <div class="app-container">
    <el-tabs
      v-model="activeName"
      :tab-position="isMobile ? 'bottom' : 'left'"
      :class="isMobile ? 'mobile' : 'h-full'"
      :type="isMobile ? 'border-card' : ''"
      :stretch="isMobile"
    >
      <el-tab-pane name="redmineMail">
        <span slot="label">
          <em v-if="isMobile" class="ri-mail-settings-line text-xl align-middle" />
          <span v-else>{{ $t('System.RedmineMail') }}</span>
        </span>
        <RedmineMail ref="redmineMail" />
      </el-tab-pane>
      <el-tab-pane name="templates">
        <span slot="label">
          <em v-if="isMobile" class="ri-profile-line text-xl align-middle" />
          <span v-else>{{ $t('System.SystemTemplates') }}</span>
        </span>
        <SystemTemplates ref="templates" />
      </el-tab-pane>
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
import RedmineMail from './components/RedmineMail'
import SystemTemplates from './components/SystemTemplates'
import SystemConfigs from './components/SystemConfigs'

export default {
  name: 'SystemArguments',
  components: {
    RedmineMail,
    SystemTemplates,
    SystemConfigs
  },
  data() {
    return {
      activeName: 'redmineMail'
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
@import 'src/styles/theme/variables.scss';
/* To make el-tab content fill space, or table will not expand */
::v-deep .el-tabs__content {
  height: 100%;
}

::v-deep .el-tab-pane {
  height: 100%;
}
::v-deep .el-tabs__nav-wrap::after {
  background-color: none;
}
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
  background-color: $linkTextColor;
  border-color: $linkTextColor;
}

::v-deep .el-radio.is-bordered.is-checked {
  border-color: $linkTextColor;
}

::v-deep .el-radio__input.is-checked .el-radio__inner {
  background-color: $linkTextColor;
  border-color: $linkTextColor;
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
