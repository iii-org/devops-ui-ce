<template>
  <div class="app-container p-3" :class="isMobile ? 'mobile' : ''">
    <el-collapse
      v-model="collapse"
      v-loading="isLoading"
    >
      <el-collapse-item name="Form">
        <div
          slot="title"
          class="flex justify-between text-title"
          style="width: -webkit-fill-available;"
        >
          <el-button
            type="text"
            size="medium"
            icon="el-icon-arrow-left"
            class="text-title linkTextColor p-3"
            @click="onBack"
          >
            <span v-if="!isMobile">{{ $t('general.Back') }}</span>
          </el-button>
          <span class="text-xl py-3 title">
            {{ row.name }}
          </span>
          <span class="p-3">
            {{ $t('general.Settings', { name: $t('Issue.Issue') }) }}
          </span>
        </div>
        <el-row>
          <el-col :xs="24" :sm="20">
            <ExcalidrawForm
              ref="ExcalidrawForm"
              class="pl-3"
              :form="form"
            />
          </el-col>
          <el-col :xs="24" :sm="4">
            <el-button
              type="primary"
              size="medium"
              class="ml-3 mb-5"
              @click="handleEdit"
            >
              {{ $t('general.Confirm') }}
            </el-button>
          </el-col>
        </el-row>
      </el-collapse-item>
      <el-collapse-item name="Excalidraw" disabled>
        <div slot="title" class="text-title pl-3" style="margin-right: auto;">
          {{ $t('Excalidraw.EditBoard') }}
        </div>
        <div class="px-1" :style="{ height : isShowExcalidraw ? null : excalidrawHeight + 'px'}">
          <iframe
            v-if="isShowExcalidraw"
            :src="`${row.url}#${userName}`"
            :height="excalidrawHeight"
            width="100%"
            title="Excalidraw"
          />
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  getExcalidrawDataById,
  updateExcalidraw,
  postExcalidrawHistory,
  patchExcalidrawHistory
} from '@/api_v2/excalidraw'
import ExcalidrawForm from '@/views/WhiteBoard/components/ExcalidrawForm'

const formTemplate = () => ({
  issue_ids: [],
  name: ''
})

export default {
  name: 'Excalidraw',
  components: { ExcalidrawForm },
  data() {
    return {
      excalidrawHeight: 500,
      isLoading: false,
      isShowExcalidraw: false,
      row: {},
      collapse: ['Excalidraw'],
      form: formTemplate()
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'userName', 'device']),
    formHeight() {
      return this.collapse.includes('Form') ? 0 : 60
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    collapse: {
      handler: 'handleHeight',
      immediate: true
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleHeight)
    this.init()
  },
  destroyed() {
    window.removeEventListener('resize', this.handleHeight)
    this.handleHistory(false)
  },
  methods: {
    async init() {
      const excalidraw_id = this.$route.params.excalidrawId
      if (this.$route.query.isEdit) this.collapse = ['Form', 'Excalidraw']
      this.row = (await getExcalidrawDataById(excalidraw_id)).data
      this.row.url = this.row.url.replace('//#', '/#')
      this.form.issue_ids = this.row.issue_ids
      this.form.name = this.row.name
      await this.handleHistory(true)
    },
    async handleHistory(value) {
      this.isLoading = true
      if (value) {
        await postExcalidrawHistory(this.row.id).then(() => {
          this.isShowExcalidraw = true
        })
      } else {
        await patchExcalidrawHistory(this.row.id)
      }
      this.isLoading = false
    },
    handleEdit() {
      this.$refs['ExcalidrawForm'].$refs['form'].validate(async(valid) => {
        if (valid) {
          this.isLoading = true
          try {
            const sendData = new FormData()
            sendData.append('name', this.form.name)
            sendData.append('issue_ids', this.form.issue_ids || '')
            await updateExcalidraw(this.row.id, sendData)
            this.$message({
              title: this.$t('general.Success'),
              message: this.$t('Notify.Updated'),
              type: 'success'
            })
            this.isLoading = false
          } catch (error) {
            console.error(error)
          }
        }
      })
    },
    handleHeight() {
      this.excalidrawHeight = window.innerHeight + this.formHeight - 250
    },
    onBack() {
      if (this.$route.query.prev_page) {
        this.$router.push(this.$route.query.prev_page)
      } else {
        this.$router.push({
          name: 'Whiteboard',
          params: { projectName: this.row.project.name }
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-collapse-item__content {
  padding-bottom: 0;
}

::v-deep .el-collapse-item__arrow {
  margin-left: 8px;
}
.mobile {
  .title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    align-self: center;
    font-size: 16px !important;
  }
}
</style>
