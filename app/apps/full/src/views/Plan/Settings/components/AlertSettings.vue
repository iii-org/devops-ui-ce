<template>
  <div class="app-container">
    <el-row>
      <el-col :xs="24" :sm="12" class="font-medium text-lg">{{ $t('ProjectSettings.IssueReminderFeature') }}</el-col>
      <el-col :xs="24" :sm="12" :style="isMobile ? '' : 'text-align: right;'">
        <el-switch
          v-model="isToggle"
          inactive-color="#ff4949"
          :style="isMobile ? '' : 'margin-right: 10px'"
          :size="isMobile ? 'small' : 'medium'"
          :disabled="disableSwitch"
          :active-text="$t('general.Enable')"
          :inactive-text="$t('general.Disable')"
          @change="toggleSwitch"
        />
        <el-button
          class="buttonPrimary"
          :size="isMobile ? 'small' : 'medium'"
          :disabled="!isToggle"
          @click="handleSave"
        >
          {{ $t('general.Save') }}
        </el-button>
      </el-col>
    </el-row>
    <el-divider />
    <el-table-responsive
      v-if="isToggle"
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      :data="listData"
      :columns="tableColumns"
      border
      fit
    >
      <template v-slot:condition="{row}">
        <span :style="isMobile ? 'white-space: normal; text-align: right; word-break: break-word;' : ''">
          <div v-if="row.condition === 'comming'">{{ $t('ProjectSettings.Comming') }}</div>
          <div v-else>{{ $t('ProjectSettings.Unchange') }}</div>
        </span>
      </template>
      <template v-slot:days="{row}">
        <el-input
          v-if="!row.disabled"
          v-model="row.days"
          type="text"
          :size="isMobile ? 'small' : 'medium'"
          :style="{ width: isMobile ? '100px' : 'auto' }"
        />
        <span v-else>{{ row.days }}</span>
      </template>
      <template v-slot:status="{row}">
        <el-tag :type="row.disabled ? 'warning' : 'success'" :size="isMobile ? 'small' : 'medium'">
          {{ row.disabled ? $t('general.Disable') : $t('general.Enable') }}
        </el-tag>
      </template>
      <template v-slot:actions="{row}">
        <el-tooltip
          placement="bottom"
          :content="!row.disabled ? $t('general.Disable') : $t('general.Enable')"
        >
          <em
            :class="row.disabled
              ? 'ri-record-circle-line finished operate-button'
              : 'ri-pause-circle-line danger operate-button'"
            @click="toggleUsage(row)"
          />
        </el-tooltip>
      </template>
    </el-table-responsive>
    <div v-else class="text-center">{{ $t('ProjectSettings.NotYetEnabled') }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { changeProjectAlertSettings, getAlertSettingsByProject, updateAlertSettingsByProject } from '@/api/alert'
import { BasicData } from '@/mixins'
import { ElTableResponsive } from '@/components'

export default {
  name: 'AlertSettings',
  components: { ElTableResponsive },
  mixins: [BasicData],
  data() {
    return {
      disableSwitch: true,
      isToggle: false,
      originData: []
    }
  },
  computed: {
    ...mapGetters(['device']),
    hasUnsavedChanges() {
      return this.isTableDataChanged(0) || this.isTableDataChanged(1)
    },
    isMobile() {
      return this.device === 'mobile'
    },
    tableColumns() {
      return [
        {
          label: this.$t('ProjectSettings.Index'),
          type: 'index',
          align: 'center',
          width: '80'
        },
        {
          label: this.$t('ProjectSettings.NotificationConditions'),
          prop: 'condition',
          align: 'center',
          slot: 'condition'
        },
        {
          label: this.$t('ProjectSettings.Days'),
          prop: 'days',
          align: 'center',
          slot: 'days'
        },
        {
          label: this.$t('ProjectSettings.Status'),
          prop: 'status',
          align: 'center',
          slot: 'status'
        },
        {
          label: this.$t('ProjectSettings.Actions'),
          align: 'center',
          width: '80',
          slot: 'actions'
        }
      ]
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
        .then(_ => {
          this.loadData()
          this.showChangeMessage(bool)
        })
        .catch(err => {
          this.listLoading = false
          return err
        })
    },
    showChangeMessage(bool) {
      this.$message({
        title: this.$t('general.Success'),
        message: bool ? this.$t('ProjectSettings.EnableMessage') : this.$t('ProjectSettings.DisableMessage'),
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
        .then(_ => {
          this.loadData()
          this.showUpdateMessage()
        })
        .catch(err => {
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
        if (this.originData[index][key] !== this.listData[index][key]) return true
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
::v-deep input.el-input__inner {
  text-align: center;
}
</style>
