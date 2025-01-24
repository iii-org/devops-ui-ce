<template>
  <el-form
    ref="issueForm"
    v-loading="isLoading"
    :model="form"
    :rules="issueFormRules"
    label-position="top"
  >
    <el-form-item
      v-if="target === 'Parent'"
      :label="$t('Issue.ParentIssue')"
      prop="parent_id"
    >
      <el-select
        v-model="form.parent_id"
        :loading="issueLoading"
        :placeholder="$t('Issue.SearchNameOrAssignee')"
        :remote-method="getSearchIssue"
        clearable
        filterable
        remote
        style="width: 100%"
      >
        <el-option-group
          v-for="group in issueList"
          :key="group.name"
          :label="group.name"
        >
          <el-option
            v-for="item in group.options"
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
        </el-option-group>
      </el-select>
    </el-form-item>
    <el-form-item
      v-else-if="target === 'Children' && showParent"
      :label="$t('Issue.ParentIssue')"
    >
      <p class="m-0">
        <Status
          :name="$t(`Issue.${row.status.name}`)"
          :type="row.status.name"
          size="mini"
        />
        <Tracker
          :name="$t(`Issue.${row.tracker.name}`)"
          :type="row.tracker.name"
        />
        #{{ row.id }} - {{ row.subject }}
        <span v-if="row.assigned">
          ({{ $t('Issue.Assignee') }}: {{ row.assigned.full_name }} -
          {{ row.assigned.username }})</span>
      </p>
    </el-form-item>
    <el-form-item v-if="target === 'Parent'" :label="$t('Issue.ChildrenIssue')">
      <p class="m-0">
        <Status
          :name="$t(`Issue.${row.status.name}`)"
          :type="row.status.name"
          size="mini"
        />
        <Tracker
          :name="$t(`Issue.${row.tracker.name}`)"
          :type="row.tracker.name"
        />
        #{{ row.id }} - {{ row.subject }}
        <span v-if="row.assigned">
          ({{ $t('Issue.Assignee') }}: {{ row.assigned.full_name }} -
          {{ row.assigned.username }})</span>
      </p>
    </el-form-item>
    <el-form-item v-else :label="$t('Issue.ChildrenIssue')" prop="children_id">
      <el-select
        v-model="form.children_id"
        :loading="issueLoading"
        :placeholder="$t('Issue.SearchNameOrAssignee')"
        :remote-method="getSearchIssue"
        :size="showParent ? '' : 'small'"
        clearable
        filterable
        multiple
        remote
        style="width: 100%"
      >
        <el-option-group
          v-for="group in issueList"
          :key="group.name"
          :label="group.name"
        >
          <el-option
            v-for="item in group.options"
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
        </el-option-group>
      </el-select>
    </el-form-item>
    <el-alert
      v-if="children['append'].length > 0 || children['remove'].length > 0"
    >
      <h3>{{ $t('Issue.CheckChildrenIssueStatus') }}</h3>
      <div v-if="children['append'].length > 0">
        {{ $t('general.Add') }}:
        <ul>
          <li v-for="item in children['append']" :key="item">
            <template v-if="issueFamily[item]">
              <strong>
                <Tracker
                  :name="$t(`Issue.${issueFamily[item].tracker.name}`)"
                  :type="issueFamily[item].tracker.name"
                />
                #{{ issueFamily[item].id }} - {{ issueFamily[item].subject }}
              </strong>
              ({{ $t('Issue.OriginalParentIssue') }}:
              <template v-if="issueFamily[item].parent">
                <Tracker
                  :name="$t(`Issue.${issueFamily[item].parent.tracker.name}`)"
                  :type="issueFamily[item].parent.tracker.name"
                />
                #{{ issueFamily[item].parent.id }} -
                {{ issueFamily[item].parent.subject }}
                <span v-if="issueFamily[item].parent.assigned">
                  (
                  {{ $t('Issue.Assignee') }}:
                  {{ issueFamily[item].parent.assigned.full_name }} -
                  {{ issueFamily[item].parent.assigned.username }}
                  )
                </span>
              </template>
              <template v-else> {{ $t('Issue.NoParentIssue') }}</template>
              )
            </template>
          </li>
        </ul>
      </div>
      <div v-if="children['remove'].length > 0">
        {{ $t('general.Delete') }}:
        <ul>
          <li v-for="item in children['remove']" :key="item">
            <s>
              <template v-if="issueFamily[item]">
                <Tracker
                  :name="$t(`Issue.${issueFamily[item].tracker.name}`)"
                  :type="issueFamily[item].tracker.name"
                />
                #{{ issueFamily[item].id }} - {{ issueFamily[item].subject }}
                <span v-if="issueFamily[item].assigned">
                  (
                  {{ $t('Issue.Assignee') }}:
                  {{ issueFamily[item].assigned.full_name }} -
                  {{ issueFamily[item].assigned.username }}
                  )
                </span>
              </template>
            </s>
          </li>
        </ul>
      </div>
    </el-alert>
  </el-form>
</template>

<script>
import { getIssueDetails, getIssueFamily } from '@/api_v3/issues'
import { getProjectIssueList } from '@/api_v3/projects'
import Status from '@/components/Issue/Status'
import Tracker from '@/components/Issue/Tracker'
import axios from 'axios'
import { mapGetters } from 'vuex'

export default {
  name: 'SettingRelationIssue',
  components: {
    Tracker,
    Status
  },
  props: {
    row: {
      type: Object,
      default: () => ({})
    },
    target: {
      type: String,
      default: 'Parent'
    },
    showParent: {
      type: Boolean,
      default: true
    }
  },
  data() {
    const validateParentId = (_rule, value, callback) => {
      const foundTracker = this.forceTracker.find(
        (tracker) => tracker.id === this.row.tracker.id
      )
      if (value === this.row.id) {
        callback(new Error('The parent issue is the same issue.'))
      } else if (
        this.enableForceTracker &&
        foundTracker &&
        this.row.has_father
      ) {
        const tracker_name = this.$t(`Issue.${foundTracker.name}`)
        const message = this.$t('Notify.NoParentIssueWarning', { tracker_name })
        callback(new Error(message))
      } else {
        callback()
      }
    }
    const validateChildrenId = (_rule, value, callback) => {
      if (value.includes(this.row.id)) {
        callback(new Error('The Children issue has the same issue in list.'))
      } else {
        callback()
      }
    }
    return {
      issueFormRules: {
        parent_id: [{ validator: validateParentId, trigger: 'blur' }],
        children_id: [{ validator: validateChildrenId, trigger: 'blur' }]
      },
      isLoading: false,
      form: {
        parent_id: null,
        children: []
      },
      children: { append: [], remove: [], merge: [] },
      issueLoading: false,
      issueList: [],
      loadingRelation: {},
      issueFamily: {},
      cancelToken: null
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'forceTracker', 'enableForceTracker'])
  },
  watch: {
    issueFamily: {
      deep: true,
      handler(value) {
        if (Object.keys(value).length <= 1) {
          this.getSearchIssue()
        }
        this.$emit('updateFamily', value)
      }
    },
    'form.children_id': {
      deep: true,
      handler() {
        this.childrenIssueDifferent()
      }
    },
    children: {
      deep: true,
      handler(value) {
        value['append'].forEach((item) => {
          this.getIssueFamilyData(item)
        })
        value['remove'].forEach((item) => {
          this.getIssueFamilyData(item)
        })
      }
    },
    isLoading() {
      this.$emit('loading', this.isLoading)
    }
  },
  async mounted() {
    this.isLoading = true
    await this.getIssueFamilyData(this.row.id)
    if (this.issueFamily[this.row.id].parent) {
      this.form.parent_id = this.issueFamily[this.row.id].parent.id
    }
    if (this.issueFamily[this.row.id].children) {
      this.form.children_id = this.issueFamily[this.row.id].children.map(
        (item) => item.id
      )
    }
    await this.getSearchIssue()
    this.isLoading = false
  },
  methods: {
    async getIssueFamilyData(id) {
      try {
        await this.$set(this.loadingRelation, id, true)
        let issue = await getIssueDetails(id)
        let family = await getIssueFamily(id)
        issue = issue.data
        family = family.data
        await this.$set(this.issueFamily, id, { ...issue, ...family })
        await this.$set(this.loadingRelation, id, false)
      } catch (e) {
        //   null
      }
    },
    childrenIssueDifferent() {
      let oldSetting = []
      if (
        this.issueFamily[this.row.id] &&
        this.issueFamily[this.row.id].children
      ) {
        oldSetting = this.issueFamily[this.row.id].children.map(
          (item) => item.id
        )
      }
      const newSetting = this.form.children_id
      const result = [...oldSetting, ...newSetting]
      const merge = [...new Set(result)]
      const append = [...merge.filter((item) => !oldSetting.includes(item))]
      const remove = [
        ...merge.filter((item) => !this.form.children_id.includes(item))
      ]
      return this.$set(this, 'children', {
        append: append,
        remove: remove,
        merge: merge
      })
    },
    originalIssue() {
      if (this.target === 'Parent') {
        if (
          !this.issueFamily[this.row.id] ||
          !this.issueFamily[this.row.id].parent
        ) {
          return {}
        }
        return {
          name: this.$t('Issue.OriginalSetting'),
          options: [this.issueFamily[this.row.id].parent]
        }
      } else if (this.target === 'Children') {
        if (
          !this.issueFamily[this.row.id] ||
          !this.issueFamily[this.row.id].children
        ) {
          return {}
        }
        return {
          name: this.$t('Issue.OriginalSetting'),
          options: this.issueFamily[this.row.id].children
        }
      }
    },
    async getSearchIssue(query) {
      const params = {
        selection: true,
        exclude_closed: true
      }
      this.issueList = []
      if (query !== '' && query) {
        params['search'] = query
        this.issueQuery = query
        this.issueLoading = true
      } else {
        params['page'] = 1
        params['limit'] = 5
        this.issueQuery = null
      }
      if (this.cancelToken) {
        this.cancelToken.cancel()
      }
      const CancelToken = axios.CancelToken.source()
      this.cancelToken = CancelToken
      const res = await getProjectIssueList(this.row.project.id, params, {
        cancelToken: CancelToken.token
      })
      let queryList = res.data
      let key = 'Issue.Result'
      if (!this.issueQuery) {
        if (queryList && queryList.hasOwnProperty('items')) {
          queryList = res.data.items
          if (this.target === 'Children') {
            queryList = res.data.items.filter(
              (item) => item.id !== this.form.parent_id
            )
          }
        } else {
          queryList = []
        }
        key = 'Issue.LastResult'
      }
      const original = this.originalIssue()
      this.issueList = [original, { name: this.$t(key), options: queryList }]
      this.issueLoading = false
      this.cancelToken = null
    },
    highLight: function (value) {
      if (!value) return ''
      if (!this.issueQuery) return value
      const reg = new RegExp(this.issueQuery, 'gi')
      return value.replace(reg, function (str) {
        return (
          "<span class='bg-yellow-200 text-danger p-1'><strong>" +
          str +
          '</strong></span>'
        )
      })
    }
  }
}
</script>
