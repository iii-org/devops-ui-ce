<template>
  <el-card
    class="mb-3"
  >
    <div class="flex justify-between items-center w-full">
      <div class="flex items-center font-semibold h-8">
        <em class="el-icon-user mx-1" />
        {{ $t('Dashboard.ProjectUsers') }}
      </div>
      <el-button
        v-permission="['Administrator','Project Manager','QA']"
        class="button-secondary"
        :size="isMobile ? 'small' : 'medium'"
        icon="el-icon-plus"
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
    <el-table
      v-else
      :data="userList"
      style="width: 100%"
      stripe
    >
      <el-table-column
        prop="name"
        :label="$t('general.Name')"
      >
        <template slot-scope="scope">
          <div style="display: flex !important;align-items: center;">
            <div class="avatar">
              <el-avatar
                :src="generateAvatarUrl(scope.row.name, scope.row.email)"
                :size="36"
              />
            </div>
            <div class="user">
              <span class="font-bold">
                <span class="font-bold">{{ scope.row.name }}</span>
                <span
                  class="badge"
                >
                  {{ scope.row.login }}
                </span>
              </span>
              <span class="text-xs text-gray-400">{{ scope.row.email }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="role_name"
        :label="$t('Project.Title')"
        :width="160"
        align="center"
      >
        <template slot-scope="scope">
          {{ getRoleName(scope.row.id) }}
        </template>
      </el-table-column>
    </el-table>
    <AddMemberDialog
      ref="addMemberDialog"
      @update="onUpdate"
    />
  </el-card>
</template>

<script>
import { mapGetters } from 'vuex'
import AddMemberDialog from '@/views/Plan/Settings/components/AddMemberDialog'
import { generateAvatarUrl } from '@shared/utils/Avatar'

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
      const isProjectOwner = id === this.selectedProject.owner_id
      return isProjectOwner ? this.$t('Member.ProjectOwner') : this.$t('Member.ProjectMember')
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
@import 'src/styles/theme/variables.scss';

.avatar {
  display: flex;
  flex-shrink: 0;
  position: relative;
  border-radius: 0.75rem;
  margin-right: 0.75rem;

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
</style>
