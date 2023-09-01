<template>
  <el-table
    ref="responsiveTable"
    :data="data"
    :fit="fit"
    :stripe="stripe"
    :border="border"
    :show-header="!isMobile"
    :highlight-current-row="highlightCurrentRow"
    :cell-style="cellStyle"
    :header-cell-style="headerCellStyle"
    :row-class-name="rowClassName"
    :cell-class-name="cellClassName"
    :header-cell-class-name="headerCellClassName"
    :class="isMobile ? 'mobile' : ''"
    :style="style"
    :size="size"
    :tree-props="treeProps"
    :row-key="rowKey"
    :expand-row-keys="expandRowKeys"
    @row-click="handleRowClick"
    @sort-change="handleSortChange"
    @current-change="handleCurrentChange"
    @expand-change="handleExpandChange"
  >
    <template v-for="col in columns">
      <el-table-column
        v-if="!isMobile || (isMobile && !col.hideOnMobile)"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width || 'auto'"
        :min-width="col.minWidth || 'auto'"
        :sortable="col.sortable || false"
        :align="col.align || 'left'"
        :header-align="col.headerAlign || col.align || 'left'"
        :show-overflow-tooltip="(col.showOverflowTooltip || false) && !isMobile"
        :type="col.type === 'expand' ? col.type : ''"
      >
        <template v-if="col.headerLabel" v-slot:header>
          <slot :name="`header-${col.headerLabel}`" />
        </template>
        <template slot-scope="scope">
          <span v-if="isMobile" class="label-mobile">{{ isMobile ? col.label : '' }}</span>
          <span>
            <el-tooltip
              v-if="col.type === 'time'"
              placement="top"
              :open-delay="200"
              :content="getLocalTime(access(col.prop, scope.row))"
            >
              <span>{{ getRelativeTime(access(col.prop, scope.row)) }}</span>
            </el-tooltip>
            <template v-else-if="col.type === 'tag'">
              <el-tag
                v-if="access(col.prop, scope.row)"
                :type="handleType(access(col.prop, scope.row), col.location)"
                :class="col.elementClass || 'el-tag--circle'"
                :size="isMobile ? 'mini' : (col.size || 'large')"
                :effect="getTagEffect(access(col.prop, scope.row))"
              >
                <span v-if="col.i18nKey">{{ $t(`${col.i18nKey}.${access(col.prop, scope.row)}`) }}</span>
                <span v-else>{{ access(col.prop, scope.row) }}</span>
              </el-tag>
              <span v-else>-</span>
            </template>
            <template v-else-if="col.type === 'index'">
              {{ scope.$index + 1 }}
            </template>
            <slot v-else-if="col.slot" :name="col.slot" :row="scope.row" />
            <span
              v-else
              class="cell"
              :class="col.showOverflowTooltip ? 'show-tooltip' : ''"
            >
              {{ access(col.prop, scope.row) }}
            </span>
          </span>
        </template>
      </el-table-column>
    </template>
    <template slot="empty">
      <Error v-if="Object.keys(error).length > 0" :error="error" />
      <el-empty :description="$t('general.NoData')" />
    </template>
  </el-table>
</template>

<script>
import { mapGetters } from 'vuex'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'
import * as elementTagType from '@shared/utils/elementTagType'

/**
 * * Table props
 * ! for required
 * ? for optional
 *
 * ! @data {array} - ! table data
 * ! @columns {array} - ! table columns (check columns props below)
 * ? @fit {boolean} - ? table fit
 * ? @stripe {boolean} - ? table stripe
 * ? @border {boolean} - ? table border
 * ? @size {string} - ? table size
 * ? @highlightCurrentRow {boolean} - ? table highlight current row
 * ? @cellStyle {function} - ? table cell style
 * ? @headerCellStyle {function} - ? table header cell style
 * ? @rowClassName {function} - ? table row class name
 * ? @error {object} - ? table error
 *
 * * Columns props
 * ! for required
 * ? for optional
 *
 * ! @prop {string} - ! column prop
 * ! @label {string} - ! column label
 * ? @width {string} - ? column width
 * ? @minWidth {string} - ? column min width
 * ? @sortable {boolean} - ? column sortable
 * ? @align {string} - ? column align
 * ? @headerAlign {string} - ? column header align
 * ? @hideOnMobile {boolean} - ? hide column on mobile
 * ? @slot {string} - ? slot name
 * ? @headerLabel {string} - ? header slot name
 * ? @showOverflowTooltip {boolean} - ? show overflow tooltip
 * ? @type {string} - ? column type [time, tag, selection, index]
 * ? @location {string} - ? column location [table, form, ...] (if type: tag)
 * ? @elementClass {string} - ? column element class (if type: tag)
 * ? @size {string} - ? column element size (if type: tag)
 * ? @i18nKey {string} - ? column i18n key (if type: tag)
 **/

export default {
  name: 'ElTableResponsive',
  components: {
    Error: () => import('@/views/Error')
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    fit: {
      type: Boolean,
      default: true
    },
    stripe: {
      type: Boolean,
      default: false
    },
    border: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'medium'
    },
    highlightCurrentRow: {
      type: Boolean,
      default: false
    },
    cellStyle: {
      type: [Function, Object],
      default: () => ''
    },
    headerCellStyle: {
      type: [Function, Object],
      default: () => ''
    },
    rowClassName: {
      type: [Function, String],
      default: () => ''
    },
    cellClassName: {
      type: [Function, String],
      default: () => ''
    },
    headerCellClassName: {
      type: [Function, String],
      default: () => ''
    },
    error: {
      type: Object,
      default: () => ({})
    },
    treeProps: {
      type: Object,
      default: () => ({})
    },
    rowKey: {
      type: [String, Function],
      default: ''
    },
    expandRowKeys: {
      type: Array,
      default: () => null
    }
  },
  data() {
    return {
      getLocalTime,
      getRelativeTime
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    style () {
      return {
        'padding': !this.isMobile ? '0 12px' : '0'
      }
    }
  },
  methods: {
    access(path, object) {
      return path.split('.').reduce((o, i) => (o[i] || o[i] === 0) ? o[i] : '', object)
    },
    handleRowClick(row, column) {
      this.$emit('row-click', row, column)
    },
    handleSortChange(sort) {
      this.$emit('sort-change', sort)
    },
    handleCurrentChange(row) {
      this.$emit('current-change', row)
    },
    handleExpandChange(row, expandedRow) {
      this.$emit('expand-change', row, expandedRow)
    },
    handleType(prop, location = 'pipelines') {
      return elementTagType[location][prop] || 'default'
    },
    getTagEffect(status) {
      const tagMap = { Building: 'light' }
      return tagMap[status] || 'dark'
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile {
  ::v-deep .el-table__body {
    width: 100% !important;
    tbody,
    tr,
    tr > td,
    tr > th {
      display: block !important;
    }
    td,
    th {
      background: 0 0;
      border: none !important;
      padding: 0.25em 0.75em !important;
      text-align: left !important;
      height: unset !important;
    }
    tr {
      border-bottom: 1px solid #ddd;
    }
    tr td:first-child {
      padding-top: 10px !important;
    }
    tr td:last-child {
      padding-bottom: 10px !important;
    }
  }
  .label-mobile {
    font-weight: bold;
    margin-right: 6px;
    min-width: 120px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  ::v-deep .cell {
    white-space: nowrap !important;
    display: flex;
    justify-content: space-between;
    padding-left: 0 !important;
    padding-right: 0 !important;
    line-height: 18px;
    text-overflow: ellipsis;
  }
  ::v-deep .el-table__header-wrapper {
    display: none !important;
  }
  ::v-deep .el-table__body-wrapper {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }
  ::v-deep .el-table__empty-block {
    width: auto !important;
  }
  ::v-deep .el-table {
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    border-radius: 6px;
    padding: 0;
  }
  ::v-deep .el-table__cell:first-child .cell {
    padding-left: 0;
  }
  ::v-deep colgroup {
    display: none;
  }
  ::v-deep .el-table__expand-icon {
    margin-left: 5px;
  }
  ::v-deep .el-table__expanded-cell {
    //background-color: #e7e7e7 !important;
    box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset !important;
  }
  ::v-deep ul {
    padding-left: 16px;
    margin: 0;
  }
}
.show-tooltip {
  word-break: normal !important;
}
::v-deep .cell, ::v-deep th.el-table__cell>.cell {
  padding-left: 0;
  padding-right: 0;
}
::v-deep .el-table__expanded-cell[class*=cell] {
  padding: 20px 50px !important;
}
</style>
