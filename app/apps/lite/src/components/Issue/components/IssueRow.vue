<template>
  <div class="issue-row">
    <div class="title">
      <el-tooltip
        :content="title"
        :disabled="clientWidth >= scrollWidth"
        placement="top"
      >
        <div
          ref="title"
          @click="clickTitle(issue.id)"
          @contextmenu="contextMenu"
        >
          <Status
            :name="$t(`Issue.${issue.status.name}`)"
            :type="issue.status.name"
            size="mini"
          />
          <Tracker
            :name="$t(`Issue.${issue.tracker.name}`)"
            :type="issue.tracker.name"
          />
          #{{ issue.id }} -
          <el-tag
            v-for="item in issue.tags"
            :key="item.id"
            class="mr-1"
            size="mini"
          >[{{ item.name }}]
          </el-tag>
          {{ issue.subject }}
          <span v-if="issue.assigned">
            ({{ $t('Issue.Assignee') }}: {{ issue.assigned.full_name }} -
            {{ issue.assigned.username }})
          </span>
        </div>
      </el-tooltip>
    </div>
    <div class="action">
      <el-popconfirm
        :cancel-button-text="$t('general.Cancel')"
        :confirm-button-text="$t('general.Remove')"
        :title="$t('Issue.RemoveIssueRelation')"
        icon="el-icon-info"
        popper-class="danger"
        @confirm="removeConfirm(issue)"
      >
        <el-button
          slot="reference"
          v-permission="[
            'sysadmin',
            'Organization Owner',
            'Project Manager',
            'Engineer'
          ]"
          :disabled="isButtonDisabled"
          icon="el-icon-remove"
          size="mini"
          type="danger"
        >
          <span v-if="device === 'desktop'">{{ $t('Issue.Unlink') }}</span>
        </el-button>
      </el-popconfirm>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'IssueRow',
  components: {
    Tracker: () => import('@/components/Issue/Tracker'),
    Status: () => import('@/components/Issue/Status')
  },
  props: {
    issue: {
      type: Object,
      default: () => ({})
    },
    isParent: {
      type: Boolean,
      default: false
    },
    reload: {
      type: [String, Number],
      default: 0
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      clientWidth: 0,
      scrollWidth: 0
    }
  },
  computed: {
    ...mapGetters(['device']),
    title() {
      const result = []
      if (this.issue.tags) {
        result.push(this.issue.tags.map((tag) => `[${tag.name}]`).join(' '))
      }
      result.push(this.issue.subject)
      if (this.issue.assigned) {
        result.push(
          `(${this.$t('Issue.Assignee')}: ${this.issue.assigned.full_name} - ${
            this.issue.assigned.username
          })`
        )
      }
      return result.join(' ')
    }
  },
  watch: {
    reload() {
      this.$nextTick(() => {
        this.handleResize()
      })
    }
  },
  mounted: function () {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      if (this.$refs['title']) {
        this.clientWidth = this.$refs['title'].clientWidth
        this.scrollWidth = this.$refs['title'].scrollWidth
      }
    },
    clickTitle(id) {
      this.$emit('click-title', id)
    },
    removeConfirm(issue) {
      this.$emit('remove-confirm', {
        issueData: issue,
        isParent: this.isParent
      })
    },
    contextMenu(id) {
      this.$emit('show-context-menu', id)
    }
  }
}
</script>

<style lang="scss" scoped>
.issue-row {
  @apply flex items-center justify-between p-1;
  .title {
    @apply flex-grow min-w-0;
    div {
      @apply truncate text-sm;
      cursor: context-menu;
    }
  }

  .action {
    @apply flex-none max-w-max;
  }
}
</style>
