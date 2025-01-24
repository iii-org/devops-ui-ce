<template>
  <div class="app-container account-manage-table">
    <div class="flex justify-between">
      <el-button
        :size="isMobile ? 'small' : 'medium'"
        type="primary"
        @click="handleUserDialog('', dialogTitle.addUser)"
      >
        <em class="el-icon-plus"></em>
        {{ $t('User.AddUser') }}
      </el-button>
      <SearchFilter
        ref="searchFilter"
        :display-fields="displayFields"
        :is-mobile="isMobile"
        :list-loading="listLoading"
        :organization-list="organizationList"
        :params="params"
        @downloadExcel="downloadExcel"
        @loadData="loadData"
      />
    </div>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :columns="tableColumns"
      :data="userList"
      :display-fields="displayFields"
      :element-loading-text="$t('Loading')"
      :header-cell-style="{ 'text-align': 'center' }"
      :row-class-name="getRowClass"
      fit
      @sort-change="handleSortChange"
    >
      <template #first_name="{ row }">
        <div
          :class="isMobile && 'mobile'"
          style="display: flex; align-items: center"
        >
          <div class="avatar">
            <el-avatar
              :class="!row.is_active ? 'grey-out' : ''"
              :size="36"
              :src="generateAvatarUrl(row.full_name, row.email)"
            />
          </div>
          <div class="user">
            <span class="font-bold">
              <span class="font-bold">{{ row.full_name }}</span>
              <span
                :style="!row.is_active ? 'color: #b4b4b4' : ''"
                class="badge"
              >
                {{ row.username }}
              </span>
            </span>
            <span class="text-xs text-gray-400">{{ row.email }}</span>
          </div>
        </div>
      </template>
      <template #organization_id="{ row }">
        <span>{{ getOrganizationName(row.organization_id) }}</span>
      </template>
      <template #actions="{ row }">
        <el-tooltip :content="$t('general.Edit')" placement="bottom">
          <em
            :class="
              row.role.name === 'sysadmin' && userRole !== 'sysadmin'
                ? 'disabled'
                : 'success'
            "
            class="ri-edit-box-line table-button"
            @click="handleRowClick(row)"
          ></em>
        </el-tooltip>
        <el-tooltip
          :content="$t('Dashboard.ADMIN.ProjectList.NAME')"
          placement="bottom"
        >
          <em
            :class="
              row.role.name === 'sysadmin' && userRole !== 'sysadmin'
                ? 'disabled'
                : 'warning'
            "
            class="ri-survey-line warning table-button"
            @click="handleToParticipathProject(row.id)"
          ></em>
        </el-tooltip>
        <el-tooltip :content="$t('general.Delete')" placement="bottom">
          <el-popconfirm
            :cancel-button-text="$t('general.Cancel')"
            :confirm-button-text="$t('general.Delete')"
            :title="$t('Notify.confirmDelete')"
            icon="el-icon-info"
            popper-class="danger"
            @confirm="handleDelete(row.id)"
          >
            <em
              slot="reference"
              :class="
                (row.role.name === 'sysadmin' && userRole !== 'sysadmin') ||
                  row.id === userId
                  ? 'disabled'
                  : 'danger'
              "
              class="ri-delete-bin-2-line table-button"
            ></em>
          </el-popconfirm>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.current"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="listQuery.total"
      @pagination="onPagination"
    />
    <UserDialog
      v-if="userDialogOptions.isDialogVisible"
      :organization-list="organizationList"
      :user-dialog-options="userDialogOptions"
      :width="isMobile ? '95%' : '50%'"
      @onCloseDialog="handleCloseUserDialog"
    />
  </div>
</template>

<script>
import { downloadUserList } from '@/api/user'
import { getOrganizationList } from '@/api_v3/organizations'
import { deleteUser, getUserDetails, getUserList } from '@/api_v3/user'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import { generateAvatarUrl } from '@shared/utils/Avatar'
import { mapGetters } from 'vuex'
import SearchFilter from './components/SearchFilter'

const ADD_USER = 'AddUser'
const EDIT_USER = 'EditUser'

export default {
  name: 'AccountManage',
  components: {
    SearchFilter,
    ElTableResponsive: () => import('@shared/components/ElTableResponsive'),
    UserDialog: () => import('./components/UserDialog')
  },
  mixins: [BasicData, Pagination],
  data() {
    this.dialogTitle = {
      addUser: ADD_USER,
      editUser: EDIT_USER
    }
    return {
      userDialogOptions: {
        isDialogVisible: false,
        title: '',
        userId: 0,
        userData: {}
      },
      params: {
        page: 1,
        limit: 10,
        search: this.keyword,
        sort: 'create_at:desc'
      },
      userList: [],
      displayFields: [
        'first_name',
        'organization_id',
        'department',
        'phone',
        'last_login',
        'actions'
      ],
      organizationList: []
    }
  },
  computed: {
    ...mapGetters(['userId', 'device', 'roleList', 'userRole']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      const column = [
        {
          label: this.$t('Activities.User'),
          prop: 'first_name',
          minWidth: 280,
          slot: 'first_name',
          sortable: 'custom'
        },
        {
          label: this.$t('general.Department'),
          prop: 'department',
          minWidth: 140,
          align: 'center',
          sortable: 'custom'
        },
        {
          label: this.$t('User.Phone'),
          prop: 'phone',
          width: 160,
          align: 'center'
        },
        {
          label: this.$t('general.CreateTime'),
          prop: 'create_at',
          minWidth: 140,
          type: 'time',
          align: 'center',
          sortable: 'custom'
        },
        {
          label: this.$t('User.LastLogin'),
          prop: 'last_login',
          minWidth: 140,
          type: 'time',
          align: 'center',
          sortable: 'custom'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          minWidth: 120,
          slot: 'actions',
          align: 'center',
          fixed: this.isMobile ? false : 'right'
        }
      ]
      if (this.userRole === 'sysadmin') {
        column.splice(1, 0, {
          label: this.$t('Organization.Organization'),
          prop: 'organization_id',
          minWidth: 140,
          align: 'center',
          slot: 'organization_id'
        })
      }
      return column
    }
  },
  mounted() {
    if (this.userRole === 'sysadmin') this.fetchOrganizationList()
  },
  methods: {
    generateAvatarUrl,
    async fetchOrganizationList() {
      await getOrganizationList().then((res) => {
        this.organizationList = res.data
      })
    },
    getOrganizationName(organizationId) {
      const organization = this.organizationList.find(
        (org) => org.id === organizationId
      )
      return organization ? organization.name : '-'
    },
    async fetchData() {
      const allUser = await getUserList(this.params)
      this.listQuery = allUser.data.pagination
      this.userList = allUser.data.items
    },
    async onPagination(query) {
      const { page, limit } = query
      this.params.page = page
      this.params.limit = limit
      await this.loadData()
    },
    handleCloseUserDialog(isVisible, isRefresh, isEdit) {
      this.userDialogOptions.isDialogVisible = isVisible
      if (isRefresh === 'refresh') {
        if (!isEdit) {
          this.params.page = 1
          // this.clearKeyword()
        }
        this.loadData()
      }
    },
    async handleUserDialog(user, title) {
      if (user === '') {
        const enRole = this.roleList.find((role) => role.name === 'Engineer')
        this.userDialogOptions.userId = 0
        this.userDialogOptions.userData = {
          username: '',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: enRole,
          is_active: true,
          organization_id: this.params.organization_id
        }
      } else {
        this.userDialogOptions.userId = user.id
        this.userDialogOptions.userData = await getUserDetails(
          this.userDialogOptions.userId
        )
        this.userDialogOptions.isDisableOrg = true
      }
      this.userDialogOptions.title = title
      this.userDialogOptions.isDialogVisible = true
    },
    async handleDelete(userId) {
      try {
        await deleteUser(userId)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        this.loadData()
      } catch (error) {
        console.error(error)
      }
    },
    handleRowClick(row) {
      this.handleUserDialog(row, this.dialogTitle.editUser)
    },
    handleToParticipathProject(user_id) {
      this.$router.push({
        name: 'ParticipateProject',
        params: { userId: user_id }
      })
    },
    getRowClass({ row }) {
      if (!row.is_active) {
        return 'grey-out'
      }
      return 'cursor-pointer'
    },
    async handleSortChange({ prop, order }) {
      const orderBy = this.checkOrder(order)
      if (orderBy) {
        this.params.sort = prop + ':' + orderBy
      } else {
        delete this.params.sort
      }
      await this.loadData()
    },
    checkOrder(order) {
      if (order === 'descending') {
        return 'desc'
      }
      if (order === 'ascending') {
        return 'asc'
      }
      return false
    },
    downloadExcel() {
      this.$confirm(
        this.$t('User.DownloadDescription'),
        this.$t('User.DownloadAccountList'),
        {
          confirmButtonText: this.$t('File.Download'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'info'
        }
      ).then(async () => {
        const fields = this.displayFields
          .flatMap((item) => {
            if (item === 'first_name') return ['full_name', 'email', 'username']
            else return item
          })
          .filter((item) => item !== 'actions')
        const res = await downloadUserList({ ...this.params, download: fields })
        const blob = new Blob([res])
        const link = document.createElement('a')
        const url = window.URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'AccountList.xlsx')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.avatar {
  display: flex;
  flex-shrink: 0;
  position: relative;
  margin-right: 0.75rem;
  overflow: hidden;
  margin-left: 0.75rem;
  border-radius: 50%;
}

.user {
  flex-direction: column;
  display: flex;
}

.badge {
  font-size: 0.73rem;
  margin-left: 0.2rem;
  display: inline-flex;
  align-items: center;
  color: $primary;
  background-color: #f4f4f4;
  padding: 0 0.4rem;
  line-height: 18px;
  border-radius: 3px;
}

.grey-out {
  opacity: 0.4;
  filter: alpha(opacity=40);
  filter: grayscale(100%);
  color: #b4b4b4 !important;
}

::v-deep {
  .grey-out {
    border-color: #cbcbcb !important;
    color: #b4b4b4 !important;
  }

  .el-table--medium .el-table__cell {
    padding: 6px 0 !important;
  }
}

.mobile {
  display: block !important;

  .avatar {
    display: contents;
  }
}
</style>
