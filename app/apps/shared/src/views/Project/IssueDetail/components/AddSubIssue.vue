<template>
  <div>
    <el-button
      ref="btn"
      icon="el-icon-close"
      style="margin-right: 10px"
      type="text"
      @click="$emit('close')"
    />
    <el-tabs ref="tabs" type="border-card">
      <el-tab-pane
        :label="$t('general.Create', { name: $t('general.SubIssue') })"
      >
        <QuickAddIssue
          v-if="isCreateSubIssue"
          :is-table="true"
          :parent="parentData"
          :project-id="parentData.project.id"
          :show-close="false"
          :sub-issue="true"
          :visible="true"
          @close="$emit('close')"
          @update="$emit('update')"
        />
        <el-row v-else>
          <el-col :span="20">
            <SettingRelationIssue
              :key="reloadSettingRelation"
              ref="settingRelationIssue"
              :row.sync="parentData"
              :show-parent="false"
              :target="'Children'"
              @loading="isLoading = $event"
            />
          </el-col>
          <el-col :span="4">
            <el-button
              :loading="isLoading"
              icon="el-icon-check"
              size="small"
              style="padding: 9px 8px; margin-top: 53px; margin-left: 10px"
              type="success"
              @click="onSaveCheckRelationIssue"
            />
          </el-col>
        </el-row>
        <el-link
          :underline="false"
          type="primary"
          @click="isCreateSubIssue = !isCreateSubIssue"
        >
          {{
            isCreateSubIssue
              ? $t('general.AddExistingIssue')
              : $t('general.AddNewSubIssue')
          }}
        </el-link>
      </el-tab-pane>
      <el-tab-pane
        v-loading="isTabIssueLoading"
        :label="$t('general.Settings', { name: $t('Issue.ParentIssue') })"
      >
        <el-row :gutter="10" class="flex items-center">
          <el-col :span="18">
            <el-select
              v-model="form.parent_id"
              :loading="issueLoading"
              :placeholder="$t('Issue.SearchNameOrAssignee')"
              :remote-method="getSearchIssue"
              clearable
              filterable
              remote
              style="width: 100%"
              @change="updateParentIssue()"
              @focus="getSearchIssue()"
            >
              <el-option-group
                v-for="group in issueList"
                :key="group.name"
                :label="group.name"
              >
                <template v-for="item in group.options">
                  <el-option
                    v-if="
                      !form.relation_ids.includes(item.id) &&
                        item.id !== issueId
                    "
                    :key="item.id"
                    :label="'#' + item.id + ' - ' + item.subject"
                    :value="item.id"
                  >
                    <el-tooltip
                      placement="right"
                      popper-class="relation-popper"
                    >
                      <div slot="content" style="width: 250px">
                        <el-card style="max-height: 300px">
                          <template slot="header">
                            <Tracker
                              :name="$t(`Issue.${item.tracker.name}`)"
                              :type="item.tracker.name"
                            />
                            #{{ item.id }} - {{ item.subject }}
                          </template>
                          <strong> {{ $t('Issue.Description') }}: </strong>
                          <p>{{ item.description }}</p>
                        </el-card>
                      </div>
                      <div class="flex justify-between">
                        <span class="truncate" style="width: 250px">
                          <strong>
                            #<span
                              v-html="highLight(item.id.toString())"
                            ></span>
                          </strong>
                          -
                          <span v-html="highLight(item.subject)"></span>
                        </span>
                        <span
                          style="color: #8492a6; font-size: 13px"
                          v-html="
                            highLight(
                              item.assigned ? item.assigned.full_name : null
                            )
                          "
                        ></span>
                      </div>
                    </el-tooltip>
                  </el-option>
                </template>
              </el-option-group>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-tag v-if="getTrackerFilter.name" icon="el-icon-s-operation">
              <el-checkbox v-model="isRecommendRelation" />
              {{ $t('general.Filter') }}:
              {{ $t('Issue.' + getTrackerFilter.name) }}
            </el-tag>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane
        v-loading="isTabIssueLoading"
        :label="$t('general.Settings', { name: $t('Issue.RelatedIssue') })"
      >
        <el-row class="flex items-center">
          <el-col :span="20">
            <el-select
              v-model="form.relation_ids"
              :loading="issueLoading"
              :placeholder="$t('Issue.SearchNameOrAssignee')"
              :remote-method="getSearchRelationIssue"
              clearable
              filterable
              multiple
              remote
              style="width: 100%"
              @focus="getSearchRelationIssue()"
            >
              <el-option-group
                v-for="group in relationIssueList"
                :key="group.subject"
                :label="group.subject"
              >
                <template v-for="item in group.options">
                  <el-option
                    v-if="item.id !== form.parent_id && item.id !== issueId"
                    :key="item.id"
                    :label="`#${item.id} - ${item.subject}`"
                    :value="item.id"
                  >
                    <el-tooltip
                      placement="right"
                      popper-class="relation-popper"
                    >
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
                          <strong>
                            #<span
                              v-html="
                                highLight(item.id ? item.id.toString() : '')
                              "
                            ></span>
                          </strong>
                          -
                          <span v-html="highLight(item.subject)"></span>
                        </span>
                        <span
                          style="color: #8492a6; font-size: 13px"
                          v-html="
                            highLight(
                              item.assigned ? item.assigned.full_name : null
                            )
                          "
                        ></span>
                      </div>
                    </el-tooltip>
                  </el-option>
                </template>
              </el-option-group>
            </el-select>
          </el-col>
          <el-col :span="4">
            <span v-if="isRelationIssueChange" class="ml-3">
              <el-button
                class="action"
                icon="el-icon-check"
                size="mini"
                type="success"
                @click="updateRelationIssue"
              />
              <el-button
                class="action"
                icon="el-icon-close"
                size="mini"
                type="danger"
                @click="
                  form.relation_ids = JSON.parse(
                    JSON.stringify(originRelationIds)
                  )
                "
              />
            </span>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import axios from 'axios'
import { getProjectIssueList } from '@/api_v3/projects'
import { updateIssue, updateIssueRelation } from '@/api_v3/issues'

const relationIssueFilter = {
  Feature: 'Test Plan',
  'Test Plan': 'Feature',
  'Fail Management': 'Test Plan'
}

export default {
  name: 'AddSubIssue',
  components: {
    Tracker: () => import('@/components/Issue/Tracker'),
    QuickAddIssue: () =>
      import('@shared/views/MyWork/components/QuickAddIssue'),
    SettingRelationIssue: () =>
      import('@shared/views/Project/IssueList/components/SettingRelationIssue')
  },
  props: {
    parentData: {
      type: Object,
      default: () => ({})
    },
    issueId: {
      type: Number,
      default: 0
    },
    parent: {
      type: Object,
      default: () => ({})
    },
    relations: {
      type: Array,
      default: () => []
    },
    form: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isLoading: false,
      reloadSettingRelation: 0,
      issueQuery: null,
      isTabIssueLoading: false,
      issueLoading: false,
      issueList: [],
      relationIssueList: [],
      isRecommendRelation: false,
      cancelToken: null,
      originRelationIds: [],
      isCreateSubIssue: true
    }
  },
  computed: {
    ...mapGetters(['tracker']),
    originalParentIssue() {
      if (Object.keys(this.parent).length <= 0) return {}
      return { name: this.$t('Issue.OriginalSetting'), options: [this.parent] }
    },
    originalRelationIssue() {
      if (Object.keys(this.relations).length <= 0) {
        return {}
      }
      return { name: this.$t('Issue.OriginalSetting'), options: this.relations }
    },
    getTrackerFilter() {
      if (this.tracker.length < 0) return { id: null, name: null }
      if (!this.form.tracker_id) {
        return this.getObjectByName(this.tracker, 'Test Plan')
      }
      if (!this.getObjectById(this.tracker, this.form.tracker_id)) {
        return { id: null, name: null }
      }
      const getFilter = this.getObjectByName(
        this.tracker,
        relationIssueFilter[
          this.getObjectById(this.tracker, this.form.tracker_id).name
        ]
      )
      if (!getFilter) {
        return { id: null, name: null }
      }
      return getFilter
    },
    isRelationIssueChange() {
      if (!this.form.relation_ids) return false
      if (this.form.relation_ids.length !== this.originRelationIds.length) {
        return true
      }
      return !this.originRelationIds.every((item) =>
        this.form.relation_ids.includes(item)
      )
    }
  },
  watch: {
    parent: {
      deep: true,
      handler() {
        this.getSearchIssue()
      }
    },
    'form.parent_id'(value) {
      if (!value && !this.issueQuery) {
        this.getSearchIssue()
      }
    },
    'form.project_id': {
      handler(newPId, oldPId) {
        if (newPId) {
          this.onChangePId()
        }
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    const scrollBar = this.$refs.tabs.$el.querySelector('.el-tabs__nav-scroll')
    scrollBar.appendChild(this.$refs.btn.$el)
    this.setOriginRelationIds()
  },
  methods: {
    onSaveCheckRelationIssue() {
      this.$refs.settingRelationIssue.$refs.issueForm.validate((valid) => {
        if (valid) {
          this.onSaveRelationIssue()
        }
      })
    },
    async onSaveRelationIssue() {
      this.isLoading = true
      try {
        const getSettingRelationIssue = this.$refs['settingRelationIssue']
        const updateApi = []
        if (getSettingRelationIssue.target === 'Parent') {
          const sendData = {
            parent_id: getSettingRelationIssue.form.parent_id
          }
          updateApi.push(updateIssue(getSettingRelationIssue.row.id, sendData))
        } else if (getSettingRelationIssue.target === 'Children') {
          const appendSendData = { parent_id: getSettingRelationIssue.row.id }
          const removeSendData = { parant_id: '' }
          getSettingRelationIssue.children['append'].forEach((item) => {
            updateApi.push(updateIssue(item, appendSendData))
          })
          getSettingRelationIssue.children['remove'].forEach((item) => {
            updateApi.push(updateIssue(item, removeSendData))
          })
        }
        await Promise.allSettled(updateApi)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        this.$emit('update')
      } catch (e) {
        console.error(e)
      }
      this.reloadSettingRelation++
      this.isLoading = false
    },
    getSearchIssue(query) {
      const issueKey = 'parent'
      this.getIssue(query, issueKey)
    },
    getSearchRelationIssue(query) {
      const issueKey = 'relation'
      this.getIssue(query, issueKey)
    },
    async getIssue(query, issue_key) {
      const params = this.getSearchParams(query, issue_key)
      const cancelToken = this.checkToken()
      await getProjectIssueList(this.form.project_id, params, {
        cancelToken
      }).then((res) => {
        switch (issue_key) {
          case 'parent':
            this.issueList = this.getListLabels(res, issue_key)
            break
          case 'relation':
            this.relationIssueList = this.getListLabels(res, issue_key)
        }
      })
      this.issueLoading = false
      this.cancelToken = null
    },
    getSearchParams(query, issue_key) {
      const params = {
        exclude_relation: true,
        exclude_closed: true
      }
      if (query !== '' && query) {
        params['search'] = query
        this.issueQuery = query
        this.issueLoading = true
      } else {
        params['page'] = 1
        params['limit'] = 5
        this.issueQuery = null
      }
      switch (issue_key) {
        case 'parent':
          if (this.isRecommendRelation && this.getTrackerFilter.id) {
            params['tracker_id'] = this.getTrackerFilter.id
          }
          break
        case 'relation':
          this.relationIssueList = []
      }
      return params
    },
    getListLabels(res, issue_key) {
      const queryList = res.data.items
      let key = 'Issue.Result'
      let issueList
      if (!this.issueQuery) {
        key = 'Issue.LastResult'
      }
      switch (issue_key) {
        case 'parent':
          issueList = [
            this.originalParentIssue,
            { name: this.$t(key), options: queryList }
          ]
          break
        case 'relation':
          issueList = [
            this.originalRelationIssue,
            { name: this.$t(key), options: queryList }
          ]
      }
      return issueList
    },
    async updateParentIssue() {
      this.isTabIssueLoading = true
      const sendData = { parent_id: this.form.parent_id }
      await updateIssue(this.issueId, sendData).then(() => {
        this.$emit('update', true)
      })
      this.isTabIssueLoading = false
    },
    async updateRelationIssue() {
      if (this.form.relation_ids) {
        this.isTabIssueLoading = true
        await updateIssueRelation(this.issueId, {
          issue_to_ids: this.form.relation_ids
        }).then(() => {
          this.$emit('update', true)
          this.setOriginRelationIds()
        })
        this.isTabIssueLoading = false
      }
    },
    getObjectById(list, id) {
      return list.find((item) => item.id === id)
    },
    getObjectByName(list, name) {
      return list.find((item) => item.name === name)
    },
    checkToken() {
      if (this.cancelToken) this.cancelToken.cancel()
      const CancelToken = axios.CancelToken.source()
      this.cancelToken = CancelToken
      return CancelToken.token
    },
    onChangePId() {
      this.getSearchIssue()
      this.getSearchRelationIssue()
    },
    setOriginRelationIds() {
      this.originRelationIds = JSON.parse(
        JSON.stringify(this.form.relation_ids)
      )
    },
    highLight(value) {
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

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
@import 'src/styles/theme/mixin.scss';

::v-deep {
  .el-tabs__nav-scroll {
    display: flex;
    justify-content: space-between;
  }
}

.el-button--success {
  @include css-prefix(transition, all 0.6s ease);
  color: $success;
  border: 1px solid #989898;
  background: none;

  &:hover {
    color: #fff;
    border: 1px solid $success;
    background: $success;
  }
}

.el-button--danger {
  @include css-prefix(transition, all 0.6s ease);
  color: $danger;
  border: 1px solid #989898;
  background: none;

  &:hover {
    color: #fff;
    border: 1px solid $danger;
    background: $danger;
  }
}

.action {
  margin: 0;

  &.el-button--mini {
    padding: 5px;
  }
}
</style>
