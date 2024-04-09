<template>
  <el-row class="flex justify-center items-center">
    <el-col :md="23" :sm="23" :xs="23">
      <el-input
        v-model="boardObject.name"
        :loading="isLoading"
        :placeholder="$t('Validation.Input', [$t('Issue.ItemName')])"
        @keypress.enter.native="$emit('emitAddCustomBoard', $event.target)"
        @keyup.delete.native="handleDelete(true, $event.target)"
      >
        <template v-if="order !== null" slot="prepend">
          {{ order + 1 }}
        </template>
        <template slot="suffix">
          <el-popover placement="bottom" trigger="click">
            <el-button
              v-for="color in colors"
              :key="color"
              :style="{ 'background-color': color }"
              @click="handleColor(color)"
            />
            <el-color-picker
              v-model="boardObject.color"
              @active-change="handleColor"
            />
            <el-button
              slot="reference"
              :style="{ 'background-color': boardObject.color }"
            />
          </el-popover>
        </template>
      </el-input>
    </el-col>
    <el-col
      v-if="!isEdited"
      :md="1"
      :sm="1"
      :xs="1"
      class="flex justify-center"
    >
      <el-tooltip :content="$t('general.Delete')" placement="bottom">
        <el-popconfirm
          :confirm-button-text="$t('general.Delete')"
          :cancel-button-text="$t('general.Cancel')"
          :title="$t('Notify.confirmDelete')"
          icon="el-icon-info"
          icon-color="red"
          @confirm="handleDelete"
        >
          <em
            slot="reference"
            :style="getStyle('danger')"
            class="el-icon-delete"
          />
        </el-popconfirm>
      </el-tooltip>
    </el-col>
  </el-row>
</template>

<script>
import variables from '@/styles/theme/variables.scss'

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
        variables['primary'],
        variables['success'],
        variables['warning'],
        variables['danger'],
        variables['info'],
        variables['light']
      ]
    }
  },
  methods: {
    getStyle(colorCode) {
      const color = variables[`${colorCode}`]
      return { color, cursor: 'pointer' }
    },
    handleColor(color) {
      this.boardObject.color = color || '#ffffff'
    },
    handleDelete(isKeyPress = false, target) {
      if (isKeyPress) {
        if (!this.boardObject.name) {
          this.deleteInput()
          const siblingElement = target?.parentElement?.parentElement?.parentElement?.previousElementSibling
          const inputElements = siblingElement.querySelectorAll('input')
          inputElements[0].focus()
        }
        return
      }
      this.deleteInput()
    },
    deleteInput() {
      const index = this.groupByValueOnBoard.findIndex(
        (item, index) => index === this.order
      )
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
    font-family: "remixicon" !important;
    font-style: normal;
    -webkit-font-smoothing: antialiased;
    content: "\EFC5";
    font-size: 18px;
    color: #000;
  }

  .el-color-picker__empty:before {
    font-family: "remixicon" !important;
    font-style: normal;
    -webkit-font-smoothing: antialiased;
    content: "\EFC5";
    font-size: 18px;
    color: #000;
  }
}

::v-deep .el-input__suffix,
.el-popover {
  display: flex;
  align-items: center;

  .el-button {
    padding: 12px;
    border-radius: 4px;
  }

  .el-color-picker {
    height: 0;
  }
}
</style>
