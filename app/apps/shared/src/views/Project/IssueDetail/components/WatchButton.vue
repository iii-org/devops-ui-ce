<template>
  <span class="star">
    <em v-if="isLoading" class="el-icon-loading text-warning"></em>
    <el-tooltip
      v-else
      :content="isWatched ? $t('Issue.Unwatch') : $t('Issue.Watch')"
      placement="bottom"
    >
      <el-button
        v-if="isWatched"
        class="star-content"
        type="text"
        @click="setStar(false)"
      >
        <em class="el-icon-star-on star-on"></em>
      </el-button>
      <el-button v-else class="star-content" type="text" @click="setStar(true)">
        <em class="el-icon-star-off star-off"></em>
      </el-button>
    </el-tooltip>
    <el-popover placement="bottom" trigger="click">
      <el-table :data="issue.watchers" max-height="200">
        <el-table-column
          :label="$t('Issue.WatcherList')"
          min-width="100"
          prop="name"
        />
      </el-table>
      <el-link
        slot="reference"
        :underline="false"
        style="color: #409eff; border-bottom: #409eff solid 1px"
      >
        {{ watchers }}
      </el-link>
    </el-popover>
  </span>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  addIssueWatcher,
  getIssueDetails,
  removeIssueWatcher
} from '@/api_v3/issues'

export default {
  name: 'WatchButton',
  props: {
    issue: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isLoading: false
    }
  },
  computed: {
    ...mapGetters(['userId', 'userName']),
    isWatched() {
      return this.issue.watchers?.some((watcher) =>
        watcher.id.includes(this.userId)
      )
    },
    watchers() {
      return this.issue.watchers?.length || 0
    }
  },
  methods: {
    async setStar(status) {
      this.isLoading = true
      if (status) {
        await addIssueWatcher(this.issue.id)
      } else {
        await removeIssueWatcher(this.issue.id)
      }
      const issue = await getIssueDetails(this.issue.id)
      this.$emit('update', issue.data)
      this.isLoading = false
    }
  }
}
</script>

<style lang="scss" scoped>
.star {
  @apply align-middle min-w-max max-w-max;
  .star-content {
    @apply align-middle inline-block cursor-pointer p-0;
    .star-on {
      @apply text-yellow-500 text-xl rounded-md;
    }

    .star-off {
      @apply text-xl text-gray-400;
    }
  }
}
</style>
