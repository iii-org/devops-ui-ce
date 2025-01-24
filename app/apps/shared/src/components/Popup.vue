<template>
  <el-dialog
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :visible.sync="dialogVisible"
    append-to-body
    modal-append-to-body
    width="50%"
    @close="closeDialog"
  >
    <img
      :src="source"
      alt=""
      class="cursor-pointer"
      style="width: 100%"
      @click="directTo"
    />
  </el-dialog>
</template>

<script>
export default {
  name: 'Popup',
  data() {
    return {
      dialogVisible: false,
      source: import.meta.env.VITE_APP_POPUP_IMG
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
      window.open(import.meta.env.VITE_APP_POPUP_URL)
    }
  }
}
</script>

<style lang="scss" scoped>
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
