<template>
  <div>
    <el-table
      v-if="spentHoursList.length > 0"
      :data="spentHoursList"
      :row-class-name="getRowClass"
      :show-header="false"
      class="spent-table"
      stripe
      style="width: 100%"
    >
      <el-table-column type="expand">
        <template slot-scope="props">
          <el-card class="comments" shadow="never">
            <div class="text-xs text-gray-500">
              {{ props.row.comments }}
            </div>
          </el-card>
        </template>
      </el-table-column>
      <el-table-column label="Activity" min-width="160" prop="activity_id">
        <template slot-scope="scope">
          <div class="font-bold text-sm">
            {{ getActivityName(scope.row.activity_id) }}
          </div>
          <div class="text-xs text-gray-500">
            {{ getHumanizeTime(scope.row.created_on) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Spent Hours" min-width="80" prop="hours">
        <template slot-scope="scope">
          <em class="ri-time-line"></em>
          <span class="font-code">{{ getTimeFormat(scope.row.hours) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="User" min-width="100" prop="user_id">
        <template slot-scope="scope">
          <div v-if="scope.row.creator?.full_name">
            <em class="ri-user-3-line"></em>
            <span class="text-[13px]">{{ scope.row.creator?.full_name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Actions" prop="actions">
        <template slot-scope="scope">
          <el-tooltip :content="$t('general.Edit')" placement="bottom">
            <em
              class="ri-edit-box-line success table-button"
              @click="handleEdit(scope.row)"
            ></em>
          </el-tooltip>
          <el-tooltip
            v-permission="[
              'sysadmin',
              'Organization Owner',
              'Project Manager',
              'QA'
            ]"
            :content="$t('general.Delete')"
            placement="bottom"
          >
            <el-popconfirm
              :cancel-button-text="$t('general.Cancel')"
              :confirm-button-text="$t('general.Delete')"
              :title="$t('Notify.confirmDelete')"
              icon="el-icon-info"
              popper-class="danger"
              @confirm="handleDelete(scope.row)"
            >
              <em
                slot="reference"
                class="ri-delete-bin-2-line danger table-button"
              ></em>
            </el-popconfirm>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <NoData v-else />
    <SpendingTimeDialog
      :activity-list="activityList"
      :is-spent-time-visible.sync="isSpentTimeVisible"
      :issue.sync="issue"
      :predefined-values="predefinedValues"
      @close="handleClose"
      @update="handleUpdate"
    />
  </div>
</template>

<script>
import { deleteTimeEntry, getIssueTimeEntries } from '@/api_v3/issues'
import dayjs from 'dayjs'
import SpendingTimeDialog from './SpentTimeDialog'

export default {
  name: 'IssueSpentHoursLog',
  components: {
    SpendingTimeDialog,
    NoData: () => import('@shared/components/NoData')
  },
  props: {
    issueId: {
      type: Number,
      default: null
    },
    activityList: {
      type: Array,
      default: () => []
    },
    issue: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      spentHoursList: [],
      isSpentTimeVisible: false,
      predefinedValues: {}
    }
  },
  watch: {
    issueId: {
      handler() {
        this.fetchSpentHoursList()
      }
    }
  },
  mounted() {
    this.fetchSpentHoursList()
  },
  methods: {
    async fetchSpentHoursList() {
      if (!this.issueId) return
      await getIssueTimeEntries(this.issueId).then((response) => {
        this.spentHoursList = response.data.sort(
          (a, b) => new Date(b.updated_on) - new Date(a.updated_on)
        )
      })
    },
    getActivityName(activityId) {
      const activity = this.activityList.find(
        (activity) => activity.id === activityId
      )
      return activity ? activity.name : ''
    },
    getTimeFormat(time) {
      return dayjs.duration(time, 'hour').format('HH:mm')
    },
    getHumanizeTime(time) {
      return dayjs(time).local().fromNow()
    },
    handleEdit(row) {
      this.predefinedValues = {
        activity_id: row.activity_id,
        comments: row.comments,
        hours: row.hours,
        id: row.id,
        spent_on: row.spent_on
      }
      this.isSpentTimeVisible = true
    },
    async handleDelete(row) {
      await deleteTimeEntry(row.id).then(() => {
        this.handleUpdate()
      })
    },
    handleClose() {
      this.predefinedValues = {}
    },
    handleUpdate() {
      this.fetchSpentHoursList()
      this.$emit('update-spent-time')
    },
    getRowClass({ row }) {
      return row.comments === '' ? 'hide-expand' : ''
    }
  }
}
</script>
<style lang="scss" scoped>
.spent-table {
  ::v-deep {
    .el-table__cell {
      border: none !important;
    }

    .el-table__expanded-cell {
      padding: 0 !important;
    }
  }

  &:before {
    background-color: transparent !important;
  }
}

::v-deep .hide-expand {
  > .el-table__expand-column {
    > .cell {
      display: none;
    }
  }
}

.comments {
  border: none;
  border-radius: 0 !important;
  box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;
}
</style>
