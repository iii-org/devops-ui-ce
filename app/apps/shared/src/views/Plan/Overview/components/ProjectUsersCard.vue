<template>
  <el-card class="mb-3 border-none">
    <div class="flex justify-between items-center w-full">
      <div class="flex items-center font-semibold h-8">
        <em class="el-icon-user mx-1"></em>
        {{ $t('Dashboard.ProjectUsers') }}
      </div>
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
    </div>
    <el-empty
      v-if="userList.length === 0"
      :description="$t('general.NoData')"
      :image-size="100"
    />
    <el-table v-else :data="userList" stripe style="width: 100%">
      <el-table-column :label="$t('general.Name')" prop="full_name">
        <template slot-scope="scope">
          <div style="display: flex !important; align-items: center">
            <div class="avatar">
              <el-avatar
                :size="36"
                :src="generateAvatarUrl(scope.row.full_name, scope.row.email)"
              />
            </div>
            <div class="user">
              <span class="font-bold">
                <span class="font-bold mr-1">{{ scope.row.full_name }}</span>
                <span class="badge">
                  {{ scope.row.username }}
                </span>
              </span>
              <span class="text-xs text-gray-400">{{ scope.row.email }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Project.Title')"
        :width="160"
        align="center"
        prop="role_name"
      >
        <template slot-scope="scope">
          {{ getRoleName(scope.row.id) }}
        </template>
      </el-table-column>
    </el-table>
    <AddMemberDialog ref="addMemberDialog" @update="onUpdate" />
  </el-card>
</template>

<script>
import AddMemberDialog from '@/views/Plan/Settings/components/AddMemberDialog'
import { generateAvatarUrl } from '@shared/utils/Avatar'
import { mapGetters } from 'vuex'

export default {
  name: 'ProjectUsersCard',
  components: {
    AddMemberDialog
  },
  props: {
    userList: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'selectedProject', 'device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    generateAvatarUrl,
    getRoleName(id) {
      const isProjectOwner = id === this.selectedProject.owner.id
      return isProjectOwner
        ? this.$t('Member.ProjectOwner')
        : this.$t('Member.ProjectMember')
    },
    showDialog() {
      this.$refs.addMemberDialog.dialogVisible = true
    },
    onUpdate() {
      this.$emit('onUpdate')
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
  border-radius: 50%;
}

.user {
  flex-direction: column;
  display: flex;
}

.badge {
  font-size: 0.73rem;
  display: inline-flex;
  align-items: center;
  color: $primary;
  background-color: #f4f4f4;
  padding: 0 0.4rem;
  line-height: 18px;
  border-radius: 3px;
}
</style>
