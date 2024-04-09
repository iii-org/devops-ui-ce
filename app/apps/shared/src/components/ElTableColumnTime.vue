
<template>
  <el-table-column v-bind="$props" align="center">
    <template slot-scope="scope">
      <el-tooltip
        :disabled="!scope.row[prop]"
        :open-delay="200"
        :content="getLocalTime(scope.row[prop])"
        placement="top"
      >
        <span>{{ getRelativeTime(scope.row[prop]) }}</span>
      </el-tooltip>
    </template>
  </el-table-column>
</template>

<script>
import i18n from '@/lang'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'

export default {
  name: 'ElTableColumnTime',
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
      default: '130'
    },
    width: {
      type: String,
      default: '130'
    },
    sortable: {
      type: [Boolean, String],
      default: false
    }
  },
  methods: {
    getLocalTime(time) {
      return getLocalTime(time)
    },
    getRelativeTime(time) {
      return getRelativeTime(time)
    }
  }
}
</script>
