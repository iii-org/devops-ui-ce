<template>
  <div class="app-container">
    <div class="text-right">
      <el-popover
        v-if="userRole === 'sysadmin'"
        placement="bottom"
        trigger="click"
      >
        <el-form>
          <el-form-item :label="$t('Activities.SystemOnly')">
            <el-checkbox v-model="filterValue.system" @change="changeFilter" />
          </el-form-item>
          <el-form-item :label="$t('Organization.Organization')">
            <el-select
              v-model="filterValue.organization_id"
              :disabled="filterValue.system"
              class="w-full"
              clearable
              filterable
              @change="changeFilter"
            >
              <el-option
                v-for="item in filterOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <el-button
          slot="reference"
          class="header-text-color"
          icon="el-icon-s-operation"
          type="text"
        >
          {{ isMobile ? '' : displayFilterValue }}
          <em class="el-icon-arrow-down el-icon--right"></em>
        </el-button>
      </el-popover>
      <el-input
        v-model="filterValue.keyword"
        :placeholder="$t('Activities.SearchPlaceholder')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? '-webkit-fill-available' : '250px' }"
        class="ml-2"
        prefix-icon="el-icon-search"
        @change="changeFilter"
      />
      <el-button
        v-if="!isFilterEmpty && userRole === 'sysadmin'"
        class="ml-2"
        plain
        size="small"
        type="warning"
        @click="clearFilter"
      >
        {{ $t('general.Clear') }}
      </el-button>
    </div>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :cell-style="{ 'text-align': 'center' }"
      :columns="tableColumns"
      :data="pagedData"
      :element-loading-text="$t('Loading')"
      :header-cell-style="{ 'text-align': 'center' }"
      fit
    />
    <Pagination
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page.sync="listQuery.current"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="listQuery.total"
      @pagination="onPagination"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getSystemActivities } from '@/api_v3/system'
import { getOrganizationList } from '@/api_v3/organizations'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'

const params = () => ({
  limit: 10,
  page: 1
})

const defaultFilterValue = () => ({
  organization_id: '',
  system: false,
  keyword: ''
})

export default {
  name: 'SystemActivities',
  components: {
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      params: params(),
      dialogVisible: false,
      activitiesList: [],
      filterOptions: [],
      filterValue: defaultFilterValue(),
      isFilterEmpty: true
    }
  },
  computed: {
    ...mapGetters(['device', 'userOrgId', 'userRole']),
    pagedData() {
      return this.activitiesList
    },
    isMobile() {
      return this.device === 'mobile'
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
        if (item === 'system' && this.filterValue.system) {
          selectedLabels.push(this.$t('Activities.SystemOnly'))
        }
        if (item === 'organization_id' && this.filterValue.organization_id) {
          const selectedOrg = this.filterOptions.find(
            (org) => org.id === this.filterValue.organization_id
          )
          selectedLabels.push(selectedOrg.name)
        }
      })
      return selectedLabels
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      const column = [
        {
          label: this.$t('Activities.User'),
          prop: 'user_name',
          minWidth: 100
        },
        {
          label: this.$t('Activities.ActionType'),
          prop: 'action_type',
          minWidth: 150
        },
        {
          label: this.$t('Activities.ActionParts'),
          prop: 'message',
          minWidth: 250
        },
        {
          label: 'IP',
          prop: 'ip',
          minWidth: 150
        },
        {
          label: this.$t('Project.Project'),
          prop: 'project.display_name',
          minWidth: 150
        },
        {
          label: this.$t('Activities.ActAt'),
          prop: 'created_at',
          minWidth: 140,
          type: 'time'
        }
      ]
      if (this.userRole === 'sysadmin') {
        column.splice(4, 0, {
          label: this.$t('Organization.Organization'),
          prop: 'organization.name',
          minWidth: 150
        })
      }
      return column
    }
  },
  mounted() {
    if (this.userRole === 'sysadmin') {
      this.fetchOrganizationList({ all: true })
    }
  },
  methods: {
    async fetchData() {
      this.getParams()
      await getSystemActivities(this.params).then((res) => {
        this.activitiesList = res.data.items
        this.listQuery = res.data.pagination
      })
    },
    fetchOrganizationList() {
      getOrganizationList().then((res) => {
        this.filterOptions = res.data
      })
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      this.params.page = page
      this.params.limit = limit
      await this.loadData()
    },
    getParams() {
      const { keyword, system, organization_id } = this.filterValue

      if (keyword) {
        this.params.search = keyword
      } else {
        delete this.params.search
      }

      if (this.userRole !== 'sysadmin') {
        this.params.organization_id = this.userOrgId
      } else {
        this.params.system = system
        if (organization_id) {
          if (system) {
            this.filterValue.organization_id = ''
            delete this.params.organization_id
          } else {
            this.params.organization_id = organization_id
          }
        }
      }
    },
    async clearFilter() {
      this.params = params()
      this.filterValue = defaultFilterValue()
      await this.loadData().then(() => {
        this.isFilterEmpty = Object.values(this.filterValue).every(
          (item) => !item || item === ''
        )
      })
    },
    async changeFilter() {
      this.params = params()
      await this.loadData().then(() => {
        this.isFilterEmpty = Object.values(this.filterValue).every(
          (item) => !item || item === ''
        )
      })
    }
  }
}
</script>
