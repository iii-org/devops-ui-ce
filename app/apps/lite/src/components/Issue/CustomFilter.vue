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
                ></em>
                <span :class="filter.isApplying ? 'text-success' : ''">{{
                  filter.name
                }}</span>
              </div>
              <div>
                <em
                  class="ri-edit-box-line success table-button"
                  @click="onEditClick(filter.id)"
                ></em>
                <el-popconfirm
                  :cancel-button-text="$t('general.Cancel')"
                  :confirm-button-text="$t('general.Remove')"
                  :title="$t('Issue.RemoveCustomFilter')"
                  icon="el-icon-info"
                  popper-class="danger"
                  @confirm="removeFilter(filter.id)"
                >
                  <em
                    slot="reference"
                    class="ri-delete-bin-2-line danger table-button"
                  ></em>
                </el-popconfirm>
              </div>
            </div>
            <div class="bg-gray-100 flex justify-center rounded-xl px-2 mt-2">
              <el-form
                v-if="filter.isShowForm"
                :model="formData"
                class="mb-3"
                label-position="top"
                label-width="80px"
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
                    collapse-tags
                    filterable
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
                  v-if="checkEditable('assigned')"
                  :label="$t('Issue.assigned')"
                >
                  <el-select
                    v-model="formData.assigned_id"
                    :placeholder="$t('Issue.SelectMember')"
                    clearable
                    filterable
                    @clear="onClear('assigned_id')"
                  >
                    <el-option
                      v-for="item in selectionOptions.assigned"
                      :key="item.username"
                      :label="item.full_name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="checkEditable('version')">
                  <div slot="label">
                    {{ $t(`Issue.version`) }}
                    <el-tag class="flex-1" plain>
                      <el-checkbox v-model="formData.show_closed_versions">
                        {{ $t('Issue.DisplayClosedVersion') }}
                      </el-checkbox>
                    </el-tag>
                  </div>
                  <el-select
                    v-model="formData.version_id"
                    :placeholder="$t('Issue.SelectVersion')"
                    clearable
                    filterable
                    @clear="onClear('version_id')"
                  >
                    <el-option
                      v-for="item in selectionOptions.version"
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
                  <el-button size="small" @click="onCancelClick(filter.id)">
                    {{ $t('general.Cancel') }}
                  </el-button>
                  <el-button
                    size="small"
                    type="primary"
                    @click="editFilter(filter)"
                  >
                    {{ $t('general.Save') }}
                  </el-button>
                </div>
              </el-form>
            </div>
          </div>
        </div>
        <el-button slot="reference" class="header-text-color" type="text">
          {{ $t('Issue.CustomFilter') }}
          <em class="el-icon-arrow-down"></em>
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
        <el-button plain size="small" type="warning" @click="handleClearFilter">
          {{ $t('general.Clear') }}
        </el-button>
      </div>
      <el-radio-group
        v-model="selectedCustomFilter"
        class="custom-filter"
        size="small"
        @change="onFilterClick"
      >
        <el-radio
          v-for="filter in filtersByType"
          :key="filter.id"
          :label="filter.id"
          :value="filter.id"
          border
          class="radio"
        >
          {{ filter.name }}
        </el-radio>
      </el-radio-group>
      <el-divider />
    </div>
  </span>
</template>

<script>
import {
  deleteCustomIssueFilter,
  getCustomIssueFilter,
  updateCustomIssueFilter
} from '@/api_v3/user'
import { mapGetters } from 'vuex'

const defaultFormData = () => ({
  name: '',
  status_id: null,
  tags: null,
  tracker_id: null,
  assigned_id: null,
  version_id: null,
  priority_id: null,
  show_closed_issues: false,
  show_closed_versions: false,
  group_by: null,
  focus_tab: null,
  expired_days: null
})
const keysMap = {
  assigned_id: 'assigned',
  version_id: 'version',
  priority_id: 'priority',
  status_id: 'status',
  tags: 'tags',
  tracker_id: 'tracker',
  show_closed_issues: 'displayClosed',
  show_closed_versions: 'version_closed',
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
      default: 'assigned_id'
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
      // -1 means all projects (dump project)
      return this.$route.name === 'MyWork'
        ? this.projectId ?? -1
        : this.selectedProjectId
    }
  },
  watch: {
    focusProjectId() {
      this.fetchCustomFilter()
    }
  },
  mounted() {
    this.fetchCustomFilter()
  },
  methods: {
    async fetchCustomFilter() {
      this.isLoading = true
      return getCustomIssueFilter()
        .then((res) => {
          this.filters = res.data.map((item) =>
            Object.assign({}, item, {
              custom_filters: this.formatCustomFilter(item.custom_filters),
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
          result[key] =
            options[key] === null
              ? null
              : options[key].split(',').map((i) => Number(i))
        } else if (
          key === 'show_closed_issues' ||
          key === 'show_closed_versions'
        ) {
          result[key] = options[key] === null ? null : Boolean(options[key])
        } else {
          result[key] = options[key]
        }
      })
      return result
    },
    onEditClick(filterId) {
      this.onPopoverHide()
      const idx = this.filters.findIndex((item) => item.id === filterId)
      this.formData = Object.assign({}, this.filters[idx].custom_filters, {
        name: this.filters[idx].name
      })
      this.filters[idx].isShowForm = !this.filters[idx].isShowForm
    },
    onCancelClick() {
      this.onPopoverHide()
    },
    removeFilter(filterId) {
      deleteCustomIssueFilter(filterId).then(() => {
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
      const sendData = {
        name: this.formData.name,
        type: this.type,
        custom_filters: {
          ...Object.assign({}, this.formData),
          tags: this.formatSendTags(this.formData.tags)
        }
      }
      delete sendData.custom_filters.name
      this.modifyCustomFilter(id, sendData)
    },
    formatSendTags(tags) {
      if (tags === null) return null
      if (tags.length < 1) return null
      else return tags.join(',')
    },
    modifyCustomFilter(filterId, sendData) {
      updateCustomIssueFilter(filterId, sendData).then(async () => {
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
      this.emitCustomFilter(this.filters[idx].custom_filters)
      this.$emit('on-filter-click', filterId)
    },
    emitCustomFilter(filters) {
      const options = Object.assign({}, filters)
      const result = Object.keys(options).reduce(
        (acc, key) => ({ ...acc, ...{ [keysMap[key] || key]: options[key] }}),
        {}
      )
      const { displayClosed, version_closed, activeTab, groupBy } = result
      delete result.displayClosed
      delete result.version_closed
      delete result.activeTab
      delete result.groupBy
      this.$emit('apply-filter', {
        result,
        displayClosed,
        version_closed,
        activeTab,
        groupBy
      })
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
      if (formItemName === 'version') return this.projectId
      if (formItemName === 'assigned') {
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
@import 'src/styles/theme/variables.module.scss';

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
    background-color: #ebeef5;
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
    width: calc(var(--n) * 100%);
    transform: translate(calc(var(--i) / var(--n) * -100%));
    padding-bottom: 10px;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    .radio {
      width: 100%; // fallback
      width: calc(100% / var(--n));
    }
  }

  .custom-filter::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
}
</style>
