<template>
  <el-dialog
    :close-on-click-modal="false"
    :show-close="false"
    :visible.sync="relationDialog.visible"
    append-to-body
    width="80%"
  >
    <div slot="title">
      <el-row slot="title" align="middle" type="flex">
        <el-col :md="16" :xs="24">
          <span class="text-title">
            {{
              $t('general.Settings', {
                name: $t('Issue.' + relationDialog.target + 'Issue')
              })
            }}
          </span>
        </el-col>
        <el-col :md="8" :xs="24" class="text-right">
          <el-button type="primary" @click="handleCheckRelationIssueSave">
            {{ $t('general.Save') }}
          </el-button>
          <el-button @click="handleRelationDialogChange(relationDialog.target)">
            {{ $t('general.Close') }}
          </el-button>
        </el-col>
      </el-row>
    </div>
    <SettingRelationIssue
      v-if="relationDialog.visible"
      ref="settingRelationIssue"
      :row.sync="contextMenu.row"
      :target.sync="relationDialog.target"
      @updateFamily="(issues) => handleFamilyUpdate(issues)"
    />
  </el-dialog>
</template>

<script>
import { updateIssue } from '@/api_v3/issues'

export default {
  name: 'WBSIssueRelatedDialog',
  components: {
    SettingRelationIssue: () =>
      import('@shared/views/Project/IssueList/components/SettingRelationIssue')
  },
  props: {
    relationDialog: {
      type: Object,
      default: () => ({
        visible: false,
        tartget: 'Parent'
      })
    },
    contextMenu: {
      type: Object,
      default: () => ({
        visible: false,
        row: {}
      })
    }
  },
  methods: {
    handleCheckRelationIssueSave() {
      this.$refs.settingRelationIssue.$refs.issueForm.validate((valid) => {
        if (valid) {
          this.handleRelationIssueSave()
        }
      })
    },
    async handleRelationIssueSave() {
      try {
        const getSettingRelationIssue = this.$refs['settingRelationIssue']
        const updateApi = []
        if (getSettingRelationIssue.target === 'Parent') {
          const sendData = { parent_id: getSettingRelationIssue.form.parent_id }
          updateApi.push(updateIssue(getSettingRelationIssue.row.id, sendData))
        } else if (getSettingRelationIssue.target === 'Children') {
          const appendSendData = { parent_id: getSettingRelationIssue.row.id }
          const removeSendData = { parent_id: '' }
          getSettingRelationIssue.children['append'].forEach((item) => {
            updateApi.push(updateIssue(item, appendSendData))
          })
          getSettingRelationIssue.children['remove'].forEach((item) => {
            updateApi.push(updateIssue(item, removeSendData))
          })
        }
        await Promise.allSettled(updateApi)
        this.$emit('onRelationIssueUpdate', getSettingRelationIssue.target)
      } catch (e) {
        console.error(e)
      }
    },
    getFormData(data) {
      const formData = new FormData()
      Object.keys(data).forEach((item) => {
        formData.append(item, data[item])
      })
      return formData
    },
    handleRelationDialogChange(target) {
      this.$emit('toggleRelationDialog', target)
    },
    handleFamilyUpdate(issues) {
      this.$emit('onFamilyUpdate', issues)
    }
  }
}
</script>
