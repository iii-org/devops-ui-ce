<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <el-input
          v-model="keyword"
          :placeholder="$t('Activities.SearchPlaceholder')"
          :size="isMobile ? 'small' : 'medium'"
          :style="{ width: isMobile ? 'auto' : '250px' }"
          prefix-icon="el-icon-search"
        />
      </ProjectListSelector>
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
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectActivities } from '@/api_v3/system'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'

const params = () => ({
  limit: 10,
  page: 1
})

export default {
  name: 'ProjectActivities',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination],
  data() {
    return {
      params: params(),
      dialogVisible: false,
      activitiesList: [],
      keyword: ''
    }
  },
  computed: {
    ...mapGetters(['device']),
    pagedData() {
      return this.activitiesList
    },
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
          label: this.$t('Activities.User'),
          prop: 'user_name'
        },
        {
          label: this.$t('Activities.ActionType'),
          prop: 'action_type'
        },
        {
          label: this.$t('Activities.ActionParts'),
          prop: 'message',
          minWidth: 200
        },
        {
          label: this.$t('Activities.ActAt'),
          prop: 'created_at',
          type: 'time'
        }
      ]
    }
  },
  watch: {
    keyword: {
      handler(val) {
        this.onSearch(val)
      }
    }
  },
  methods: {
    async fetchData() {
      const res = await getProjectActivities(
        this.selectedProjectId,
        this.params
      )
      this.setListData(res)
    },
    setListData(res) {
      this.activitiesList = res.data.items
      this.listQuery = res.data.pagination
    },
    /**
     * @param keyword
     * search keys are 'operator_name', 'action_type', 'action_parts'
     */
    async onSearch(keyword) {
      this.params.search = keyword
      if (keyword === '') delete this.params.search
      await this.loadData()
      this.initParams()
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      this.params.page = page
      this.params.limit = limit
      if (this.keyword !== '') this.params.search = this.keyword
      await this.loadData()
      this.initParams()
    },
    initParams() {
      this.params = params()
    }
  }
}
</script>
