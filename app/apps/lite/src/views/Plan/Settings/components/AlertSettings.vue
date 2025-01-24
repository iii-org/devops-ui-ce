<template>
  <div>
    <el-row class="mb-4">
      <el-col :sm="24" :style="isMobile ? '' : 'text-align: right;'" :xs="24">
        <el-switch
          v-model="isToggle"
          :active-text="$t('general.Enable')"
          :disabled="disableSwitch"
          :inactive-text="$t('general.Disable')"
          :size="isMobile ? 'small' : 'medium'"
          :style="isMobile ? '' : 'margin-right: 10px'"
          @change="toggleSwitch"
        />
        <el-button
          :disabled="!isToggle"
          :size="isMobile ? 'small' : 'medium'"
          type="primary"
          @click="handleSave"
        >
          {{ $t('general.Save') }}
        </el-button>
      </el-col>
    </el-row>
    <el-table
      v-if="isToggle"
      v-loading="listLoading"
      :data="listData"
      :element-loading-text="$t('Loading')"
      border
      fit
    >
      <el-table-column
        :label="$t('ProjectSettings.Index')"
        align="center"
        type="index"
        width="100"
      />
      <el-table-column
        :label="$t('ProjectSettings.NotificationConditions')"
        align="center"
      >
        <template slot-scope="scope">
          <span v-if="scope.row.condition === 'comming'">{{
            $t('ProjectSettings.Comming')
          }}</span>
          <span v-else>{{ $t('ProjectSettings.Unchange') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('ProjectSettings.Days')" align="center">
        <template slot-scope="scope">
          <el-input
            v-show="!scope.row.disabled"
            v-model="scope.row.days"
            type="text"
          />
          <span v-show="scope.row.disabled">{{ scope.row.days }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('ProjectSettings.Status')" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.disabled ? 'danger' : 'success'">
            {{
              scope.row.disabled ? $t('general.Disable') : $t('general.Enable')
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('ProjectSettings.Actions')" align="center">
        <template slot-scope="scope">
          <el-button size="mini" @click="toggleUsage(scope.row)">
            <div class="flex items-center">
              <span
                :class="scope.row.disabled ? 'bg-success' : 'bg-danger'"
                class="dot"
              ></span>
              <span
                :class="scope.row.disabled ? 'text-success' : 'text-danger'"
                class="ml-2"
              >
                {{
                  !scope.row.disabled
                    ? $t('general.Disable')
                    : $t('general.Enable')
                }}
              </span>
            </div>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-else class="text-center">
      {{ $t('ProjectSettings.NotYetEnabled') }}
    </div>
  </div>
</template>

<script>
import {
  changeProjectAlertSettings,
  getAlertSettingsByProject,
  updateAlertSettingsByProject
} from '@/api/alert'
import BasicData from '@/mixins/BasicData'

export default {
  name: 'AlertSettings',
  mixins: [BasicData],
  data() {
    return {
      disableSwitch: true,
      isToggle: false,
      originData: []
    }
  },
  computed: {
    isMobile() {
      return this.device === 'mobile'
    },
    hasUnsavedChanges() {
      return this.isTableDataChanged(0) || this.isTableDataChanged(1)
    }
  },
  watch: {
    selectedProjectId: {
      handler(val) {
        this.disableSwitch = val === -1
      },
      immediate: true
    }
  },
  methods: {
    async fetchData() {
      const res = await getAlertSettingsByProject(this.selectedProjectId)
      if (res.data.length === 0) this.isToggle = false
      else {
        this.setOriginData(res.data.alert_list)
        this.isToggle = true
      }
      return res.data.alert_list
    },
    setOriginData(data) {
      this.originData = JSON.parse(JSON.stringify(data))
    },
    async toggleSwitch(bool) {
      const param = {}
      param.enable = bool
      this.listLoading = true
      await changeProjectAlertSettings(this.selectedProjectId, param)
        .then((_) => {
          this.loadData()
          this.showChangeMessage(bool)
        })
        .catch((err) => {
          this.listLoading = false
          return err
        })
    },
    showChangeMessage(bool) {
      this.$message({
        title: this.$t('general.Success'),
        message: bool
          ? this.$t('ProjectSettings.EnableMessage')
          : this.$t('ProjectSettings.DisableMessage'),
        type: 'success'
      })
    },
    handleSave() {
      this.handleUpdateAlertTable(0)
      this.handleUpdateAlertTable(1)
    },
    async handleUpdateAlertTable(index) {
      const params = {}
      const alertId = this.listData[index].id
      params.disabled = this.listData[index].disabled
      params.days = this.listData[index].days
      this.listLoading = true
      await updateAlertSettingsByProject(alertId, params)
        .then((_) => {
          this.loadData()
          this.showUpdateMessage()
        })
        .catch((err) => {
          this.listLoading = false
          return err
        })
    },
    showUpdateMessage() {
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('ProjectSettings.SuccessUpdateAlertSettings'),
        type: 'success'
      })
    },
    isTableDataChanged(index) {
      if (!this.listData) return false
      for (const key in this.listData[index]) {
        if (this.originData[index][key] !== this.listData[index][key]) { return true }
      }
      return false
    },
    toggleUsage(row) {
      row.disabled = !row.disabled
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-table {
    padding: 0 !important;
  }

  input.el-input__inner {
    text-align: center;
  }
}
</style>
