/**
 * ! Before using this module, you need to know:
 * 1. The main feature of searchBar mixins is offer filterValue.
 * 2. Define function for saving filter information in sessionStorage.
 *    ! Have to define storageName if you want to save filter info.
 */

import {
  getProjectUserList,
  getProjectVersion,
  getTagList
} from '@/api_v3/projects'
import { mapActions, mapGetters } from 'vuex'

/**
 * * How to use SearchFilter component
 * ! for required
 * ? for optional
 *
 * ! @listLoading {Boolean}
 * ! @filterOptions {Array}
 * ! @selectionOptions {Object}
 * ! @prefill {Object}
 * ! @changeFilter {Function}
 * ! @changeFixedVersion {Function}
 * ! @addCustomFilter {Function}
 * ! @cleanFilter {Function}
 *
 * * Component example
 *  <SearchFilter
 *    :filter-options="filterOptions"
 *    :list-loading="listLoading"
 *    :selection-options="contextOptions"
 *    :prefill="{
 *      filterValue: filterValue,
 *      keyword: keyword,
 *      displayClosed: displayClosed,
 *      version_closed: version_closed
 *    }"
 *    @change-filter="onChangeFilterForm"
 *    @change-fixed-version="onChangeFixedVersionStatus"
 *    @add-custom-filter="updateCustomFilter"
 *    @clean-filter="cleanFilter"
 *  >
 * ?  <slot />
 * ?  <slot name="download" />
 *  </SearchFilter>
 */

/**
 * * How to use CustomFilter component
 * ! for required
 * ? for optional
 *
 * ! @selectionOptions {Object}
 * ! @type {String}
 * ? @projectId {Number, String}
 * ? @activeTab {String}
 * ? @groupBy {Object}
 * ! @applyFilter {Function}
 *
 * * Component example
 *  <CustomFilter
 *    type="my_work"
 *    :selection-options="contextOptions"
 *    :project-id="projectId"
 *    :active-tab="activeTab"
 *    :group-by="groupBy"
 *    @apply-filter="applyCustomFilter"
 *  />
 */

export default {
  components: {
    SearchFilter: () => import('@/components/Issue/SearchFilter'),
    CustomFilter: () => import('@/components/Issue/CustomFilter')
  },
  data() {
    return {
      filterOptions: Object.freeze([
        {
          id: 1,
          label: this.$t('Issue.FilterDimensions.tracker'),
          value: 'tracker',
          placeholder: 'Type',
          tag: true
        },
        {
          id: 2,
          label: this.$t('Issue.FilterDimensions.status'),
          value: 'status',
          placeholder: 'Status',
          tag: true
        },
        {
          id: 3,
          label: this.$t('Issue.FilterDimensions.tags'),
          value: 'tags',
          placeholder: 'Tag'
        },
        {
          id: 4,
          label: this.$t('Issue.FilterDimensions.assigned'),
          value: 'assigned',
          placeholder: 'Member'
        },
        {
          id: 5,
          label: this.$t('Issue.FilterDimensions.version'),
          value: 'version',
          placeholder: 'Version'
        },
        {
          id: 6,
          label: this.$t('Issue.FilterDimensions.priority'),
          value: 'priority',
          placeholder: 'Priority',
          tag: true
        },
        {
          id: 7,
          label: this.$t('Issue.FilterDimensions.due_date_start'),
          value: 'due_date_start',
          placeholder: 'Date',
          component: 'el-date-picker',
          componentOptions: { type: 'date' },
          tag: true
        },
        {
          id: 8,
          label: this.$t('Issue.FilterDimensions.due_date_end'),
          value: 'due_date_end',
          placeholder: 'Date',
          component: 'el-date-picker',
          componentOptions: { type: 'date' },
          tag: true
        }
      ]),
      storageName: '',
      sort: '',
      filterValue: {},
      originFilterValue: {},
      keyword: null,
      tracker_id: null,
      assigned: [],
      version: [],
      expiredDays: 0,
      tags: [],
      version_closed: false,
      displayClosed: false
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'userRole', 'userId']),
    mainSelectedProjectId() {
      return this.filterValue.project || this.selectedProjectId
    },
    isDisabled() {
      return this.mainSelectedProjectId === -1
    },
    getFilteredVersion() {
      return this.version.filter((item) => {
        const validDate =
          new Date(`${item.effective_date}T23:59:59`) >= new Date()
        const closedStatus = item.status !== 'closed'
        return validDate && closedStatus
      })
    }
  },
  watch: {
    selectedProjectId: {
      async handler() {
        await this.getInitStoredData()
        await this.loadSelectionList()
      }
    },
    version_closed(value) {
      this.setFixedVersionShowClosed({ [this.storageName]: value })
      this.loadVersionList(value)
    },
    version(value) {
      if (this.storageName === 'issue_board' || this.storageName === 'board') {
        if (value.length > 0) {
          if (!this.filterValue.hasOwnProperty('version')) {
            const version = this.getFilteredVersion
            if (version.length > 0) {
              this.setFilterValue(version)
            }
          }
        }
      }
    }
  },
  async mounted() {
    await this.getInitStoredData()
    await this.loadSelectionList()
    await this.loadData()
    if (this.storageType.includes('Pagination')) await this.getStoredListQuery()
  },
  methods: {
    ...mapActions('projects', [
      'getIssueFilter',
      'setIssueFilter',
      'getKeyword',
      'setKeyword',
      'getDisplayClosed',
      'setDisplayClosed',
      'getFixedVersionShowClosed',
      'setFixedVersionShowClosed',
      'getGroupBy',
      'setGroupBy'
    ]),
    getParams(limit) {
      const result = {
        page: this.listQuery ? this.listQuery.page : this.listBoardQuery.page,
        limit:
          limit || this.listQuery
            ? this.listQuery.limit
            : this.listBoardQuery.limit,
        root_only: !!this.mainSelectedProjectId
      }
      if (this.sort) result['sort'] = this.sort
      if (this.keyword) result['search'] = this.keyword
      if (this.tracker_id) result['tracker_id'] = this.tracker_id
      if (!this.displayClosed) result['exclude_closed'] = true
      Object.keys(this.filterValue).forEach((item) => {
        if (this.filterValue[item]) {
          if (this.filterValue[item] === 'overdue') {
            result['is_expired'] = true
            result['expired_days'] = Number(this.filterValue.expiredDays) || ~~1
          } else if (item === 'tags' && this.filterValue[item].length > 0) {
            result[item] = this.filterValue[item].join()
          } else if (item !== 'expiredDays') {
            result[item + '_id'] = this.filterValue[item]
          }
        }
      })
      return result
    },
    async getInitStoredData() {
      if (!this.storageName) return
      const key = this.storageName
      const storedData = await this.fetchStoredData()
      const {
        storedFilterValue,
        storedKeyword,
        storedDisplayClosed,
        storedVersionClosed,
        storedGroupBy
      } = storedData
      this.filterValue = storedFilterValue[key] ? storedFilterValue[key] : {}
      if (this.$route.name === 'Milestone' && this.filterValue.tracker) {
        this.filterValue.tracker = 1
      }
      const findChangeIndex = this.assigned.findIndex(
        (issue) => parseInt(this.filterValue.assigned) === parseInt(issue.id)
      )
      if (findChangeIndex < 0) this.$delete(this.filterValue, 'assigned')
      this.$delete(this.filterValue, 'tags')
      this.keyword = storedKeyword[key] ? storedKeyword[key] : null
      this.displayClosed = storedDisplayClosed[key]
        ? storedDisplayClosed[key]
        : false
      this.version_closed = storedVersionClosed[key]
        ? storedVersionClosed[key]
        : false
      if (storedGroupBy) this.groupBy = storedGroupBy
    },
    setFilterValue(version) {
      this.$set(this.filterValue, 'version', version[0].id)
      this.$set(this.originFilterValue, 'version', version[0].id)
    },
    async fetchStoredData() {
      const filter = {}
      await Promise.allSettled([
        this.getIssueFilter(),
        this.getKeyword(),
        this.getDisplayClosed(),
        this.getFixedVersionShowClosed(),
        this.getGroupBy()
      ]).then((res) => {
        const [
          filterValue,
          keyword,
          displayClosed,
          fixedVersionClosed,
          groupBy
        ] = res.map((item) => item.value)
        filter.storedFilterValue = filterValue
        filter.storedKeyword = keyword
        filter.storedDisplayClosed = displayClosed
        filter.storedVersionClosed = fixedVersionClosed
        filter.storedGroupBy = groupBy
      })
      return filter
    },
    async loadSelectionList() {
      if (this.selectedProjectId === -1) return
      await Promise.allSettled([
        getProjectUserList(this.mainSelectedProjectId),
        getTagList(this.mainSelectedProjectId)
      ]).then((res) => {
        const [assigneeList, tagsList] = res.map((item) => item.value.data)
        this.tags = tagsList
        this.assigned = [
          { name: this.$t('Issue.Unassigned'), id: 'null' },
          {
            name: this.$t('Issue.me'),
            username: '-Me-',
            id: this.userId,
            class: 'bg-yellow-100'
          },
          ...assigneeList.map((item) => ({
            name: item.full_name,
            username: item.username,
            id: item.id
          }))
        ]
        // if (this.userRole === 'Engineer') {
        //   this.$set(this.filterValue, 'assigned', this.userId)
        //   this.$set(this.originFilterValue, 'assigned', this.userId)
        // }
      })
      await this.loadVersionList(this.version_closed)
    },
    async loadVersionList(status) {
      let params = { all: true, status: 'open,locked' }
      if (status) {
        params = { all: true, status: 'open,locked,closed' }
      }
      const versionList = await getProjectVersion(
        this.mainSelectedProjectId,
        params
      )
      this.version = [
        { name: this.$t('Issue.VersionUndecided'), id: 'null' },
        ...versionList.data
      ]
      // this.onChangeFilter()
    },
    async onChangeFilterForm(value, isCustomFilter) {
      if (!isCustomFilter) {
        this.$refs.customFilter?.resetApplyFilter()
      }
      Object.keys(value).forEach((item) => {
        this[item] = value[item]
      })
      if (this.filterValue.status !== 'overdue') {
        this.$delete(this.filterValue, 'expiredDays')
      }
      if (this.filterValue['tags'] && this.filterValue['tags'].length <= 0) {
        this.$delete(this.filterValue, 'tags')
      }
      if (value.isReloadFilterList) {
        await this.loadSelectionList()
      }
      if (this.listQuery) {
        this.listQuery.page = 1
        // this.listQuery.offset = 0
      }
      await this.onChangeFilter()
    },
    async onChangeFilter() {
      if (this.storageName) {
        const key = this.storageName
        const storedData = await this.fetchStoredData()
        const {
          storedFilterValue,
          storedKeyword,
          storedDisplayClosed,
          storedGroupBy
        } = storedData
        storedFilterValue[key] = this.filterValue
        storedKeyword[key] = this.keyword
        storedDisplayClosed[key] = this.displayClosed
        if (storedGroupBy) {
          this.$set(storedGroupBy, 'dimension', this.groupBy.dimension)
          this.$set(storedGroupBy, 'value', this.groupBy.value)
        }
        await this.setIssueFilter(storedFilterValue)
        await this.setKeyword(storedKeyword)
        await this.setDisplayClosed(storedDisplayClosed)
      }
      if (this.filterValue['tags'] && this.filterValue['tags'].length <= 0) {
        this.$delete(this.filterValue, 'tags')
      }
      if (
        this.storageName === 'issue_board' &&
        Object.prototype.hasOwnProperty.call(
          this.filterValue,
          this.groupBy.dimension
        )
      ) {
        this.$delete(this.filterValue, this.groupBy.dimension)
      }
      if (this.listQuery) {
        this.listQuery.page = 1
        // this.listQuery.offset = 0
      }
      await this.loadData()
    },
    onChangeFixedVersionStatus(value) {
      this.version_closed = value
    },
    updateCustomFilter() {
      this.$refs.customFilter.fetchCustomFilter()
    },
    cleanFilter() {
      if (this.$refs.customFilter) {
        this.$refs.customFilter.resetApplyFilter()
      } else {
        this.filterValue = Object.assign({}, this.originFilterValue)
        this.keyword = ''
        this.displayClosed = false
        this.version_closed = false
      }
      if (this.storageName === 'issue_board' && this.storageName === 'board') {
        this.onChangeGroupByDimension('status')
      }
      // this.onChangeFilter()
    },
    applyCustomFilter(filters) {
      const { result, displayClosed, version_closed, groupBy } = filters
      this.onChangeFilterForm({ filterValue: result }, true)
      this.displayClosed = displayClosed
      this.version_closed = version_closed
      if (groupBy) {
        this.$set(this.groupBy, 'dimension', groupBy.dimension)
        this.$set(this.groupBy, 'value', groupBy.value)
        this.setGroupBy(groupBy)
      }
    },
    onChangeGroupByDimension(value) {
      this.groupBy = { dimension: value, value: [] }
      this.$refs['groupByValue'].selected = []
      this.updatedByGroupBy()
      this.onChangeFilter()
    },
    onChangeGroupByValue(value, loadData) {
      this.$set(this.groupBy, 'value', value)
      this.updatedByGroupBy(loadData)
    },
    updatedByGroupBy(loadData) {
      this.setGroupBy(this.groupBy)
      if (loadData) this.loadData()
    }
  }
}
