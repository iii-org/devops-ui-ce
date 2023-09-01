<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :title="$t('SystemConfigs.LoginTimeDurationSetting')"
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
      <el-form-item prop="timeout">
        <el-input
          v-model.number="form.timeout"
          :placeholder="$t('Validation.Input',[$t('SystemConfigs.DurationTime')])"
        >
          <template slot="prepend">
            {{ $t('SystemConfigs.DurationTime') }}
          </template>
          <template slot="append">
            {{ $t('SystemConfigs.Minutes') }}
          </template>
        </el-input>
      </el-form-item>
      <el-form-item class="text-right">
        <el-button
          class="buttonSecondaryReverse"
          @click="handleClose"
        >
          {{ $t('general.Close') }}
        </el-button>
        <el-button
          type="primary"
          @click="handleUpdateFileSize"
        >
          {{ $t('general.Confirm') }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  getKeycloakConfig,
  updateKeycloakConfig
} from '@/api_v2/systemParameter'

export default {
  name: 'TimeoutDialog',
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
        timeout: 0
      },
      rules: {
        timeout: [
          {
            type: 'number',
            required: true,
            message: this.$t('Validation.Input', [this.$t('Validation.Number')]),
            trigger: 'blur'
          },
          {
            min: 0,
            max: 1440,
            message: this.$t('SystemConfigs.DoNotExceed24Hours'),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.isLoading = true
      const keycloakConfig = await getKeycloakConfig({ config_keys: ['ssoSessionIdleTimeout'] })
      this.form.timeout = keycloakConfig.config_maps.ssoSessionIdleTimeout / 60
      this.isLoading = false
    },
    handleUpdateFileSize() {
      this.$refs['form'].validate(async(valid) => {
        if (!valid) return
        this.isLoading = true
        try {
          await updateKeycloakConfig({
            config_maps: {
              ssoSessionIdleTimeout: this.form.timeout * 60
            }
          })
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
