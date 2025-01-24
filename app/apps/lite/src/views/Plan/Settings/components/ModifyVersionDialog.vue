<template>
  <el-dialog
    :close-on-click-modal="false"
    :title="$t(`Version.${dialogStatusText}Version`)"
    :visible.sync="dialogVisible"
    :width="isMobile ? '95%' : '50%'"
    append-to-body
    top="3vh"
    @closed="onDialogClosed"
  >
    <el-form
      ref="versionForm"
      :model="form"
      :rules="formRules"
      label-position="top"
    >
      <el-form-item :label="$t('general.Name')" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item :label="$t('general.DueDate')" prop="effective_date">
        <el-date-picker
          v-model="form.effective_date"
          :placeholder="$t('Version.EndDate')"
          style="width: 100%"
          type="date"
          value-format="yyyy-MM-dd"
        />
      </el-form-item>
      <el-form-item :label="$t('general.Status')" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :label="'open'">{{ $t('Version.Open') }}</el-radio>
          <el-radio :label="'closed'">{{ $t('general.Close') }}</el-radio>
          <el-radio :label="'locked'">{{ $t('Version.Locked') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('general.Description')" prop="description">
        <el-input v-model="form.description" type="textarea" />
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">
        {{ $t('general.Cancel') }}
      </el-button>
      <el-button
        :loading="btnConfirmLoading"
        type="primary"
        @click="handleConfirm"
      >
        {{ $t('general.Confirm') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { createProjectVersion, updateProjectVersion } from '@/api_v3/projects'
import { mapGetters } from 'vuex'

const formTemplate = () => ({
  name: '',
  effective_date: '',
  status: 'open',
  description: ''
})

export default {
  name: 'ModifyVersionDialog',
  data() {
    return {
      dialogVisible: false,
      dialogStatus: 1,
      form: formTemplate(),
      formRules: {
        name: [
          {
            required: true,
            message: 'Please input name',
            trigger: 'blur'
          }
        ],
        effective_date: [
          {
            required: true,
            message: 'Please input effective date',
            trigger: 'blur'
          }
        ],
        status: [
          {
            required: true,
            message: 'Please select status',
            trigger: 'blur'
          }
        ]
      },
      btnConfirmLoading: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device']),
    dialogStatusText() {
      switch (this.dialogStatus) {
        case 1:
          return 'Add'
        case 2:
          return 'Edit'
        default:
          return 'Null'
      }
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    onDialogClosed() {
      this.$nextTick(() => {
        this.$refs['versionForm'].resetFields()
        this.form = formTemplate()
      })
    },
    async handleConfirm() {
      this.$refs['versionForm'].validate(async (valid) => {
        if (valid) {
          const data = this.form
          this.btnConfirmLoading = true
          if (this.dialogStatus === 1) {
            await createProjectVersion(this.selectedProject.id, data)
            this.$message({
              title: this.$t('general.Success'),
              message: this.$t('Notify.Added'),
              type: 'success'
            })
          } else {
            await updateProjectVersion(this.form.id, data)
            this.$message({
              title: this.$t('general.Success'),
              message: this.$t('Notify.Updated'),
              type: 'success'
            })
          }
          this.$emit('update')
          this.btnConfirmLoading = false
          this.dialogVisible = false
        }
      })
    }
  }
}
</script>
