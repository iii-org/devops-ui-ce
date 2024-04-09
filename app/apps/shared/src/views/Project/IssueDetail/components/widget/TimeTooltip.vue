<template>
  <el-tooltip
    v-if="time"
    :open-delay="200"
    :content="getLocalTime(time)"
    placement="top"
  >
    <span class="text-sm">
      {{ getRelativeTime(time) }}
    </span>
  </el-tooltip>
</template>

<script>
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'

export default {
  name: 'TimeTooltip',
  props: {
    time: {
      type: String,
      default: ''
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
