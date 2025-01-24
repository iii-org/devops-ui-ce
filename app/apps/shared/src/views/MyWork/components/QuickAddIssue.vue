<template>
  <div>
    <el-row v-if="!isDrawer" v-show="visible">
      <el-form
        ref="quickAddIssueForm"
        :model="formData"
        :rules="formRules"
        class="quick-add"
        inline
        size="small"
      >
        <el-form-item>
          <span class="font-bold text-sm" style="padding: 10px 0 10px 5px">
            {{ subIssue ? $t('Issue.AddSubIssue') : $t('Issue.AddIssue') }}:
          </span>
        </el-form-item>
        <el-form-item prop="tracker_id">
          <el-select
            v-model="formData.tracker_id"
            :placeholder="$t('Issue.SelectType')"
          >
            <el-option
              v-for="option in trackerList"
              :key="option.id"
              :label="$t('Issue.' + option.name)"
              :value="option.id"
            >
              <Tracker :name="$t(`Issue.${option.name}`)" :type="option.name" />
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="subject">
          <el-input
            v-model="formData.subject"
            :placeholder="$t('Issue.name')"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            :icon="isTable ? 'el-icon-check' : ''"
            :loading="isLoading"
            :style="isTable ? 'padding: 8px;' : ''"
            :type="isTable ? 'success' : 'primary'"
            class="button-save"
            size="small"
            @click="onSaveClick"
          >
            <span v-if="!isTable">{{ $t('general.Save') }}</span>
          </el-button>
          <el-button
            v-if="isTable && showClose"
            :disabled="isLoading"
            icon="el-icon-close"
            size="small"
            style="padding: 8px"
            type="danger"
            @click="$emit('close')"
          />
        </el-form-item>
        <el-form-item>
          <div style="min-width: 200px">
            <span class="expand-button" @click="onAdvancedSettingsClick">
              <em class="ri-settings-3-line expand-button-icon"></em>
              <span class="expand-button-text">{{
                $t('general.AdvancedSettings')
              }}</span>
            </span>
          </div>
        </el-form-item>
      </el-form>
    </el-row>
    <el-drawer
      v-else
      :title="$t('Issue.AddIssue')"
      :visible.sync="toggleDrawer"
      class="drawer"
      destroy-on-close
      direction="btt"
      size="auto"
    >
      <el-form
        ref="quickAddIssueForm"
        :model="formData"
        :rules="formRules"
        class="container"
      >
        <el-card shadow="never">
          <el-form-item prop="subject">
            <div class="title">
              <span>
                <el-divider direction="vertical" />
                <span class="text">{{ $t('general.Name') }}</span>
              </span>
            </div>
            <el-input
              v-model="formData.subject"
              :placeholder="$t('Issue.name')"
              size="small"
            />
          </el-form-item>
          <el-divider />
          <el-form-item prop="tracker_id">
            <div class="title">
              <span>
                <el-divider direction="vertical" />
                <span class="text">{{ $t('general.Type') }}</span>
              </span>
            </div>
            <el-radio-group
              v-model="formData.tracker_id"
              class="radio-group"
              size="small"
            >
              <el-col class="settings">
                <el-radio
                  v-for="option in trackerList"
                  :key="option.id"
                  :label="option.id"
                  :value="option.id"
                  border
                >
                  {{ $t(`Issue.${option.name}`) }}
                </el-radio>
              </el-col>
            </el-radio-group>
          </el-form-item>
        </el-card>
        <el-link
          :disabled="isLoading"
          class="link"
          @click="onAdvancedSettingsClick"
        >
          {{ $t('general.AdvancedSettings') }}
        </el-link>
        <el-button
          :loading="isLoading"
          class="save"
          type="primary"
          @click="onSaveClick"
        >
          {{ $t('general.Save') }}
        </el-button>
      </el-form>
    </el-drawer>
    <el-dialog
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      :top="device === 'desktop' ? '5px' : ''"
      :visible.sync="showDialog"
      :width="device === 'desktop' ? '50%' : '100%'"
      append-to-body
      destroy-on-close
    >
      <template slot="title">
        <el-row slot="title" align="middle" type="flex">
          <el-col :lg="8" :md="24">
            <span class="text-title">
              {{ $t('Issue.AddIssue') }}
            </span>
          </el-col>
          <el-col :lg="8" :md="24" class="text-center">
            {{ $t('general.project_name') }} :
            {{ selectedProject.display_name }}
          </el-col>
        </el-row>
      </template>
      <AddIssue
        ref="addIssueDialog"
        :is-create="Object.keys(parent).length === 0"
        :parent-id="parent.id"
        :parent-subject="parent.subject"
        :prefill="formData"
        :project-id="projectId"
        :save-data="handleIssueSave"
        :tracker-list="trackerList"
        import-from="list"
        @import="handleAdvancedImport"
        @loading="loadingUpdate"
        @add-topic-visible="closeDialog"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="onDialogCancel">
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button :loading="isLoading" type="primary" @click="onDialogConfirm">
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { createProjectIssue } from '@/api_v3/projects'
import { mapGetters } from 'vuex'

const getDefaultFormData = () => ({
  tracker_id: null,
  subject: '',
  assigned_id: null,
  status_id: 1,
  priority_id: 2
})

export default {
  name: 'MyWorkQuickAddIssue',
  components: {
    AddIssue: () => import('@/components/Issue/AddIssue'),
    Tracker: () => import('@/components/Issue/Tracker')
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: [Number, String],
      default: 0
    },
    filterConditions: {
      type: Object,
      default: () => ({})
    },
    parent: {
      type: Object,
      default: () => ({})
    },
    isTable: {
      type: Boolean,
      default: false
    },
    showClose: {
      type: Boolean,
      default: true
    },
    subIssue: {
      type: Boolean,
      default: false
    },
    isDrawer: {
      type: Boolean,
      default: false
    },
    fromTestPlan: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      formData: getDefaultFormData(),
      tracker_id: null,
      isLoading: false,
      showDialog: false,
      formRules: {
        subject: [
          {
            required: true,
            message: this.$t('Validation.Input', [this.$t('general.Name')]),
            trigger: 'blur'
          }
        ],
        tracker_id: [
          {
            required: true,
            message: this.$t('Validation.Select', [this.$t('general.Type')]),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters([
      'userId',
      'tracker',
      'strictTracker',
      'enableForceTracker',
      'selectedProject',
      'device'
    ]),
    trackerList() {
      if (this.enableForceTracker) return this.strictTracker
      return this.tracker
    },
    toggleDrawer: {
      get() {
        return this.visible
      },
      set(val) {
        if (val === false) this.formData = getDefaultFormData()
        this.$emit('update:visible', val)
      }
    }
  },
  watch: {
    projectId(val) {
      if (val === '') {
        this.$emit('update:visible', false)
      }
      this.formData = getDefaultFormData()
    }
  },
  mounted() {
    const { tracker } = this.filterConditions
    if (tracker && this.trackerList.map((a) => a.id).includes(tracker)) {
      this.formData.tracker_id = tracker
    }
    if (this.fromTestPlan) {
      this.formData.tracker_id = 8
    }
  },
  methods: {
    onSaveClick() {
      // this.formData.tracker_id = this.tracker_id
      this.$refs.quickAddIssueForm.validate(async (valid) => {
        if (!valid) return
        this.setFilterToForm()
        const sendData = Object.assign({}, this.formData, {
          project_id: this.projectId
        })
        if (this.parent.hasOwnProperty('id')) {
          this.$set(sendData, 'parent_id', this.parent.id)
        }
        this.handleIssueSave(sendData)
      })
    },
    onAdvancedSettingsClick() {
      this.setFilterToForm()
      this.showDialog = true
    },
    setFilterToForm() {
      const { priority, status, tracker, version } = this.filterConditions
      if (tracker && !this.formData.tracker_id) {
        this.formData.tracker_id = tracker
      }
      if (priority) this.formData.priority_id = priority
      if (status) this.formData.status_id = status
      if (version) this.formData.version_id = version
    },
    onDialogCancel() {
      this.$refs.addIssueDialog.handleClose()
    },
    onDialogConfirm() {
      this.$refs.addIssueDialog.handleSave()
    },
    loadingUpdate(value) {
      this.isLoading = value
    },
    async handleIssueSave(data) {
      const assignedToId =
        data instanceof FormData
          ? Number(data.get('assigned_id'))
          : data.assigned_id
      this.isLoading = true
      await createProjectIssue(data.project_id, data)
        .then(() => {
          // this.$message({
          //   title: this.$t('general.Success'),
          //   message: this.$t('Notify.Added'),
          //   type: 'success'
          // })
          this.formData = getDefaultFormData()
          this.$emit('update', assignedToId)
          this.device === 'mobile' && this.$emit('close')
        })
        .catch((error) => {
          return error
        })
      this.isLoading = false
    },
    getFormData(data) {
      const formData = new FormData()
      Object.keys(data).forEach((item) => {
        formData.append(item, data[item])
      })
      return formData
    },
    setFormData(data) {
      const {
        project,
        assigned,
        version,
        subject,
        tracker,
        status,
        priority,
        estimated_hours,
        done_ratio,
        start_date,
        due_date,
        description
      } = data
      // this.formData = {}
      this.formData.project_id = project ? project.id : ''
      this.formData.assigned_id = assigned ? assigned.id : ''
      this.formData.subject =
        this.formData.subject !== ''
          ? this.formData.subject
          : subject + ' (' + this.$t('Issue.Copy') + ')'
      this.formData.version_id = version ? version.id : ''
      this.formData.tracker_id =
        this.formData.tracker_id !== null
          ? this.formData.tracker_id
          : tracker.id
      this.formData.status_id = status.id
      this.formData.priority_id = priority.id
      this.formData.estimated_hours = estimated_hours
      this.formData.done_ratio = done_ratio
      this.formData.start_date = start_date === null ? '' : start_date
      this.formData.due_date = due_date === null ? '' : due_date
      this.formData.description = description === null ? '' : description
    },
    handleAdvancedImport() {
      this.setFormData(this.parent)
      this.$refs['addIssueDialog'].handleImport()
    },
    closeDialog() {
      this.showDialog = false
      this.device === 'mobile' && this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
@import 'src/styles/theme/mixin.scss';

@include tablet {
  ::v-deep .el-dialog__wrapper {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  ::v-deep .el-dialog__wrapper::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }
  ::v-deep .el-dialog {
    margin-bottom: 0;
    padding-bottom: 50px;
    border-radius: 0px !important;
  }
}

::v-deep .el-dialog__body {
  padding: 0 1rem;
}

.link {
  color: $linkTextColor !important;
}

.expand-button {
  background-color: $buttonPrimary;
  cursor: pointer;
  color: white;
  text-decoration: none;
  border-radius: 50px;
  height: 32.2px;
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  width: auto;
  max-width: 32.2px;
  -webkit-transition: max-width 0.5s;
  transition: max-width 0.5s;
  vertical-align: middle;

  &:hover {
    max-width: 300px;
  }

  &.cursor-not-allowed {
    background-color: gray;
  }

  &-icon {
    font-size: 20px;
    margin-right: 4px;
    padding: 0px 5.5px;
    display: flex;
    align-items: center;
  }

  &-text {
    white-space: nowrap;
    padding-right: 16px;
  }
}

.drawer {
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }

  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    padding: 10px;
  }

  ::v-deep .el-drawer__body::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }

  ::v-deep .el-drawer__body {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .container {
    padding: 14px;
    max-width: 768px;
    max-height: 80vh;

    ::v-deep .el-divider {
      background-color: #ebeef5;
    }

    ::v-deep .el-card__body,
    .el-main {
      padding: 10px;
    }

    .title {
      margin-bottom: 10px;

      ::v-deep .el-divider--vertical {
        width: 6px;
        margin: 0;
        border-radius: 3px 0 0 3px;
        height: 18px;
        background-color: $warning !important;
      }

      ::v-deep .el-tag--small {
        height: 25px;
      }

      ::v-deep .el-button--small {
        padding: 5px 10px;
      }

      ::v-deep .el-checkbox__label {
        font-size: 12px;
      }

      .text {
        font-size: 15px;
        font-weight: bold;
        color: #72767b;
        vertical-align: middle;
      }
    }

    .radio-group {
      display: grid;

      .settings::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera*/
      }

      .settings {
        max-width: 768px;
        margin: 0 auto;
        display: grid;
        gap: 6px;
        overflow-x: auto;
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
        ::v-deep .el-radio.is-bordered {
          margin-left: 0;
          margin-right: 0;
          // width: 140px;
        }

        ::v-deep .el-radio__label {
          padding-left: 2px;
        }
      }
    }

    .advance {
      color: $buttonPrimary;
      margin-top: 12px;
      text-decoration-line: underline;
    }

    .save {
      margin-top: 12px;
      width: 100%;
    }
  }
}

.quick-add {
  border-radius: 10px;
  padding: 20px 10px 0 10px;
  margin-bottom: 10px;
  background-color: white;
}

@include mobile {
  .settings {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include tablet-1 {
  .settings {
    grid-template-columns: repeat(3, 1fr);
  }
}

@include tablet-2 {
  .settings {
    grid-template-columns: repeat(4, 1fr);
  }
}

@include tablet-3 {
  .settings {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
