<template>
  <div v-loading.sync="isLoading" :class="isMobile ? '' : 'container'">
    <div class="flex justify-between">
      <div :class="isMobile ? 'text-xl' : 'text-2xl'">{{ $t('System.RedmineMail') }}</div>
      <div class="text-right">
        <el-switch
          v-model="redmineMailForm.active"
          :active-text="$t('general.Enable')"
          :inactive-text="$t('general.Disable')"
          @change="confirm(false)"
        />
        <el-button
          v-if="!redmineMailForm.active"
          class="buttonSecondary"
          :size="isMobile ? 'small' : 'medium'"
          @click="onUpdate(true)"
        >
          {{ $t('general.TemporarySave') }}
        </el-button>
        <el-button
          v-else
          class="ml-3 buttonSecondary"
          :size="isMobile ? 'small' : 'medium'"
          @click="confirm(true)"
        >
          {{ $t('general.Modify') }}
        </el-button>
      </div>
    </div>
    <el-form
      ref="redmineMailForm"
      :model="redmineMailForm"
      :rules="redmineMailRules"
      label-width="100px"
      class="demo-ruleForm"
      label-position="top"
    >
      <el-row :gutter="10">
        <el-col :span="24" :sm="12" :md="7" :lg="7">
          <el-form-item label="User Name">
            <el-input
              v-model="redmineMailForm.smtp_settings.smtp_user"
              :disabled="isAuthenticationEmpty"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24" :sm="12" :md="7" :lg="7">
          <el-form-item label="Password">
            <el-input
              v-model="redmineMailForm.smtp_settings.smtp_password"
              :disabled="isAuthenticationEmpty"
              show-password
            />
          </el-form-item>
        </el-col>
        <el-col :span="24" :sm="12" :md="5" :lg="6">
          <el-form-item label="Domain">
            <el-input v-model="redmineMailForm.smtp_settings.smtp_host" />
          </el-form-item>
        </el-col>
        <el-col :span="24" :sm="12" :md="5" :lg="4">
          <el-form-item label="Authentication">
            <el-select
              v-model="redmineMailForm.smtp_settings.auth"
              :placeholder="$t('RuleMsg.PleaseSelect')"
              style="width: 100%"
            >
              <el-option
                v-for="item in authenticationOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24" :sm="12" :md="7" :lg="7">
          <el-form-item label="Delivery Method">
            <el-input value=":stmp" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="24" :sm="12" :md="5" :lg="4">
          <el-form-item
            label="Port"
            prop="smtp_settings.smtp_port"
            :placeholder="$t('general.PleaseInput')"
          >
            <el-input v-model="redmineMailForm.smtp_settings.smtp_port" />
          </el-form-item>
        </el-col>
        <el-col :span="24" :sm="12" :md="12" :lg="13">
          <el-form-item
            label="Emission Email Address"
            prop="emission_email_address"
          >
            <el-input v-model="redmineMailForm.emission_email_address" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="Starttls Auto">
            <el-radio-group v-model="redmineMailForm.smtp_settings.smtp_protocol">
              <el-radio label="tls" border />
              <el-radio label="ssl" border />
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div :style="getStyle('danger')" class="text-sm">
      {{ $t('RedmineMail.Warning') }}
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getUserRedmineMailProfile, editUserRedmineMailProfile } from '@/api/redmineMail'
import { BasicData } from '@/mixins'
import variables from '@/styles/theme/variables.scss'

const defaultFormData = () => ({
  smtp_settings: {
    smtp_user: '',
    smtp_password: '',
    auth: 'login',
    smtp_host: '',
    smtp_port: '',
    smtp_protocol: ''
  },
  emission_email_address: '',
  active: false
})

export default {
  name: 'RedmineMail',
  mixins: [BasicData],
  data() {
    return {
      deliveryMethodOptions: [
        { value: ':smtp', label: ':smtp' },
        { value: ':semdmail', label: ':sendmail' }
      ],
      authenticationOptions: [
        { value: '', label: '' },
        { value: 'login', label: 'login' },
        { value: 'plain', label: 'plain' },
        { value: 'cram_md5', label: 'cram_md5' }
      ],
      redmineMailForm: defaultFormData(),
      redmineMailRules: {
        'smtp_settings.smtp_port': [
          { required: true, message: 'Please input port.', trigger: 'change' }
        ]
      },
      isLoading: false,
      stopUpdateActive: false,
      timer: null
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    isAuthenticationEmpty() {
      return this.redmineMailForm.smtp_settings.auth === ''
    }
  },
  beforeDestroy() {
    this.clearTimer()
  },
  methods: {
    async fetchData() {
      await getUserRedmineMailProfile().then((res) => {
        if (Object.keys(res.data).length > 0) this.redmineMailForm = res.data
      })
    },
    filterEmpty(data) {
      if (!data) return
      const arr = ['smtp_user', 'smtp_password']
      Object.keys(data).forEach((item) => {
        if (typeof data[item] === 'object') this.filterEmpty(data[item])
        if (arr.includes(item) && data[item] === '') delete data[item]
      })
    },
    checkData() {
      const res = this.redmineMailForm
      if (this.isAuthenticationEmpty) {
        delete res.smtp_settings.smtp_user
        delete res.smtp_settings.smtp_password
      }
      this.filterEmpty(res)
      return res
    },
    /**
     * @param isModify - means if you click the "Modify" button
     */
    confirm(isModify) {
      this.$confirm(
        this.$t('Notify.RedmineMailConfirmWarning'),
        this.$t('general.Warning'),
        {
          closeOnClickModal: false,
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel')
        }
      )
        .then(async () => {
          await this.onUpdate(false)
          this.stopUpdateActive = false
        })
        .catch((action) => {
          if (isModify) return
          if (action === 'cancel') {
            this.redmineMailForm.active = !this.redmineMailForm.active
            this.stopUpdateActive = true
          }
        })
    },
    /**
     * @param isTemporary - means if you click the "Temporary Save" button
     */
    async onUpdate(isTemporary) {
      this.$refs.redmineMailForm.validate(async valid => {
        if (!valid) return
        const data = this.getUpdateData(isTemporary)
        await this.fetchUserRedmineMailProfile(data)
      })
    },
    getUpdateData(isTemporary) {
      const data = {
        redmine_mail: { smtp_settings: this.checkData().smtp_settings },
        emission_email_address: this.checkData().emission_email_address
      }
      if (isTemporary) {
        this.$set(data, 'temp_save', isTemporary)
      } else {
        this.$set(data, 'active', this.redmineMailForm.active)
      }
      return data
    },
    async fetchUserRedmineMailProfile(data) {
      this.isLoading = true
      await editUserRedmineMailProfile(data)
        .then(() => {
          this.handleMessage(data)
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(async () => {
          this.isLoading = false
        })
    },
    handleMessage(data) {
      this.$message({
        message: this.$t('Notify.Updated'),
        type: 'success'
      })
    },
    clearTimer() {
      clearTimeout(this.timer)
      this.timer = null
    },
    getStyle(colorCode) {
      const color = variables[`${colorCode}`]
      return {
        color
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-form-item {
  &__label {
    font-size: 16px;
  }
}
.container {
  height: auto;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  border-radius: 4px;
  background-color: #FFF;
  overflow: hidden;
  color: #303133;
  -webkit-transition: .3s;
  transition: .3s;
}
</style>
