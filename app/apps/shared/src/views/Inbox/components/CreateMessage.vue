<template>
  <el-dialog
    :close-on-click-modal="false"
    :show-close="false"
    :title="isEdit ? $t('Inbox.EditMessage') : $t('Inbox.CreateMessage')"
    :top="isMobile ? '2vh' : '8vh'"
    :visible.sync="showDialog"
    :width="isMobile ? '95%' : '80%'"
    @closed="onDialogClosed"
  >
    <el-form
      ref="createMessage"
      :model="form"
      :rules="rules"
      label-position="top"
      size="medium"
    >
      <el-row :gutter="10">
        <el-col :sm="16" :span="24">
          <el-col :span="24">
            <el-form-item :label="$t('Inbox.Title')" prop="title">
              <el-input
                v-model="form.title"
                :placeholder="$t('general.PleaseInput') + $t('Inbox.Title')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('Inbox.MessageContent')" prop="content">
              <editor
                ref="mdEditor"
                :options="editorOptions"
                height="auto"
                initial-edit-type="wysiwyg"
                @change="onMessageChange"
              />
            </el-form-item>
          </el-col>
        </el-col>
        <el-col :sm="8" :span="24">
          <el-col>
            <el-radio-group
              v-model="messageType"
              :disabled="isEdit"
              size="mini"
            >
              <el-radio-button label="Public">{{ $t('Inbox.Public') }}
              </el-radio-button>
              <el-radio-button label="Private">{{ $t('Inbox.Private') }}
              </el-radio-button>
            </el-radio-group>
          </el-col>
          <el-col v-if="messageType === 'Private'" :span="24">
            <el-form-item :label="$t('Inbox.GroupReceiverTitle')" prop="target">
              <el-select
                v-model="form.target"
                :disabled="isEdit"
                style="width: 100%"
              >
                <el-option
                  v-for="item in groupReceiver"
                  :key="item"
                  :label="`${$t(`Inbox.GroupReceiver.${item}`)}`"
                  :value="item"
                >
                  {{ `${$t(`Inbox.GroupReceiver.${item}`)}` }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col
            v-if="
              messageType === 'Private' &&
                form.target &&
                (form.target !== '' || form.target !== 'all')
            "
            :span="24"
          >
            <el-form-item
              :label="`${$t(
                `Inbox.GroupReceiver.${form.target?.split('_')[0]}`
              )}`"
              prop="target_ids"
            >
              <el-select
                v-model="form.target_ids"
                :disabled="isEdit"
                filterable
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="item in targetOptions"
                  :key="item.id"
                  :label="
                    item.display_name || item.name || item.full_name || '-'
                  "
                  :value="item.id"
                >
                  {{ item.display_name || item.name || item.full_name || '-' }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('Inbox.AlertLevel')" prop="level">
              <el-select v-model="form.level" style="width: 100%">
                <el-option
                  v-for="item in alertList"
                  :key="item.id"
                  :label="item.label"
                  :value="item.id"
                >
                  {{ item.label }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-col>
      </el-row>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button :disabled="isLoading" @click="onDialogClosed">
        {{ $t('general.Cancel') }}
      </el-button>
      <el-button :loading="isLoading" type="primary" @click="onSend">{{
        $t('Inbox.Send')
      }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getUserList } from '@/api_v3/user'
import { getOrganizationList } from '@/api_v3/organizations'
import {
  createNewNotification,
  updateNotification
} from '@/api_v3/notifications'
import '@toast-ui/editor/dist/i18n/zh-tw'
import '@toast-ui/editor/dist/toastui-editor.css'
import { mapGetters } from 'vuex'

const formTemplate = () => ({
  title: '',
  content: '',
  type: 'user_message',
  level: '',
  target: 'all',
  target_ids: null
})

export default {
  name: 'CreateMessage',
  components: {
    Editor: () => import('@toast-ui/vue-editor').then(({ Editor }) => Editor)
  },
  props: {
    alertList: {
      type: Array,
      default: () => []
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    messageData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      form: formTemplate(),
      showDialog: false,
      isLoading: false,
      messageType: 'Public',
      projectList: [],
      userList: [],
      organizationList: []
    }
  },
  computed: {
    ...mapGetters([
      'projectOptions',
      'roleList',
      'language',
      'device',
      'userRole'
    ]),
    editorOptions() {
      return {
        minHeight: '200px',
        language: this.language
      }
    },
    isMobile() {
      return this.device === 'mobile'
    },
    groupReceiver() {
      const options = ['user', 'role', 'project', 'project_owner']
      if (this.userRole === 'sysadmin') {
        options.push('organization', 'organization_owner')
      }
      return options
    },
    targetOptions() {
      if (this.form.target === 'user') {
        return this.userList
      } else if (
        this.form.target === 'project' ||
        this.form.target === 'project_owner'
      ) {
        return this.projectList
      } else if (
        this.form.target === 'organization' ||
        this.form.target === 'organization_owner'
      ) {
        return this.organizationList
      } else if (this.form.target === 'role') {
        return this.roleList
      } else {
        return []
      }
    },
    rules() {
      return {
        title: [
          {
            required: true,
            message: `${this.$t('general.PleaseInput')} ${this.$t(
              'Inbox.Title'
            )}`,
            trigger: 'blur'
          }
        ],
        content: [
          {
            required: true,
            message: `${this.$t('general.PleaseInput')} ${this.$t(
              'Inbox.MessageContent'
            )}`,
            trigger: 'blur'
          }
        ],
        level: [
          {
            required: true,
            message: `${this.$t('general.PleaseInput')} ${this.$t(
              'Inbox.AlertLevel'
            )}`,
            trigger: 'change'
          }
        ],
        target: [
          {
            required: true,
            message: `${this.$t('general.PleaseInput')} ${this.$t(
              'Inbox.GroupReceiverTitle'
            )}`,
            trigger: 'change'
          }
        ],
        target_ids: [
          {
            required: true,
            message: `${this.$t('general.PleaseInput')} ${this.$t(
              `Inbox.GroupReceiver.${this.form.target?.split('_')[0]}`
            )}`,
            trigger: 'change'
          }
        ]
      }
    }
  },
  watch: {
    messageType: {
      handler(value) {
        if (value === 'Public') {
          this.form.target = 'all'
          this.form.target_ids = null
        } else if (this.isEdit) {
          this.form.target = this.messageData.target
          this.form.target_ids = this.messageData.target_ids
        } else {
          this.form.target = ''
          this.form.target_ids = null
        }
        if (this.$refs.createMessage) this.$refs.createMessage.clearValidate()
      },
      immediate: true
    },
    'form.target'() {
      if (this.isEdit && this.form.target === this.messageData.target) {
        this.form.target_ids = this.messageData.target_ids
      } else {
        this.form.target_ids = null
      }
      if (this.$refs.createMessage) this.$refs.createMessage.clearValidate()
    },
    isEdit(val) {
      if (val) {
        this.assignMessageData()
        if (this.form.target === 'all') {
          this.messageType = 'Public'
        } else {
          this.messageType = 'Private'
        }
      }
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.projectList = this.projectOptions.filter((obj) => {
        return !obj.is_locked && !obj.is_disabled
      })

      const API = [getUserList({ all: true })]
      if (this.userRole === 'sysadmin') {
        API.push(getOrganizationList({ all: true }))
      }

      await Promise.allSettled(API).then((results) => {
        if (results[0].status === 'fulfilled') {
          this.userList = results[0].value.data
        }
        if (this.userRole === 'sysadmin') {
          this.organizationList = results[1].value.data
        }
      })
    },
    assignMessageData() {
      if (this.isEdit) {
        this.form = Object.assign({}, this.messageData)

        this.$nextTick(() => {
          this.$refs.mdEditor.invoke('setMarkdown', this.form.content)
        })
      }
    },
    onDialogClosed() {
      this.showDialog = false
      this.messageType = 'Public'
      this.form = formTemplate()

      this.$nextTick(() => {
        this.$refs.createMessage.resetFields()
        this.$refs.createMessage.clearValidate()
        this.$refs.mdEditor.invoke('reset')
        this.$emit('edit')
      })
    },
    async onSend() {
      this.$refs.createMessage.validate(async (valid) => {
        if (!valid) return
        this.isLoading = true

        const sendData = Object.assign({}, this.form)
        if (!sendData.target_ids?.length) {
          delete sendData.target_ids
          sendData.target = 'all'
        }

        const API = this.isEdit
          ? updateNotification(sendData.id, sendData)
          : createNewNotification(sendData)

        await API.then(async () => {
          this.$emit('load-data')
          this.onDialogClosed()
          this.isLoading = false
        }).catch((err) => {
          console.error(err)
          this.isLoading = false
        })
      })
    },
    onMessageChange() {
      this.form.content = this.$refs.mdEditor.invoke('getMarkdown')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

@include tablet {
  ::v-deep .toastui-editor-popup {
    max-width: 250px;
    margin-left: 0px;
  }
  ::v-deep .toastui-editor-popup-add-table .toastui-editor-table-cell {
    width: 20px;
    height: 20px;
  }
  ::v-deep .toastui-editor-defaultUI-toolbar button {
    margin: 7px 0px;
  }
  ::v-deep .toastui-editor-defaultUI-toolbar {
    padding: 0 5px;
  }
  ::v-deep .toastui-editor-toolbar-divider {
    margin: 14px 0px;
  }
  ::v-deep .toastui-editor-dropdown-toolbar {
    right: 0px !important;
  }
}
</style>
