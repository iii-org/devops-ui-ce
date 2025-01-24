<template>
  <el-dialog
    :visible="visible"
    :width="isMobile ? '90%' : '50%'"
    append-to-body
    destroy-on-close
    @close="handleClose"
  >
    <template #title>
      {{ isEdit ? $t('general.Edit') : $t('general.Add') }}
      {{ $t('Issue.SpentHours') }}
    </template>
    <el-form ref="spentForm" :model="form" :rules="rules" label-width="120px">
      <el-row>
        <el-col :md="12" :sm="24" class="mb-2">
          <el-form-item :label="$t('Issue.SpentHours')" prop="hours">
            <el-input-number
              v-model="form.hours"
              :min="0"
              :placeholder="$t('Issue.SpentHours')"
              class="w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24" class="mb-2">
          <el-form-item :label="$t('Issue.Activity')" prop="activity_id">
            <el-select
              v-model="form.activity_id"
              :placeholder="$t('Issue.Activity')"
              class="w-full"
            >
              <el-option
                v-for="item in activityList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="$t('Issue.Comments')" props="comments">
            <el-input
              v-model="form.comments"
              :placeholder="$t('Issue.Comments')"
              type="textarea"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">{{ $t('general.Cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">
        {{ $t('general.Save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { createTimeEntry, updateTimeEntry } from '@/api_v3/issues'
import { mapGetters } from 'vuex'

const defaultForm = () => ({
  hours: 0,
  activity_id: null,
  comments: ''
})

export default {
  name: 'SpentTimeDialog',
  props: {
    isSpentTimeVisible: {
      type: Boolean,
      default: false
    },
    issue: {
      type: Object,
      default: () => ({})
    },
    activityList: {
      type: Array,
      default: () => []
    },
    predefinedValues: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      form: defaultForm()
    }
  },
  computed: {
    ...mapGetters(['userId', 'device']),
    visible: {
      get() {
        return this.isSpentTimeVisible
      },
      set(val) {
        this.$emit('update:isSpentTimeVisible', val)
      }
    },
    rules() {
      return {
        hours: [
          {
            required: true,
            message: 'Please input spent time',
            trigger: 'blur'
          }
        ],
        activity_id: [
          {
            required: true,
            message: 'Please select activity',
            trigger: 'change'
          }
        ]
      }
    },
    isEdit() {
      return Object.keys(this.predefinedValues).length
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    isEdit(val) {
      if (val) this.assignPredefinedValues()
    }
  },
  methods: {
    assignPredefinedValues() {
      this.form = this.predefinedValues
    },
    async handleSave() {
      this.$refs.spentForm.validate(async (valid) => {
        if (valid) {
          let formData = this.form
          if (!this.isEdit) {
            formData = {
              ...formData,
              spent_on: new Date().toLocaleDateString('fr-CA'),
              user_id: this.userId
            }
          }
          formData.hours = String(formData.hours)
          const API = this.isEdit ? updateTimeEntry : createTimeEntry
          await API(this.isEdit ? this.form.id : this.issue.id, formData)
            .then(() => {
              this.$message.success('Spent time updated successfully')
              this.$emit('update')
              this.handleClose()
            })
            .catch((err) => {
              console.error(err)
            })
        }
      })
    },
    handleClose() {
      this.$refs.spentForm.resetFields()
      this.$refs.spentForm.clearValidate()
      this.$emit('close')
      this.form = defaultForm()
      this.visible = false
    }
  }
}
</script>
