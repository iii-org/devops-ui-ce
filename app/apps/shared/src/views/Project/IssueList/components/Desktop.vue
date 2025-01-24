<template>
  <el-table
    ref="issueList"
    :data="parent.isSearch ? parent.pagedData : parent.listData"
    :expand-row-keys="parent.expands"
    :row-class-name="parent.getRowClass"
    :tree-props="{ children: 'child' }"
    fit
    highlight-current-row
    row-key="id"
    size="mini"
    @cell-click="parent.handleClick"
    @expand-change="parent.getIssueFamilyData"
    @sort-change="parent.handleSortChange"
    @row-contextmenu="parent.handleContextMenu"
    @selection-change="parent.handleSelectionChange"
  >
    <el-table-column
      v-if="parent.userRole === 'QA'"
      reserve-selection
      type="selection"
      width="55"
    />
    <el-table-column class-name="informationExpand" type="expand">
      <template slot-scope="{ row }">
        <el-row v-if="row.showQuickAddIssue" class="add-issue">
          <QuickAddIssue
            :filter-conditions="parent.filterValue"
            :is-table="true"
            :parent="row"
            :project-id="row.project.id"
            :sub-issue="true"
            :visible.sync="row.showQuickAddIssue"
            @close="parent.closeQuickAddIssue(row)"
            @update="parent.loadDataAfterSetIssue"
          />
        </el-row>
        <IssueExpand
          :issue="row"
          class="mx-3"
          @update="parent.loadDataAfterSetIssue"
          @on-context-menu="parent.onContextMenu"
        />
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('tracker') >= 0"
      :label="$t('general.Type')"
      prop="tracker"
      sortable="custom"
      width="150"
    >
      <template slot-scope="{ row }">
        <Tracker
          v-if="row.tracker.name"
          :name="$t(`Issue.${row.tracker.name}`)"
          :type="row.tracker.name"
        />
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('subject') >= 0"
      :label="$t('Issue.Id')"
      min-width="280"
      prop="id"
      show-overflow-tooltip
      sortable="custom"
    >
      <template slot-scope="scope">
        <span style="display: flex">
          <div
            class="text-success mr-2"
            style="display: flex; align-items: center"
          >
            #{{ scope.row.id }}
          </div>
          <div class="truncate">
            <template v-if="scope.row.tags.length > 0">
              <el-tag
                v-for="item in scope.row.tags"
                :key="item.id"
                class="mr-1"
                size="mini"
              >
                [{{ item.name }}]
              </el-tag>
              <br />
            </template>
            {{ scope.row.subject }}
          </div>
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('priority') >= 0"
      :label="$t('Issue.Priority')"
      align="center"
      prop="priority"
      sortable="custom"
      width="110"
    >
      <template slot-scope="{ row }">
        <Priority
          v-if="row.priority.name"
          :name="$t(`Issue.${row.priority.name}`)"
          :type="row.priority.name"
        />
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('status') >= 0"
      :label="$t('general.Status')"
      align="center"
      prop="status"
      sortable="custom"
      width="120"
    >
      <template slot-scope="{ row }">
        <Status
          v-if="row.status.name"
          :name="$t(`Issue.${row.status.name}`)"
          :type="row.status.name"
        />
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('assigned') >= 0"
      :label="$t('Issue.Assignee')"
      align="center"
      min-width="180"
      prop="assigned"
      show-overflow-tooltip
      sortable="custom"
    >
      <template v-if="scope.row.assigned" slot-scope="scope">
        <span>
          {{ scope.row.assigned.full_name }}
        </span>
        <span v-if="scope.row.assigned.username">
          ({{ scope.row.assigned.username }})
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('version') >= 0"
      :label="$t('Issue.version')"
      align="center"
      min-width="140"
      prop="version"
      show-overflow-tooltip
      sortable="custom"
    >
      <template v-if="scope.row.version" slot-scope="scope">
        <span>
          {{ scope.row.version.name }}
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('StartDate') >= 0"
      :label="$t('Issue.StartDate')"
      align="center"
      min-width="120"
      prop="start_date"
      show-overflow-tooltip
      sortable="custom"
    >
      <template v-if="scope.row.start_date" slot-scope="scope">
        <span>
          {{ scope.row.start_date }}
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('EndDate') >= 0"
      :label="$t('Issue.EndDate')"
      align="center"
      min-width="120"
      prop="due_date"
      show-overflow-tooltip
      sortable="custom"
    >
      <template v-if="scope.row.due_date" slot-scope="scope">
        <span>
          {{ scope.row.due_date }}
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('done_ratio') >= 0"
      :label="$t('Issue.DoneRatio')"
      align="center"
      min-width="130"
      prop="done_ratio"
      show-overflow-tooltip
      sortable="custom"
    >
      <template v-if="scope.row.done_ratio" slot-scope="scope">
        <span>
          {{ scope.row.done_ratio }}
        </span>
      </template>
    </el-table-column>
    <el-table-column type="action" width="50px">
      <template slot-scope="{ row }">
        <el-button
          class="action"
          icon="el-icon-more"
          type="text"
          @click.native.stop="parent.handleContextMenu(row, {}, $event)"
        />
      </template>
    </el-table-column>
    <template
      v-if="
        parent.isSearch
          ? parent.pagedData.length === 0
          : parent.listData.length === 0
      "
      slot="empty"
    >
      <el-empty :description="$t('general.NoData')" />
    </template>
  </el-table>
</template>

<script>
export default {
  name: 'IssueTable',
  components: {
    Priority: () => import('@/components/Issue/Priority'),
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker'),
    IssueExpand: () => import('@/components/Issue/IssueExpand'),
    QuickAddIssue: () => import('@shared/views/MyWork/components/QuickAddIssue')
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    parent() {
      return this.$parent.$parent
    }
  },
  methods: {
    handleRowClick(row) {
      this.$emit('row-click', row)
    }
  }
}
</script>

<style lang="scss" scoped>
.add-issue {
  margin: 0 16px;
  border: solid 1px #cbcbcb;
  border-radius: 4px;
  padding: 8px 2px 0 2px;
}
</style>
