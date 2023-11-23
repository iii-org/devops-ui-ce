<template>
  <el-row class="flex justify-center items-center">
    <el-col
      :md="20"
      :sm="18"
      :xs="16"
    >
      <el-input
        v-model="boardObject.name"
        :loading="isLoading"
        style="width: 95%"
        :placeholder="$t('Validation.Input',[$t('Issue.BoardName')])"
        clearable
      />
    </el-col>
    <el-col
      :md="3"
      :sm="4"
      :xs="5"
    >
      <el-popover
        placement="bottom"
        trigger="click"
      >
        <el-button
          v-for="color in colors"
          :key="color"
          :style="{'background-color': color}"
          size="mini"
          circle
          @click="handleColor(color)"
        />
        <el-color-picker
          v-model="boardObject.color"
          size="mini"
          @change="handleColor"
        />
        <el-button
          slot="reference"
          :style="{'background-color': boardObject.color}"
          circle
        />
      </el-popover>
    </el-col>
    <el-col
      v-if="!isEdited"
      :md="1"
      :sm="2"
      :xs="2"
      class="flex justify-center"
    >
      <el-tooltip
        placement="bottom"
        :content="$t('general.Delete')"
      >
        <el-popconfirm
          :confirm-button-text="$t('general.Delete')"
          :cancel-button-text="$t('general.Cancel')"
          icon="el-icon-info"
          icon-color="red"
          :title="$t('Notify.confirmDelete')"
          @confirm="handleDelete"
        >
          <em
            slot="reference"
            class="el-icon-delete danger operate-button"
          />
        </el-popconfirm>
      </el-tooltip>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'CustomItem',
  props: {
    order: {
      type: Number,
      default: null
    },
    boardObject: {
      type: Object,
      default: () => ({})
    },
    groupByValueOnBoard: {
      type: Array,
      default: () => []
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoading: false,
      colors: [
        '#409EFF',
        '#67C23A',
        '#E6A23C',
        '#F56C6C',
        '#909399',
        '#303133'
      ]
    }
  },
  methods: {
    handleColor(color) {
      this.boardObject.color = color || '#ffffff'
    },
    handleDelete() {
      const index = this.groupByValueOnBoard.findIndex((item, index) => index === this.order)
      this.groupByValueOnBoard.splice(index, 1)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-color-picker__trigger {
  height: 0 !important;
  width: 0 !important;
  border: none !important;
  padding: 1px 10px !important;
  margin-left: 4px !important;

  .el-icon-arrow-down:before {
    font-family: 'remixicon' !important;
    font-style: normal;
    -webkit-font-smoothing: antialiased;
    content: "\EFC5";
    font-size: 18px;
    color: #000;
  }

  .el-color-picker__empty:before {
    font-family: 'remixicon' !important;
    font-style: normal;
    -webkit-font-smoothing: antialiased;
    content: "\EFC5";
    font-size: 18px;
    color: #000;
  }
}
</style>
