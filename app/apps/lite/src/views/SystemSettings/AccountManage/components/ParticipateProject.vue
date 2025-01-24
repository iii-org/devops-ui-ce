<template>
  <div class="app-container">
    <div class="flex justify-between">
      <div>
        <el-button
          class="previous"
          icon="el-icon-arrow-left"
          size="medium"
          type="text"
          @click="handleBackPage"
        >
          {{ $t('general.Back') }}
        </el-button>
        <el-tag :class="!isMobile ? 'text-lg' : ''">
          {{ $t('Issue.FilterDimensions.assigned') }}: {{ projectMember }}
        </el-tag>
      </div>
      <el-input
        v-model="keyword"
        :placeholder="$t('Project.SearchProjectName')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? '130px' : '250px' }"
        prefix-icon="el-icon-search"
      />
    </div>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :cell-style="{ 'text-align': 'center' }"
      :columns="tableColumns"
      :data="pagedData"
      :element-loading-text="$t('Loading')"
      :header-cell-style="{ 'text-align': 'center' }"
      fit
      highlight-current-row
    >
      <template #display_name="{ row }">
        <el-link
          :class="row.disabled || row.is_lock ? '' : 'link-text-color'"
          :disabled="row.disabled || row.is_lock"
          :underline="false"
          @click="handleDisplayClick(row)"
        >
          {{ row.display_name }}
        </el-link>
        <div class="text-info text-sm">#{{ row.identifier }}</div>
      </template>
      <template #actions="{ row }">
        <el-tooltip
          :content="$t('Dashboard.ADMIN.ProjectList.NAME')"
          placement="bottom"
        >
          <em
            v-if="$route.params.user_id !== row.owner_id"
            class="ri-survey-line warning table-button"
            @click="handleParticipateDialog(row.owner_id)"
          ></em>
        </el-tooltip>
        <el-tooltip :content="$t('Issue.Issue')" placement="bottom">
          <em
            class="ri-file-copy-2-line success table-button"
            @click="handleIssueClick(row)"
          ></em>
        </el-tooltip>
        <el-tooltip
          :content="$t('general.Remove')"
          :disabled="isDisabled"
          placement="bottom"
        >
          <el-popconfirm
            :cancel-button-text="$t('general.Cancel')"
            :confirm-button-text="$t('general.Remove')"
            :disabled="isDisabled"
            :title="$t('Member.confirmRemove')"
            icon="el-icon-info"
            popper-class="danger"
            @confirm="handleDelete(row.id)"
          >
            <span slot="reference">
              <em
                :class="isDisabled ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
              ></em>
            </span>
          </el-popconfirm>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      v-if="listData && listData.length > 0"
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.page"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="filteredData.length"
      @pagination="onPagination"
    />
  </div>
</template>

<script>
import { getMyProjects, removeProjectMember } from '@/api_v3/projects'
import { getUserDetails } from '@/api_v3/user'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { mapGetters } from 'vuex'

export default {
  name: 'ParticipateProject',
  components: {
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      projectMember: '',
      searchKeys: ['display_name', 'owner_name']
    }
  },
  computed: {
    ...mapGetters(['userId', 'device']),
    isDisabled() {
      return this.$route.params.userId === this.userId
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
          label: this.$t('Project.Name'),
          prop: 'display_name',
          slot: 'display_name',
          minWidth: '250'
        },
        {
          label: this.$t('Project.Owner'),
          prop: 'owner_name',
          minWidth: '120'
        },
        {
          label: this.$t('Project.StartDate'),
          prop: 'start_date',
          minWidth: '120'
        },
        {
          label: this.$t('general.DueDate'),
          prop: 'due_date',
          minWidth: '120'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          slot: 'actions',
          minWidth: '100'
        }
      ]
    }
  },
  mounted() {
    this.getUserInfo(this.$route.params.userId)
  },
  methods: {
    async fetchData() {
      const res = await getMyProjects({
        user_id: this.$route.params.userId,
        all: true
      })
      return res.data
    },
    async getUserInfo(user_id) {
      const userInfo = await getUserDetails(user_id)
      this.projectMember = userInfo.full_name
    },
    async handleDelete(project_id) {
      this.listLoading = true
      try {
        await removeProjectMember(project_id, this.$route.params.userId)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        await this.fetchData(this.$route.params.userId)
      } catch (error) {
        console.error(error)
        this.listLoading = false
      }
    },
    handleBackPage() {
      this.$router.go(-1)
    },
    handleParticipateDialog(owner_id) {
      this.$router.push({
        name: 'ParticipateProject',
        params: { userId: owner_id }
      })
    },
    handleIssueClick(row) {
      const { owner_id, owner_name } = row
      this.$router.push({
        name: 'IssueTransfer',
        params: { userId: owner_id, userName: owner_name }
      })
    },
    handleDisplayClick(row) {
      const { name } = row
      this.$router.push({ name: 'Overview', params: { projectName: name }})
    }
  }
}
</script>
