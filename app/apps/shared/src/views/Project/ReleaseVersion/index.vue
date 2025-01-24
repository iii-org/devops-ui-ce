<template>
  <div class="app-container">
    <el-row>
      <el-col>
        <ProjectListSelector>
          <div slot="button">
            <el-dropdown
              :size="isMobile ? 'small' : 'medium'"
              :type="state === 'STATE_INIT' ? 'success' : 'danger'"
              split-button
              @click="toggleCreateRelease"
              @command="handleCommand"
            >
              <span v-if="!isMobile">
                {{
                  state === 'STATE_INIT'
                    ? $t('Release.startRelease')
                    : $t('Release.stopRelease')
                }}
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  :disabled="state === 'STATE_CREATE_RELEASE'"
                  command="version"
                >
                  <em class="el-icon-document mr-1"></em>
                  <span>{{ $t('Version.Manage') }}</span>
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="hasWorkManagement"
                  :disabled="state === 'STATE_CREATE_RELEASE'"
                  command="work"
                >
                  <em class="ri-bubble-chart-line mr-1"></em>
                  <span>{{ $t('route.WorkManagement') }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <el-input
            v-model="keywords"
            :placeholder="$t('Project.SearchProjectNameOrId')"
            :size="isMobile ? 'small' : 'medium'"
            :style="{ width: isMobile ? '150px' : '200px' }"
            prefix-icon="el-icon-search"
          />
        </ProjectListSelector>
      </el-col>
    </el-row>
    <el-divider />
    <ReleaseTable v-if="state === 'STATE_INIT'" :keywords="keywords" />
    <CreateRelease
      v-else-if="state === 'STATE_CREATE_RELEASE'"
      :is-show-versions="isShowVersions"
      @initState="state = 'STATE_INIT'"
      @toggleShowVersions="toggleShowVersions"
    />
    <el-dialog
      :top="isMobile ? '1vh' : '5vh'"
      :visible.sync="isShowVersions"
      :width="isMobile ? '95%' : '80%'"
    >
      <ProjectVersions v-if="isShowVersions" :is-show-title="true" />
    </el-dialog>
    <el-dialog
      :top="isMobile ? '1vh' : '5vh'"
      :visible.sync="isShowWorks"
      :width="isMobile ? '95%' : '80%'"
    >
      <WorkManagement v-if="isShowWorks" :is-show-title="true" />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

const STATE_INIT = 0
const STATE_CREATE_RELEASE = 1

export default {
  name: 'ReleaseVersion',
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector'),
    ReleaseTable: () => import('./ReleaseTable/index'),
    CreateRelease: () => import('./CreateRelease/index'),
    ProjectVersions: () =>
      import('@/views/Plan/Settings/components/ProjectVersions'),
    WorkManagement: () => import('@/views/Activities/WorkManagement')
  },
  data() {
    return {
      isCheckRelease: false,
      isShowVersions: false,
      isShowWorks: false,
      state: 'STATE_INIT',
      STATE_INIT: STATE_INIT,
      STATE_CREATE_RELEASE: STATE_CREATE_RELEASE,
      keywords: ''
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    hasWorkManagement() {
      if (!import.meta.env.VITE_APP_HAS_WORK_MANAGEMENT) return false
      return (
        import.meta.env.VITE_APP_HAS_WORK_MANAGEMENT.toLowerCase() === 'true'
      )
    }
  },
  methods: {
    toggleCreateRelease() {
      if (this.state === 'STATE_INIT') this.state = 'STATE_CREATE_RELEASE'
      else this.state = 'STATE_INIT'
    },
    toggleShowVersions() {
      this.isShowVersions = !this.isShowVersions
    },
    toggleShowWorks() {
      this.isShowWorks = !this.isShowWorks
    },
    handleCommand(command) {
      switch (command) {
        case 'version':
          this.toggleShowVersions()
          break
        case 'work':
          this.toggleShowWorks()
      }
    }
  },
  render(h) {
    // Dynamically render the component only if it's loaded
    if (this.hasWorkManagement && this.components.WorkManagement) {
      return h(this.components.WorkManagement)
    }
    return h('div', 'Work Management is not available')
  }
}
</script>
