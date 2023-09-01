<template>
  <div class="app-container">
    <ProjectListSelector />
    <el-divider />
    <el-tabs
      v-model="tabActiveName"
      :tab-position="isMobile ? 'bottom' : 'top'"
      :class="isMobile ? 'mobile' : ''"
      :type="isMobile ? 'border-card' : 'card'"
      :stretch="isMobile"
      :before-leave="beforeLeave"
    >
      <el-tab-pane name="generalSettings">
        <span slot="label">
          <svg-icon v-if="isMobile" icon-class="settings" class="text-2xl" />
          <span v-else>{{ $t('ProjectSettings.GeneralSettings') }}</span>
        </span>
        <el-row :gutter="10">
          <el-col class="mb-4" :sm="24" :md="14" :lg="15">
            <el-card shadow="never">
              <el-collapse v-model="activeNames">
                <el-collapse-item name="ProjectVersions" :title="$t('Version.ProjectManage')">
                  <ProjectVersions />
                </el-collapse-item>
              </el-collapse>
            </el-card>
          </el-col>
          <el-col class="mb-4" :sm="24" :md="10" :lg="9">
            <el-card shadow="never">
              <el-collapse v-model="activeNames">
                <el-collapse-item name="PluginSettings" :title="$t('Plugin.Manage')">
                  <PipelineSettings />
                </el-collapse-item>
              </el-collapse>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col class="mb-4" :xs="24">
            <el-card shadow="never">
              <el-collapse v-model="activeNames">
                <el-collapse-item name="ProjectMembers" :title="$t('Member.Manage')">
                  <ProjectMembers />
                </el-collapse-item>
              </el-collapse>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane name="notifySettings">
        <span slot="label">
          <svg-icon v-if="isMobile" icon-class="notification-settings" class="text-2xl" />
          <span v-else>{{ $t('ProjectSettings.NotifySettings') }}</span>
        </span>
        <el-card>
          <AlertSettings ref="alertSettings" />
        </el-card>
      </el-tab-pane>
      <el-tab-pane name="tagSettings">
        <span slot="label">
          <svg-icon v-if="isMobile" icon-class="tag-settings" class="text-2xl" />
          <span v-else>{{ $t('ProjectSettings.TagSettings') }}</span>
        </span>
        <el-card>
          <TagSettings ref="tagSettings" />
        </el-card>
      </el-tab-pane>
      <el-tab-pane name="trackerSettings">
        <span slot="label">
          <svg-icon v-if="isMobile" icon-class="task-settings" class="text-2xl" />
          <span v-else>{{ $t('ProjectSettings.ParentIssueRequired') }}</span>
        </span>
        <el-card>
          <TrackerSettings ref="trackerSettings" />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { ProjectListSelector } from '@shared/components'
import {
  ProjectVersions,
  ProjectMembers,
  PipelineSettings
} from './components'

export default {
  name: 'ProjectSettings',
  components: {
    ProjectListSelector,
    ProjectVersions,
    PipelineSettings,
    ProjectMembers,
    AlertSettings: () => import ('@/views/Plan/Settings/components/AlertSettings'),
    TagSettings: () => import ('@/views/Plan/Settings/components/TagSettings'),
    TrackerSettings: () => import ('@/views/Plan/Settings/components/TrackerSettings')
  },
  data() {
    return {
      activeNames: [],
      tabActiveName: 'generalSettings',
      isConfirmLeave: false
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device']),
    hasUnsavedChanges() {
      return this.$refs.alertSettings.hasUnsavedChanges
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  beforeRouteLeave(to, from, next) {
    if (this.hasUnsavedChanges) {
      this.$confirm(this.$t('Notify.UnSavedChanges'), this.$t('general.Warning'), {
        confirmButtonText: this.$t('general.Confirm'),
        cancelButtonText: this.$t('general.Cancel'),
        type: 'warning'
      })
        .then(() => {
          next()
        })
        .catch(() => {
          next(false)
        })
    } else {
      next()
    }
  },
  watch: {
    activeNames(val) {
      localStorage.setItem('ProjectSettingsActiveNames', JSON.stringify(val))
    }
  },
  mounted() {
    this.getActiveCollapseItem()
  },
  methods: {
    getActiveCollapseItem() {
      const target = JSON.parse(localStorage.getItem('ProjectSettingsActiveNames'))
      this.activeNames = target === null ? ['ProjectMembers'] : target
    },
    showNoProjectWarning() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.NoProject'),
        type: 'warning'
      })
    },
    async fetchData() {
      if (this.selectedProjectId === -1) {
        this.showNoProjectWarning()
        return []
      }
    },
    beforeLeave() {
      if (this.isConfirmLeave) return true
      if (this.hasUnsavedChanges) return this.showLeaveMessage()
    },
    /*
      if return false or reject(), then it will prevent switching
      return true or resolve() on the contrary
      suggested to return reject() or resolve() because it will sometimes invalid when returned true or false
    */
    showLeaveMessage() {
      return new Promise((resolve, reject) => {
        return this.$confirm(this.$t('Notify.UnSavedChanges'), this.$t('general.Warning'), {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        })
          .then(() => {
            this.isConfirmLeave = true
            return resolve()
          })
          .catch(() => {
            return reject()
          })
          .finally(() => {
            return reject()
          })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
::v-deep .el-collapse-item__header {
  font-size: 1.125rem;
}
::v-deep .el-tabs--card>.el-tabs__header .el-tabs__item.is-active {
  background: #e4ecf7 ;
  color: #3e3f41;
  border-top: 5px solid #3e3f41;
  border-bottom-color: #e4ecf7 ;
  height: 45px;
}
::v-deep .el-tabs--card>.el-tabs__header .el-tabs__item {
  background: #3e3f41;
  color: #e4ecf7 ;
  border-radius: 5px;
  width:250px;
  &:hover {
    color: $linkTextColor;
  }
}
::v-deep .el-tabs__content {
  background: #e4ecf7 ;
  border-radius: 3px;
}
::v-deep .el-tabs__header {
  margin: 0;
}
::v-deep .el-tab-pane {
  margin: 15px;
  background: #e4ecf7 ;
}
.mobile {
  ::v-deep .el-tabs__content {
    height: auto;
    background: #F5F7FA ;
    padding: 0 0 60px 0;
  }
  ::v-deep .el-tab-pane {
    height: auto;
    margin: 10px 5px;
    background: #F5F7FA ;
  }
  ::v-deep .el-tabs__header {
    position: fixed;
    bottom: 0px;
    left: 0px;
    z-index: 1000;
    width: 100%;
    padding: 0;
  }
  ::v-deep .el-tabs__item{
    padding: 0 12px !important;
    height: 50px;
  }
  ::v-deep .svg-icon {
    vertical-align: middle;
  }
  ::v-deep .el-card__body {
    padding: 10px;
  }
  ::v-deep .el-card__body .el-divider--horizontal {
    width: 100%;
    margin: 10px 0;
  }
}
</style>
