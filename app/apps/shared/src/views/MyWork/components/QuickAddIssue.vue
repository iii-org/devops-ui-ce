<template>
  <div>
    <el-row v-if="!isDrawer" v-show="visible">
      <div style="padding: 10px 5px; font-weight: bold">
        <span>{{ subIssue ? $t('Issue.AddSubIssue') : $t('Issue.AddIssue') }}: </span>
        <el-link
          :disabled="isLoading"
          class="link"
          :size="isTable ? 'small' : ''"
          @click="onAdvancedSettingsClick"
        >
          {{ $t('general.AdvancedSettings') }}
        </el-link>
      </div>
      <el-form
        ref="quickAddIssueForm"
        inline
        :model="formData"
        :rules="formRules"
      >
        <el-form-item prop="tracker_id">
          <el-select
            v-model="formData.tracker_id"
            :size="isTable ? 'small' : ''"
            :placeholder="$t('Issue.SelectType')"
          >
            <el-option
              v-for="option in trackerList"
              :key="option.id"
              :label="$t('Issue.' + option.name)"
              :value="option.id"
            >
              <Tracker
                :name="$t(`Issue.${option.name}`)"
                :type="option.name"
              />
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="name">
          <el-input
            v-model="formData.name"
            :size="isTable ? 'small' : ''"
            :placeholder="$t('Issue.name')"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            :type="isTable ? 'success' : 'primary'"
            :style="isTable ? 'padding: 9px 8px;' : ''"
            :size="isTable ? 'small' : 'medium'"
            :icon="isTable ? 'el-icon-check' : ''"
            :loading="isLoading"
            class="button-save"
            @click="onSaveClick"
          >
            <span v-if="!isTable">{{ $t('general.Save') }}</span>
          </el-button>
          <el-button
            v-if="isTable && showClose"
            :disabled="isLoading"
            style="padding: 9px 8px;"
            size="small"
            icon="el-icon-close"
            type="danger"
            @click="$emit('close')"
          />
        </el-form-item>
      </el-form>
    </el-row>
    <el-drawer
      v-else
      :title="$t('Issue.AddIssue')"
      :visible.sync="toggleDrawer"
      direction="btt"
      class="drawer"
      size="auto"
      destroy-on-close
    >
      <el-form
        ref="quickAddIssueForm"
        :model="formData"
        :rules="formRules"
        class="container"
      >
        <el-card shadow="never">
          <el-form-item prop="name">
            <div class="title">
              <span>
                <el-divider direction="vertical" />
                <span class="text">{{ $t('general.Name') }}</span>
              </span>
            </div>
            <el-input
              v-model="formData.name"
              size="small"
              :placeholder="$t('Issue.name')"
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
            <el-radio-group v-model="formData.tracker_id" size="small" class="radio-group">
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
          {{ $t('general.AdvancedSettings').replace('》', '') }}
        </el-link>
        <el-button
          type="primary"
          class="save"
          :loading="isLoading"
          @click="onSaveClick"
        >
          {{ $t('general.Save') }}
        </el-button>
      </el-form>
    </el-drawer>
    <el-dialog
      :visible.sync="showDialog"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      append-to-body
      :width="device === 'desktop' ? '50%' : '100%'"
      :top="device === 'desktop' ? '5px' : ''"
    >
      <template slot="title">
        <el-row slot="title" type="flex" align="middle">
          <el-col :md="24" :lg="8">
            <span class="text-title">
              {{ $t('Issue.AddIssue') }}
            </span>
          </el-col>
          <el-col :md="24" :lg="8" class="text-center">
            {{ $t('general.project_name') }} : {{ selectedProject.display }}
          </el-col>
        </el-row>
      </template>
      <AddIssue
        ref="addIssueDialog"
        :project-id="projectId"
        :parent-id="parent.id"
        :parent-name="parent.name"
        :prefill="formData"
        :save-data="handleIssueSave"
        import-from="list"
        :is-create="Object.keys(parent).length === 0"
        :tracker-list="trackerList"
        @loading="loadingUpdate"
        @add-topic-visible="closeDialog"
        @import="handleAdvancedImport"
      />
      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button
          class="buttonSecondaryReverse"
          @click="onDialogCancel"
        >
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button
          :loading="isLoading"
          class="buttonPrimary"
          @click="onDialogConfirm"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { addIssue } from '@/api/issue'
import { Tracker, AddIssue } from '@/components/Issue'

const getDefaultFormData = () => ({
  tracker_id: null,
  name: '',
  assigned_to_id: null,
  status_id: 1,
  priority_id: 3
})

export default {
  name: 'MyWorkQuickAddIssue',
  components: { Tracker, AddIssue },
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
    }
  },
  data() {
    return {
      formData: getDefaultFormData(),
      tracker_id: null,
      isLoading: false,
      showDialog: false,
      formRules: {
        name: [
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
    if (tracker && this.trackerList.map(a => a.id).includes(tracker)) {
      this.formData.tracker_id = tracker
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
        if (this.parent.hasOwnProperty('id')) this.$set(sendData, 'parent_id', this.parent.id)
        const formData = this.getFormData(sendData)
        this.handleIssueSave(formData)
      })
    },
    onAdvancedSettingsClick() {
      this.setFilterToForm()
      this.showDialog = true
    },
    setFilterToForm() {
      const { priority, status, tracker, fixed_version } = this.filterConditions
      if (tracker && !this.formData.tracker_id) this.formData.tracker_id = tracker
      if (priority) this.formData.priority_id = priority
      if (status) this.formData.status_id = status
      if (fixed_version) this.formData.fixed_version_id = fixed_version
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
      const assignedToId = data instanceof FormData
        ? Number(data.get('assigned_to_id'))
        : data.assigned_to_id
      this.isLoading = true
      await addIssue(data)
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
        assigned_to,
        fixed_version,
        name,
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
      this.formData.assigned_to_id = assigned_to ? assigned_to.id : ''
      this.formData.name = this.formData.name !== '' ? this.formData.name : name + ' (' + this.$t('Issue.Copy') + ')'
      this.formData.fixed_version_id = fixed_version ? fixed_version.id : ''
      this.formData.tracker_id = this.formData.tracker_id !== null ? this.formData.tracker_id : tracker.id
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
@import 'src/styles/theme/variables.scss';
@media only screen and (max-width: 768px) {
  ::v-deep .el-dialog__wrapper {
    -ms-overflow-style: none;  /* IE and Edge */
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
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .container {
    padding: 14px;
    max-width: 768px;
    max-height: 80vh;
    ::v-deep .el-divider {
      background-color: #EBEEF5;
    }
    ::v-deep .el-card__body, .el-main {
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
        -ms-overflow-style: none;  /* IE and Edge */
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

@media (min-width: 350px) {
  .settings { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 500px) {
  .settings { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 650px) {
  .settings { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 750px) {
  .settings { grid-template-columns: repeat(5, 1fr); }
}
</style>
