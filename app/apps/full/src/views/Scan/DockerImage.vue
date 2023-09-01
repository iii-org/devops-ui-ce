<template>
  <el-row class="app-container">
    <ProjectListSelector>
      <el-input
        v-model="keyword"
        :placeholder="$t('Git.searchBranchOrCommitId')"
        :style="{ width: isMobile ? 'auto' : '200px' }"
        :size="isMobile ? 'small' : 'medium'"
        prefix-icon="el-icon-search"
      />
    </ProjectListSelector>
    <el-divider />
    <el-table-responsive
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      fit
      :data="testList"
      :columns="tableColumns"
    >
      <template v-slot:commit="{ row }">
        <el-link
          class="linkTextColor"
          target="_blank"
          style="font-size: 16px"
          :href="row.commit_url"
        >
          <svg-icon
            class="mr-1"
            icon-class="ion-git-commit-outline"
          />{{ row.commit }}
        </el-link>
      </template>
      <template v-slot:duration="{ row }">
        {{ durationText(row.duration) }}
      </template>
      <template v-slot:fullLog="{ row }">
        <el-tooltip
          v-if="row.scan_status === 'Success'"
          placement="bottom"
          :content="$t('Dashboard.Report')"
        >
          <em
            class="ri-file-list-2-line active operate-button"
            @click="handleToTestReport(row)"
          />
        </el-tooltip>
      </template>
    </el-table-responsive>
    <Pagination
      :total="listQuery.total"
      :page.sync="listQuery.current"
      :limit="listQuery.per_page"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { getHarborScan } from '@/api_v2/harbor'
import { BasicData, SearchBar, Pagination } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@/components'
import { getDurationTime } from '@/utils/handleTime'

export default {
  name: 'DockerImage',
  components: {
    ProjectListSelector,
    ElTableResponsive
  },
  mixins: [BasicData, SearchBar, Pagination],
  data() {
    return {
      storageName: 'clair',
      storageType: ['SearchBar'],
      params: {
        page: 1,
        per_page: 10,
        search: this.keyword
      },
      testList: []
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
          label: this.$t('Git.Branch'),
          prop: 'branch',
          align: 'center'
        },
        {
          label: this.$t('Git.Commit'),
          prop: 'commit',
          align: 'center',
          width: '140',
          slot: 'commit'
        },
        {
          label: this.$t('general.Status'),
          prop: 'scan_status',
          align: 'center',
          size: this.isMobile ? 'small' : 'medium',
          location: 'docker',
          minWidth: '130',
          i18nKey: 'Docker',
          type: 'tag'
        },
        {
          label: this.$t('Docker.Size'),
          prop: 'size',
          align: 'center'
        },
        {
          label: this.$t('Zap.critical'),
          prop: 'Critical',
          align: 'center'
        },
        {
          label: this.$t('Zap.high'),
          prop: 'High',
          align: 'center'
        },
        {
          label: this.$t('Zap.medium'),
          prop: 'Medium',
          align: 'center'
        },
        {
          label: this.$t('Zap.low'),
          prop: 'Low',
          align: 'center'
        },
        {
          label: this.$t('Docker.Fixable'),
          prop: 'fixable',
          align: 'center'
        },
        {
          label: this.$t('general.RunAt'),
          prop: 'start_time',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('Log.duration'),
          prop: 'duration',
          align: 'center',
          component: 'ElTableColumnTime',
          slot: 'duration'
        },
        {
          label: this.$t('Log.fullLog'),
          prop: 'fullLog',
          align: 'center',
          slot: 'fullLog'
        }
      ]
    }
  },
  watch: {
    async keyword(value) {
      this.params.search = value
      this.params.page = 1
      this.storeKeyword()
      await this.loadData()
    }
  },
  methods: {
    async fetchData() {
      const res = await getHarborScan(this.selectedProjectId, this.params)
      this.setListData(res)
    },
    setListData(res) {
      this.testList = res.data.scan_list
      this.listQuery = res.data.page
    },
    durationText(duration) {
      return getDurationTime(0, duration)
    },
    async onPagination(query) {
      const { page, limit } = query
      this.params.page = page
      this.params.per_page = limit
      await this.loadData()
    },
    async handleToTestReport(row) {
      this.$router.push({
        name: 'DockerReport',
        params: {
          projectId: this.selectedProjectId,
          commitId: row.commit,
          commitBranch: row.branch,
          size: row.size ? row.size : '-'
        }
      })
    }
  }
}
</script>
