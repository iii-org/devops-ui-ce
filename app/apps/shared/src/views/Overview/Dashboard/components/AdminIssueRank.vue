<template>
  <el-col v-loading="listLoading">
    <ElTableResponsive
      :data="listData"
      :columns="tableColumns"
      cell-class-name="items-center"
      row-class-name="cursor-pointer"
      header-cell-class-name="items-center"
      stripe
      @row-click="showUnclosedIssuesDetail"
    >
      <template v-slot:user_name="{row}">
        {{ `${row.user_name} (${row.user_login})` }}
      </template>
    </ElTableResponsive>
    <el-dialog
      :visible.sync="unclosedIssuesDialog"
      :title="$t('Dashboard.ADMIN.IssueRank.DETAIL', [issueRankDetail['user_name']])"
      top="3vh"
      width="90vw"
      @close="closeHandler"
    >
      <admin-issue-rank-unclosed-issues
        :detail="issueRankDetail"
        :user="listData"
        @update-detail="updateUnclosedIssuesDetail"
      />
    </el-dialog>
  </el-col>
</template>

<script>
import { mapGetters } from 'vuex'
import { ElTableResponsive } from '@shared/components'
import { getUnclosedIssues } from '@/api/dashboard'
import { BasicData } from '@/mixins'
import AdminIssueRankUnclosedIssues from './widget/AdminIssueRankUnclosedIssues'

export default {
  name: 'AdminIssueRank',
  components: {
    AdminIssueRankUnclosedIssues,
    ElTableResponsive
  },
  mixins: [BasicData],
  props: {
    data: {
      type: Function,
      default: () => []
    }
  },
  data() {
    return {
      issueRankDetail: {},
      involvedProjectsDialog: false,
      unclosedIssuesDialog: false,
      searchKeys: ['user_name']
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
          label: this.$t('Dashboard.ADMIN.IssueRank.user_name'),
          prop: 'user_name',
          showOverflowTooltip: true,
          slot: 'user_name'
        },
        {
          label: this.$t('Dashboard.ADMIN.IssueRank.unclosed_count'),
          prop: 'unclosed_count'
        },
        {
          label: this.$t('Dashboard.ADMIN.IssueRank.project_count'),
          prop: 'project_count'
        }
      ]
    }
  },
  watch: {
    data() {
      this.loadData()
    }
  },
  methods: {
    async loadData() {
      this.listLoading = true
      this.listData = await this.data()
      this.listLoading = false
    },
    async showUnclosedIssuesDetail(row) {
      this.unclosedIssuesDialog = true
      this.issueRankDetail = row
      this.$set(this.issueRankDetail, 'unclosedIssues', this.getUnclosedIssuesData)
    },
    updateUnclosedIssuesDetail(id) {
      this.issueRankDetail = this.listData.find(item => item.user_id === id)
      this.$set(this.issueRankDetail, 'unclosedIssues', this.getUnclosedIssuesData)
    },
    closeHandler() {
      this.keyword = ''
    },
    async getUnclosedIssuesData(id) {
      const res = await getUnclosedIssues(id)
      return Promise.resolve(res.data)
    }

    // onClickChart(row) {
    //   this.detailDialog = true
    //   this.keyword = row.name
    // },
    // getInvolvedProjectsData(id) {
    //   return getInvolvedProjects(id).then(res => {
    //     return Promise.resolve(res.data)
    //   })
    // },
  }
}
</script>
