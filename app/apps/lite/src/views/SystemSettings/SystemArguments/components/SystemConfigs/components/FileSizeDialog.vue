<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :title="$t('general.Edit') + $t('SystemConfigs.FileSize')"
    :width="isMobile ? '95%' : '60%'"
    destroy-on-close
    append-to-body
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <el-form
      ref="form"
      v-loading="isLoading"
      :model="form"
      :rules="rules"
    >
      <el-form-item prop="fileSize">
        <el-input
          v-model.number="form.fileSize"
          :placeholder="$t('Validation.Input',[$t('SystemConfigs.FileSize')])"
        >
          <template slot="prepend">
            {{ $t('SystemConfigs.FileSize') }}
          </template>
          <template slot="append">
            MB
          </template>
        </el-input>
      </el-form-item>
      <el-form-item class="text-right">
        <el-button
          class="button-secondary-reverse"
          :loading="isLoading"
          @click="handleClose"
        >
          {{ $t('general.Close') }}
        </el-button>
        <el-button
          type="primary"
          :loading="isLoading"
          @click="handleUpdateFileSize"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'FileSizeDialog',
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoading: false,
      form: {
        fileSize: 0
      },
      rules: {
        fileSize: [
          {
            type: 'number',
            required: true,
            message: this.$t('Validation.Input', [this.$t('Validation.Number')]),
            trigger: 'blur'
          },
          {
            type: 'number',
            min: 0,
            max: 100,
            message: this.$t('SystemConfigs.TypeBetween0And100'),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['fileSizeLimit', 'device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    ...mapActions('app', ['updateFileSize']),
    fetchData() {
      this.isLoading = true
      this.form.fileSize = Number(this.fileSizeLimit.replace(/\D/g, ''))
      this.isLoading = false
    },
    handleUpdateFileSize() {
      this.$refs['form'].validate(async(valid) => {
        if (!valid) return
        this.isLoading = true
        try {
          await this.updateFileSize({ upload_file_size: this.form.fileSize })
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.handleClose()
          this.$emit('update')
        } catch (error) {
          console.error(error)
        } finally {
          this.isLoading = false
        }
      })
    },
    handleClose() {
      this.$emit('update:dialogVisible', false)
    }
  }
}
</script>
