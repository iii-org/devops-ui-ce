<template>
  <el-dialog
    :visible.sync="linkIssueDialogOptions.isDialogVisible"
    :width="isMobile ? '95%' : '25%'"
    append-to-body
    title="選擇議題"
    top="25vh"
    @close="handleCancel"
  >
    <el-select
      v-model="issueId"
      :loading="isLoading"
      :placeholder="$t('Issue.SearchNameOrAssignee')"
      :remote-method="fetchIssues"
      clearable
      filterable
      remote
      reserve-keyword
      size="small"
      style="width: 100%"
      @focus="fetchIssues()"
    >
      <el-option-group
        v-for="group in issues"
        :key="group.name"
        :label="group.name"
      >
        <el-option
          v-for="item in group.options"
          :key="item.id"
          :label="`#${item.id} - ${item.name}`"
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
                  #{{ item.id }} - {{ item.name }}
                </template>
                <strong>{{ $t('Issue.Description') }}:</strong>
                <p>{{ item.description }}</p>
              </el-card>
            </div>
            <div class="flex justify-between">
              <span class="truncate" style="width: 250px">
                <strong>#<span v-html="highLight(item.id.toString())"></span></strong>
                -
                <span v-html="highLight(item.name)"></span>
              </span>
              <span
                style="color: #8492a6; font-size: 13px"
                v-html="
                  highLight(item.assigned_to ? item.assigned_to.name : null)
                "
              ></span>
            </div>
          </el-tooltip>
        </el-option>
      </el-option-group>
    </el-select>
  </el-dialog>
</template>

<script>
import axios from 'axios'
import { mapGetters } from 'vuex'
import { getProjectIssueList } from '@/api_v2/projects'
import Tracker from '@/components/Issue/Tracker'

export default {
  name: 'LinkIssueDialog',
  components: {
    Tracker
  },
  props: {
    linkIssueDialogOptions: {
      type: Object,
      default: () => ({
        isDialogVisible: false
      })
    }
  },
  data() {
    return {
      issueId: '',
      isLoading: false,
      issues: []
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device']),
    isMobile() {
      return this.device === 'mobile'
    },
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
  methods: {
    async fetchIssues(query) {
      const params = {
        selection: true
      }
      this.issues = []
      if (query !== '' && query) {
        params['search'] = query
        this.isLoading = true
      } else {
        params['offset'] = 0
        params['limit'] = 5
      }
      if (this.cancelToken) {
        this.cancelToken.cancel()
      }
      const CancelToken = axios.CancelToken.source()
      this.cancelToken = CancelToken
      const res = await getProjectIssueList(this.selectedProjectId, params, {
        cancelToken: CancelToken.token
      })
      let queryList = res.data
      let key = 'Issue.Result'
      if (!this.issueQuery) {
        if (queryList && queryList.hasOwnProperty('issue_list')) {
          queryList = res.data.issue_list
        } else {
          queryList = []
        }
        key = 'Issue.LastResult'
      }
      this.issues = [{ name: this.$t(key), options: queryList }]
      this.isLoading = false
      this.cancelToken = null
    },
    handleCancel() {
      this.$emit('onCloseDialog', false)
    }
  }
}
</script>
