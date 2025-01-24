<template>
  <div style="padding: 10px">
    <el-row>
      <el-col :md="6" :sm="24">
        <el-checkbox
          v-model="selectAll"
          :label="$t('general.SelectAll')"
          style="padding-top: 1rem"
          @change="handleSelectAll"
        />
      </el-col>
      <el-col :md="18" :sm="24" :style="!isMobile ? 'text-align: right' : ''">
        <SearchFilter ref="filter" @changeFilter="changeFilter">
          <el-popconfirm
            :cancel-button-text="$t('general.Cancel')"
            :confirm-button-text="$t('general.Confirm')"
            :title="batchCloseHint"
            @confirm="batchClose"
          >
            <el-button
              slot="reference"
              :disabled="noRowSelected"
              class="valign-middle"
              size="small"
            >
              {{ $t('Release.batchClose') }}
            </el-button>
          </el-popconfirm>
          <el-button
            :disabled="noRowSelected"
            class="valign-middle"
            size="small"
            @click="batchMoveDialogVisible = true"
          >
            {{ $t('Release.batchMove') }}
          </el-button>
        </SearchFilter>
      </el-col>
    </el-row>
    <el-card
      v-loading="treeLoading"
      :body-style="{ height: '300px', overflow: 'auto' }"
      shadow="never"
    >
      <el-tree
        ref="tree"
        :data="allIssuesTree"
        :filter-node-method="filterNode"
        :props="{ disabled: 'is_closed' }"
        check-strictly
        default-expand-all
        node-key="id"
        show-checkbox
        @check="checkTreeNode"
      >
        <span
          slot-scope="{ node, data }"
          class="flex items-center justify-between"
          style="width: 100%"
        >
          <span :style="calcStyle(node, data)" class="truncate">
            <Tracker
              v-if="data.tracker.name"
              :is-hide-name="true"
              :name="$t(`Issue.${data.tracker.name}`)"
              :type="data.tracker.name"
            />
            #{{ data.id }} - {{ data.subject }}
          </span>
          <span class="truncate" style="width: 15rem; display: inline-block">
            <span v-if="data.version">
              <el-tag
                :type="
                  selectedVersions.includes(data.version.id)
                    ? 'primary'
                    : 'info'
                "
                class="rounded-xl font-bold"
                effect="dark"
                size="mini"
              >
                {{ data.version.name }}
              </el-tag>
            </span>
            <span v-if="data.status.name">
              <Status
                :name="$t(`Issue.${data.status.name}`)"
                :size="'mini'"
                :type="data.status.name"
              />
            </span>
            <span v-if="data.assigned">
              <el-tag
                class="rounded-xl font-bold"
                effect="dark"
                size="mini"
                type="info"
              >
                <em class="el-icon-user"></em>
                {{ data.assigned.full_name }}
              </el-tag>
            </span>
          </span>
          <span class="truncate" style="width: 20rem; display: inline-block">
            <el-button
              class="primary mr-1"
              icon="el-icon-edit-outline"
              type="text"
              @click.stop="handleEdit(data)"
            >
              <span v-if="!isMobile">{{ $t('Issue.EditIssue') }}</span>
            </el-button>
            <el-button
              v-if="!data.has_children && !data.is_closed"
              icon="el-icon-error text-danger"
              type="text"
              @click.stop="handleClosedIssueDialogVisible(data)"
            >
              <span v-if="!isMobile">{{ $t('general.Close') }}</span>
            </el-button>
          </span>
        </span>
      </el-tree>
    </el-card>
    <el-dialog
      :title="$t('Release.batchMoveDialogTitle')"
      :visible.sync="batchMoveDialogVisible"
    >
      <el-form v-loading="dialogLoading">
        <el-form-item :label="$t('Release.futureVersion')">
          <el-select
            v-model="batchMoveToVersion"
            :placeholder="$t('Release.selectMoveToVersion')"
            filterable
          >
            <el-option
              v-for="item in projectVersionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          {{ $t('Release.batchMoveDialogHint', [selectedIssueIds.length]) }}
        </el-form-item>
        <el-button
          :disabled="!batchMoveToVersion"
          type="primary"
          @click="batchMove"
        >
          {{ $t('general.Confirm') }}
        </el-button>
        <el-button @click="batchMoveDialogVisible = false">
          {{ $t('general.Cancel') }}
        </el-button>
      </el-form>
    </el-dialog>
    <el-dialog
      :title="$t('Issue.AskDeleteIssue')"
      :visible.sync="closedIssueDialogVisible"
      destroy-on-close
    >
      <el-row v-loading="dialogLoading" :class="isMobile ? 'mobile' : ''">
        <el-col>
          <el-row class="text-sm font-bold py-3">
            {{ $t('Issue.Notes') }}
          </el-row>
        </el-col>
        <el-col>
          <Editor
            ref="mdEditor"
            :initial-edit-type="editorType"
            :options="editorOptions"
            class="mx-3"
            height="12rem"
            preview-style="tab"
            @change="(type) => (editorType = type)"
          />
        </el-col>
      </el-row>
      <div slot="footer" class="dialog-footer">
        <el-button
          :disabled="dialogLoading"
          type="danger"
          @click="handleCloseIssue"
        >
          {{ $t('Issue.CloseIssue') }}
        </el-button>
      </div>
    </el-dialog>
    <el-dialog
      :visible.sync="issueDetailDialogVisible"
      append-to-body
      destroy-on-close
      top="3vh"
      width="90%"
    >
      <ProjectIssueDetail
        v-if="issueDetailDialogVisible"
        ref="children"
        :is-in-dialog="true"
        :props-issue-id="editedIssueId"
        @delete="handleRelationUpdate"
        @update="handleRelationUpdate"
      />
    </el-dialog>
  </div>
</template>

<script>
import { closeAllIssuesByIds, updateIssue } from '@/api_v3/issues'
import { getProjectIssueChildren } from '@/api_v3/projects'
import colorVariables from '@/styles/theme/variables.module.scss'
import { mapGetters } from 'vuex'
import SearchFilter from './SearchFilter'

export default {
  name: 'IssuesTree',
  components: {
    ProjectIssueDetail: () => import('@/views/Project/IssueDetail'),
    SearchFilter,
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker'),
    Editor: () => import('@toast-ui/vue-editor').then(({ Editor }) => Editor)
  },
  props: {
    selectedVersions: {
      type: Array,
      required: true
    },
    projectVersionOptions: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      editorType: 'wysiwyg',
      treeLoading: false,
      issues: [],
      dialogLoading: false,
      batchMoveDialogVisible: false,
      closedIssueDialogVisible: false,
      issueDetailDialogVisible: false,
      batchMoveToVersion: null,
      closedRow: {},
      editedIssueId: '',
      allIssuesTree: [],
      selectedIssueIds: [],
      selectAll: false
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device', 'language']),
    batchCloseHint() {
      return this.$t('Release.confirmBatchClose', [
        this.selectedIssueIds.length
      ])
    },
    noRowSelected() {
      return this.selectedIssueIds.length === 0
    },
    isMobile() {
      return this.device === 'mobile'
    },
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    editorOptions() {
      const options = {
        minHeight: '100px',
        language: this.language,
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync']
        ]
      }
      if (!this.isLite) {
        options.widgetRules = [
          {
            rule: /@[^@$][\u4e00-\u9fa5~`!#$%^&*()_=+-\w\s]+\(#\w+\)/,
            toDOM(text) {
              const span = document.createElement('span')
              span.innerHTML = text
              span.style.color = colorVariables.active
              return span
            }
          }
        ]
      }
      return options
    }
  },
  watch: {
    selectedProjectId(val) {
      if (val) this.batchMoveToVersion = null
    }
  },
  mounted() {
    this.getTree()
  },
  methods: {
    async getTree() {
      this.allIssuesTree = []
      this.treeLoading = true
      const params = { version_ids: this.selectedVersions.toString() }
      await getProjectIssueChildren(this.selectedProjectId, params)
        .then((res) => {
          this.allIssuesTree.push(...res.data)
        })
        .catch(() => {})
        .finally(() => {
          this.$refs.filter?.onChangeFilter()
          this.treeLoading = false
        })
    },
    checkTreeNode(data) {
      const node = this.$refs.tree.getNode(data)
      if (node.checked && node.childNodes.length > 0) {
        this.checkChildrenNode(node)
      } else if (!node.checked && node.parent) {
        this.checkParentNode(node)
      }
      this.selectedIssueIds = this.$refs.tree.getCheckedKeys()
    },
    checkParentNode(node) {
      if (!node.parent) return
      node.parent.checked = node.checked
      this.checkParentNode(node.parent)
    },
    checkChildrenNode(node) {
      node.childNodes.forEach((item) => {
        if (item.data.is_closed) return
        item.checked = node.checked
        if (item.childNodes.length === 0) return
        this.checkChildrenNode(item)
      })
    },
    changeFilter(val) {
      this.$refs.tree.filter(val)
    },
    filterNode(value, data) {
      const is_closed = value.is_closed
      const isSearch = value.keyword !== ''
      const search =
        data.id.toString().indexOf(value.keyword) !== -1 ||
        data.subject.indexOf(value.keyword) !== -1
      if (is_closed && !isSearch) return true
      if (is_closed && isSearch) return search
      if (!is_closed && isSearch) return !data.is_closed && search
      else return !data.is_closed
    },
    handleSelectAll() {
      const root = this.$refs.tree.getNode(this.allIssuesTree[0].id).parent
      root.childNodes.forEach((item) => {
        if (item.data.is_closed) return
        item.checked = this.selectAll
        this.checkChildrenNode(item)
      })
      this.selectedIssueIds = this.$refs.tree.getCheckedKeys()
    },
    handleEdit(row) {
      this.issueDetailDialogVisible = true
      this.editedIssueId = row.id
    },
    handleRelationUpdate() {
      this.$emit('onInit')
    },
    handleClosedIssueDialogVisible(row) {
      this.closedRow = row
      this.closedIssueDialogVisible = true
    },
    async handleCloseIssue() {
      const note = this.$refs?.mdEditor?.invoke('getMarkdown')
      const sendData = note ? { note, status_id: 6 } : { status_id: 6 }
      this.closeIssue(sendData)
    },
    closeIssue(sendData) {
      this.dialogLoading = true
      const issueId = this.closedRow.id
      updateIssue(issueId, sendData)
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
        })
        .catch((err) => {
          console.error(err)
        })
        .finally(() => {
          this.dialogLoading = false
          this.closedIssueDialogVisible = false
          this.$emit('onInit')
        })
    },
    async batchClose() {
      this.treeLoading = true
      await closeAllIssuesByIds({ issue_ids: this.selectedIssueIds })
        .then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
        })
        .catch((err) => {
          console.error(err)
        })
        .finally(() => {
          this.treeLoading = false
          this.$emit('onInit')
        })
    },
    async batchMove() {
      this.dialogLoading = true
      const sendData = {
        version_id: this.batchMoveToVersion
      }
      const updatePromises = this.selectedIssueIds.map((issueId) =>
        updateIssue(issueId, sendData)
      )

      Promise.allSettled(updatePromises).then((results) => {
        results.forEach((result, index) => {
          if (result.status !== 'fulfilled') {
            this.$alert(
              `Failed to update issues: ${this.selectedIssueIds[index]}`,
              this.$t('general.Error'),
              {
                confirmButtonText: this.$t('general.Confirm')
              }
            )
          }
        })
      })

      this.dialogLoading = false
      this.batchMoveDialogVisible = false
      this.$emit('onInit')
    },
    calcStyle(node, data) {
      const nodeWidth = 1.125 * (node.level - 1) + 'rem'
      const style = {
        display: 'inline-block',
        fontSize: '14px',
        lineHeight: '20px',
        width: `calc(25rem - ${nodeWidth})`
      }
      if (data.is_closed) {
        style.color = 'gray'
        style.opacity = '0.5'
      }
      if (data.version && !this.selectedVersions.includes(data.version.id)) {
        delete style.color
      }
      return style
    }
  }
}
</script>

<style lang="scss" scoped>
.el-form-item {
  padding: 10px 10px;
  font-weight: bold;
}

::v-deep {
  .el-tree-node__content {
    height: 30px;
  }

  .el-card__body {
    padding: 10px;
  }

  .el-button + .el-button {
    margin-left: 0;
  }
}

.mobile {
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
