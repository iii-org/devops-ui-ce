<template>
  <el-dialog
    :before-close="onDialogClosed"
    :close-on-click-modal="false"
    :loading="isLoading"
    :title="$t('Plugins.excalidraw.CreateBoard')"
    :visible.sync="dialogVisible"
    :width="isMobile ? '95%' : '50%'"
  >
    <ExcalidrawForm ref="ExcalidrawForm" :form="form" />
    <span slot="footer" class="dialog-footer">
      <el-button @click="onDialogClosed">
        {{ $t('general.Close') }}
      </el-button>
      <el-button type="primary" @click="handleCreate">
        {{ $t('general.Add') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { createExcalidraw } from '@/api_v2/excalidraw'
import ExcalidrawForm from '@/views/WhiteBoard/components/ExcalidrawForm'
import { mapGetters } from 'vuex'

const formTemplate = () => ({
  issue_ids: [],
  name: ''
})

export default {
  name: 'CreateBoardDialog',
  components: { ExcalidrawForm },
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoading: false,
      form: formTemplate(),
      rules: {
        name: [
          {
            required: true,
            message: this.$t('RuleMsg.PleaseSelect') + this.$t('general.Name'),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    handleCreate() {
      this.$refs['ExcalidrawForm'].$refs['form'].validate(async (valid) => {
        if (valid) {
          this.isLoading = true
          try {
            const sendData = new FormData()
            sendData.append('project_id', this.selectedProject.id)
            sendData.append('name', this.form.name)
            if (this.form.issue_ids.length > 0) {
              sendData.append('issue_ids', this.form.issue_ids)
            }
            const row = (await createExcalidraw(sendData)).data
            this.isLoading = false
            this.$router.push({
              name: 'Excalidraw',
              params: {
                projectName: this.selectedProject.identifier,
                excalidrawId: row.id
              }
            })
          } catch (error) {
            console.error(error)
            this.$emit('handleError')
          } finally {
            this.onDialogClosed()
          }
        }
      })
    },
    onDialogClosed() {
      this.form = formTemplate()
      this.$refs['ExcalidrawForm'].$refs['form'].resetFields()
      this.$emit('update:dialogVisible', false)
    }
  }
}
</script>
