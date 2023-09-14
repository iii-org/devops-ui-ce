<template>
  <div>
    <span v-if="!isDrawer">
      <slot />
      <el-popover
        popper-class="popper"
        placement="bottom"
        trigger="click"
        @hide="resetSaveFilterButtons"
      >
        <el-form v-loading="listLoading" label-position="top">
          <template v-for="dimension in filterOptionsWithProject">
            <el-form-item v-if="groupBy?.dimension !== dimension.value" :key="dimension.id">
              <div slot="label">
                {{ $t(`Issue.${dimension.value}`) }}
                <el-tag
                  v-if="dimension.value === 'fixed_version'"
                  type="info"
                  size="small"
                  class="flex-1"
                >
                  <el-checkbox v-model="fixed_version_closed">
                    <span class="text-xs">{{ $t('Issue.DisplayClosedVersion') }}</span>
                  </el-checkbox>
                </el-tag>
              </div>
              <component
                :is="dimension.component"
                v-if="dimension.component"
                v-model="filterValue[dimension.value]"
                v-bind="dimension.componentOptions"
                @change="onChangeFilter"
              />
              <el-select
                v-else
                v-model="filterValue[dimension.value]"
                :placeholder="$t('Issue.Select'+dimension.placeholder)"
                :disabled="selectedProjectId === -1"
                filterable
                clearable
                :multiple="dimension.value === 'tags'"
                :collapse-tags="dimension.value === 'tags'"
                @change="onChangeFilter"
              >
                <el-option
                  v-for="item in (dimension.value === 'status')
                    ? filterClosedStatus(getOptionsData(dimension.value))
                    : getOptionsData(dimension.value)"
                  :key="(dimension.value === 'assigned_to') ? item.login : item.id"
                  :label="getSelectedLabel(item)"
                  :class="{[item.class]:item.class}"
                  :value="item.id"
                >
                  <component
                    :is="dimension.value"
                    v-if="dimension.tag"
                    :name="$t(`Issue.${item.name}`)"
                    :type="item.name"
                  />
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="dimension.value === 'status' && filterValue[dimension.value] === 'overdued'"
              :key="`${dimension.id}_dueDays`"
            >
              <div slot="label">{{ $t('general.ExpiredDays') }}</div>
              <el-input
                v-model="filterValue.expiredDays"
                placeholder="1"
                @change="onChangeFilter(Number(filterValue.expiredDays) || Number(1))"
              />
            </el-form-item>
          </template>
          <el-form-item>
            <label class="el-form-item__label mr-3">{{ $t('Issue.DisplayClosedIssue') }}</label>
            <el-checkbox
              v-model="displayClosed"
              @change="onChangeFilter"
            />
          </el-form-item>
        </el-form>
        <SaveFilterButton
          v-show="checkSaveFilterButtonDisplay()"
          ref="saveFilterButton"
          :type="type"
          :filter-value="filterValueClone"
          :group-by="groupBy"
          @update="onCustomFilterAdded"
        />
        <el-button
          slot="reference"
          icon="el-icon-s-operation"
          type="text"
          class="header-text-color"
        >
          {{ isMobile ? '': displayFilterValue }}
          <em class="el-icon-arrow-down el-icon--right" />
        </el-button>
      </el-popover>
      <el-divider direction="vertical" />
      <el-input
        v-if="searchVisible"
        id="input-search"
        v-model="keyword"
        prefix-icon="el-icon-search"
        :placeholder="$t('Issue.SearchNameOrAssignee')"
        :style="{width: isMobile ? '120px' : '250px'}"
        clearable
        @blur="searchVisible=!searchVisible"
        @input="onChangeKeyword"
      />
      <el-button
        v-else
        type="text"
        icon="el-icon-search"
        class="header-text-color"
        @click="searchVisible = !searchVisible"
      >
        {{ isMobile ? '' : ($t('general.Search') + ((keyword) ? ': ' + keyword : '')) }}
      </el-button>
      <template v-if="isFilterChanged">
        <el-divider direction="vertical" />
        <el-button
          size="small"
          icon="el-icon-close"
          class="button-secondary-reverse"
          @click="cleanFilter"
        >
          <span v-if="!isMobile">{{ $t('Issue.CleanFilter') }}</span>
        </el-button>
      </template>
      <slot name="download" />
    </span>
    <div v-if="isDrawer" style="margin: 10px 5px 0 5px">
      <Fab
        position="bottom-right"
        bg-color="#409eff"
        icon-size="small"
        main-icon="more_vert"
        :actions="fabActions"
        @addButton="$emit('add-issue')"
        @searchButton="handleFloatingSearchButton"
        @filterButton="handleFloatingFilterButton"
      />
      <el-drawer
        :key="`drawer-${drawerKey}`"
        v-loading="listLoading"
        :title="$t('general.Filter')"
        :visible.sync="isShowFloatingFilter"
        direction="btt"
        class="drawer"
        size="90%"
        destroy-on-close
      >
        <div class="container">
          <el-card shadow="never">
            <template v-for="dimension in filterOptionsWithProject">
              <div :key="`${dimension.value}_${dimension.id}`">
                <div class="title flex justify-between">
                  <span>
                    <el-divider direction="vertical" />
                    <span class="text">{{ $t('Issue.' + dimension.value) }}</span>
                    <el-tag
                      v-if="dimension.value === 'fixed_version'"
                      type="info"
                      size="small"
                      class="flex-1"
                    >
                      <el-checkbox
                        :value="fixed_version_closed"
                        @change="onChangeFilter"
                      >
                        {{ $t('Issue.DisplayClosedVersion') }}
                      </el-checkbox>
                    </el-tag>
                  </span>
                  <el-button class="button-tertiary" size="small" @click="cleanFilter">
                    {{ $t('general.Clear') }}
                  </el-button>
                </div>
                <el-radio-group
                  v-model="filterValue[dimension.value]"
                  size="small" class="radio-group"
                  @change="onChangeFilter"
                >
                  <el-col class="settings">
                    <el-radio
                      v-for="option in (dimension.value === 'status')
                        ? filterClosedStatus(getOptionsData(dimension.value))
                        : getOptionsData(dimension.value)"
                      :key="`${dimension.value}_${option.id}`"
                      :label="option.id"
                      :value="option.id"
                      border
                    >
                      {{ dimension.tag ? $t(`Issue.${option.name}`) : option.name }}
                    </el-radio>
                  </el-col>
                </el-radio-group>
                <el-divider />
              </div>
            </template>
            <div class="title flex justify-between">
              <span>
                <el-divider direction="vertical" />
                <span class="text">{{ $t('Issue.DisplayClosedIssue') }}</span>
              </span>
              <el-switch
                v-model="displayClosed"
                @change="onChangeFilter"
              />
            </div>
          </el-card>
          <SaveFilterButton
            v-show="checkSaveFilterButtonDisplay()"
            ref="saveFilterButton"
            :type="type"
            :filter-value="filterValueClone"
            @update="onCustomFilterAdded"
          />
        </div>
      </el-drawer>
      <el-drawer
        :title="$t('general.Search')"
        :visible.sync="isShowFloatingSearch"
        :modal="false"
        direction="btt"
        class="drawer"
        size="auto"
        destroy-on-close
      >
        <el-input
          v-model="keyword"
          prefix-icon="el-icon-search"
          :placeholder="$t('Issue.SearchNameOrAssignee')"
          class="search"
          clearable
          @input="onChangeKeyword"
        />
      </el-drawer>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { cloneDeep } from 'lodash'
import { getLocalTime } from '@shared/utils/handleTime'
import { getHasSon, getProjectRelation } from '@/api_v2/projects'

export default {
  name: 'SearchFilter',
  components: {
    Tracker: () => import('@/components/Issue/Tracker'),
    Status: () => import('@/components/Issue/Status'),
    Priority: () => import('@/components/Issue/Priority'),
    SaveFilterButton: () => import('@/components/Issue/components/SaveFilterButton'),
    Fab: () => import('vue-fab')
  },
  props: {
    listLoading: {
      type: Boolean,
      default: false
    },
    filterOptions: {
      type: Array,
      default: () => []
    },
    selectionOptions: {
      type: Object,
      default: () => ({})
    },
    prefill: {
      type: Object,
      default: () => ({})
    },
    isDrawer: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'issue_list'
    }
  },
  data() {
    return {
      columns: [],
      filterValue: {},
      originFilterValue: {},
      keyword: null,
      searchVisible: false,
      fixed_version_closed: false,
      displayClosed: false,
      filterOptionsWithProject: [],
      projectRelationList: [],
      isShowFloatingSearch: false,
      isShowFloatingFilter: false,
      drawerKey: 0,
      timeoutId: -1,
      groupBy: {}
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'tracker', 'status', 'priority', 'selectedProject', 'device']),
    isFilterChanged() {
      return this.checkFilterValue('originFilterValue') || this.checkFilterValue('filterValue') ||
        !!this.keyword || this.checkGroupBy()
    },
    displayFilterValue() {
      const selectedLabels = this.getSelectedLabels
      const colon = selectedLabels.length > 0 ? ': ' : ''
      const factor = selectedLabels.join(', ')
      return `${this.$t('general.Filter')}${colon}${factor}`
    },
    getSelectedLabels() {
      const selectedLabels = []
      Object.keys(this.filterValue).forEach((item) => {
        if (!this.filterValue[item]) return
        const isArray = Array.isArray(this.filterValue[item]) && this.filterValue[item].length > 0
        // isArray ? selectedLabels.push(this.handleArrayLabels(item)) : selectedLabels.push(this.handleLabels(item))
        if (isArray) selectedLabels.push(this.handleArrayLabels(item))
        else if (!isArray && this.handleLabels(item)) {
          selectedLabels.push(this.handleLabels(item))
        }
      })
      return selectedLabels
    },
    handleArrayLabels() {
      return function (item) {
        let label = ''
        const value = this.getOptionsData(item).filter((search) => this.filterValue[item].includes(search.id))
        if (value) {
          const joinedString = value.map((subItem) => this.getSelectedLabel(subItem)).join('/')
          label = `#${joinedString}`
        }
        return label
      }
    },
    handleLabels() {
      return function (item) {
        let label = ''
        const value = this.getOptionsData(item)
          ? this.getOptionsData(item).find((search) => search.id === this.filterValue[item])
          : this.filterValue[item]
        if (value) label = this.getSelectedLabel(value)
        return label
      }
    },
    filterValueClone() {
      return Object.assign({}, this.filterValue, {
        fixed_version_closed: this.fixed_version_closed,
        displayClosed: this.displayClosed
      })
    },
    fabActions() {
      const actions = [
        {
          name: 'addButton',
          icon: 'add',
          color: '#409eff'
        },
        {
          name: 'searchButton',
          icon: 'search',
          color: '#e6a23c'
        },
        {
          name: 'filterButton',
          icon: 'filter_alt',
          color: '#67c23a'
        }
      ]
      return this.selectedProjectId ? actions : actions.slice(1, 3)
    },
    customStatus() {
      const status = JSON.parse(JSON.stringify(this.status))
      const overduedStatus = {
        id: 'overdued',
        name: 'Overdued',
        is_closed: false
      }
      const customStatus = [...status, overduedStatus]
      return customStatus
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    prefill(value) {
      Object.keys(value).forEach((item) => {
        this[item] = value[item]
      })
      this.$emit('filter-label', this.displayFilterValue)
    },
    fixed_version_closed() {
      this.onChangeFixedVersionStatus()
    },
    selectedProjectId: {
      async handler(val) {
        const hasSon = await this.fetchHasSon(this.selectedProjectId)
        this.filterOptionsWithProject = await this.getFilterOptions(hasSon)
        if (hasSon) {
          this.projectRelationList = await this.getProjectRelationData()
        }
      },
      immediate: true
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timeoutId)
  },
  methods: {
    getSelectedLabel(item) {
      const visibleStatus = ['closed', 'locked']
      const positiveNumberRegex = /^\+?[1-9]\d*$/
      if (positiveNumberRegex.test(item)) return this.$t('Issue.DayExpired', { days: item })
      let result = this.getTranslateHeader(item.name || getLocalTime(item, 'YYYY-MM-DD'))
      if (item.hasOwnProperty('status') && visibleStatus.includes(item.status)) {
        result += ` (${this.getTranslateHeader(item.status)})`
      }
      if (item.hasOwnProperty('login')) {
        result += ` (${item.login})`
      }
      return result
    },
    getTranslateHeader(value) {
      return this.$te('Issue.' + value) ? this.$t('Issue.' + value) : value
    },
    filterClosedStatus(statusList) {
      if (this.displayClosed) return statusList
      return statusList.filter((item) => item.is_closed === false)
    },
    getOptionsData(option_name) {
      const options = {
        ...this.selectionOptions,
        tracker: this.tracker,
        status: this.customStatus,
        priority: this.priority,
        project: this.projectRelationList
      }
      return options[option_name]
    },
    async onChangeFilter(expiredDays) {
      this.$emit('change-filter', {
        filterValue: this.filterValue,
        keyword: this.keyword,
        displayClosed: this.displayClosed,
        isReloadFilterList: this.filterValueClone.hasOwnProperty('project')
      })
      this.$emit('filter-label', this.displayFilterValue)
    },
    onChangeFixedVersionStatus() {
      this.$emit('change-fixed-version', this.fixed_version_closed)
      this.$emit('filter-label', this.displayFilterValue)
    },
    onChangeKeyword() {
      if (this.keyword !== null) {
        window.clearTimeout(this.timeoutId)
        this.timeoutId = window.setTimeout(() => this.onChangeFilter(), 500)
      } else {
        this.keyword = ''
      }
    },
    cleanFilter() {
      this.$emit('clean-filter')
      this.$set(this.$data, 'filterValue', cloneDeep(this.originFilterValue))
      this.keyword = ''
      this.displayClosed = false
      this.fixed_version_closed = false
      this.onChangeFilter()
      this.onChangeFixedVersionStatus()
    },
    checkFilterValue(key) {
      const comparedKey = this.getComparedKey(key)
      for (const item of Object.keys(this[key])) {
        const checkFilterValue = this[key]
        if (!checkFilterValue || !checkFilterValue[item]) return
        if (checkFilterValue[item] === '' || checkFilterValue[item].length === 0) delete checkFilterValue[item]
        if (this[comparedKey][item] !== checkFilterValue[item]) return true
      }
    },
    checkGroupBy() {
      if (!this.groupBy.dimension) return false
      return !(this.groupBy.dimension === 'status' && this.groupBy.value.length === 0)
    },
    getComparedKey(key) {
      return key === 'filterValue' ? 'originFilterValue' : 'filterValue'
    },
    onCustomFilterAdded() {
      this.$emit('add-custom-filter')
    },
    resetSaveFilterButtons() {
      this.$refs.saveFilterButton.reset()
    },
    checkSaveFilterButtonDisplay() {
      const whiteList = ['IssueList', 'IssueBoards']
      return whiteList.includes(this.$route.name)
    },
    async fetchHasSon(pId) {
      const hasSon = await getHasSon(pId)
      return hasSon.has_child
    },
    async getFilterOptions(hasSon) {
      this.filterOptionsWithProject = hasSon ? [{
        id: 9,
        value: 'project',
        placeholder: 'Project'
      }].concat(this.filterOptions) : this.filterOptions
      return this.filterOptionsWithProject
    },
    async getProjectRelationData() {
      const { id, display } = this.selectedProject
      const projectRelation = (await getProjectRelation(id)).data
      const projectRelationList = [{ id, name: display }]
      if (projectRelation && projectRelation[0].child) projectRelationList.push(...projectRelation[0].child)
      return projectRelationList
    },
    handleFloatingSearchButton() {
      this.isShowFloatingSearch = true
    },
    async handleFloatingFilterButton() {
      this.isShowFloatingFilter = true
    },
    isHiddenFormItem(condition) {
      const isRequireProjectId = condition.value === 'fixed_version' && !this.selectedProjectId
      const isHideAssignedToSelect = condition.value === 'assigned_to'
      return isRequireProjectId || isHideAssignedToSelect
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
@import 'src/styles/theme/mixin.scss';

::v-deep .fab-main {
  padding: 22px !important;
}
::v-deep .fab-wrapper {
  bottom: 2.5vh !important;
}

.drawer {
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }
  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    padding: 10px;
  }
  ::v-deep .el-drawer__body::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }
  ::v-deep .el-drawer__body {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .container {
    padding: 14px;
    max-width: 768px;
    ::v-deep .el-divider {
      background-color: #EBEEF5;
    }
    ::v-deep .el-card__body, .el-main {
      padding: 10px;
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
    .radio-group {
      display: grid;
      .settings::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera*/
      }
      .settings {
        max-width: 768px;
        margin: 0 auto;
        display: grid;
        gap: 6px;
        overflow-x: auto;
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none; /* Firefox */
        ::v-deep .el-radio.is-bordered {
          margin-left: 0;
          margin-right: 0;
          // width: 140px;
        }
        ::v-deep .el-radio__label {
          padding-left: 2px;
        }
      }
    }
    .save {
      margin-top: 12px;
    }
  }
  .search {
    margin: 20px;
    width: -webkit-fill-available;
  }
}

@include mobile {
  .settings { grid-template-columns: repeat(2, 1fr); }
}
@include tablet-1 {
  .settings { grid-template-columns: repeat(3, 1fr); }
}
@include tablet-2 {
  .settings { grid-template-columns: repeat(4, 1fr); }
}
@include tablet-3 {
  .settings { grid-template-columns: repeat(5, 1fr); }
}
</style>
