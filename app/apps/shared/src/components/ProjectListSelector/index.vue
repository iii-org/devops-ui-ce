<template>
  <div :class="isMobile ? '' : 'flex items-center justify-between'">
    <div :class="isMobile ? '' : 'mr-3'">
      <el-row align="middle" justify="start" type="flex">
        <span class="mr-2">
          <slot name="returnButton"></slot>
        </span>
        <el-col v-if="projectValue !== ''" class="star">
          <div
            v-if="projectInformation.is_starred"
            class="star-content"
            @click="setStar(projectValue, false)"
          >
            <em class="el-icon-star-on star-on"></em>
          </div>
          <div v-else class="star-content" @click="setStar(projectValue, true)">
            <em class="el-icon-star-off star-off"></em>
          </div>
        </el-col>
        <el-col :style="{ width: device === 'mobile' ? '100%' : 'auto' }">
          <el-tooltip
            :content="tooltipContent"
            :disabled="tooltipContent === ''"
            placement="top"
          >
            <el-select
              ref="selectProject"
              v-model="projectValue"
              :clearable="clearable"
              :filter-method="setFilter"
              :placeholder="$t('Project.SelectProject')"
              class="project"
              filterable
              popper-class="max-w-80"
              @blur="selectVisible = false"
              @change="setChange"
              @click.native="checkUnsavedChanges"
            >
              <template slot="prefix">
                <em class="el-icon-s-cooperation el-input__icon"></em>
              </template>
              <el-option-group
                v-for="group in categoryProjectList"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="item in group.options"
                  :key="item.id"
                  :label="item.display_name"
                  :value="item.id"
                />
              </el-option-group>
            </el-select>
          </el-tooltip>
        </el-col>
        <el-col v-if="showButton" class="more">
          <el-popover
            v-if="projectValue !== ''"
            placement="right"
            popper-class="rounded-xl"
          >
            <div class="more-popover">
              <div v-if="services.gitlab" class="item gitlab">
                <svg-icon class="text-xl" icon-class="gitlab" />
                <div class="sub-item">
                  <el-button
                    circle
                    icon="el-icon-copy-document"
                    size="mini"
                    @click="copyUrl(projectInformation.git_url)"
                  />
                  <a :href="projectInformation.git_url" target="_blank">
                    <el-button circle size="mini">
                      <em class="ri-external-link-line"></em>
                    </el-button>
                  </a>
                </div>
              </div>
              <el-link
                v-if="!isLite && services.harbor"
                :href="projectInformation.harbor_url"
                :underline="false"
                class="item"
                target="_blank"
              >
                <svg-icon class="text-xl" icon-class="harbor" />
              </el-link>
              <div class="item project-name">
                #{{ projectInformation.identifier }}
              </div>
            </div>
            <div slot="reference" class="more-btn">
              <em class="el-icon-more"></em>
            </div>
          </el-popover>
        </el-col>
        <el-col v-if="showButton" class="min-w-max max-w-max">
          <slot name="button"></slot>
        </el-col>
      </el-row>
    </div>
    <div v-if="showButton">
      <el-row align="middle" justify="end" type="flex">
        <slot></slot>
      </el-row>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { deleteStarProject, postStarProject } from '@/api_v3/projects'
import defaultSettings from '@/settings'

export default {
  name: 'ProjectListSelector',
  props: {
    projectId: {
      type: [Number, String],
      default: null
    },
    keepSelection: {
      type: Boolean,
      default: true
    },
    clearable: {
      type: Boolean,
      default: false
    },
    showButton: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      projectValue: '',
      selectVisible: false,
      toolbarVisible: false,
      categoryProjectList: [],
      defaultSettings
    }
  },
  computed: {
    ...mapGetters([
      'projectOptions',
      'selectedProject',
      'selectedProjectId',
      'device',
      'services'
    ]),
    projectInformation() {
      const item = this.projectOptions.find(
        (option) => option.id === this.projectValue
      )
      if (!item) return { display_name: this.$t('general.All') }
      return item
    },
    tooltipContent() {
      if (this.projectValue !== '') {
        const item = this.projectOptions.find(
          (option) => option.id === this.projectValue
        )
        if (item) return item.display_name
        else return ''
      } else return ''
    },
    isLite() {
      return this.defaultSettings.type === 'LITE'
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    projectId(value) {
      if (value) this.projectValue = value
    },
    selectedProjectId: {
      immediate: true,
      handler(val) {
        if (!this.keepSelection) return
        this.$nextTick(
          () => (this.projectValue = (!val || val) === -1 ? '' : val)
        )
        this.$parent.isConfirmLeave = false
      }
    }
  },
  mounted() {
    this.getCategoryProjectList()
    this.handleRouteParams()
  },
  methods: {
    ...mapActions('projects', ['setSelectedProject', 'getMyProjectOptions']),
    handleRouteParams() {
      if (!this.keepSelection) {
        this.handleMyWorkInitRoute()
        return
      }
      const routeProjectNameParam = this.$route.params.projectName
      if (!routeProjectNameParam) return
      const project = this.projectOptions.find(
        (option) => option.identifier === routeProjectNameParam
      )
      if (!project) {
        this.$router.replace({ name: '404' })
        return
      }
      this.setChange(project.id)
    },
    handleMyWorkInitRoute() {
      const storedProjectId = Number(sessionStorage.getItem('workProjectId'))
      if (storedProjectId) {
        this.$emit('update:project-id', storedProjectId)
      } else {
        this.$router.push({ name: 'MyWork' })
      }
    },
    showNoProjectWarning() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.NoProject'),
        type: 'warning'
      })
      this.listLoading = false
    },
    setFilter(value) {
      this.getCategoryProjectList()
      const keyword = value.toLowerCase()
      this.categoryProjectList = this.categoryProjectList.filter((item) => {
        item.options = item.options.filter((element) => {
          const { display_name, identifier } = element
          return (
            display_name.toString().toLowerCase().indexOf(keyword) > -1 ||
            identifier.toString().toLowerCase().indexOf(keyword) > -1
          )
        })
        return item.options.length > 0
      })
    },
    setChange(projectId) {
      if (this.keepSelection) {
        if (projectId || projectId !== '') {
          this.onProjectChange(projectId)
        }
        this.setNewRoute(projectId)
      } else {
        this.$emit('update:project-id', projectId)
      }
      this.selectVisible = false
    },
    setNewRoute() {
      this.$router.push({
        name: this.$route.name,
        params: { projectName: this.selectedProject.identifier },
        query: this.getQuery()
      })
    },
    getQuery() {
      const changeProject =
        this.$route.params.projectName !== this.selectedProject.identifier
      return changeProject ? {} : this.$route.query
    },
    onProjectChange(projectId) {
      this.setSelectedProject(
        this.projectOptions.find((elm) => elm.id === projectId) || { id: -1 }
      )
      localStorage.setItem('projectId', projectId)
      sessionStorage.setItem('workProjectId', projectId)
    },
    async setStar(id, star) {
      if (star) {
        await postStarProject(id)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
      } else {
        await deleteStarProject(id)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
      }
      await this.getMyProjectOptions()
      this.getCategoryProjectList()
    },
    getCategoryProjectList() {
      if (
        (this.selectedProjectId === -1 || !this.selectedProjectId) &&
        !this.clearable
      ) {
        this.showNoProjectWarning()
        return []
      }
      const filteredArray = this.projectOptions.filter((obj) => {
        return obj.is_locked !== true && obj.is_disabled !== true
      })
      const starred = filteredArray.filter((item) => item.is_starred)
      const projects = filteredArray.filter((item) => !item.is_starred)
      this.categoryProjectList = [
        {
          label: this.$t('Project.Starred'),
          options: starred
        },
        { options: projects }
      ]
    },
    copyUrl(text) {
      this.$copyText(text).then(
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Copied'),
          type: 'success'
        })
      )
    },
    async checkUnsavedChanges() {
      if (this.$parent.isConfirmLeave) return
      if (this.$parent.hasUnsavedChanges) {
        this.$refs.selectProject.blur()
        await this.$confirm(
          this.$t('Notify.UnSavedChanges'),
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }
        )
          .then(() => {
            this.$parent.isConfirmLeave = true
          })
          .catch()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

.star {
  @apply align-middle pr-2 min-w-max max-w-max;
  .star-content {
    @apply align-middle inline-block cursor-pointer;
    .star-on {
      @apply text-yellow-500 text-xl rounded-md;
    }

    .star-off {
      @apply text-xl text-gray-400;
    }
  }
}

.project {
  min-width: 250px !important;

  ::v-deep .el-input {
    input {
      @apply bg-gray-200 rounded-md font-semibold cursor-pointer text-black text-lg truncate;
    }

    .el-input__prefix {
      @apply text-lg text-black;
    }

    .el-select__caret {
      color: #000000;
    }
  }

  .clear-btn {
    @apply w-min h-full py-2 px-2 bg-gray-400 text-white rounded-md mr-2;
  }
}

.more {
  @apply align-middle p-2 min-w-max max-w-max;
  .more-btn {
    @apply align-middle cursor-pointer p-2 bg-gray-300 rounded-md;
  }
}

.more-popover {
  @apply align-middle;
  .item {
    @apply inline-block mr-3;
  }

  .gitlab {
    @apply p-1 bg-gray-200 rounded-md px-2 mr-2 align-middle;
    .sub-item {
      @apply inline-block;
    }
  }

  .project-name {
    @apply text-sm text-gray-400;
  }
}

@include tablet {
  .project {
    min-width: auto !important;
    @apply w-full;
  }
}
</style>
