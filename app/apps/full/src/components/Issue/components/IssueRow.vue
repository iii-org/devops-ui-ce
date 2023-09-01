<template>
  <div class="issue-row">
    <div class="title">
      <el-tooltip :disabled="clientWidth >= scrollWidth" :content="title" placement="top">
        <div
          id="title"
          ref="title"
          @click="clickTitle(issue.id)"
          @contextmenu="contextMenu"
          @touchstart="isMobile ? longPress($event) : ''"
        >
          <Status :name="$t(`Issue.${issue.status.name}`)" :type="issue.status.name" size="mini" />
          <Tracker :name="$t(`Issue.${issue.tracker.name}`)" :type="issue.tracker.name" />
          #{{ issue.id }} -
          <el-tag v-for="item in issue.tags" :key="item.id" size="mini" class="mr-1">[{{ item.name }}] </el-tag>
          {{ issue.name }}
          <span v-if="issue.hasOwnProperty('assigned_to') && Object.keys(issue.assigned_to).length > 1">
            ({{ $t('Issue.Assignee') }}: {{ issue.assigned_to.name }} - {{ issue.assigned_to.login }})
          </span>
        </div>
      </el-tooltip>
    </div>
    <div class="action">
      <el-popconfirm
        :confirm-button-text="$t('general.Remove')"
        :cancel-button-text="$t('general.Cancel')"
        icon="el-icon-info"
        icon-color="red"
        :title="$t('Issue.RemoveIssueRelation')"
        @confirm="removeConfirm(issue)"
      >
        <el-button
          slot="reference"
          v-permission="['Administrator', 'Project Manager', 'Engineer']"
          type="danger"
          size="mini"
          icon="el-icon-remove"
          :disabled="isButtonDisabled"
        >
          <span v-if="!isMobile">{{ $t('Issue.Unlink') }}</span>
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
      result.push(this.issue.name)
      if (this.issue.assigned_to) {
        result.push(`(${this.$t('Issue.Assignee')}: ${this.issue.assigned_to.name} - ${this.issue.assigned_to.login})`)
      }
      return result.join(' ')
    },
    isMobile() {
      return this.device === 'mobile'
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
    contextMenu(event) {
      this.$emit('show-context-menu', event)
    },
    async longPress(event) {
      // Define variable
      let pressTimer = null
      const el = document.getElementById(`title`)
      // Define funtion handlers
      // Create timeout ( run function after 1s )
      const start = (e) => {
        if (e.type === 'click' && e.button !== 0) {
          return
        }
        if (pressTimer === null) {
          pressTimer = setTimeout(() => {
            // Run function
            this.contextMenu(event)
          }, 1000)
        }
      }
      // Cancel Timeout
      const cancel = (e) => {
        // Check if timer has a value or not
        if (pressTimer !== null) {
          clearTimeout(pressTimer)
          pressTimer = null
        }
      }
      this.$nextTick(() => {
        el.addEventListener('mousedown', start)
        el.addEventListener('touchstart', start)
        el.addEventListener('touchmove', cancel)
        el.addEventListener('click', cancel)
        el.addEventListener('mouseout', cancel)
        el.addEventListener('touchend', cancel)
        el.addEventListener('touchcancel', cancel)
      })
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
