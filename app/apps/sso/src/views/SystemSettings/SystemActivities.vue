<template>
  <div class="app-container">
    <div class="clearfix">
      <el-input
        v-model="keyword"
        prefix-icon="el-icon-search"
        :placeholder="$t('Activities.SearchPlaceholder')"
        style="float: right"
        :style="{ width: isMobile ? '-webkit-fill-available' : '250px' }"
        :size="isMobile ? 'small' : 'medium'"
      />
    </div>
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
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getAllActivities } from '@/api/activities'
import { BasicData, Pagination } from '@/mixins'
import { ElTableResponsive } from '@shared/components'

const params = () => ({
  limit: 10,
  offset: 0
})

export default {
  name: 'SystemActivities',
  components: { ElTableResponsive },
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
          prop: 'operator_name',
          minWidth: 100
        },
        {
          label: this.$t('Activities.ActionType'),
          prop: 'action_type',
          minWidth: 150
        },
        {
          label: this.$t('Activities.ActionParts'),
          prop: 'action_parts',
          minWidth: 250
        },
        {
          label: this.$t('Activities.ActAt'),
          prop: 'act_at',
          minWidth: 150,
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
      const res = await getAllActivities(this.params)
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
    async onPagination (listQuery) {
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
