<template>
  <el-row v-loading="listLoading">
    <el-row type="flex" align="middle">
      <el-col :span="12">
        <el-select
          v-model="searchUser"
          value-key="user_id"
          :style="{ width: 'auto' }"
          :size="isMobile ? 'small' : 'medium'"
        >
          <el-option v-for="item in user" :key="item.user_id" :label="item.user_name" :value="item.user_id" />
        </el-select>
        <el-input
          v-model="keyword"
          :style="{ width: 'auto' }"
          :size="isMobile ? 'small' : 'medium'"
          :placeholder="$t('Project.SearchProjectName')"
          clearable
        />
      </el-col>
      <el-col v-if="listData.length > 0" :span="12" class="text-right">
        {{ $t('Dashboard.ADMIN.sync_date', [listData[0].sync_date]) }}
      </el-col>
    </el-row>
    <el-card>
      <el-table-responsive
        v-if="listData.length > 0"
        :data="pagedData"
        :columns="tableColumns"
      >
        <template v-slot:issue_type="{row}">
          <Tracker
            :name="$t(`Issue.${row.issue_type}`)"
            :type="row.issue_type"
          />
        </template>
        <template v-slot:status="{row}">
          <Status
            :name="$t(`Issue.${row.status}`)"
            :type="row.status"
            :size="isMobile ? 'small' : 'medium'"
          />
        </template>
      </el-table-responsive>
      <Pagination
        :total="filteredData.length"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :page-sizes="[listQuery.limit]"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
    </el-card>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { BasicData, Pagination, SearchBar, Table } from '@/mixins'
import { Tracker, Status } from '@/components/Issue'
import { ElTableResponsive } from '@/components'

export default {
  name: 'AdminIssueRankDetail',
  components: { Status, Tracker, ElTableResponsive },
  mixins: [BasicData, Pagination, SearchBar, Table],
  props: {
    detail: {
      type: Object,
      default: () => ({})
    },
    user: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      listQuery: {
        page: 1,
        limit: 5
      },
      searchKeys: ['project_name', 'issue_name'],
      searchUser: ''
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('Dashboard.ADMIN.IssueRank.project_name'),
          prop: 'project_name',
          sortable: true,
          showOverflowTooltip: true
        },
        {
          label: this.$t('Dashboard.ADMIN.IssueRank.issue_name'),
          prop: 'issue_name',
          sortable: true,
          showOverflowTooltip: true
        },
        {
          label: this.$t('Dashboard.ADMIN.IssueRank.issue_type'),
          prop: 'issue_type',
          sortable: true,
          showOverflowTooltip: true,
          slot: 'issue_type'
        },
        {
          label: this.$t('Dashboard.ADMIN.IssueRank.status_id'),
          prop: 'status',
          sortable: true,
          showOverflowTooltip: true,
          slot: 'status'
        },
        {
          label: this.$t('Dashboard.ADMIN.IssueRank.start_date'),
          prop: 'start_date',
          sortable: true,
          showOverflowTooltip: true
        }
      ]
    }
  },
  watch: {
    detail: {
      deep: true,
      handler() {
        this.searchUser = this.detail.user_id
        this.loadData(this.searchUser)
      }
    },
    searchUser(val) {
      this.$emit('update-detail', val)
    }
  },
  mounted() {
    this.searchUser = this.detail.user_id
    this.loadData(this.searchUser)
  },
  methods: {
    async loadData(value) {
      if (value && this.detail.hasOwnProperty('unclosedIssues')) {
        this.listLoading = true
        this.listData = await this.detail['unclosedIssues'](value)
        this.listLoading = false
      }
    }
  }
}
</script>
