<template>
  <el-dialog :visible.sync="visible" :width="isMobile ? '95vw' : '70vw'">
    <p>
      <el-button :disabled="noRowSelected" type="success" @click="copy">
        {{ $t('Release.copyIssues') }}
      </el-button>
    </p>
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
      <el-table-column
        :label="$t('Issue.id')"
        align="center"
        prop="id"
        width="75"
      />
      <el-table-column
        :label="$t('Issue.name')"
        align="center"
        prop="subject"
      />
      <el-table-column
        :label="$t('Project.Version')"
        align="center"
        prop="version.name"
      />
      <el-table-column
        :label="$t('general.Type')"
        align="center"
        prop="tracker.name"
      />
    </el-table>
    <Pagination
      :layout="'total, prev, pager, next'"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :page-sizes="[listQuery.limit]"
      :total="filteredData.length"
      @pagination="handlePagination"
    />
  </el-dialog>
</template>

<script>
import Checkbox from '@/mixins/Checkbox'
import { mapGetters } from 'vuex'

export default {
  name: 'IssueListDialog',
  mixins: [Checkbox],
  data() {
    return {
      searchKeys: ['subject'],
      visible: false,
      listQuery: {
        limit: 5,
        total: 0,
        page: 1
      }
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    setData(listData, category) {
      if (category) {
        listData = listData.filter((item) => {
          return item.tracker.name === category
        })
      }
      this.listData = listData
    },
    copy() {
      const vm = this
      let text = ''
      this.multipleSelection.forEach((val, i) => {
        for (const pos of val) {
          const index = parseInt(i) * this.listQuery.limit + parseInt(pos)
          text += this.listData[index].subject + '\n'
        }
      })
      this.$copyText(text).then(function () {
        vm.$message({
          message: vm.$t('general.copied'),
          type: 'info'
        })
      })
    }
  }
}
</script>
