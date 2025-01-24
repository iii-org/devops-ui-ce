<template>
  <div>
    <el-button
      v-if="showSaveSettingsButton"
      style="width: 100%"
      type="primary"
      @click="showSaveSettingsButton = !showSaveSettingsButton"
    >
      {{ $t('general.SaveSettings') }}
    </el-button>
    <div v-else class="flex">
      <el-input
        v-model="filterName"
        :placeholder="$t('Issue.InputFilterName')"
        class="mr-2"
      />
      <el-button @click="setCustomFilter">
        {{ $t('general.Save') }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { createCustomIssueFilter } from '@/api_v3/user'
import { mapGetters } from 'vuex'

const keyMap = {
  status_id: 'status',
  tags: 'tags',
  tracker_id: 'tracker',
  assigned_id: 'assigned',
  version_id: 'version',
  priority_id: 'priority',
  show_closed_issues: 'displayClosed',
  show_closed_versions: 'version_closed',
  expired_days: 'expiredDays'
}
const sendDataMap = {
  status: 'status_id',
  tracker: 'tracker_id',
  assigned: 'assigned_id',
  version: 'version_id',
  priority: 'priority_id'
}

export default {
  name: 'SaveFilterButton',
  props: {
    filterValue: {
      type: Object,
      default: () => ({})
    },
    type: {
      type: String,
      default: ''
    },
    projectId: {
      type: [Number, String],
      default: null
    },
    activeTab: {
      type: String,
      default: null
    },
    groupBy: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      filterName: '',
      showSaveSettingsButton: true
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId']),
    isIssueList() {
      return this.$route.name === 'issueList'
    },
    focusProjectId() {
      // -1 means all projects (dump project)
      return this.$route.name === 'MyWork'
        ? this.projectId ?? -1
        : this.selectedProjectId
    }
  },
  methods: {
    reset() {
      this.filterName = ''
      this.showSaveSettingsButton = true
    },
    async setCustomFilter() {
      if (!this.filterName) {
        this.$message.warning(this.$t('Issue.InputFilterName'))
        return
      }
      const sendData = this.formatFilterData()
      await createCustomIssueFilter(sendData).then(() => {
        this.$message.success(this.$t('Notify.Saved'))
        this.$emit('update')
        this.reset()
      })
    },
    formatFilterData() {
      const sendData = {
        name: this.filterName,
        type: this.type,
        custom_filters: {
          status_id: null,
          tags: [],
          tracker_id: null,
          assigned_id: null,
          version_id: null,
          show_closed_issues: null,
          show_closed_versions: null,
          priority_id: null,
          group_by: null,
          focus_tab: null,
          expired_days: null
        }
      }
      for (const key in keyMap) {
        const originalKey = keyMap[key]
        if (key === 'tags') {
          sendData['custom_filters'][key] = this.filterValue[originalKey]
            ? this.filterValue[originalKey].join(',')
            : null
        } else if (key === 'assigned_id') {
          sendData['custom_filters'][key] = this.filterValue[originalKey]
        } else {
          sendData['custom_filters'][key] =
            this.filterValue[originalKey] === 'null'
              ? null
              : this.filterValue[originalKey]
        }
        sendData['custom_filters']['focus_tab'] = this.activeTab
        sendData['custom_filters']['group_by'] =
          this.groupBy && Object.keys(this.groupBy).length > 0
            ? this.groupBy
            : null
      }
      const isIssueBoard = this.$route.name === 'IssueBoards'
      return isIssueBoard ? this.formatSendData(sendData) : sendData
    },
    formatSendData(sendData) {
      const result = Object.assign({}, sendData)
      const removeKey = sendDataMap[this.groupBy.dimension]
      delete result['custom_filters'][removeKey]
      return result
    }
  }
}
</script>
