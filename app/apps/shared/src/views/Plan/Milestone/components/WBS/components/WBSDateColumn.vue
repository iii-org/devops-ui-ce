<template>
  <el-table-column v-bind="$props">
    <template slot-scope="{ row, $index }">
      <template v-if="row.create">
        <el-date-picker
          v-model="row[prop]"
          :picker-options="pickerOptions(row)"
          clearable
          style="width: 100%"
          type="date"
          value-format="yyyy-MM-dd"
          @keyup.enter.native="handlerCreate(row, $index)"
          @keyup.esc.native="handlerResetCreate(row, $index)"
        />
      </template>
      <template
        v-else-if="
          row.editColumn === prop && row.id === editRowId && editable(row)
        "
      >
        <el-date-picker
          :ref="`${prop}_${row.id}`"
          v-model="row[prop]"
          :picker-options="pickerOptions(row)"
          clearable
          style="width: 100%"
          type="date"
          value-format="yyyy-MM-dd"
          @blur="handlerReset(row, $index)"
          @change="handlerEdit(row, $index)"
          @keyup.enter.native="handlerEdit(row, $index)"
          @keyup.esc.native="handlerReset(row, $index)"
        />
      </template>
      <template v-else>
        <div
          v-if="row[prop]"
          :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'"
          class="w-full"
        >
          {{ getLocalTime(row[prop], 'YYYY-MM-DD') }}
        </div>
        <div
          v-else
          :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'"
          class="w-full"
        >
          -
        </div>
      </template>
    </template>
  </el-table-column>
</template>

<script>
import i18n from '@/lang'
import { getLocalTime } from '@shared/utils/handleTime'

export default {
  name: 'WBSInputNumberColumn',
  props: {
    prop: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: i18n.t('general.LastUpdateTime')
    },
    minWidth: {
      type: String,
      default: null
    },
    width: {
      type: String,
      default: null
    },
    sortable: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    hasChildEdit: {
      type: Boolean,
      default: false
    },
    showOverflowTooltip: {
      type: Boolean,
      default: false
    },
    afterDateColumn: {
      type: String,
      default: null
    },
    beforeDateColumn: {
      type: String,
      default: null
    },
    editRowId: {
      type: [String, Number],
      default: null
    }
  },
  methods: {
    pickerOptions(row) {
      const _this = this
      return {
        disabledDate(date) {
          if (_this.beforeDateColumn && row[_this.beforeDateColumn]) {
            return date > new Date(row[_this.beforeDateColumn])
          }
          if (_this.afterDateColumn && row[_this.afterDateColumn]) {
            const setAfterDate = new Date(row[_this.afterDateColumn])
            return date < setAfterDate.setDate(setAfterDate.getDate() - 1)
          }
          return false
        }
      }
    },
    hasRequired(row) {
      return this.required && row[this.prop].length <= 0
    },
    editable(row) {
      if (this.hasChildEdit) {
        return true
      } else {
        return !row['has_children']
      }
    },
    getLocalTime(time, format) {
      return getLocalTime(time, format)
    },
    handlerEdit(row, index, treeNode) {
      this.$emit('edit', {
        value: { [this.prop]: row[this.prop] },
        row: row,
        index: index,
        treeNode: treeNode
      })
    },
    handlerCreate(row, index, treeNode) {
      this.$emit('create', {
        value: { [this.prop]: row[this.prop] },
        row: row,
        index: index,
        treeNode: treeNode
      })
    },
    handlerReset(row, index, treeNode) {
      this.$emit('reset-edit', {
        value: this.prop,
        row: row,
        index: index,
        treeNode: treeNode
      })
    },
    handlerResetCreate(row, index, treeNode) {
      this.$emit('reset-create', {
        value: this.prop,
        row: row,
        index: index,
        treeNode: treeNode
      })
    }
  }
}
</script>
