<template>
  <div>
    <ProjectListSelector
      :project-id.sync="focusedProjectId"
      :keep-selection="false"
      :clearable="true"
      :show-button="device === 'mobile' ? false : true"
    >
      <template slot="button">
        <template v-if="!focusedProjectId">
          <el-button
            v-permission="['Administrator','Project Manager']"
            class="buttonPrimary"
            icon="el-icon-plus"
            @click="$emit('create-project')"
          >
            {{ $t('Project.AddProject') }}
          </el-button>
        </template>
        <el-button
          v-if="focusedProjectId"
          v-permission="['Administrator','Project Manager', 'Engineer']"
          class="buttonSecondary"
          icon="el-icon-plus"
          size="medium"
          @click="$emit('add-issue')"
        >
          {{ $t('Issue.AddIssue') }}
        </el-button>
      </template>

      <CustomFilter
        :ref="`customFilter_${activeTab}`"
        type="my_work"
        :project-id="projectId"
        :active-tab="activeTab"
        :selection-options="contextOptions"
        :selected-id="selectedCustomId"
        @apply-filter="applyCustomFilter"
        @clear="clearFilter"
        @on-filter-click="onFilterClick"
      />

      <el-popover
        placement="bottom"
        trigger="click"
        @hide="resetSaveFilterButtons"
      >
        <el-form>
          <template v-for="condition in filterConditionGroup">
            <el-form-item
              v-if="!isHiddenFormItem(condition)"
              :key="condition.id"
            >
              <div slot="label">
                {{ $t('Issue.' + condition.value) }}
                <el-tag
                  v-if="condition.value === 'fixed_version'"
                  type="info"
                  class="flex-1"
                >
                  <el-checkbox
                    :value="displayClosedVersion"
                    @change="$emit('update:displayClosedVersion', $event)"
                  >{{ $t('Issue.DisplayClosedVersion') }} </el-checkbox>
                </el-tag>
              </div>

              <el-select
                v-model="filterConditions[condition.value]"
                :placeholder="$t('Issue.Select' + condition.placeholder)"
                filterable
                clearable
                @clear="clearCondition(condition.value)"
              >
                <el-option
                  v-for="option in filterOption(condition)"
                  :key="option.id"
                  :label="formatOptionName(condition.value, option.name)"
                  :value="option.id"
                >
                  <component
                    :is="condition.value"
                    v-if="condition.tag"
                    :name="$t(`Issue.${option.name}`)"
                    :type="option.name"
                  />
                </el-option>
              </el-select>
            </el-form-item>
          </template>

          <el-form-item :label="$t('Issue.DisplayClosedIssue')">
            <el-checkbox
              :value="displayClosedIssue"
              @change="$emit('update:displayClosedIssue', $event)"
            />
          </el-form-item>
        </el-form>

        <SaveFilterButton
          ref="saveFilterButton"
          type="my_work"
          :project-id="projectId"
          :filter-value="filterValueClone"
          :active-tab="activeTab"
          @update="onCustomFilterAdded"
        />

        <el-button
          slot="reference"
          icon="el-icon-s-operation"
          type="text"
          class="headerTextColor"
        >
          {{ selectedConditions }}
          <em class="el-icon-arrow-down" />
        </el-button>
      </el-popover>

      <el-divider direction="vertical" />

      <el-button
        v-if="!searchVisible"
        type="text"
        class="headerTextColor"
        icon="el-icon-search"
        @click="showKeywordInput"
      >
        {{ $t('general.Search') + (keyword ? `: ${keyword}` : '') }}
      </el-button>
      <el-input
        v-else-if="searchVisible"
        ref="keywordInput"
        :value="keyword"
        prefix-icon="el-icon-search"
        :placeholder="$t('Issue.SearchNameOrAssignee')"
        style="width: 250px"
        clearable
        @blur="searchVisible = !searchVisible"
        @input="$emit('update:keyword', $event)"
      />

      <template v-if="showClearFilterButton()">
        <el-divider direction="vertical" />
        <el-button
          size="small"
          class="buttonSecondaryReverse"
          icon="el-icon-close"
          @click="clearFilter"
        >
          {{ $t('Issue.CleanFilter') }}
        </el-button>
      </template>
    </ProjectListSelector>
    <div v-if="device === 'mobile'" style="margin: 10px 5px 0 5px">
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
        :title="$t('general.Filter')"
        :visible.sync="isShowFloatingFilter"
        direction="btt"
        class="drawer"
        size="90%"
        destroy-on-close
      >
        <div class="container">
          <el-card shadow="never">
            <CustomFilter
              :ref="`customFilter_${activeTab}`"
              type="my_work"
              :project-id="projectId"
              :active-tab="activeTab"
              :selection-options="contextOptions"
              :from-drawer="true"
              :selected-id="selectedCustomId"
              @apply-filter="applyCustomFilter"
              @clear="clearFilter"
              @on-filter-click="onFilterClick"
            />
            <template v-for="condition in filterConditionGroup">
              <div v-if="!isHiddenFormItem(condition)" :key="condition.id">
                <div class="title flex justify-between">
                  <span>
                    <el-divider direction="vertical" />
                    <span class="text">{{ $t('Issue.' + condition.value) }}</span>
                    <el-tag
                      v-if="condition.value === 'fixed_version'"
                      type="info"
                      size="small"
                      class="flex-1"
                    >
                      <el-checkbox
                        :value="displayClosedVersion"
                        @change="$emit('update:displayClosedVersion', $event)"
                      >{{ $t('Issue.DisplayClosedVersion') }} </el-checkbox>
                    </el-tag>
                  </span>
                  <el-button class="buttonTertiary" size="small" @click="filterConditions[condition.value] = ''">
                    {{ $t('general.Clear') }}
                  </el-button>
                </div>
                <el-radio-group v-model="filterConditions[condition.value]" size="small" class="radio-group">
                  <el-col class="settings">
                    <el-radio
                      v-for="option in filterOption(condition)"
                      :key="option.id"
                      :label="option.id"
                      :value="option.id"
                      border
                    >
                      {{ condition.tag ? $t(`Issue.${option.name}`) : option.name }}
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
              <el-switch v-model="displayClosedIssue" @change="$emit('update:displayClosedIssue', $event)" />
            </div>
          </el-card>
          <SaveFilterButton
            ref="saveFilterButton"
            type="my_work"
            class="save"
            :project-id="projectId"
            :filter-value="filterValueClone"
            :active-tab="activeTab"
            @update="onCustomFilterAdded"
          />
        </div>
      </el-drawer>
      <el-drawer
        :title="$t('general.Search')"
        :visible.sync="isShowFloatingSearch"
        direction="btt"
        class="drawer"
        size="auto"
        destroy-on-close
      >
        <el-input
          :value="keyword"
          prefix-icon="el-icon-search"
          :placeholder="$t('Issue.SearchNameOrAssignee')"
          class="search"
          clearable
          @input="$emit('update:keyword', $event)"
        />
      </el-drawer>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectUserList, getProjectVersion } from '@/api/projects'
import { CustomFilter, Tracker, Priority, Status } from '@/components/Issue'
import { ProjectListSelector } from '@/components'
import SaveFilterButton from '@/components/Issue/components/SaveFilterButton'
import Fab from 'vue-fab' // https://github.com/PygmySlowLoris/vue-fab

export default {
  name: 'MyWorkPageHeader',
  components: {
    ProjectListSelector,
    CustomFilter,
    SaveFilterButton,
    Tracker,
    Priority,
    Status,
    Fab
  },
  props: {
    projectId: {
      type: [Number, String],
      default: null
    },
    displayClosedIssue: {
      type: Boolean,
      default: false
    },
    displayClosedVersion: {
      type: Boolean,
      default: false
    },
    filterConditions: {
      type: Object,
      default: () => ({})
    },
    keyword: {
      type: String,
      default: ''
    },
    activeTab: {
      type: String,
      default: 'assigned_to_id'
    }
  },
  data() {
    return {
      filterConditionGroup: [
        {
          id: 1,
          label: this.$t('Issue.FilterDimensions.status'),
          value: 'status',
          placeholder: 'Status',
          tag: true,
          options: []
        },
        {
          id: 2,
          label: this.$t('Issue.FilterDimensions.tracker'),
          value: 'tracker',
          placeholder: 'Type',
          tag: true,
          options: []
        },
        {
          id: 3,
          label: this.$t('Issue.FilterDimensions.assigned_to'),
          value: 'assigned_to',
          placeholder: 'Member',
          options: []
        },
        {
          id: 4,
          label: this.$t('Issue.FilterDimensions.fixed_version'),
          value: 'fixed_version',
          placeholder: 'Version',
          options: []
        },
        {
          id: 5,
          label: this.$t('Issue.FilterDimensions.priority'),
          value: 'priority',
          placeholder: 'Priority',
          tag: true,
          options: []
        }
      ],
      searchVisible: false,
      isShowFloatingFilter: false,
      isShowFloatingSearch: false,
      drawerKey: 0,
      selectedCustomId: null
    }
  },
  computed: {
    ...mapGetters(['status', 'tracker', 'priority', 'device']),
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
      return this.focusedProjectId ? actions : actions.slice(1, 3)
    },
    selectedConditions() {
      return this.handleFilterSelected()
    },
    focusedProjectId: {
      get() {
        return this.projectId
      },
      set(id) {
        this.$emit('update:projectId', id)
      }
    },
    filterValueClone() {
      return Object.assign({}, this.filterConditions, {
        fixed_version_closed: this.displayClosedVersion,
        displayClosed: this.displayClosedIssue
      })
    },
    contextOptions() {
      return {
        assigned_to: this.filterConditionGroup[2].options,
        fixed_version: this.filterConditionGroup[3].options
      }
    }
  },
  watch: {
    projectId(newId, oldId) {
      if (oldId !== null) this.clearFilter()

      if (newId) this.fetchData()
    },
    displayClosedVersion() {
      if (this.projectId) this.fetchVersionList()
    },
    device() {
      this.isShowFloatingFilter = false
      this.isShowFloatingSearch = false
    },
    filterConditions: {
      handler() {
        this.handleFilterSelected()
      },
      deep: true
    }
  },
  mounted() {
    this.setFilterOptions()
  },
  methods: {
    fetchData() {
      this.fetchUserList()
      this.fetchVersionList()
      this.drawerKey++
    },
    setFilterOptions() {
      const { status, tracker, priority } = this
      this.filterConditionGroup[0].options = status
      this.filterConditionGroup[1].options = tracker
      this.filterConditionGroup[4].options = priority
    },
    fetchUserList() {
      getProjectUserList(this.projectId).then((res) => {
        const userList = res.data.user_list.map((user) => ({
          id: user.id,
          name: user.name
        }))
        this.filterConditionGroup[2].options = [{ id: 'null', name: this.$t('Issue.Unassigned') }, ...userList]
      })
    },
    fetchVersionList() {
      const params = this.displayClosedVersion ? { status: 'open,locked,closed' } : { status: 'open,locked' }
      getProjectVersion(this.projectId, params).then((res) => {
        const versionList = res.data.versions.map((version) => {
          return {
            id: version.id,
            name: this.formatVersionName(version.status, version.name)
          }
        })
        this.$set(this.filterConditionGroup[3], 'options', [{ id: 'null', name: this.$t('Issue.VersionUndecided') }, ...versionList])
        // this.filterConditionGroup[3].options = [{ id: 'null', name: this.$t('Issue.VersionUndecided') }, ...versionList]
      })
    },
    formatVersionName(versionStatus, versionName) {
      return versionStatus === 'open' ? versionName : versionName + ` (${this.$t('Version.' + versionStatus)})`
    },
    clearFilter() {
      this.$emit('update:keyword', '')
      this.$emit('update:filterConditions', {})
      this.$emit('update:displayClosedIssue', false)
      this.$emit('update:displayClosedVersion', false)
      if (this.$refs[`customFilter_${this.activeTab}`]) {
        this.$refs[`customFilter_${this.activeTab}`].resetApplyFilter()
      }
    },
    isHiddenFormItem(condition) {
      const isRequireProjectId = condition.value === 'fixed_version' && !this.focusedProjectId
      const isHideAssignedToSelect = condition.value === 'assigned_to' && this.activeTab === 'assigned_to_id'
      return isRequireProjectId || isHideAssignedToSelect
    },
    clearCondition(condition) {
      delete this.filterConditions[condition]
    },
    showClearFilterButton() {
      const hasSelectedConditions = Object.keys(this.filterConditions).length > 0
      const hasKeyword = this.keyword !== ''
      return hasSelectedConditions || hasKeyword
    },
    showKeywordInput() {
      this.searchVisible = !this.searchVisible
      this.$nextTick(() => this.$refs.keywordInput.focus())
    },
    formatOptionName(condition, optionName) {
      return ['fixed_version', 'assigned_to'].includes(condition) ? optionName : this.$t('Issue.' + optionName)
    },
    filterOption(condition) {
      const { value, options } = condition
      const showAllOptions = value !== 'status' || this.displayClosedIssue
      return showAllOptions ? options : options.filter((option) => option.id !== 6)
    },
    onCustomFilterAdded() {
      this.$refs[`customFilter_${this.activeTab}`].fetchCustomFilter()
    },
    applyCustomFilter(filters) {
      const { result, displayClosed, fixed_version_closed, activeTab } = filters
      this.$emit('update:filterConditions', this.formatFilterResult(result))
      this.$emit('update:displayClosedIssue', displayClosed)
      this.$emit('update:displayClosedVersion', fixed_version_closed)
      this.$emit('update:activeTab', activeTab)
    },
    formatFilterResult(result) {
      Object.keys(result).forEach((key) => {
        if (result[key] === null) delete result[key]
      })
      return result
    },
    resetSaveFilterButtons() {
      this.$refs.saveFilterButton.reset()
    },
    handleFloatingSearchButton() {
      this.isShowFloatingSearch = true
    },
    async handleFloatingFilterButton() {
      this.isShowFloatingFilter = true
    },
    handleFilterSelected() {
      const conditions = Object.keys(this.filterConditions).map((filterCondition) => {
        const groupIdx = this.filterConditionGroup.findIndex((condition) => condition.value === filterCondition)
        const filterOptionId = this.filterConditions[filterCondition]
        const optionNameIdx = this.filterConditionGroup[groupIdx].options.findIndex(
          (option) => option.id === filterOptionId
        )
        if (optionNameIdx === -1) return
        const optionName = this.filterConditionGroup[groupIdx].options[optionNameIdx].name
        return this.formatOptionName(filterCondition, optionName)
      })
      this.$emit('filter-name', conditions.length > 0 ? this.$t('general.Filter') + ': ' + conditions.filter(function(el) { return el }).join(', ') : '')
      return this.$t('general.Filter') + (conditions.length ? ': ' : '') +
        conditions.filter(function(el) { return el }).join(', ')
    },
    onFilterClick(value) {
      this.selectedCustomId = value
    }
  }
}
</script>

<style lang="scss" scoped>
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
        background-color: #e6a23c;
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

@media (min-width: 350px) {
  .settings { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 500px) {
  .settings { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 650px) {
  .settings { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 750px) {
  .settings { grid-template-columns: repeat(5, 1fr); }
}
</style>
