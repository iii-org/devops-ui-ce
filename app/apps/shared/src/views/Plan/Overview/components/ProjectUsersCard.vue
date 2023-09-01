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
        class="buttonSecondary"
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
        prop="role_name"
        :label="$t('Project.Title')"
      >
        <template slot-scope="scope">
          {{ getRoleName(scope.row.id) }}
        </template>
      </el-table-column>>
      <el-table-column
        prop="name"
        :label="$t('general.Name')"
      >
        <template slot-scope="scope">
          {{ `${scope.row.name} (${scope.row.login})` }}
        </template>
      </el-table-column>
      <el-table-column
        prop="email"
        :label="$t('general.Email')"
      />
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
