<template>
  <span v-if="filtersByType.length">
    <span v-if="!fromDrawer">
      <el-popover
        placement="bottom"
        trigger="click"
        width="250"
        @hide="onPopoverHide"
      >
        <div class="filter-list">
          <div
            v-for="(filter, idx) in filtersByType"
            :key="filter.id"
            :title="filter.name"
          >
            <el-divider v-if="idx !== 0" />
            <div class="flex justify-between mx-2">
              <div
                class="filter-list-name text-sm self-center"
                @click.prevent="onFilterClick(filter.id)"
              >
                <em
                  v-show="filter.isApplying"
                  class="el-icon-check text-success mr-1"
                />
                <span :class="filter.isApplying ? 'text-success' : ''">{{ filter.name }}</span>
              </div>
              <div>
                <el-button
                  icon="el-icon-edit"
                  size="mini"
                  circle
                  @click="onEditClick(filter.id)"
                />
                <el-popconfirm
                  :confirm-button-text="$t('general.Remove')"
                  :cancel-button-text="$t('general.Cancel')"
                  icon="el-icon-info"
                  popper-class="danger"
                  :title="$t('Issue.RemoveCustomFilter')"
                  @confirm="removeFilter(filter.id)"
                >
                  <el-button
                    slot="reference"
                    type="danger"
                    icon="el-icon-delete"
                    size="mini"
                    circle
                  />
                </el-popconfirm>
              </div>
            </div>
            <div class="bg-gray-100 flex justify-center rounded-xl px-2 mt-2">
              <el-form
                v-if="filter.isShowForm"
                label-position="top"
                label-width="80px"
                :model="formData"
                class="mb-3"
              >
                <el-form-item :label="$t('Issue.CustomFilterName')">
                  <el-input v-model="formData.name" />
                </el-form-item>
                <el-form-item
                  v-if="checkEditable('status')"
                  :label="$t('Issue.status')"
                >
                  <el-select
                    v-model="formData.status_id"
                    :placeholder="$t('Issue.SelectStatus')"
                    clearable
                    filterable
                    @clear="onClear('status_id')"
                  >
                    <el-option
                      v-for="item in statusOptions"
                      :key="item.id"
                      :label="$t(`Issue.${item.name}`)"
                      :value="item.id"
                    >
                      <component
                        :is="'Status'"
                        :name="$t(`Issue.${item.name}`)"
                        :type="item.name"
                      />
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="checkEditable('tags')"
                  :label="$t('Issue.tags')"
                >
                  <el-select
                    v-model="formData.tags"
                    :placeholder="$t('Issue.SelectTag')"
                    clearable
                    filterable
                    collapse-tags
                    multiple
                    @clear="onClear('tags')"
                  >
                    <el-option
                      v-for="item in selectionOptions.tags"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="checkEditable('tracker')"
                  :label="$t('Issue.tracker')"
                >
                  <el-select
                    v-model="formData.tracker_id"
                    :placeholder="$t('Issue.SelectType')"
                    clearable
                    filterable
                    @clear="onClear('tracker_id')"
                  >
                    <el-option
                      v-for="item in trackerOptions"
                      :key="item.id"
                      :label="$t(`Issue.${item.name}`)"
                      :value="item.id"
                    >
                      <component
                        :is="'Tracker'"
                        :name="$t(`Issue.${item.name}`)"
                        :type="item.name"
                      />
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="checkEditable('assigned_to')"
                  :label="$t('Issue.assigned_to')"
                >
                  <el-select
                    v-model="formData.assigned_to_id"
                    :placeholder="$t('Issue.SelectMember')"
                    clearable
                    filterable
                    @clear="onClear('assigned_to_id')"
                  >
                    <el-option
                      v-for="item in selectionOptions.assigned_to"
                      :key="item.login"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="checkEditable('fixed_version')">
                  <div slot="label">
                    {{ $t(`Issue.fixed_version`) }}
                    <el-tag
                      type="info"
                      class="flex-1"
                    >
                      <el-checkbox v-model="formData.show_closed_versions"> {{ $t('Issue.DisplayClosedVersion') }}
                      </el-checkbox>
                    </el-tag>
                  </div>
                  <el-select
                    v-model="formData.fixed_version_id"
                    :placeholder="$t('Issue.SelectVersion')"
                    clearable
                    filterable
                    @clear="onClear('fixed_version_id')"
                  >
                    <el-option
                      v-for="item in selectionOptions.fixed_version"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="checkEditable('priority')"
                  :label="$t('Issue.priority')"
                >
                  <el-select
                    v-model="formData.priority_id"
                    :placeholder="$t('Issue.SelectPriority')"
                    clearable
                    filterable
                    @clear="onClear('priority_id')"
                  >
                    <el-option
                      v-for="item in priorityOptions"
                      :key="item.id"
                      :label="$t(`Issue.${item.name}`)"
                      :value="item.id"
                    >
                      <component
                        :is="'Priority'"
                        :name="$t(`Issue.${item.name}`)"
                        :type="item.name"
                      />
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item v-if="checkEditable('DisplayClosedIssue')">
                  <div slot="label">
                    {{ $t('Issue.DisplayClosedIssue') }}
                    <el-checkbox
                      v-model="formData.show_closed_issues"
                      class="ml-2"
                    />
                  </div>
                </el-form-item>
                <div class="flex justify-between">
                  <el-button
                    size="small"
                    class="buttonSecondaryReverse"
                    @click="onCancelClick(filter.id)"
                  >
                    {{ $t('general.Cancel') }}
                  </el-button>
                  <el-button
                    class="buttonPrimary"
                    size="small"
                    @click="editFilter(filter)"
                  >
                    {{ $t('general.Save') }}
                  </el-button>
                </div>
              </el-form>
            </div>
          </div>
        </div>
        <el-button
          slot="reference"
          class="headerTextColor"
          type="text"
        >
          {{ $t('Issue.CustomFilter') }}
          <em class="el-icon-arrow-down" />
        </el-button>
      </el-popover>
      <el-divider direction="vertical" />
    </span>
    <div v-else class="custom-drawer">
      <div class="title flex justify-between">
        <span>
          <el-divider direction="vertical" />
          <span class="text">{{ $t('Issue.CustomFilter') }}</span>
        </span>
        <el-button class="buttonTertiary" size="small" @click="handleClearFilter">
          {{ $t('general.Clear') }}
        </el-button>
      </div>
      <el-radio-group v-model="selectedCustomFilter" size="small" class="custom-filter">
        <el-radio
          v-for="filter in filtersByType"
          :key="filter.id"
          :label="filter.id"
          :value="filter.id"
          class="radio"
          border
        >
          {{ filter.name }}
        </el-radio>
      </el-radio-group>
      <el-divider />
    </div>
  </span>
</template>

<script>
import { mapGetters } from 'vuex'
import { getIssueFilter, editIssueFilter, removeIssueFilter } from '@/api/issueFilter'

const defaultFormData = () => ({
  name: '',
  status_id: null,
  tags: null,
  tracker_id: null,
  assigned_to_id: null,
  fixed_version_id: null,
  priority_id: null,
  show_closed_issues: false,
  show_closed_versions: false,
  group_by: null,
  focus_tab: null,
  expired_days: null
})
const keysMap = {
  assigned_to_id: 'assigned_to',
  fixed_version_id: 'fixed_version',
  priority_id: 'priority',
  status_id: 'status',
  tags: 'tags',
  tracker_id: 'tracker',
  show_closed_issues: 'displayClosed',
  show_closed_versions: 'fixed_version_closed',
  group_by: 'groupBy',
  focus_tab: 'activeTab',
  expired_days: 'expiredDays'
}
export default {
  name: 'CustomFilter',
  components: {
    Tracker: () => import('@/components/Issue/Tracker'),
    Status: () => import('@/components/Issue/Status'),
    Priority: () => import('@/components/Issue/Priority')
  },
  props: {
    selectionOptions: {
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
      default: 'assigned_to_id'
    },
    groupBy: {
      type: Object,
      default: null
    },
    fromDrawer: {
      type: Boolean,
      default: false
    },
    selectedId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      filters: [],
      formData: defaultFormData(),
      showEditForm: false,
      selectedCustomFilter: null
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'tracker', 'status', 'priority']),
    trackerOptions() {
      return this.tracker
    },
    statusOptions() {
      return this.status
    },
    priorityOptions() {
      return this.priority
    },
    filtersByType() {
      return this.filters.filter((item) => item.type === this.type)
    },
    focusProjectId() {
      if (this.$route.name === 'MyWork') {
        return this.projectId ? this.projectId : -1 // -1 means all projects (dump project)
      } else {
        return this.selectedProjectId
      }
    }
  },
  watch: {
    focusProjectId() {
      this.fetchCustomFilter()
    },
    selectedCustomFilter(value) {
      if (value) this.onFilterClick(value)
    }
  },
  mounted() {
    this.fetchCustomFilter()
  },
  methods: {
    async fetchCustomFilter() {
      this.isLoading = true
      return getIssueFilter(this.focusProjectId)
        .then((res) => {
          this.filters = res.data.map((item) =>
            Object.assign({}, item, {
              custom_filter: this.formatCustomFilter(item.custom_filter),
              isShowForm: false,
              isApplying: this.selectedId ? this.selectedId === item.id : false
            })
          )
          this.selectedCustomFilter = this.selectedId
        })
        .catch((err) => console.error(err))
        .then(() => (this.isLoading = false))
    },
    formatCustomFilter(options) {
      const result = Object.assign({}, options)
      Object.keys(options).forEach((key) => {
        if (key === 'tags') {
          result[key] = options[key] === null ? null : options[key].split(',').map((i) => Number(i))
        } else if (key === 'show_closed_issues' || key === 'show_closed_versions') {
          result[key] = options[key] === null ? null : Boolean(options[key])
        } else if (['focus_tab', 'group_by'].includes(key)) {
          result[key] = options[key]
        } else if (key === 'assigned_to_id') {
          result[key] = this.formatAssignedTo(options[key])
        } else if (key === 'status_id' && options[key] === 'overdued') {
          result[key] === options[key]
        } else {
          result[key] = options[key] === null ? null : Number(options[key])
        }
      })
      return result
    },
    formatAssignedTo(idString) {
      if (idString === null) {
        return null
      } else if (idString === 'null') {
        return 'null'
      } else {
        return Number(idString)
      }
    },
    onEditClick(filterId) {
      this.onPopoverHide()
      const idx = this.filters.findIndex((item) => item.id === filterId)
      this.formData = Object.assign({}, this.filters[idx].custom_filter, {
        name: this.filters[idx].name
      })
      this.filters[idx].isShowForm = !this.filters[idx].isShowForm
    },
    onCancelClick() {
      this.onPopoverHide()
    },
    removeFilter(filterId) {
      removeIssueFilter(this.focusProjectId, filterId).then((res) => {
        this.fetchCustomFilter()
        this.$message.success(this.$t('Notify.Deleted'))
      })
    },
    onPopoverHide() {
      this.filters.forEach((filter) => {
        filter.isShowForm = false
      })
    },
    editFilter(filter) {
      const { id } = filter
      const sendData = Object.assign({}, this.formData)
      sendData['type'] = this.type
      sendData['tags'] = this.formatSendTags(sendData['tags'])
      this.modifyCustomFilter(id, sendData)
    },
    formatSendTags(tags) {
      if (tags === null) return null
      if (tags.length < 1) return null
      else return tags.join(',')
    },
    modifyCustomFilter(filterId, sendData) {
      editIssueFilter(this.focusProjectId, filterId, sendData).then(async () => {
        await this.fetchCustomFilter()
        this.$message({
          message: this.$t('Notify.Saved'),
          type: 'success'
        })
        this.onFilterClick(filterId)
      })
    },
    resetApplyFilter() {
      this.filters.forEach((filter) => {
        filter.isApplying = false
      })
      this.selectedCustomFilter = null
    },
    onFilterClick(filterId) {
      this.resetApplyFilter()
      const idx = this.filters.findIndex((item) => item.id === filterId)
      this.filters[idx].isApplying = !this.filters[idx].isApplying
      this.selectedCustomFilter = filterId
      this.emitCustomFilter(this.filters[idx].custom_filter)
      this.$emit('on-filter-click', filterId)
    },
    emitCustomFilter(filters) {
      const options = Object.assign({}, filters)
      const result = Object.keys(options).reduce(
        (acc, key) => ({ ...acc, ...{ [keysMap[key] || key]: options[key] }}),
        {}
      )
      const { displayClosed, fixed_version_closed, activeTab, groupBy } = result
      delete result.displayClosed
      delete result.fixed_version_closed
      delete result.activeTab
      delete result.groupBy
      this.$emit('apply-filter', { result, displayClosed, fixed_version_closed, activeTab, groupBy })
    },
    onClear(itemName) {
      this.formData[itemName] = null
    },
    checkEditable(formItemName) {
      const isMyWork = this.$route.name === 'MyWork'
      if (isMyWork) {
        return this.checkIsMyWorkFilterDisplayRule(formItemName)
      } else {
        if (!this.groupBy) return true
        const { dimension } = this.formData.group_by
        return formItemName !== dimension
      }
    },
    checkIsMyWorkFilterDisplayRule(formItemName) {
      if (formItemName === 'fixed_version') return this.projectId
      if (formItemName === 'assigned_to') {
        const { focus_tab } = this.formData
        return focus_tab === 'author_id'
      }
      return formItemName !== 'tags'
    },
    handleClearFilter() {
      this.selectedCustomFilter = null
      this.$emit('clear')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
.filter-list {
  max-height: 80vh;
  overflow-x: hidden;
  overflow-y: auto;
  &-name {
    @apply font-medium text-base truncate w-3/5 cursor-pointer;
  }
}
.custom-drawer {
  ::v-deep .el-divider {
    background-color: #EBEEF5;
  }
  .title {
    margin-bottom: 10px;
    ::v-deep .el-divider--vertical {
      width: 6px;
      margin: 0;
      border-radius: 3px 0 0 3px;
      height: 18px;
      background-color: $warning !important;
    }
    ::v-deep .el-tag--small {
      height: 25px;
    }
    ::v-deep .el-button--small {
      padding: 5px 10px;
    }
    ::v-deep .el-checkbox__label {
      font-size: 12px;
    }
    .text {
      font-size: 15px;
      font-weight: bold;
      color: #72767b;
      vertical-align: middle;
    }
  }
  .custom-filter {
    ::v-deep .el-radio__inner {
      height: 0;
      width: 0;
      border: none;
      &:after {
        transform: scale(0);
        height: 0;
        width: 0;
        color: none;
      }
    }
    ::v-deep .el-radio__label {
      padding-left: 2px;
    }
    ::v-deep .el-radio--small.is-bordered {
      border-radius: 16px;
    }
    ::v-deep .el-radio {
      margin-right: 0;
    }
    ::v-deep .el-radio__input.is-checked .el-radio__inner {
      border: none;
      background: none;
      &:after {
        transform: scale(0);
      }
    }
    --n: 1;
    display: flex;
    align-items: center;
    overflow-y: hidden;
    width: 100%; // fallback
    width: calc(var(--n)*100%);
    transform: translate(calc(var(--i)/var(--n) * -100%));
    padding-bottom: 10px;
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    .radio {
      width: 100%; // fallback
      width: calc(100%/var(--n))
    }
  }
  .custom-filter::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }
}
</style>
