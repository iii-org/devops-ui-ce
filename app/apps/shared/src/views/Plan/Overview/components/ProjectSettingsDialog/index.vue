<template>
  <el-tabs v-model="activeTab">
    <el-tab-pane :label="$t('ProjectSettingDialog.Information')" name="projectInformation">
      <ProjectInformation
        v-if="activeTab === 'projectInformation'"
        @handleCancel="handleCloseDialog"
      />
    </el-tab-pane>
    <el-tab-pane :label="$t('ProjectSettingDialog.Member')" name="projectMembers">
      <ProjectMembers v-if="activeTab === 'projectMembers'" />
    </el-tab-pane>
    <el-tab-pane :label="$t('ProjectSettingDialog.Version')" name="projectVersions">
      <ProjectVersions v-if="activeTab === 'projectVersions'" />
    </el-tab-pane>
    <el-tab-pane
      v-if="isSSO"
      :label="$t('ProjectSettingDialog.PipelineSettings')"
      name="advanceBranchSettings"
    >
      <AdvanceBranchSettings
        v-if="activeTab === 'advanceBranchSettings'"
        :is-project-settings-dialog="true"
      />
    </el-tab-pane>
    <el-tab-pane :label="$t('ProjectSettingDialog.AlertSettings')" name="alertSettings">
      <AlertSettings v-if="activeTab === 'alertSettings'" />
    </el-tab-pane>
    <el-tab-pane :label="$t('ProjectSettingDialog.TagSettings')" name="tagSettings">
      <TagSettings v-if="activeTab === 'tagSettings'" />
    </el-tab-pane>
    <el-tab-pane :label="`Slack ${$t('general.Notifications')}`" name="slackNotification">
      <SlackNotification
        v-if="activeTab === 'slackNotification'"
        @handleCancel="handleCloseDialog"
      />
    </el-tab-pane>
  </el-tabs>
</template>

<script>
export default {
  name: 'ProjectSettingsDialog',
  components: {
    ProjectInformation: () => import('./components/ProjectInformation'),
    ProjectMembers: () => import('@/views/Plan/Settings/components/ProjectMembers'),
    ProjectVersions: () => import('@/views/Plan/Settings/components/ProjectVersions'),
    AdvanceBranchSettings: () => import('@/views/Plan/Settings/components/AdvanceBranchSettings'),
    AlertSettings: () => import('@/views/Plan/Settings/components/AlertSettings'),
    TagSettings: () => import('@/views/Plan/Settings/components/TagSettings'),
    SlackNotification: () => import('./components/SlackNotification')
  },
  data() {
    return {
      activeTab: 'projectInformation'
    }
  },
  computed: {
    isSSO() {
      return process.env.VUE_APP_PROJECT === 'SSO'
    }
  },
  methods: {
    handleCloseDialog() {
      this.$emit('handleCloseDialog')
    }
  }
}
</script>
