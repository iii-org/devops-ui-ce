<template>
  <el-table
    ref="issueList"
    :data="parent.listData"
    fit
    highlight-current-row
    size="mini"
    row-key="id"
    :expand-row-keys="parent.expands"
    :tree-props="{ children: 'child' }"
    :row-class-name="parent.getRowClass"
    @cell-click="parent.handleClick"
    @expand-change="parent.getIssueFamilyData"
    @sort-change="parent.handleSortChange"
    @row-contextmenu="parent.handleContextMenu"
    @selection-change="parent.handleSelectionChange"
  >
    <el-table-column
      v-if="parent.userRole === 'QA'"
      type="selection"
      reserve-selection
      width="55"
    />
    <el-table-column
      type="expand"
      class-name="informationExpand"
    >
      <template slot-scope="{row}">
        <el-row v-if="row.showQuickAddIssue" class="add-issue">
          <QuickAddIssue
            :project-id="row.project.id"
            :visible.sync="row.showQuickAddIssue"
            :filter-conditions="parent.filterValue"
            :parent="row"
            :is-table="true"
            :sub-issue="true"
            @close="parent.closeQuickAddIssue(row)"
            @update="parent.loadDataAfterSetIssue"
          />
        </el-row>
        <IssueExpand
          :issue="row"
          @on-context-menu="parent.onContextMenu"
          @update="parent.loadDataAfterSetIssue"
        />
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('project') >= 0"
      :label="$t('Issue.project')"
      min-width="130"
      show-overflow-tooltip
      prop="project.id"
      sortable="custom"
    >
      <template
        v-if="scope.row.project"
        slot-scope="scope"
      >
        <span>{{ scope.row.project.display }}</span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('tracker') >= 0"
      :label="$t('general.Type')"
      width="150"
      prop="tracker"
      sortable="custom"
    >
      <template slot-scope="{row}">
        <Tracker
          v-if="row.tracker.name"
          :name="$t(`Issue.${row.tracker.name}`)"
          :type="row.tracker.name"
        />
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('name') >= 0"
      :label="$t('Issue.Id')"
      min-width="280"
      show-overflow-tooltip
      prop="id"
      sortable="custom"
    >
      <template slot-scope="scope">
        <span style="display:flex;">
          <div
            class="text-success mr-2"
            style="display:flex; align-items:center;"
          >
            #{{ scope.row.id }}
          </div>
          <div class="truncate">
            <template v-if="scope.row.tags.length > 0">
              <el-tag
                v-for="item in scope.row.tags"
                :key="item.id"
                size="mini"
                class="mr-1"
              >
                [{{ item.name }}]
              </el-tag>
              <br>
            </template>
            {{ scope.row.name }}
          </div>
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('priority') >= 0"
      align="center"
      :label="$t('Issue.Priority')"
      width="110"
      prop="priority"
      sortable="custom"
    >
      <template slot-scope="{row}">
        <Priority
          v-if="row.priority.name"
          :name="$t(`Issue.${row.priority.name}`)"
          :type="row.priority.name"
        />
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('status') >= 0"
      align="center"
      :label="$t('general.Status')"
      width="120"
      prop="status"
      sortable="custom"
    >
      <template slot-scope="{row}">
        <Status
          v-if="row.status.name"
          :name="$t(`Issue.${row.status.name}`)"
          :type="row.status.name"
        />
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('assigned_to') >= 0"
      align="center"
      :label="$t('Issue.Assignee')"
      min-width="180"
      prop="assigned_to"
      sortable="custom"
      show-overflow-tooltip
    >
      <template
        v-if="scope.row.assigned_to"
        slot-scope="scope"
      >
        <span>
          {{ scope.row.assigned_to.name }}
        </span>
        <span v-if="scope.row.assigned_to.login">
          ({{ scope.row.assigned_to.login }})
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('fixed_version') >= 0"
      align="center"
      :label="$t('Issue.fixed_version')"
      min-width="140"
      prop="fixed_version"
      sortable="custom"
      show-overflow-tooltip
    >
      <template
        v-if="scope.row.fixed_version"
        slot-scope="scope"
      >
        <span>
          {{ scope.row.fixed_version.name }}
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('StartDate') >= 0"
      align="center"
      :label="$t('Issue.StartDate')"
      min-width="120"
      prop="start_date"
      sortable="custom"
      show-overflow-tooltip
    >
      <template
        v-if="scope.row.start_date"
        slot-scope="scope"
      >
        <span>
          {{ scope.row.start_date }}
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('EndDate') >= 0"
      align="center"
      :label="$t('Issue.EndDate')"
      min-width="120"
      prop="due_date"
      sortable="custom"
      show-overflow-tooltip
    >
      <template
        v-if="scope.row.due_date"
        slot-scope="scope"
      >
        <span>
          {{ scope.row.due_date }}
        </span>
      </template>
    </el-table-column>
    <el-table-column
      v-if="parent.columns.indexOf('DoneRatio') >= 0"
      align="center"
      :label="$t('Issue.DoneRatio')"
      min-width="130"
      prop="done_ratio"
      sortable="custom"
      show-overflow-tooltip
    >
      <template
        v-if="scope.row.done_ratio"
        slot-scope="scope"
      >
        <span>
          {{ scope.row.done_ratio }}
        </span>
      </template>
    </el-table-column>
    <el-table-column
      type="action"
      width="50px"
    >
      <template slot-scope="{row}">
        <el-button
          class="action"
          type="text"
          icon="el-icon-more"
          @click.native.stop="parent.handleContextMenu(row, {}, $event)"
        />
      </template>
    </el-table-column>
    <template slot="empty">
      <el-empty :description="$t('general.NoData')" />
    </template>
  </el-table>
</template>

<script>
import {
  Priority,
  Status,
  Tracker,
  IssueExpand
} from '@/components/Issue'
import QuickAddIssue from '@shared/views/MyWork/components/QuickAddIssue'

export default {
  name: 'IssueTable',
  components: {
    Priority,
    Status,
    Tracker,
    IssueExpand,
    QuickAddIssue
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
  margin-left: 24px;
  margin-right: 29px;
  border: solid 1px #cbcbcb;
  border-radius: 4px;
  padding: 10px;
}
</style>
