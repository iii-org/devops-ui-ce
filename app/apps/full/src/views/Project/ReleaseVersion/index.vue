<template>
  <div class="app-container">
    <el-row>
      <el-col>
        <ProjectListSelector>
          <div slot="button">
            <el-button
              :type="state === 'STATE_INIT' ? 'success' : 'danger'"
              :icon="state === 'STATE_INIT' ? 'el-icon-goods' : 'el-icon-close'"
              :size="isMobile ? 'small' : 'medium'"
              @click="toggleCreateRelease"
            >
              <span v-if="!isMobile">
                {{ state === 'STATE_INIT' ?
                  $t('Release.startRelease') : $t('Release.stopRelease') }}
              </span>
            </el-button>
            <el-button
              type="primary"
              icon="el-icon-document"
              :size="isMobile ? 'small' : 'medium'"
              @click="toggleShowVersions"
            >
              <span v-if="!isMobile">{{ $t('Version.Manage') }}</span>
            </el-button>
          </div>
          <el-input
            v-model="keywords"
            :size="isMobile ? 'small' : 'medium'"
            :style="{ width: isMobile ? '100px' : '250px' }"
            :placeholder="$t('Project.SearchProjectNameOrId')"
            prefix-icon="el-icon-search"
          />
        </ProjectListSelector>
      </el-col>
    </el-row>
    <el-divider />
    <ReleaseTable
      v-if="state === 'STATE_INIT'"
      :keywords="keywords"
    />
    <CreateRelease
      v-else-if="state === 'STATE_CREATE_RELEASE'"
      :is-show-versions="isShowVersions"
      @toggleShowVersions="toggleShowVersions"
      @initState="state = 'STATE_INIT'"
    />
    <el-dialog
      :visible.sync="isShowVersions"
      :width="isMobile ? '95%' : '60%'"
      :top="isMobile ? '1vh' : '5vh'"
    >
      <ProjectVersions v-if="isShowVersions" :is-show-title="true" />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { ProjectListSelector } from '@/components'

const STATE_INIT = 0
const STATE_CREATE_RELEASE = 1

export default {
  name: 'ReleaseVersion',
  components: {
    ProjectListSelector,
    ReleaseTable: () => import('./ReleaseTable/index'),
    CreateRelease: () => import('./CreateRelease/index'),
    ProjectVersions: () => import('@/views/Plan/Settings/components/ProjectVersions')
  },
  data() {
    return {
      isCheckRelease: false,
      isShowVersions: false,
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
    }
  },
  methods: {
    toggleCreateRelease() {
      if (this.state === 'STATE_INIT') this.state = 'STATE_CREATE_RELEASE'
      else this.state = 'STATE_INIT'
    },
    toggleShowVersions() {
      this.isShowVersions = !this.isShowVersions
    }
  }
}

</script>
