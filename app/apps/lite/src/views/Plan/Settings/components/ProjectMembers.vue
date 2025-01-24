<template>
  <div v-loading="listLoading">
    <div v-if="isShowTitle" class="text-lg mb-2">
      {{ $t('Member.Manage') }}
    </div>
    <el-empty
      v-if="selectedProjectId === -1"
      :description="$t('general.NoData')"
      :image-size="100"
    />
    <template v-else>
      <div class="flex justify-between mb-4">
        <el-button
          v-permission="[
            'sysadmin',
            'Organization Owner',
            'Project Manager',
            'QA'
          ]"
          :size="isMobile ? 'small' : 'medium'"
          icon="el-icon-plus"
          type="success"
          @click="showDialog"
        >
          <span v-if="!isMobile">{{ $t('Member.AddMember') }}</span>
        </el-button>
        <div>
          <span v-if="!isMobile" class="font-bold mx-2">
            {{ $t('Project.Owner') }}
          </span>
          <el-select
            v-model="owner"
            :disabled="disabledEditOwner"
            :size="isMobile ? 'small' : 'medium'"
            :style="{ width: isMobile ? '100px' : 'auto' }"
            value-key="id"
            @change="confirmSetProjectOwner"
          >
            <el-option
              v-for="user in assignedList"
              :key="user.id"
              :disabled="user.disabled"
              :label="user.full_name"
              :value="user"
            />
          </el-select>
        </div>
        <el-input
          v-model="keyword"
          :placeholder="$t('general.SearchName')"
          :size="isMobile ? 'small' : 'medium'"
          :style="{ width: isMobile ? 'auto' : '140px' }"
          prefix-icon="el-icon-search"
        />
      </div>
      <ElTableResponsive :columns="tableColumns" :data="pagedData" fit>
        <template #role="{ row }">
          {{ getRoleName(row.id) }}
        </template>
        <template #actions="{ row }">
          <el-dropdown placement="bottom" trigger="click">
            <el-button type="text">
              {{ $t('general.Edit') }}
              <em class="el-icon-arrow-down el-icon--right"></em>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-permission="['sysadmin', 'Organization Owner', 'QA']"
              >
                <el-button
                  class="text-primary"
                  icon="ri-survey-line"
                  type="text"
                  @click="handleParticipateDialog(row.id)"
                >
                  {{ $t('general.Participate') }}
                </el-button>
              </el-dropdown-item>
              <el-dropdown-item
                v-permission="[
                  'sysadmin',
                  'Organization Owner',
                  'Project Manager',
                  'QA'
                ]"
              >
                <el-button
                  class="text-success"
                  icon="ri-file-copy-2-line"
                  type="text"
                  @click="handleIssueClick(row)"
                >
                  {{ $t('Issue.Issue') }}
                </el-button>
              </el-dropdown-item>
              <el-dropdown-item
                v-if="!row.can_modify"
                v-permission="[
                  'sysadmin',
                  'Organization Owner',
                  'Project Manager',
                  'QA'
                ]"
              >
                <el-button
                  class="text-info"
                  icon="ri-loop-left-line"
                  type="text"
                  @click="handleUserSync(row)"
                >
                  {{ $t('general.Sync') }}
                </el-button>
              </el-dropdown-item>
              <el-dropdown-item
                v-permission="[
                  'sysadmin',
                  'Organization Owner',
                  'Project Manager',
                  'QA'
                ]"
                divided
              >
                <el-button
                  :class="
                    !(
                      row.id === userId || row.id === selectedProject.owner.id
                    ) && 'text-danger'
                  "
                  :disabled="
                    row.id === userId || row.id === selectedProject.owner.id
                  "
                  icon="ri-delete-bin-2-line"
                  type="text"
                  @click="handleDeleteClick(row)"
                >
                  {{ $t('general.Remove') }}
                </el-button>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </ElTableResponsive>
      <Pagination
        :layout="paginationLayout"
        :limit="listQuery.limit"
        :page="listQuery.page"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        :total="filteredData.length"
        @pagination="onPagination"
      />
      <AddMemberDialog ref="addMemberDialog" @update="loadData" />
    </template>
  </div>
</template>

<script>
import { syncUserData } from '@/api_v2/projects'
import {
  getProjectUserList,
  removeProjectMember,
  updateProject
} from '@/api_v3/projects'
import { getUserIssueList } from '@/api_v3/user'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { mapActions, mapGetters } from 'vuex'
import AddMemberDialog from './AddMemberDialog'

export default {
  name: 'ProjectMembers',
  components: {
    AddMemberDialog,
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination, SearchBar],
  props: {
    isShowTitle: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchKeys: ['full_name', 'username', 'department'],
      unClosedIssueCount: 0,
      owner: {}
    }
  },
  computed: {
    ...mapGetters(['userRole', 'userId', 'device']),
    disabledEditOwner() {
      if (
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      ) {
        return false
      }
      return this.userId !== this.selectedProject.owner.id
    },
    isEngineer() {
      return this.userRole === 'Engineer'
    },
    assignedList() {
      const list = this.listData
        .filter((item) => item.role.name === 'Project Manager')
        .map(({ id, full_name, department }) => ({
          id,
          full_name,
          department
        }))

      if (!list.some((item) => item.id === this.owner.id)) {
        list.push({ ...this.owner, disabled: true })
      }
      return list
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
      const columns = [
        {
          label: this.$t('Member.Account'),
          prop: 'username',
          align: 'center'
        },
        {
          label: 'First Name',
          prop: 'first_name',
          align: 'center'
        },
        {
          label: 'Last Name',
          prop: 'last_name',
          align: 'center'
        },
        {
          label: this.$t('general.Department'),
          prop: 'department',
          align: 'center',
          width: '300'
        },
        {
          label: this.$t('Member.Phone'),
          prop: 'phone',
          align: 'center'
        },
        {
          label: this.$t('Member.Role'),
          prop: 'role',
          align: 'center',
          slot: 'role'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          slot: 'actions'
        }
      ]
      return this.isEngineer
        ? columns.filter((column) => column.prop !== 'actions')
        : columns
    }
  },
  mounted() {
    this.setOwner()
  },
  methods: {
    ...mapActions('projects', ['setSelectedProject']),
    async fetchData() {
      const res = await getProjectUserList(this.selectedProjectId)
      return res.data
    },
    confirmSetProjectOwner() {
      const h = this.$createElement
      this.$msgbox({
        title: this.$t('ProjectSettings.ChangeManager'),
        message: h('p', null, [
          h('span', null, this.$t('Notify.ChangeProjectManager'))
        ]),
        showCancelButton: true,
        confirmButtonText: this.$t('general.ok'),
        cancelButtonText: this.$t('general.Cancel'),
        beforeClose: (action, _instance, done) => {
          if (action === 'confirm') this.setProjectOwner()
          else this.owner = this.selectedProject.owner
          done()
        }
      })
    },
    async setProjectOwner() {
      this.listLoading = true
      await updateProject(this.selectedProjectId, {
        owner_id: this.owner.id
      })
        .then(() => {
          this.$message({
            message: `${this.$t('Notify.Updated')} ${this.$t('Project.Owner')}`,
            type: 'success'
          })
          this.setSelectedProject({
            ...this.selectedProject,
            owner: this.owner
          })
        })
        .catch((err) => {
          this.$message({
            message: err,
            type: 'error'
          })
        })
        .then(() => {
          this.listLoading = false
        })
    },
    setOwner() {
      this.owner = this.selectedProject.owner
    },
    showDialog() {
      this.$refs.addMemberDialog.dialogVisible = true
    },
    async handleDelete(userId) {
      this.listLoading = true
      try {
        await removeProjectMember(this.selectedProjectId, userId)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        this.$refs.addMemberDialog.loadData()
        await this.loadData()
      } catch (error) {
        console.error(error)
        this.listLoading = false
      }
    },
    getRoleName(id) {
      const isProjectOwner = id === this.selectedProject.owner.id
      return isProjectOwner
        ? this.$t('Member.ProjectOwner')
        : this.$t('Member.ProjectMember')
    },
    async handleDeleteClick(row) {
      this.listLoading = true
      await this.fetchIssueByUser(row)
      this.listLoading = false
      const hasUnclosedIssue = this.unClosedIssueCount > 0
      hasUnclosedIssue
        ? this.showConfirmTransferDialog(row)
        : this.showConfirmRemoveMemberDialog(row)
    },
    handleIssueClick(row) {
      const { id, full_name } = row
      this.$router.push({
        name: 'IssueTransfer',
        params: { userId: id, userName: full_name }
      })
    },
    showConfirmTransferDialog(row) {
      const { id, full_name } = row
      this.$confirm(
        this.$t('Member.ConfirmTransfer', {
          userRole: this.getRoleName(id),
          userName: full_name,
          unClosedIssueCount: this.unClosedIssueCount
        }),
        this.$t('general.caution'),
        {
          confirmButtonText: this.$t('Member.TransferIssue'),
          type: 'warning',
          showCancelButton: false
        }
      )
        .then(() => {
          this.handleIssueClick(row)
        })
        .catch(() => ({}))
    },
    showConfirmRemoveMemberDialog(row) {
      const { id, full_name } = row
      this.$confirm(
        this.$t('Member.ConfirmRemoveMember', {
          userRole: this.getRoleName(id),
          userName: full_name
        }),
        this.$t('general.caution'),
        {
          confirmButtonText: this.$t('general.Remove'),
          confirmButtonClass: 'el-button--danger',
          type: 'error',
          showCancelButton: false
        }
      )
        .then(() => {
          this.handleDelete(id)
        })
        .catch(() => ({}))
    },
    async fetchIssueByUser(row) {
      const { id } = row
      const params = {
        from: 'assigned',
        exclude_closed: true,
        project_id: this.selectedProjectId,
        all: true
      }
      await getUserIssueList(id, params).then((res) => {
        this.unClosedIssueCount = res.data.length
      })
    },
    handleParticipateDialog(user_id) {
      this.$router.push({
        name: 'ParticipateProject',
        params: { userId: user_id }
      })
    },
    async handleUserSync(row) {
      await syncUserData(row.id).then(() => {
        this.loadData()
        this.$message({
          message: this.$t('Notify.Synced'),
          type: 'success'
        })
      })
    }
  }
}
</script>
