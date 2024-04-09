<template>
  <div>
    <div class="flex justify-between mb-4">
      <el-button
        class="button-secondary"
        :disabled="isAddingTag"
        :size="isMobile ? 'small' : 'medium'"
        icon="el-icon-plus"
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
              type="text"
              class="mr-3"
            />
            <el-button
              class="button-primary"
              :size="isMobile ? 'small' : 'medium'"
              @click="handleInputSave"
            >
              {{ $t('general.Save') }}
            </el-button>
            <el-button
              class="button-secondary-reverse"
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
        animation="500"
        :move="onMove"
        ghost-class="ghost"
        chosen-class="chosen"
        element="tbody"
        @update="handleTableDraggingChange"
      >
        <tr v-for="(row, id) in listData" :key="row.id">
          <td class="align-center">
            <svg-icon
              icon-class="draggable"
              class="text-lg mr-2"
            />
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
                type="success"
                size="mini"
                icon="el-icon-check"
                @click.stop="handleTableInputConfirm(row, id)"
              />
              <el-button
                class="action"
                type="danger"
                size="mini"
                icon="el-icon-close"
                @click.stop="handleTableInputCancel(row, id)"
              />
            </div>
            <template v-else>
              <span class="w-full">{{ row.name }}</span>
              <em
                :class="row.mouseover ? 'ri-edit-box-line info table-button' : ''"
                @click.stop="row.edit = true"
              ></em>
            </template>
          </td>
          <td class="align-center">
            <el-tooltip
              placement="bottom"
              :content="$t('general.Delete')"
            >
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
      :visible.sync="relationIssue.visible"
      width="90%"
      top="3vh"
      append-to-body
      destroy-on-close
      :before-close="handleRelationIssueDialogBeforeClose"
    >
      <ProjectIssueDetail
        v-if="relationIssue.visible"
        ref="children"
        :props-issue-id="relationIssue.id"
        :is-in-dialog="true"
        @delete="onCloseRelationIssueDialog"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { BasicData } from '@/mixins'
import {
  getTagsByProject,
  addProjectTags,
  deleteProjectTags,
  updateProjectTags,
  updateProjectTagsOrder,
  getIssueByTagId
} from '@/api_v2/projects'
import Draggable from 'vuedraggable'
import ProjectIssueDetail from '@/views/Project/IssueDetail/'

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
      await getTagsByProject(this.selectedProjectId)
        .then((res) => {
          tags = res.data.tags
          this.setOriginData(tags)
        })
        .finally(() => {
          this.listLoading = false
        })
      return this.handleRowData(tags)
    },
    async addProjectTags(formData) {
      await addProjectTags(formData)
        .then(() => {
          this.updateTable()
          this.initForm()
        })
        .catch(err => {
          console.error(err)
        })
    },
    async deleteProjectTags(tag_id) {
      await deleteProjectTags(tag_id)
        .then(() => {
          this.updateTable()
        })
        .catch(err => {
          console.error(err)
        })
    },
    async updateProjectTags(tag_id, data) {
      await updateProjectTags(tag_id, data)
        .then(() => {
          this.updateTable()
        })
        .catch(err => {
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
      tags.forEach(item => {
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
      const formData = this.getFormData()
      this.addProjectTags(formData)
    },
    getFormData() {
      const name = this.form.name
      const project_id = this.selectedProjectId
      const formData = new FormData()
      formData.delete('name')
      formData.delete('project_id')
      formData.append('name', name)
      formData.append('project_id', project_id)
      return formData
    },
    getUpdatedData(row) {
      const name = row.name
      const formData = new FormData()
      formData.delete(name)
      formData.append('name', name)
      return formData
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
      const updatedData = this.getUpdatedData(row)
      if (this.originData[index].name !== row.name) this.updateProjectTags(tag_id, updatedData)
      row.edit = false
    },
    handleTableInputCancel(row, index) {
      row.name = this.originData[index].name
      row.edit = false
    },
    handleRelationIssueDialogBeforeClose(done) {
      if (this.$refs.children.hasUnsavedChanges()) {
        this.$confirm(this.$t('Notify.UnSavedChanges'), this.$t('general.Warning'), {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        })
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
    async showWarningMessage(row, arrIssueListData) {
      const h = this.$createElement
      const tagName = { tagName: row.name }
      const messageList = [
        h('div', { style: { 'text-align': 'center' }}, arrIssueListData.length > 0
          ? this.$t(`ProjectSettings.DeleteTag`, tagName) : this.$t(`Notify.confirmDelete`)),
        h('div', { style: { 'text-align': 'center' }}, '________________________________________')
      ]
      arrIssueListData.forEach((value) => {
        messageList.push(
          h('p', { key: value.id, style: { 'text-align': 'center' }}, [
            h('span', null, '• '),
            h('span', { on: { click: async () => {
              this.onRelationIssueDialog(value.id)
            } }, class: 'issue-id' }, ' #' + value.id),
            h('span', null, ' ' + value.name)
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
          await this.deleteProjectTags(row.id)
        })
        .catch(err => console.error(err))
    },
    async handleTagDelete(row) {
      await getIssueByTagId(this.selectedProjectId, row.id)
        .then(async (res) => {
          this.showWarningMessage(row, res.data)
        })
        .catch(err => {
          console.error(err)
        })
    },
    showUpdateMessage() {
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('ProjectSettings.TagUpdateMessage'),
        type: 'success'
      })
    },
    async handleTableDraggingChange(event) {
      const { oldIndex } = event
      const sendData = {
        tag_id: Number(this.originData[oldIndex].id),
        to_tag_id: this.getToTagId(event)
      }
      if (sendData.to_tag_id === null) {
        delete sendData.to_tag_id
      }
      await updateProjectTagsOrder(sendData)
        .then(() => {
          this.showUpdateMessage()
        })
        .finally(() => {
          this.updateData()
        })
    },
    getToTagId(event) {
      const { oldIndex, newIndex } = event
      if (newIndex + 1 === this.originData.length) {
        return null
      }
      return oldIndex > newIndex
        ? Number(this.originData[newIndex].id)
        : Number(this.originData[newIndex + 1].id)
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
@import 'src/styles/theme/variables.scss';
@import 'src/styles/theme/mixin.scss';

$bg-color: #EBEEF5;
$ghost-bg-color: #E5E8EF;
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
  td, th {
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
    &:first-child, &:nth-child(2) {
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

.el-button--success {
  @include css-prefix(transition, all .6s ease);
  color: $success;
  border: 1px solid #989898;
  background: none;
  &:hover {
    color: #fff;
    border: 1px solid $success;
    background: $success;
  }
}

.el-button--danger {
  @include css-prefix(transition, all .6s ease);
  color: $danger;
  border: 1px solid #989898;
  background: none;
  &:hover {
    color: #fff;
    border: 1px solid $danger;
    background: $danger;
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
