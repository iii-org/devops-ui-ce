<template>
  <div>
    <el-row class="mb-4">
      <el-col :sm="24" :style="isMobile ? '' : 'text-align: right;'" :xs="24">
        <el-switch
          v-model="isToggle"
          :active-text="$t('general.Enable')"
          :disabled="disableSwitch || permission"
          :inactive-text="$t('general.Disable')"
          :size="isMobile ? 'small' : 'medium'"
          :style="isMobile ? '' : 'margin-right: 10px'"
          @change="toggleSwitch"
        />
        <el-button
          :disabled="!isToggle || permission"
          :size="isMobile ? 'small' : 'medium'"
          type="primary"
          @click="handleSave"
        >
          {{ $t('general.Save') }}
        </el-button>
      </el-col>
    </el-row>
    <div v-show="isToggle">
      <el-table
        :key="tableKey"
        ref="multipleTable"
        v-loading="listLoading"
        :data="tracker"
        :element-loading-text="$t('Loading')"
        border
        fit
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          :label="$t('ProjectSettings.Index')"
          align="center"
          type="index"
          width="100"
        />
        <el-table-column
          :label="$t('ProjectSettings.IssueType')"
          align="center"
        >
          <template slot-scope="scope">
            {{ $t(`Issue.${scope.row.name}`) }}
          </template>
        </el-table-column>
        <el-table-column
          :selectable="checkboxState"
          align="center"
          type="selection"
          width="200"
        />
      </el-table>
    </div>
    <div v-if="!isToggle" class="text-center">
      {{ $t('ProjectSettings.NotYetEnabled') }}
    </div>
  </div>
</template>

<script>
import {
  createIssueForceTracker,
  deleteIssueForceTracker,
  getIssueForceTracker,
  updateIssueForceTracker
} from '@/api_v2/issue'
import { mapGetters } from 'vuex'

export default {
  name: 'AlertSettings',
  data() {
    return {
      listLoading: false,
      disableSwitch: true,
      isToggle: false,
      alertList: [],
      originData: [],
      trackerList: [],
      newForceTrackerList: [],
      oldForceTrackerListId: [],
      tableKey: 0
    }
  },
  computed: {
    ...mapGetters(['tracker', 'selectedProject', 'userId', 'userRole']),
    permission() {
      if (
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      ) {
        return false
      } else if (this.selectedProject.owner_id === this.userId) return false
      else return true
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    selectedProject: {
      handler(val) {
        this.disableSwitch = val === -1
      },
      immediate: true
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.tableKey += 1
      this.$forceUpdate()
      const res = await getIssueForceTracker(this.selectedProject.id)
      this.isToggle = res.data.enable
      this.oldForceTrackerListId = res.data.need_fatherissue_trackers.map(
        (object) => object.id
      )
      const selected = this.tracker.filter((ob) =>
        this.oldForceTrackerListId.includes(ob.id)
      )
      this.toggleSelection(selected)
    },
    async toggleSwitch(bool) {
      this.listLoading = true
      if (bool) {
        await createIssueForceTracker(this.selectedProject.id)
          .then(async () => {
            await this.fetchData()
            this.showChangeMessage(bool)
          })
          .catch((err) => {
            this.listLoading = false
            return err
          })
      } else {
        await deleteIssueForceTracker(this.selectedProject.id)
          .then(async () => {
            await this.fetchData()
            this.showChangeMessage(bool)
          })
          .catch((err) => {
            this.listLoading = false
            return err
          })
      }
      this.listLoading = false
    },
    showChangeMessage(bool) {
      this.$message({
        title: this.$t('general.Success'),
        message: bool
          ? this.$t('ProjectSettings.EnableForceTracker')
          : this.$t('ProjectSettings.DisableForceTracker'),
        type: 'success'
      })
    },
    toggleSelection(rows) {
      if (this.$refs.multipleTable) {
        rows.forEach((row) => {
          this.$refs.multipleTable.toggleRowSelection(row)
        })
      }
    },
    async handleSelectionChange(val) {
      this.newForceTrackerList = val
    },
    async handleSave() {
      this.listLoading = true
      const newForceTrackerListId = this.newForceTrackerList.map(
        (object) => object.id
      )
      await updateIssueForceTracker(this.selectedProject.id, {
        need_fatherissue_trackers: newForceTrackerListId
      })
        .then(async () => {
          await this.fetchData()
          await this.showUpdateMessage()
        })
        .catch((err) => {
          this.listLoading = false
          return err
        })
      this.listLoading = false
    },
    showUpdateMessage() {
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('Notify.Updated'),
        type: 'success'
      })
    },
    checkboxState() {
      return !this.permission
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep input.el-input__inner {
  text-align: center;
}
</style>
