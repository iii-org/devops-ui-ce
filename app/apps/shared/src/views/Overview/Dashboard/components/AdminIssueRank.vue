<template>
  <el-col v-loading="listLoading">
    <ElTableResponsive
      :data="listData"
      :columns="tableColumns"
      row-class-name="cursor-pointer"
      stripe
      @row-click="showUnclosedIssuesDetail"
    >
      <template #user_name="{ row }">
        {{ row.user_name }} <span class="badge">{{ row.user_login }}</span>
      </template>
    </ElTableResponsive>
    <el-dialog
      :visible.sync="unclosedIssuesDialog"
      :title="
        $t('Dashboard.ADMIN.IssueRank.DETAIL', [issueRankDetail['user_name']])
      "
      destroy-on-close
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
import { getUnclosedIssues } from '@/api/dashboard'
import BasicData from '@/mixins/BasicData'
import AdminIssueRankUnclosedIssues from './widget/AdminIssueRankUnclosedIssues'

export default {
  name: 'AdminIssueRank',
  components: {
    AdminIssueRankUnclosedIssues,
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
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
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
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
          prop: 'unclosed_count',
          width: 100,
          align: 'center'
        },
        {
          label: this.$t('Dashboard.ADMIN.IssueRank.project_count'),
          prop: 'project_count',
          width: 100,
          align: 'center'
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
      this.$set(
        this.issueRankDetail,
        'unclosedIssues',
        this.getUnclosedIssuesData
      )
    },
    updateUnclosedIssuesDetail(id) {
      this.issueRankDetail = this.listData.find((item) => item.user_id === id)
      this.$set(
        this.issueRankDetail,
        'unclosedIssues',
        this.getUnclosedIssuesData
      )
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

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.badge {
  font-size: 0.8rem;
  margin-left: 0.2rem;
  display: inline-flex;
  align-items: center;
  color: $primary;
  background-color: #f4f4f4;
  padding: 0 0.4rem;
  line-height: 20px;
  border-radius: 3px;
  font-weight: bold;
}
</style>
