/**
 * ! Before using this module, you need to know:
 * 1. The main feature of pagination mixins is offer pagedData.
 * 2. Define function for saving page information in sessionStorage.
 *    ! Have to define storageName if you want to save page info.
 */

import { mapActions } from 'vuex'
import { Pagination } from '@/components'

/**
 * * How to use Pagination component
 * ! for required
 * ? for optional
 *
 * ! @total {Number}
 * ! @page {Number}
 * ! @limit {Number}
 * ! @pageSizes {Array}
 * ! @layout {String}
 * ? @background {Boolean}
 * ? @autoScroll {Boolean}
 * ? @hidden {Boolean}
 * ! @pagination {Function}
 *
 * * Component example
 *  <Pagination
 *    :total="listQuery.total"
 *    :page.sync="listQuery.current"
 *    :limit="listQuery.limit"
 *    :page-sizes="[10, 25, 50, 100]"
 *    :layout="'total, sizes, prev, pager, next'"
 *    :background="true"
 *    :auto-scroll="true"
 *    :hidden="true"
 *    @pagination="onPagination or handleCurrentChange"
 *  />
 */

export default {
  components: { Pagination },
  data() {
    return {
      storageName: '',
      listQuery: {
        offset: 0,
        limit: 10,
        total: 0,
        page: 1
      },
      timeout: 0
    }
  },
  computed: {
    pagedData() {
      if (this.remote) { return [] }
      const start = (this.listQuery.page - 1) * this.listQuery.limit
      const end = start + this.listQuery.limit
      if (!this.filteredData && !this.listData) return
      return this.filteredData?.slice(start, end) || this.listData?.slice(start, end)
    }
  },
  watch: {
    selectedProject() {
      this.listQuery.page = 1
    },
    filterValue: {
      handler() {
        if (this.timeout > 3) {
          this.listQuery.page = 1
          this.listQuery.offset = 0
        }
      },
      deep: true
    },
    timeout(val) {
      if (val >= 3) {
        window.clearInterval(this.interTimeout)
      }
    }
  },
  async mounted() {
    this.interTimeout = window.setInterval(() => {
      this.timeout++
    }, 1000)
  },
  methods: {
    ...mapActions('projects', ['getListQuery', 'setListQuery']),
    async getStoredListQuery() {
      if (!this.storageName) return
      const key = this.storageName
      const storeListQuery = await this.getListQuery()
      const storedTabQuery = storeListQuery[key]
      if (storedTabQuery !== undefined) {
        this.listQuery = storedTabQuery
      }
      return Promise.resolve()
    },
    async onPagination(pageInfo) {
      const { limit, page } = pageInfo
      this.listQuery.offset = limit * page - limit
      this.listQuery.limit = limit
      this.listQuery.page = page
      await this.storeListQuery()
    },
    async handleCurrentChange(pageInfo) {
      const { limit, page } = pageInfo
      this.listQuery.offset = limit * page - limit
      this.listQuery.limit = limit
      this.listQuery.page = page
      await this.loadData()
      await this.storeListQuery()
    },
    setNewListQuery(pageInfo) {
      const {
        // offset,
        // limit,
        // current,
        // pages,
        total
      } = pageInfo
      // if (pages !== 0 && current > pages) {
      //   this.resetListQuery()
      // } else {
      //   this.listQuery = { offset, limit, total, page: current }
      // }
      this.listQuery.total = total
    },
    // async resetListQuery() {
    //   this.listQuery.offset = 0
    //   this.listQuery.page = 1
    //   await this.storeListQuery()
    //   await this.loadData()
    // },
    async storeListQuery() {
      const key = this.storageName
      if (!key) return
      const storeListQuery = await this.getListQuery()
      storeListQuery[key] = this.listQuery
      await this.setListQuery(storeListQuery)
    }
  }
}
