<template>
  <div v-loading="parent.listLoading">
    <slot name="header"></slot>
    <div class="header resizeHeight">
      <Kanban
        v-if="parent.listData && parent.listData.length > 0"
        :id="`kanban-work_issue-list`"
        :board-object="{ id: 1, is_closed: false, name: 'Active' }"
        :dimension="'version'"
        :disabled="true"
        :from-wbs="true"
        :list="parent.listData"
        :status="status"
        class="kanban"
        from-tab="issue-list"
        @contextmenu="handleDrawerMenu"
        @relationIssueId="parent.handleClick($event)"
        @update="parent.loadDataAfterSetIssue"
      />
      <el-empty v-else :description="$t('general.NoData')" :image-size="100" />
    </div>
    <el-drawer
      v-loading="parent.listLoading"
      :title="`#${contextMenu.row.id} - ${contextMenu.row.subject}`"
      :visible.sync="contextMenu.visible"
      class="drawer"
      destroy-on-close
      direction="btt"
      size="auto"
    >
      <DrawerMenu
        :key="drawerKey"
        ref="contextmenu"
        :filter-column-options="parent.filterOptions"
        :row="contextMenu.row"
        @update="parent.loadData"
        @update-row="getContextRow"
      />
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Kanban from '@shared/views/Project/IssueBoards/components/Kanban'
import ContextMenu from '@/mixins/ContextMenu'
import CancelRequest from '@/mixins/CancelRequest'

export default {
  name: 'MyWorkMobile',
  components: {
    Kanban,
    DrawerMenu: () => import('@/components/Issue/DrawerMenu')
  },
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
  ::v-deep .container {
    max-height: 80vh;
  }

  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }

  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    padding: 10px;
  }

  ::v-deep .el-drawer__body::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }

  ::v-deep .el-drawer__body {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
}
</style>
