<template>
  <el-row v-loading="listLoading">
    <el-row v-if="inDialog" type="flex" align="middle">
      <el-col :span="12">
        <el-select
          v-model="searchStatus"
          value-key="user_id"
          :style="{ width: 'auto' }"
          :size="isMobile ? 'small' : 'medium'"
        >
          <el-option :label="$t('Dashboard.ADMIN.ProjectList.all')" value="" />
          <el-option :label="$t('Dashboard.ADMIN.ProjectList.overdue')" value="overdue" />
          <el-option :label="$t('Dashboard.ADMIN.ProjectList.in_progress')" value="in_progress" />
          <el-option :label="$t('Dashboard.ADMIN.ProjectList.not_started')" value="not_started" />
        </el-select>
        <el-input
          v-model="keyword"
          :placeholder="$t('Project.SearchProjectName')"
          :style="{ width: 'auto' }"
          :size="isMobile ? 'small' : 'medium'"
          clearable
        />
      </el-col>
      <el-col v-if="listData.length > 0" :span="12" class="text-right">
        {{ $t('Dashboard.ADMIN.sync_date', [listData[0].sync_date]) }}
      </el-col>
    </el-row>
    <component :is="showShadow">
      <ElTableResponsive
        v-loading="listLoading"
        :data="tableData"
        :columns="tableColumns"
        :row-class-name="tableRowClassName"
        cell-class-name="items-center"
        header-cell-class-name="items-center"
        :height="tableHeightDialog"
        @sort-change="onSortChange"
      >
        <template v-slot:owner_name="{row}">
          {{ `${row.owner_name} (${row.owner_login})` }}
        </template>
        <template v-slot:project_status="{row}">
          <project-status :name="row.project_status" :size="isMobile ? 'small' : 'medium'" />
        </template>
      </ElTableResponsive>
      <Pagination
        v-if="inDialog"
        :total="filteredData.length"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :page-sizes="[listQuery.limit]"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
    </component>
    <el-dialog
      v-if="!inDialog"
      :visible.sync="dialogVisible.projectList"
      :title="$t('Dashboard.ADMIN.ProjectList.NAME')"
      top="3vh"
      width="90vw"
    >
      <AdminProjectList :data="getProjectListDetailData" :in-dialog="true" />
    </el-dialog>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { BasicData, Pagination, SearchBar, Table } from '@/mixins'
import { getProjectListDetail } from '@/api/dashboard'
import ProjectStatus from './widget/ProjectStatus'
import { ElTableResponsive } from '@shared/components'

export default {
  name: 'AdminProjectList',
  components: { ProjectStatus, ElTableResponsive },
  mixins: [BasicData, Pagination, SearchBar, Table],
  props: {
    data: {
      type: Function,
      default: () => []
    },
    dialogVisible: {
      type: Object,
      default: () => {}
    },
    inDialog: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      listQuery: {
        page: 1,
        limit: 10
      },
      detailData: [],
      searchKeys: ['project_name', 'owner_name'],
      searchStatus: ''
    }
  },
  computed: {
    ...mapGetters(['device']),
    showShadow() {
      return this.inDialog ? 'el-card' : 'div'
    },
    tableData() {
      return this.inDialog ? this.pagedData : this.listData
    },
    tableHeightDialog() {
      return this.inDialog ? 'calc(100vh - 370px)' : null
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          prop: 'project_name',
          label: this.$t('Dashboard.ADMIN.ProjectList.project_name'),
          sortable: true,
          showOverflowTooltip: true
        },
        {
          prop: 'owner_name',
          label: this.$t('Dashboard.ADMIN.ProjectList.owner_name'),
          sortable: true,
          showOverflowTooltip: true,
          slot: 'owner_name'
        },
        {
          prop: 'project_status',
          label: this.$t('Dashboard.ADMIN.ProjectList.project_status'),
          sortable: true,
          showOverflowTooltip: true,
          slot: 'project_status'
        },
        {
          prop: 'complete_percent',
          label: this.$t('Dashboard.ADMIN.ProjectList.complete_percent'),
          sortable: true,
          showOverflowTooltip: true
        },
        {
          prop: 'unclosed_issue_count',
          label: this.$t('Dashboard.ADMIN.ProjectList.unclosed_issue_count'),
          sortable: true,
          showOverflowTooltip: true
        },
        {
          prop: 'closed_issue_count',
          label: this.$t('Dashboard.ADMIN.ProjectList.closed_issue_count'),
          sortable: true,
          showOverflowTooltip: true
        },
        {
          prop: 'member_count',
          label: this.$t('Dashboard.ADMIN.ProjectList.member_count'),
          sortable: true,
          showOverflowTooltip: true
        },
        {
          prop: 'expired_day',
          label: this.$t('Dashboard.ADMIN.ProjectList.expired_day'),
          sortable: true,
          showOverflowTooltip: true
        },
        {
          prop: 'end_date',
          label: this.$t('general.DueDate'),
          sortable: true,
          showOverflowTooltip: true
        }
      ]
    }
  },
  watch: {
    searchStatus(value) {
      this.filterData(value)
    },
    dialogVisible: {
      handler(value) {
        if (value.projectList) {
          this.loadData()
        }
      },
      deep: true
    }
  },
  methods: {
    async loadData() {
      this.listLoading = true
      const data = await this.data()
      this.listData = data
      // this.$emit('update', this.listData[0].sync_date)
      this.$emit('update', '')
      this.detailData = data
      this.listLoading = false
    },
    filterData(value) {
      if (value) {
        this.listData = this.detailData.filter(item => item.project_status === value)
      } else {
        this.listData = this.detailData
      }
    },
    onSortChange(sort) {
      const { prop, order } = sort
      let orderSign = 1
      if (order === 'descending') orderSign = -1
      else orderSign = 1
      this.listData = this.listData.sort((a, b) => {
        if (a[prop] > b[prop]) return orderSign
        else if (b[prop] > a[prop]) return -1 * orderSign
        else return 0
      })
    },
    tableRowClassName({ row }) {
      if (row.project_status === 'overdue') {
        return 'danger-row'
      }
      return ''
    },
    async getProjectListDetailData() {
      return getProjectListDetail().then(res => Promise.resolve(res.data))
    }
  }
}
</script>
