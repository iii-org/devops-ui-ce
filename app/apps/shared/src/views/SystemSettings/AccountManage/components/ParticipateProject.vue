<template>
  <div class="app-container">
    <div class="flex justify-between">
      <div>
        <el-button
          type="text"
          size="medium"
          icon="el-icon-arrow-left"
          class="previous"
          @click="handleBackPage"
        >
          {{ $t('general.Back') }}
        </el-button>
        <el-tag :class="!isMobile ? 'text-lg' : ''">
          {{ $t('Issue.FilterDimensions.assigned_to') }}: {{ projectMember }}
        </el-tag>
      </div>
      <el-input
        v-model="keyword"
        :placeholder="$t('Project.SearchProjectName')"
        :style="{ width: isMobile ? '130px' : '250px' }"
        :size="isMobile ? 'small' : 'medium'"
        prefix-icon="el-icon-search"
      />
    </div>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :data="pagedData || []"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
      fit
      highlight-current-row
    >
      <template v-slot:actions="{ row }">
        <el-tooltip
          :content="$t('general.Participate')"
          placement="bottom"
        >
          <em
            v-if="$route.params.user_id !== row.owner_id"
            class="ri-survey-line primary table-button"
            @click="handleParticipateDialog(row.owner_id)"
          />
        </el-tooltip>
        <el-tooltip
          :content="$t('Issue.Issue')"
          placement="bottom"
        >
          <em
            class="ri-file-copy-2-line success table-button"
            @click="handleIssueClick(row)"
          />
        </el-tooltip>
        <el-tooltip
          :content="$t('general.Remove')"
          :disabled="isDisabled"
          placement="bottom"
        >
          <el-popconfirm
            :confirm-button-text="$t('general.Remove')"
            :cancel-button-text="$t('general.Cancel')"
            :title="$t('Member.confirmRemove')"
            :disabled="isDisabled"
            icon="el-icon-info"
            popper-class="danger"
            @confirm="handleDelete(row.id)"
          >
            <span slot="reference">
              <em
                :class="isDisabled ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
              />
            </span>
          </el-popconfirm>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      v-if="listData && listData.length > 0"
      :total="filteredData.length"
      :page="listQuery.page"
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
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { getParticipateProject, deleteProjectMember } from '@/api/projects'
import { getUserInfo } from '@/api/user'
import { ElTableResponsive } from '@shared/components'

export default {
  name: 'ParticipateProject',
  components: { ElTableResponsive },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      projectMember: ''
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
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('Project.Name'),
          prop: 'display',
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
          minWidth: '100',
          slot: 'actions'
        }
      ]
    }
  },
  watch: {
    '$route.params.userId': {
      handler(val) {
        this.fetchData(val)
        this.getUserInfo(val)
      },
      immediate: true
    }
  },
  methods: {
    async fetchData(user_id) {
      if (!user_id) return
      this.listLoading = true
      const projectsByUser = await getParticipateProject(user_id)
      this.listData = projectsByUser.data
      this.listLoading = false
    },
    async getUserInfo(user_id) {
      const userInfo = await getUserInfo(user_id)
      this.projectMember = userInfo.name
    },
    async handleDelete(project_id) {
      this.listLoading = true
      try {
        await deleteProjectMember(project_id, this.$route.params.userId)
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
      this.$router.push({ name: 'ParticipateProject', params: { userId: owner_id }})
    },
    handleIssueClick(row) {
      const { owner_id, name } = row
      this.$router.push({ name: 'IssueTransfer', params: { userId: owner_id, userName: name }})
    }
  }
}
</script>
