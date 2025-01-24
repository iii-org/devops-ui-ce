<template>
  <div>
    <el-table
      ref="theTable"
      v-loading="listLoading"
      :data="pagedData"
      :element-loading-text="$t('Loading')"
      fit
      highlight-current-row
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
    </el-table>
    <Pagination
      :layout="'total, prev, pager, next'"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :page-sizes="[listQuery.limit]"
      :total="filteredData.length"
      @pagination="handlePagination"
    />
  </div>
</template>

<script>
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'

export default {
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      paged: false,
      multipleSelection: []
    }
  },
  computed: {
    selectedIndexes() {
      const indexes = []
      for (const i in this.multipleSelection) {
        const arr = this.multipleSelection[i]
        for (const idx of arr) {
          indexes.push(i * this.listQuery.limit + idx)
        }
      }
      return indexes
    },
    noRowSelected() {
      return this.selectedIndexes.length === 0
    }
  },
  watch: {
    pagedData() {
      this.listQuery.total = Math.floor(
        this.filteredData.length / this.listQuery.limit
      )
      if (this.multipleSelection.length !== this.listQuery.total + 1) {
        this.multipleSelection = []
        for (let i = 0; i < this.listQuery.total + 1; i++) {
          this.$set(this.multipleSelection, i, [])
        }
      }
    }
  },
  methods: {
    handleSelectionChange(val) {
      const indexes = []
      for (const row of val) {
        const index = this.pagedData.indexOf(row)
        indexes.push(index)
      }
      if (!this.paged) {
        this.$set(this.multipleSelection, this.listQuery.page - 1, indexes)
      }
    },
    async handlePagination(listQuery) {
      this.paged = true
      await this.onPagination(listQuery)
      this.reselect()
    },
    reselect() {
      this.multipleSelection[this.listQuery.page - 1].forEach((index) => {
        this.$refs.theTable.toggleRowSelection(this.pagedData[index])
      })
      this.paged = false
    }
  }
}
</script>
