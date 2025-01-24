<template>
  <el-select
    ref="select"
    v-model="issue_ids"
    v-loading="isLoading"
    :placeholder="$t('Issue.SearchNameOrAssignee')"
    :remote-method="getSearchIssue"
    clearable
    filterable
    multiple
    remote
    style="width: 100%"
    value-key="issueIds"
    @change="changeIssueIds"
  >
    <el-option-group
      v-for="group in issueList"
      :key="group.name"
      :label="group.name"
    >
      <template v-for="item in group.options">
        <el-option
          :key="item.id"
          :label="'#' + item.id + ' - ' + item.subject"
          :value="item.id"
        >
          <el-tooltip placement="right" popper-class="relation-popper">
            <div slot="content" style="width: 250px">
              <el-card style="max-height: 300px">
                <template slot="header">
                  <Tracker
                    :name="$t(`Issue.${item.tracker.name}`)"
                    :type="item.tracker.name"
                  />
                  #{{ item.id }} - {{ item.subject }}
                </template>
                <strong>{{ $t('Issue.Description') }}:</strong>
                <p>{{ item.description }}</p>
              </el-card>
            </div>
            <div class="flex justify-between">
              <span class="truncate" style="width: 250px">
                <strong>#<span v-html="highLight(item.id.toString())"></span></strong>
                -
                <span v-html="highLight(item.subject)"></span>
              </span>
              <span
                style="color: #8492a6; font-size: 13px"
                v-html="
                  highLight(item.assigned ? item.assigned.full_name : null)
                "
              ></span>
            </div>
          </el-tooltip>
        </el-option>
      </template>
    </el-option-group>
  </el-select>
</template>

<script>
import Tracker from './Tracker'

export default {
  name: 'IssueSelect',
  components: { Tracker },
  props: {
    commitId: {
      type: String,
      default: ''
    },
    parent: {
      type: Object,
      default: () => ({})
    },
    issueIds: {
      type: Array,
      default: () => []
    },
    issueList: {
      type: Array,
      default: () => []
    },
    issueQuery: {
      type: String,
      default: ''
    },
    issueLoading: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isLoading: this.issueLoading,
      issue_ids: this.issueIds
    }
  },
  computed: {
    highLight() {
      return function (value) {
        if (!value) return ''
        if (!this.issueQuery) return value
        const reg = new RegExp(this.issueQuery, 'gi')
        return value.replace(
          reg,
          (str) =>
            `<span class=\'bg-yellow-200 text-danger p-1\'><strong>${str}</strong></span>`
        )
      }
    }
  },
  watch: {
    issueLoading(value) {
      this.isLoading = value
    },
    issueIds(value) {
      if (value) {
        this.issue_ids = this.issueIds
      }
    },
    issue_ids(value) {
      if (!value && !this.issueQuery) {
        this.getSearchIssue()
      }
    }
  },
  methods: {
    async getSearchIssue(query) {
      const commitId = this.commitId
      const parent = this.parent
      this.$emit('update', query, commitId, parent)
    },
    changeIssueIds() {
      this.$nextTick(async () => {
        const { commitId, issue_ids } = this
        const selectedIssues = await this.$refs.select.selected.map(
          (item) => item.label
        )
        this.$emit('change', { commitId, issue_ids, selectedIssues })
      })
    }
  }
}
</script>
