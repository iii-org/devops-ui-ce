<template>
  <component
    :is="isMobile ? 'el-drawer' : 'el-dialog'"
    :close-on-click-modal="false"
    :show-close="isMobile"
    :visible.sync="dialogVisible"
    append-to-body
    class="drawer"
    direction="btt"
    size="99%"
    top="5%"
    width="50%"
  >
    <template slot="title">
      <component :is="isMobile ? 'h4' : 'h3'" style="margin-bottom: 6px">
        {{ message?.title || 'No Title' }}
      </component>
      <div v-if="!isMobile" class="text-sm">
        <em class="el-icon-time mr-1"></em>{{ getLocalTime(message.created_at) }}
      </div>
    </template>
    <div class="bg-gray-50 rounded px-3 py-1">
      <Viewer
        :key="componentKey"
        :initial-value="
          message.content === '' ? $t('general.NoContent') : message.content
        "
      />
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button
        size="small"
        @click="
          () => {
            dialogVisible = false
          }
        "
      >{{ $t('general.Close') }}</el-button>
    </span>
  </component>
</template>

<script>
import { getLocalTime } from '@shared/utils/handleTime'
import { mapGetters } from 'vuex'

export default {
  name: 'MessageDialog',
  components: {
    Viewer: () => import('@toast-ui/vue-editor').then(({ Viewer }) => Viewer)
  },
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
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    message() {
      this.componentKey += 1
    }
  },
  async created() {
    await import('@toast-ui/editor/dist/toastui-editor-viewer.css')
  },
  methods: {
    getLocalTime(value) {
      return getLocalTime(value)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

::v-deep .el-dialog__header {
  padding: 1px 20px 10px 20px;
  background-color: $primary;
  border-radius: 8px 8px 0 0;
  color: #fff;
}

.drawer {
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }

  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    border-bottom: 1px solid #ebeef5;
    padding: 10px;
  }

  ::v-deep .el-drawer__body::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }

  ::v-deep .el-drawer__body {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    padding: 10px;
  }
}
</style>
