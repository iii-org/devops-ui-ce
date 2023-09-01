<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <ScanLogButton slot="button" />
        <el-input
          v-model="keyword"
          :placeholder="$t('Git.searchBranchOrCommitId')"
          :style="{ width: isMobile ? 'auto' : '250px' }"
          :size="isMobile ? 'small' : 'medium'"
          prefix-icon="el-icon-search"
        />
      </ProjectListSelector>
      <el-divider />
      <ElTableResponsive
        v-loading="listLoading"
        :element-loading-text="$t('Loading')"
        :data="pagedData"
        :columns="tableColumns"
        :cell-style="{ 'text-align': 'center' }"
        :header-cell-style="{ 'text-align': 'center' }"
        fit
      >
        <template v-slot:commit_id="{ row }">
          <el-link
            class="linkTextColor"
            target="_blank"
            style="font-size: 16px"
            :href="row.commit_url"
          >
            <svg-icon
              class="mr-1"
              icon-class="ion-git-commit-outline"
            />{{ row.commit_id }}
          </el-link>
        </template>
        <template v-slot:fullLog="{ row }">
          <el-tooltip
            :id="`btn-postman-${getRowIndex(row)}`"
            placement="bottom"
            :content="$t('general.Report')"
          >
            <em
              class="ri-file-list-2-line active operate-button"
              @click="handleClick('PostmanTestCase', row.id)"
            />
          </el-tooltip>
        </template>
      </ElTableResponsive>
      <Pagination
        :total="filteredData.length"
        :page="listQuery.page"
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
import { getPostmanResult } from '@/api_v2/postman'
import { BasicData, SearchBar, Pagination } from '@/mixins'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'
import ScanLogButton from './ScanLogButton'

export default {
  name: 'Postman',
  components: {
    ProjectListSelector,
    ScanLogButton,
    ElTableResponsive
  },
  mixins: [BasicData, SearchBar, Pagination],
  data() {
    return {
      storageName: 'postman',
      storageType: ['SearchBar'],
      dialogVisible: false,
      searchKeys: ['branch', 'commit_id']
    }
  },
  computed: {
    ...mapGetters(['userRole', 'device']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('Postman.Id'),
          prop: 'id',
          width: 100
        },
        {
          label: this.$t('Postman.Branch'),
          prop: 'branch',
          minWidth: 120
        },
        {
          label: this.$t('Git.Commit'),
          prop: 'commit_id',
          width: 140,
          slot: 'commit_id'
        },
        {
          label: this.$t('Postman.TestPass'),
          prop: 'success',
          minWidth: 100
        },
        {
          label: this.$t('Postman.TestFail'),
          prop: 'failure',
          minWidth: 100
        },
        {
          label: this.$t('Postman.StartTime'),
          prop: 'run_at',
          type: 'time'
        },
        {
          label: this.$t('Log.fullLog'),
          slot: 'fullLog'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      return (await getPostmanResult(this.selectedProjectId)).data
    },
    handleClick(target, id) {
      this.$router.push({ name: target, params: { id, projectName: this.selectedProject.name }})
    },
    getRowIndex(row) {
      return this.pagedData.indexOf(row)
    }
  }
}
</script>
