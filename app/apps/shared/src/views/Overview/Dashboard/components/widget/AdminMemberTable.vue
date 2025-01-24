<template>
  <el-table
    v-loading="memberData.loading"
    :data="categoryByRole"
    :show-header="false"
    row-key="user_id"
  >
    <el-table-column
      :label="$t('Member.Role')"
      prop="role_name"
      show-overflow-tooltip
      sortable
      width="200"
    >
      <div slot-scope="scope" class="text-right">
        <span>
          <strong>
            {{ scope.row.role_name }}
          </strong>
          ({{ scope.row.user_name.length }})
        </span>
      </div>
    </el-table-column>
    <el-table-column
      :label="$t('Dashboard.ADMIN.ProjectMembers.NAME')"
      prop="user_name"
      show-overflow-tooltip
      sortable
    >
      <template slot-scope="scope">
        <el-tag
          v-for="(user, idx) in scope.row.user_name"
          :key="idx"
          :type="mapType(scope.row.role_name)"
          class="ml-1 rounded-md"
          effect="dark"
          size="small"
        >
          {{ user }}
        </el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: 'AdminMemberTable',
  props: {
    memberData: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    categoryByRole() {
      const category = {}
      const result = []
      this.memberData.children.forEach((item) => {
        if (!category.hasOwnProperty(item.role_name)) {
          category[item.role_name] = []
        }
        category[item.role_name].push(item.user_name)
      })
      Object.keys(category).forEach((item) => {
        result.push({ role_name: item, user_name: category[item] })
      })
      return result
    }
  },
  methods: {
    mapType(role) {
      switch (role) {
        case 'sysadmin':
        case 'Organization Owner':
          return 'danger'
        case 'Project Manager':
          return 'warning'
        case 'Engineer':
          return 'success'
        default:
          return 'info'
      }
    }
  }
}
</script>
