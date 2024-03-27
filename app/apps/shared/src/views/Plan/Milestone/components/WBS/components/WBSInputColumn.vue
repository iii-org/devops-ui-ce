<template>
  <el-table-column v-bind="$props">
    <template slot-scope="{ row, column, $index, treeNode }">
      <template v-if="prop === 'name' && !treeNode">
        <div class="el-table__root" />
      </template>
      <el-button
        v-if="prop === 'name' && row.id.toString().includes('new')"
        class="action"
        type="success"
        size="mini"
        icon="el-icon-check"
        @click="handlerCreate(row, $index, treeNode)"
      />
      <el-button
        v-if="prop === 'name' && row.id.toString().includes('new')"
        class="action"
        type="danger"
        size="mini"
        icon="el-icon-close"
        @click="handleResetCreate(row, $index, treeNode)"
      />
      <!-- 新增議題 -->
      <template v-if="row.create">
        <el-input
          v-if="number"
          ref="input"
          v-model.number="row[prop]"
          :min="min"
          :max="max"
          :style="{ width: treeWidth(treeNode, row) }"
          @keyup.esc.native="handleResetCreate(row, $index, treeNode)"
        />
        <el-input
          v-else
          ref="input"
          v-model="row[prop]"
          :style="{ width: treeWidth(treeNode, row) }"
          @keyup.esc.native="handleResetCreate(row, $index, treeNode)"
        />
        <template v-if="prop === 'name'">
          <el-tag v-for="item in row['tags']" :key="item.id"> [{{ item.name }}] </el-tag>
        </template>
        <ul v-if="hasRequired(row)" slot="suffix">
          <li class="text-danger text-sm">
            {{ $t('Validation.Input', [label]) }}
          </li>
        </ul>
      </template>
      <!-- 編輯議題名稱 -->
      <template v-else-if="row.editColumn === prop && row.id === editRowId && editable(row)">
        <el-input
          v-if="number"
          ref="input"
          v-model.number="row[prop]"
          :min="min"
          :max="max"
          :style="{ width: treeWidth(treeNode, row) }"
          @keyup.enter.native="handleEdit(row, $index, treeNode)"
          @keyup.esc.native="handleReset(row, $index, treeNode)"
        />
        <el-input
          v-else
          ref="input"
          v-model="row[prop]"
          :style="{ width: treeWidth(treeNode, row) }"
          @blur="handleBlur(row, $index, treeNode)"
          @keyup.enter.native="handleEdit(row, $index, treeNode)"
          @keyup.esc.native="handleReset(row, $index, treeNode)"
        />
        <template v-if="prop === 'name'">
          <el-tag v-for="item in row['tags']" :key="item.id"> [{{ item.name }}] </el-tag>
        </template>
        <ul v-if="hasRequired(row)" slot="suffix">
          <li class="text-danger text-sm">
            {{ $t('Validation.Input', [label]) }}
          </li>
        </ul>
      </template>
      <!-- 議題名稱欄位正常狀態 -->
      <template v-else-if="prop === 'name'">
        <div class="flex justify-start">
          <div
            :class="editable(row) ? 'cursor-zoom-in' : 'cursor-not-allowed'"
            class="truncate"
            style="max-width: 300px"
          >
            {{ row[prop] }}
          </div>
          <el-tooltip v-if="showIconRowId === row.id" placement="bottom" :content="$t('general.Edit')">
            <em class="ri-edit-box-line info table-button" @click.self="$emit('onCellClick', row, column)" />
          </el-tooltip>
          <el-tag v-for="item in row['tags']" :key="item.id"> [{{ item.name }}] </el-tag>
        </div>
      </template>
      <template v-else>
        <div v-if="row[prop]" :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'">
          {{ row[prop] }}
        </div>
        <div v-else :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'">-</div>
      </template>
    </template>
  </el-table-column>
</template>

<script>
import i18n from '@/lang'

export default {
  name: 'WBSInputColumn',
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
    number: {
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
    min: {
      type: Number,
      default: null
    },
    max: {
      type: Number,
      default: null
    },
    editRowId: {
      type: [String, Number],
      default: null
    },
    showIconRowId: {
      type: [String, Number],
      default: null
    }
  },
  methods: {
    hasRequired(row) {
      if (!row.create) {
        if (this.$refs['input']) {
          this.$refs['input'].focus()
        }
      }
      return this.required && row[this.prop].length <= 0
    },
    editable(row) {
      if (this.hasChildEdit) {
        return true
      } else {
        return !row['has_children']
      }
    },
    treeWidth(treeNode, row) {
      let width = '70%'
      if (row && row.id && row.id.toString().includes('new') && !row.parent_object) {
        width = '50%'
      }
      if (this.prop === 'name' && treeNode?.indent) {
        return `calc(${width} - ${treeNode.indent * 2}px)`
      }
      if (this.prop === 'name') {
        return `calc(${width})`
      }
      return `calc(100%)`
    },
    handleBlur(row, index, treeNode) {
      const checkUpdate = row[this.prop] !== row.originColumn
      if (checkUpdate) {
        this.handleEdit(row, index, treeNode)
      } else if (row.originColumn) {
        this.handleReset(row, index, treeNode)
      }
    },
    handleEdit(row, index, treeNode) {
      if (this.number) {
        if (!Number.isInteger(row[this.prop])) {
          this.$set(row, this.prop, row.originColumn)
          this.$alert(
            this.$t('Validation.Input', [this.$t('Validation.Number')]).toString(),
            this.$t('general.Error').toString(),
            { type: 'error' }
          )
          return
        } else if (row[this.prop] > this.max || row[this.prop] < this.min) {
          this.$set(row, this.prop, row.originColumn)
          this.$alert(this.$t('Validation.Input', ['0 - 100']).toString(), this.$t('general.Error').toString(), {
            type: 'error'
          })
          return
        }
      }
      if (!this.hasRequired(row)) {
        this.$emit('edit', {
          value: { [this.prop]: row[this.prop] },
          row,
          index,
          treeNode
        })
      }
    },
    handlerCreate(row, index, treeNode) {
      if (this.number && (row[this.prop] > this.max || row[this.prop] < this.min)) {
        this.$set(row, this.prop, row.originColumn)
        this.$alert(this.$t('Validation.Input', ['0 - 100']).toString(), this.$t('general.Error').toString(), {
          type: 'error'
        })
      } else if (!this.hasRequired(row)) {
        this.$emit('create', {
          value: { [this.prop]: row[this.prop] },
          row,
          index,
          treeNode
        })
      }
    },
    handleReset(row, index, treeNode) {
      this.$emit('reset-edit', {
        value: this.prop,
        row,
        index,
        treeNode
      })
    },
    handleResetCreate(row, index, treeNode) {
      this.$emit('reset-create', {
        value: this.prop,
        row,
        index,
        treeNode
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.cursor-zoom-in {
  cursor: zoom-in;
}

.el-table__root {
  width: 20px;
  height: 20px;
  display: inline-block;
}

.action {
  margin: 0;

  &.el-button--mini {
    padding: 5px;
  }
}
</style>
