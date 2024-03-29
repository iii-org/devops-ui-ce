<template>
  <el-dialog
    :visible.sync="dialogVisible"
    width="50%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    append-to-body
    modal-append-to-body
    @close="closeDialog"
  >
    <img
      :src="source"
      style="width: 100%;"
      class="cursor-pointer"
      @click="directTo"
    >
  </el-dialog>
</template>

<script>
export default {
  name: 'Popup',
  data() {
    return {
      dialogVisible: false,
      source: process.env.VUE_APP_POPUP_IMG
    }
  },
  mounted() {
    this.dialogVisible = localStorage.getItem('isShowPopup') === 'true'
  },
  methods: {
    closeDialog() {
      this.dialogVisible = false
      localStorage.setItem('isShowPopup', 'false')
    },
    directTo() {
      window.open(process.env.VUE_APP_POPUP_URL)
    }
  }
}
</script>

<style scoped lang="scss">
::v-deep .el-dialog__header {
  padding: 0;
}

::v-deep .el-dialog__body {
  padding: 3px 3px 0;
}

::v-deep .el-dialog__headerbtn {
  top: 10px;
  right: 10px;
}

::v-deep .el-dialog__close {
  background-color: #ffffff;
  border-radius: 16px;
  font-size: 20px;
  padding: 2px;
}
</style>
