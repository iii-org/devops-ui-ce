<template>
  <div v-loading="parent.listLoading">
    <slot name="header" />
    <div class="header resizeHeight">
      <Kanban
        v-if="parent.listData && parent.listData.length > 0"
        :id="`kanban-work_issue-list`"
        :board-object="{id: 1, is_closed: false, name: 'Active'}"
        :list="parent.listData"
        :status="status"
        :dimension="'version'"
        :from-wbs="true"
        :disabled="true"
        from-tab="issue-list"
        class="kanban"
        @relationIssueId="parent.handleClick($event)"
        @update="parent.loadDataAfterSetIssue"
        @contextmenu="handleDrawerMenu"
      />
      <el-empty
        v-else
        :description="$t('general.NoData')"
        :image-size="100"
      />
    </div>
    <el-drawer
      v-loading="parent.listLoading"
      :title="`#${contextMenu.row.id} - ${contextMenu.row.name}`"
      :visible.sync="contextMenu.visible"
      direction="btt"
      class="drawer"
      size="60%"
      destroy-on-close
    >
      <DrawerMenu
        ref="contextmenu"
        :key="drawerKey"
        :row="contextMenu.row"
        :filter-column-options="parent.filterOptions"
        @update="parent.loadData"
        @update-row="getContextRow"
      />
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { Kanban } from '@/views/Project/IssueBoards/components'
import { ContextMenu, CancelRequest } from '@/mixins'
import { DrawerMenu } from '@/components/Issue'

export default {
  name: 'MyWorkMobile',
  components: { Kanban, DrawerMenu },
  mixins: [ContextMenu, CancelRequest],
  data() {
    return {
      drawerKey: 0
    }
  },
  computed: {
    ...mapGetters(['status', 'selectedProjectId', 'selectedProject']),
    parent() {
      return this.$parent.$parent
    }
  },
  methods: {
    handleDrawerMenu(val) {
      this.drawerKey = val.id
      this.contextMenu.visible = true
      this.contextMenu.row = val
    }
  }
}
</script>

<style lang="scss" scoped>
.kanban {
  width: auto;
  background-color: white;

  ::v-deep .board-item {
    margin-top: 5px !important;
  }
}
.pagination {
  padding: 2px;
  background: transparent;
}
::v-deep .board-column {
  background-color: white;
}
.drawer {
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }
  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
  }
  ::v-deep .el-drawer__body::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }
  ::v-deep .el-drawer__body {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
}
</style>
