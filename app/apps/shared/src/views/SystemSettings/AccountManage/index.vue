<template>
  <div class="app-container account-manage-table">
    <div class="flex justify-between">
      <el-button
        :size="isMobile ? 'small' : 'medium'"
        class="button-primary"
        @click="showUserDialog('', 'Add User')"
      >
        <em class="el-icon-plus" />
        {{ $t('User.AddUser') }}
      </el-button>
      <SearchFilter
        :list-loading="listLoading"
        :is-mobile="isMobile"
        :params="params"
        :display-fields="displayFields"
        @load-data="loadData"
      />
    </div>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :data="userList"
      :columns="tableColumns"
      :display-fields="displayFields"
      :element-loading-text="$t('Loading')"
      :header-cell-style="{ 'text-align': 'center' }"
      :row-class-name="getRowClass"
      fit
      highlight-current-row
      @row-click="clickEvent"
      @sort-change="handleSortChange"
    >
      <template v-slot:avatar="{ row }">
        <div style="display: flex !important; align-items: center;">
          <div class="avatar">
            <el-avatar
              :src="generateAvatarUrl(row.name, row.email)"
              :size="36"
              :class="row.status === 'disable' ? 'grey-out' : ''"
            />
          </div>
          <div class="user">
            <span class="font-bold">
              <span class="font-bold">{{ row.name }}</span>
              <span
                :style="row.status === 'disable' ? 'color: #b4b4b4' : ''"
                class="badge"
              >
                {{ row.login }}
              </span>
            </span>
            <span class="text-xs text-gray-400">{{ row.email }}</span>
          </div>
        </div>
      </template>
      <template v-slot:actions="{ row }">
        <el-tooltip
          :content="$t('general.Participate')"
          placement="bottom"
        >
          <em
            class="ri-edit-box-line success table-button"
            @click="handleParticipateDialog(row.id)"
          />
        </el-tooltip>
        <el-tooltip
          :content="$t('general.Delete')"
          placement="bottom"
        >
          <el-popconfirm
            :title="$t('Notify.confirmDelete')"
            :confirm-button-text="$t('general.Delete')"
            :cancel-button-text="$t('general.Cancel')"
            icon="el-icon-info"
            popper-class="danger"
            @confirm="handleDelete(row.id)"
          >
            <em
              slot="reference"
              class="ri-delete-bin-2-line danger table-button"
            />
          </el-popconfirm>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      :total="listQuery.total"
      :page="listQuery.current"
      :limit="listQuery.per_page"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
    <UserDialog
      :dialog-title="dialogTitle"
      :user-id="editUserId"
      :user-data="editUserData"
      :dialog-visible="userDialogVisible"
      :width="isMobile ? '95%' : '40%'"
      @add-user-visible="emitAddUserDialogVisible"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getUser, getUserInfo, deleteUser } from '@/api/user'
import { BasicData, Pagination } from '@/mixins'
import { ElTableResponsive } from '@shared/components'
import { generateAvatarUrl } from '@shared/utils/Avatar'
import SearchFilter from './components/SearchFilter'
import UserDialog from './components/UserDialog'

export default {
  name: 'AccountManage',
  components: {
    SearchFilter,
    UserDialog,
    ElTableResponsive
  },
  mixins: [BasicData, Pagination],
  data() {
    return {
      storageName: 'participate',
      userDialogVisible: false,
      dialogTitle: '',
      editUserId: 0,
      editUserData: {},
      params: {
        page: 1,
        per_page: 10,
        search: this.keyword
      },
      userList: [],
      displayFields: ['avatar', 'department', 'phone', 'last_login', 'actions']
    }
  },
  computed: {
    ...mapGetters(['userId', 'device']),
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
          prop: 'avatar',
          minWidth: 280,
          slot: 'avatar',
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
          align: 'center'
        }
      ]
    }
  },
  methods: {
    generateAvatarUrl,
    async fetchData() {
      const allUser = await getUser(this.params)
      this.listQuery = allUser.page
      this.userList = allUser.user_list.filter(item => item.id !== this.userId)
    },
    async onPagination(query) {
      const { page, limit } = query
      this.params.page = page
      this.params.per_page = limit
      await this.loadData()
    },
    emitAddUserDialogVisible(visible, refresh, edit) {
      this.userDialogVisible = visible
      if (refresh === 'refresh') {
        if (!edit) {
          this.params.page = 1
          this.clearKeyword()
        }
        this.loadData()
      }
    },
    async showUserDialog(user, title) {
      if (user === '') {
        this.editUserId = 0
        this.editUserData = {
          login: '',
          name: '',
          email: '',
          phone: '',
          role: { id: process.env.VUE_APP_PROJECT === 'SSO' ? 1 : 3 },
          enable: true,
          status: 'enable'
        }
      } else {
        this.editUserId = user.id
        this.editUserData = await getUserInfo(this.editUserId)
      }
      this.dialogTitle = title
      this.userDialogVisible = true
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
    clickEvent(row, column) {
      if (column.label !== this.$t('general.Actions')) this.showUserDialog(row, 'Edit User')
    },
    handleParticipateDialog(user_id) {
      this.$router.push({
        name: 'ParticipateProject',
        params: { userId: user_id }
      })
    },
    getRowClass({ row }) {
      if (row.status === 'disable') {
        return 'grey-out'
      }
      return ''
    },
    handleSortChange({ column, prop, order }) {
      if (order) {
        this.params.sort = prop === 'avatar' ? 'account' : prop
        this.params.desc = order !== 'ascending'
      } else {
        delete this.params.sort
        delete this.params.desc
      }
      this.loadData()
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

.avatar {
  display: flex;
  flex-shrink: 0;
  position: relative;
  border-radius: 0.75rem;
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
  font-size: .73rem;
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
</style>
