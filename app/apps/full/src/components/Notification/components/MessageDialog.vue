<template>
  <component
    :is="device === 'mobile' ? 'el-drawer' : 'el-dialog'"
    :show-close="device === 'mobile'"
    :visible.sync="dialogVisible"
    width="50%"
    direction="btt"
    class="drawer"
    size="99%"
  >
    <template slot="title">
      <component :is="device === 'mobile' ? 'h4' : 'h2'" style="margin-bottom: 12px">{{ message.title ? message.title : 'No Title' }}</component>
      <div v-if="device === 'desktop'" style="color: #45474b">{{ getLocalTime(message.created_at) }}</div>
    </template>
    <div class="border">
      <Viewer :key="componentKey" :initial-value="message.message" />
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button class="buttonSecondaryReverse" @click="dialogVisible = false">{{ $t('general.Close') }}</el-button>
    </span>
  </component>
</template>

<script>
import { getLocalTime } from '@/utils/handleTime'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import { Viewer } from '@toast-ui/vue-editor'

export default {
  name: 'MessageDialog',
  components: { Viewer },
  props: {
    message: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      dialogVisible: false,
      componentKey: 0
    }
  },
  computed: {
    device() {
      return this.$store.getters.device
    }
  },
  watch: {
    message() {
      this.componentKey += 1
    }
  },
  methods: {
    getLocalTime(value) {
      return getLocalTime(value)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-dialog__header {
  padding: 10px 20px 0px 20px
}
.border {
  border: 2px solid rgb(180, 180, 180);
  border-radius: 5px;
  border-width: medium;
  padding: 10px 10px 10px 10px
}
.drawer {
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }
  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    border-bottom: 1px solid #ebeef5;
  }
  ::v-deep .el-drawer__body::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }
  ::v-deep .el-drawer__body {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    padding: 10px;
  }
}
</style>
