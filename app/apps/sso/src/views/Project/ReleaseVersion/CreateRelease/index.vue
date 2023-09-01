<template>
  <div :class="isMobile ? 'mobile' : ''">
    <el-card>
      <el-steps
        slot="header"
        :active="stepActive"
        finish-status="success"
        :simple="!isMobile"
        :align-center="isMobile"
      >
        <el-step :title="$t('Release.IssueVersion')" />
        <el-step :title="$t('Release.ImageVersion')" />
        <el-step :title="$t('Release.ReleaseVersion')" />
      </el-steps>
      <section>
        <IssueVersion
          v-if="stepActive === 0"
          :release-data="releaseData"
          :is-show-versions="isShowVersions"
          @onNext="next"
          @initReleaseData="initData"
        >
          <template v-slot:description>
            <div class="notification">
              <span style="vertical-align: -webkit-baseline-middle;">
                {{ $t('Release.IssueVersionWarning1') }}
                <el-button type="text" size="mini" style="font-size: 13px;" @click="$emit('toggleShowVersions')">
                  {{ $t('Version.Manage') }}
                </el-button>
                {{ $t('Release.IssueVersionWarning2') }}
              </span>
            </div>
          </template>
        </IssueVersion>
        <ImageVersion
          v-else-if="stepActive === 1"
          :release-data="releaseData"
          :update-data="updateData"
          @onNext="next"
          @onBack="back"
        >
          <template v-slot:description>
            <div class="notification">
              <span>
                {{ $t('Release.ImageVersionWarning') }}
              </span>
            </div>
          </template>
        </ImageVersion>
        <PackageVersion
          v-else-if="stepActive === 2"
          :release-data="releaseData"
          :update-data="updateData"
          @onBack="back"
          @initState="initState"
        >
          <template v-slot:description>
            <div class="notification">
              <span>
                {{ $t('Release.ReleaseVersionWarning') }}
              </span>
            </div>
          </template>
        </PackageVersion>
      </section>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

/**
 * @summary for release data
 */
const releaseData = () => ({
  branch: '',
  commit: '',
  extra_image_path: '', // only for extra image path
  forced: true,
  main: '', // main version
  note: '',
  versions: []
})

/**
 * @summary for those data which is not used by releasing
 */
const updateData = () => ({
  issues: [],
  projectVersions: [],
  image: ''
})

export default {
  name: 'CreateRelease',
  components: {
    IssueVersion: () => import('./IssueVersion/index'),
    ImageVersion: () => import('./ImageVersion/index'),
    PackageVersion: () => import('./PackageVersion')
  },
  props: {
    isShowVersions: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      stepActive: 0,
      releaseData: releaseData(),
      updateData: updateData()
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    selectedProjectId() {
      this.stepActive = 0
    }
  },
  methods: {
    setData(releaseData, updateData) {
      this.handleSetData(releaseData, 'releaseData')
      if (Object.keys(updateData).length > 0) this.handleSetData(updateData, 'updateData')
    },
    initData() {
      this.setData(releaseData(), updateData())
    },
    next(releaseData, updateData) {
      this.setData(releaseData, updateData)
      this.stepActive += 1
    },
    back(releaseData, updateData) {
      this.setData(releaseData, updateData)
      this.stepActive -= 1
    },
    initState() {
      this.$emit('initState')
    },
    handleSetData(data, key) {
      Object.keys(data).forEach((item) => {
        this[key][item] = data[item]
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile {
  ::v-deep .el-card__body{
    padding: 10px;
  }
  ::v-deep .step-card {
    width: 100%;
  }
  ::v-deep .form_item {
    padding: 5px;
  }
  ::v-deep .el-step__title {
    line-height: 22px;
  }
}
</style>
