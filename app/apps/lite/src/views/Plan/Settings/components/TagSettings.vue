<template>
  <div>
    <div class="flex justify-between mb-4">
      <el-button
        :disabled="isAddingTag"
        :size="isMobile ? 'small' : 'medium'"
        icon="el-icon-plus"
        type="success"
        @click="handleShowTagInput"
      >
        <span>{{ $t('ProjectSettings.AddCustomTag') }}</span>
      </el-button>
    </div>
    <el-collapse-transition>
      <div v-show="isAddingTag">
        <el-form ref="form" :model="form">
          <el-form-item :label="$t('ProjectSettings.TagName')">
            <el-input
              v-model="form.name"
              :placeholder="$t('ProjectSettings.TagInputPlaceholder')"
              :size="isMobile ? 'small' : 'medium'"
              class="mr-3"
              type="text"
            />
            <el-button
              :size="isMobile ? 'small' : 'medium'"
              type="primary"
              @click="handleInputSave"
            >
              {{ $t('general.Save') }}
            </el-button>
            <el-button
              :size="isMobile ? 'small' : 'medium'"
              @click="handleInputCancel"
            >
              {{ $t('general.Cancel') }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-transition>
    <table class="table">
      <caption></caption>
      <tr>
        <th></th>
        <th>{{ $t('ProjectSettings.Index') }}</th>
        <th>{{ $t('ProjectSettings.Tag') }}</th>
        <th>{{ $t('general.Actions') }}</th>
      </tr>
      <Draggable
        v-if="listData && listData.length > 0"
        v-model="listData"
        :move="onMove"
        animation="500"
        chosen-class="chosen"
        element="tbody"
        ghost-class="ghost"
        @update="handleTableDraggingChange"
      >
        <tr v-for="(row, id) in listData" :key="row.id">
          <td class="align-center">
            <svg-icon class="text-lg mr-2" icon-class="draggable" />
          </td>
          <td class="align-center">{{ id + 1 }}</td>
          <td
            class="align-center"
            @mouseenter="row.mouseover = true"
            @mouseleave="row.mouseover = false"
          >
            <div v-if="row.edit">
              <el-input v-model="row.name" type="text" />
              <el-button
                class="action"
                icon="el-icon-check"
                size="mini"
                type="success"
                @click.stop="handleTableInputConfirm(row, id)"
              />
              <el-button
                class="action"
                icon="el-icon-close"
                size="mini"
                type="danger"
                @click.stop="handleTableInputCancel(row, id)"
              />
            </div>
            <template v-else>
              <span class="w-full">{{ row.name }}</span>
              <em
                :class="
                  row.mouseover ? 'ri-edit-box-line info table-button' : ''
                "
                @click.stop="row.edit = true"
              ></em>
            </template>
          </td>
          <td class="align-center">
            <el-tooltip :content="$t('general.Delete')" placement="bottom">
              <em
                class="ri-delete-bin-2-line danger table-button"
                @click.stop="handleTagDelete(row)"
              ></em>
            </el-tooltip>
          </td>
        </tr>
      </Draggable>
      <tr v-else>
        <td colspan="4">
          <el-empty :description="$t('general.NoData')" />
        </td>
      </tr>
    </table>
    <el-dialog
      :before-close="handleRelationIssueDialogBeforeClose"
      :visible.sync="relationIssue.visible"
      append-to-body
      destroy-on-close
      top="3vh"
      width="90%"
    >
      <ProjectIssueDetail
        v-if="relationIssue.visible"
        ref="children"
        :is-in-dialog="true"
        :props-issue-id="relationIssue.id"
        @delete="onCloseRelationIssueDialog"
      />
    </el-dialog>
  </div>
</template>

<script>
import {
  createTag,
  deleteTag,
  getProjectIssueList,
  getTagList,
  updateTag,
  updateTagOrder
} from '@/api_v3/projects'
import BasicData from '@/mixins/BasicData'
import ProjectIssueDetail from '@/views/Project/IssueDetail/'
import Draggable from 'vuedraggable'
import { mapGetters } from 'vuex'

export default {
  name: 'TagSettings',
  components: {
    Draggable,
    ProjectIssueDetail
  },
  mixins: [BasicData],
  data() {
    return {
      isAddingTag: false,
      originData: [],
      form: {
        name: ''
      },
      relationIssue: {
        visible: false,
        id: null
      }
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device']),
    lastTagId() {
      return this.originData[this.originData.length - 1].id
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      let tags = []
      await getTagList(this.selectedProjectId)
        .then((res) => {
          tags = res.data
          this.setOriginData(tags)
        })
        .finally(() => {
          this.listLoading = false
        })
      return this.handleRowData(tags)
    },
    async createTag() {
      const sendData = {
        name: this.form.name
      }
      await createTag(this.selectedProjectId, sendData)
        .then(() => {
          this.updateTable()
          this.initForm()
        })
        .catch((err) => {
          console.error(err)
        })
    },
    async deleteTag(tag_id) {
      await deleteTag(tag_id, { project_id: this.selectedProjectId })
        .then(() => {
          this.updateTable()
        })
        .catch((err) => {
          console.error(err)
        })
    },
    async updateTag(tag_id, data) {
      await updateTag(tag_id, data)
        .then(() => {
          this.updateTable()
        })
        .catch((err) => {
          console.error(err)
        })
    },
    updateTable() {
      this.loadData()
      this.showUpdateMessage()
    },
    setOriginData(data) {
      this.originData = JSON.parse(JSON.stringify(data))
    },
    handleRowData(tags) {
      tags.forEach((item) => {
        item.edit = false
        item.mouseover = false
      })
      return tags
    },
    handleShowTagInput() {
      this.isAddingTag = true
    },
    handleInputSave() {
      if (!this.form.name) {
        this.$message({
          title: this.$t('general.Warning'),
          message: this.$t('ProjectSettings.TagInputPlaceholder'),
          type: 'warning'
        })
        return
      }
      this.createTag()
    },
    handleInputCancel() {
      this.initForm()
      this.isAddingTag = false
    },
    initForm() {
      this.form = { name: '' }
    },
    handleTableInputConfirm(row, index) {
      const tag_id = row.id
      const sendData = {
        name: row.name
      }
      if (this.originData[index].name !== row.name) {
        this.updateTag(tag_id, sendData)
      }
      row.edit = false
    },
    handleTableInputCancel(row, index) {
      row.name = this.originData[index].name
      row.edit = false
    },
    handleRelationIssueDialogBeforeClose(done) {
      if (this.$refs.children.hasUnsavedChanges()) {
        this.$confirm(
          this.$t('Notify.UnSavedChanges'),
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }
        )
          .then(() => {
            done()
          })
          .catch()
      } else {
        done()
      }
    },
    onRelationIssueDialog(id) {
      this.$set(this.relationIssue, 'visible', true)
      this.$set(this.relationIssue, 'id', id)
    },
    onCloseRelationIssueDialog() {
      this.$set(this.relationIssue, 'visible', false)
      this.$set(this.relationIssue, 'id', null)
    },
    async handleTagDelete(row) {
      const params = {
        tags: row.id
      }
      await getProjectIssueList(this.selectedProjectId, params)
        .then(async (res) => {
          const issues = res.data.items
          this.showWarningMessage(row, issues)
        })
        .catch((err) => {
          console.error(err)
        })
    },
    async showWarningMessage(row, issues) {
      const h = this.$createElement
      const tagName = { tagName: row.name }
      const messageList = [
        h(
          'div',
          { style: { 'text-align': 'center' }},
          issues.length > 0
            ? this.$t(`ProjectSettings.DeleteTag`, tagName)
            : this.$t(`Notify.confirmDelete`)
        ),
        h(
          'div',
          { style: { 'text-align': 'center' }},
          '________________________________________'
        )
      ]
      issues.forEach((issue) => {
        messageList.push(
          h('p', { key: issue.id, style: { 'text-align': 'center' }}, [
            h('span', null, '• '),
            h(
              'span',
              {
                on: {
                  click: async () => {
                    this.onRelationIssueDialog(issue.id)
                  }
                },
                class: 'issue-id'
              },
              ` #${issue.id}`
            ),
            h('span', null, ` ${issue.subject}`)
          ])
        )
      })
      const message = h('div', { class: 'warning' }, messageList)
      await this.$confirm(message, this.$t(`general.Warning`), {
        confirmButtonText: this.$t('general.Delete'),
        cancelButtonText: this.$t('general.Cancel'),
        confirmButtonClass: 'el-button--danger',
        center: true,
        type: 'warning'
      })
        .then(async () => {
          await this.deleteTag(row.id)
        })
        .catch((err) => console.error(err))
    },
    showUpdateMessage() {
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('ProjectSettings.TagUpdateMessage'),
        type: 'success'
      })
    },
    async handleTableDraggingChange(event) {
      const { oldIndex, newIndex } = event
      const sendData = {
        tag_id: Number(this.originData[oldIndex].id),
        to_tag_id: newIndex === 0 ? null : Number(this.originData[newIndex].id)
      }
      if (sendData.to_tag_id === null) {
        delete sendData.to_tag_id
      }
      await updateTagOrder(this.selectedProjectId, sendData)
        .then(() => {
          this.showUpdateMessage()
        })
        .finally(() => {
          this.updateData()
        })
    },
    async updateData() {
      this.listLoading = true
      this.$nextTick(async () => {
        this.listData = await this.fetchData()
      })
      this.listLoading = false
    },
    onMove(_event) {
      return !this.listLoading
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
@import 'src/styles/theme/mixin.scss';

$bg-color: #ebeef5;
$ghost-bg-color: #e5e8ef;
$table-font-color: #606266;

::v-deep .el-input {
  width: 300px;
}

.align-center {
  text-align: center;
}

.chosen {
  background-color: $bg-color !important;
}

.ghost {
  background-color: $ghost-bg-color !important;
}

table.table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid $bg-color;
  font-weight: normal;
  font-size: 13px;
  color: $table-font-color;

  td,
  th {
    padding: 3px;
    height: 50px;
  }

  th {
    font-size: 14px;
    color: $closed;
    text-align: center;
    border-bottom: 1px solid $bg-color;
  }

  td {
    border-bottom: 1px solid $bg-color;

    &:active {
      cursor: grabbing;
    }

    &:first-child,
    &:nth-child(2) {
      width: 50px;
    }

    &:nth-child(3) {
      width: 600px;
    }
  }

  tr {
    cursor: grab;
  }
}

.action {
  margin: 0;

  &.el-button--mini {
    padding: 5px;
  }
}

.warning {
  line-height: 20px;
  font-weight: bold;
  overflow-y: auto;
  max-height: 250px;

  .issue-id {
    color: $buttonPrimary;
    cursor: pointer;
  }
}
</style>
