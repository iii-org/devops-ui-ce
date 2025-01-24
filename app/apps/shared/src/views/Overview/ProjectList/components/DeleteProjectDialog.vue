<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible.sync="showDialog"
    width="40%"
    @closed="onDialogClosedDelete"
  >
    <div slot="title">
      {{
        `${$t('general.Delete')} 「${deleteProjectObj.identifier}」 ${$t(
          'Project.Project'
        )}`
      }}
    </div>
    <p v-if="projectRelationList.length > 0" class="text-danger font-bold">
      {{
        $t('Project.deleteHasSonProjectText', [
          projectRelationList.map((item) => item.display_name)
        ])
      }}
    </p>
    <p class="text-danger">
      {{ $t('Project.deleteProjectConfirmText') }}
    </p>
    <p>
      <span>
        {{ $t('Project.PleaseType') }}
      </span>
      <span class="text-xl font-semibold text-danger mx-1">
        {{ deleteProjectObj.identifier }}
      </span>
      <span>
        {{ $t('Project.AndThen') }}
      </span>
    </p>
    <el-input
      v-model="confirmProjectName"
      :placeholder="`Please Input ${deleteProjectObj.identifier}`"
    />
    <span slot="footer" class="dialog-footer">
      <el-button
        id="dialog-btn-cancel"
        :loading="isLoading"
        @click="showDialog = false"
      >
        {{ $t('general.Cancel') }}
      </el-button>
      <el-button
        id="dialog-btn-delete"
        :loading="isLoading"
        type="danger"
        @click="handleDeleteModal"
      >
        {{ $t('general.Delete') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'DeleteProjectDialog',
  props: {
    deleteProjectObj: {
      type: Object,
      default: () => ({})
    },
    isForceDelete: {
      type: Boolean,
      default: false
    },
    projectRelationList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      showDialog: false,
      isLoading: false,
      confirmProjectName: ''
    }
  },
  methods: {
    ...mapActions('projects', ['deleteProject']),
    onDialogClosedDelete() {
      this.confirmProjectName = ''
    },
    async handleDeleteModal() {
      if (this.deleteProjectObj.identifier !== this.confirmProjectName) {
        this.showWarningMessage('Notify.WrongProjectName')
        return
      }

      try {
        this.isLoading = true
        await this.deleteProject({
          pId: this.deleteProjectObj.id,
          force: this.isForceDelete
        })
        this.showSuccessMessage('Notify.Deleted')
        this.finishProcess()
      } catch (err) {
        this.isLoading = false
        console.error(err)

        if (err.data?.error?.code === 400) {
          await this.handleForceDeleteConfirmation()
        }
      }
    },
    showWarningMessage(messageKey) {
      this.$message({
        message: this.$t(messageKey),
        type: 'warning'
      })
    },
    showSuccessMessage(messageKey) {
      this.$message({
        message: this.$t(messageKey),
        type: 'success'
      })
    },
    finishProcess() {
      this.$emit('update')
      this.showDialog = false
      this.isLoading = false
    },
    async handleForceDeleteConfirmation() {
      try {
        await this.$confirm(
          this.$t('Notify.confirmDeleteSth', {
            name: this.projectRelationList
              .map((item) => item.display_name)
              .join(', ')
          }),
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Delete'),
            cancelButtonText: this.$t('general.Cancel'),
            confirmButtonClass: 'el-button--danger',
            type: 'error'
          }
        )

        this.isLoading = true
        await this.deleteProject({ pId: this.deleteProjectObj.id, force: true })
        this.showSuccessMessage('Notify.Deleted')
        this.finishProcess()
      } catch (err) {
        console.error(err)
        this.isLoading = false
      }
    }
  }
}
</script>
