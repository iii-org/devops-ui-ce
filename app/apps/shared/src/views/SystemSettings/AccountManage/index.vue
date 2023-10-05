<template>
  <div class="app-container account-manage-table">
    <div class="flex justify-between">
      <el-button
        class="button-primary"
        :size="isMobile ? 'small' : 'medium'"
        @click="showUserDialog('', 'Add User')"
      >
        <em class="el-icon-plus" />
        {{ $t('User.AddUser') }}
      </el-button>
      <el-input
        v-model="keyword"
        prefix-icon="el-icon-search"
        :placeholder="$t('User.SearchAccount')"
        :style="{ width: isMobile ? 'auto' : '250px' }"
        :size="isMobile ? 'small' : 'medium'"
      />
    </div>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :data="userList"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      :cell-style="{ 'text-align': 'center' }"
      :header-cell-style="{ 'text-align': 'center' }"
      fit
      highlight-current-row
      @row-click="clickEvent"
    >
      <template v-slot:actions="{ row }">
        <el-tooltip
          placement="bottom"
          :content="$t('general.Participate')"
        >
          <em
            class="ri-edit-box-line success table-button"
            @click="handleParticipateDialog(row.id)"
          />
        </el-tooltip>
        <el-tooltip
          placement="bottom"
          :content="$t('general.Delete')"
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
import { deleteUser, getUser, getUserInfo } from '@/api/user'
import { BasicData, SearchBar, Pagination } from '@/mixins'
import { ElTableResponsive } from '@shared/components'
import UserDialog from './components/UserDialog'

export default {
  name: 'AccountManage',
  components: {
    UserDialog,
    ElTableResponsive
  },
  mixins: [BasicData, SearchBar, Pagination],
  data() {
    return {
      storageName: 'participate',
      storageType: ['SearchBar'],
      userDialogVisible: false,
      dialogTitle: '',
      editUserId: 0,
      editUserData: {},
      params: {
        page: 1,
        per_page: 10,
        search: this.keyword
      },
      userList: []
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
          label: this.$t('User.Account'),
          prop: 'login',
          minWidth: 170
        },
        {
          label: this.$t('general.Name'),
          prop: 'name',
          minWidth: 200
        },
        {
          label: 'Email',
          prop: 'email',
          minWidth: 280
        },
        {
          label: this.$t('general.CreateTime'),
          prop: 'create_at',
          minWidth: 140,
          type: 'time'
        },
        {
          label: this.$t('User.Phone'),
          prop: 'phone',
          width: 160
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          minWidth: 120,
          type: 'tag',
          i18nKey: 'Status',
          location: 'accountManage'
        },
        {
          label: this.$t('User.LastLogin'),
          prop: 'last_login',
          minWidth: 140,
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          minWidth: 80,
          slot: 'actions'
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
    }
  }
}
</script>
