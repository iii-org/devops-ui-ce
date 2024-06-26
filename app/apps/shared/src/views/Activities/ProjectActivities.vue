<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <el-input
          v-model="keyword"
          :placeholder="$t('Activities.SearchPlaceholder')"
          :style="{ width: isMobile ? 'auto' : '250px' }"
          :size="isMobile ? 'small' : 'medium'"
          prefix-icon="el-icon-search"
        />
      </ProjectListSelector>
      <el-divider />
      <ElTableResponsive
        v-loading="listLoading"
        :data="pagedData"
        :columns="tableColumns"
        :element-loading-text="$t('Loading')"
        :cell-style="{ 'text-align': 'center' }"
        :header-cell-style="{ 'text-align': 'center' }"
        fit
      />
      <Pagination
        :total="listQuery.total"
        :page.sync="listQuery.current"
        :limit="listQuery.limit"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectActivities } from '@/api/activities'
import { BasicData, Pagination } from '@/mixins'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'

const params = () => ({
  limit: 10,
  offset: 0
})

export default {
  name: 'ProjectActivities',
  components: { ProjectListSelector, ElTableResponsive },
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
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('Activities.User'),
          prop: 'operator_name'
        },
        {
          label: this.$t('Activities.ActionType'),
          prop: 'action_type'
        },
        {
          label: this.$t('Activities.ActionParts'),
          prop: 'action_parts',
          minWidth: 200
        },
        {
          label: this.$t('Activities.ActAt'),
          prop: 'act_at',
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
      const res = await getProjectActivities(this.selectedProjectId, this.params)
      this.setListData(res)
    },
    setListData(res) {
      this.activitiesList = res.data.activities_list
      this.listQuery = Object.assign({}, res.data.page)
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
      const offset = limit * (page - 1)
      this.params.offset = offset
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
