<template>
  <div
    class="app-container"
    :class="isInDialog ? 'in-dialog' : ''"
    :style="isFromBoard ? 'padding: 0' : ''"
  >
    <el-card
      v-loading="isLoading"
      :element-loading-text="$t('Loading')"
      :body-style="{ 'min-height': '78vh' }"
      :style="!isFromBoard ? 'height: 91vh; overflow: auto;' : ''"
    >
      <el-row slot="header">
        <el-row
          type="flex"
          align="bottom"
          justify="space-between"
        >
          <el-row>
            <el-col
              class="text-xl mr-3"
              :style="isFromBoard ? 'max-width: 500px;' : ''"
            >
              <el-button
                v-if="!isInDialog"
                type="text"
                size="medium"
                icon="el-icon-arrow-left"
                class="previous link-text-color"
                @click="$parent.handleBackPage"
              >
                {{ $t('general.Back') }}
              </el-button>
              <span
                class="align-middle"
                :class="form.status_id === 6 ? 'grey-title' : ''"
              >
                <Status
                  v-if="form.status_id === 6"
                  class="mx-1"
                  :name="$t(`Issue.Closed`)"
                  type="Closed"
                />
                <Tracker
                  v-if="tracker"
                  :name="$t(`Issue.${tracker}`)"
                  :type="tracker"
                />
                <span v-else>
                  {{ $t('Issue.Issue') }}
                </span>
                <span>
                  #{{ issueId }} -
                </span>
                <IssueTitle
                  ref="IssueTitle"
                  v-model="form.name"
                  :old-value="originForm.name"
                  :issue-id="issueId"
                  :is-from-board="isFromBoard"
                  :is-button-disabled="isButtonDisabled"
                  @update="$parent.historyUpdate"
                />
              </span>
            </el-col>
          </el-row>
          <el-col :span="8" class="text-right">
            <el-row class="mb-3">
              <span v-if="!isLoading && issueId" class="text-sm">
                {{ $t('Issue.AddBy', { user: author, created_date: $parent.getRelativeTime(createdDate) }) }}
              </span>
            </el-row>
            <el-row>
              <WatchButton
                :issue.sync="issue"
                @update="$emit('update:issue', $event)"
              />
              <el-divider direction="vertical" />
              <ShareButton
                v-if="!isLite"
                :issue="issue"
                :assigned-to="assignedTo"
                @copyUrl="$parent.copyUrl"
              />
              <el-tooltip
                :content="$t('general.CopyUrl')"
                placement="bottom"
              >
                <el-button
                  circle
                  size="small"
                  @click="$parent.copyUrl"
                >
                  <em class="el-icon-copy-document" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="isFromBoard"
                :content="$t('general.PopUp')"
                placement="bottom"
              >
                <el-button
                  circle
                  size="small"
                  @click="$parent.$emit('popup')"
                >
                  <em class="ri-external-link-line" />
                </el-button>
              </el-tooltip>
              <AddToCalendar
                :issue-id="issueId"
                :form="form"
              />
              <el-tooltip
                v-if="!isFromBoard"
                v-permission="['Administrator','Project Manager','QA']"
                :content="$t('general.Delete')"
                placement="bottom"
              >
                <el-button
                  circle
                  size="small"
                  :type="isButtonDisabled ? 'info' : 'danger'"
                  :disabled="isButtonDisabled"
                  @click="$parent.isDeleteIssueDialog = true"
                >
                  <em class="el-icon-delete" />
                </el-button>
              </el-tooltip>
            </el-row>
          </el-col>
        </el-row>
      </el-row>
      <el-row :gutter="20" :class="isFromBoard ? 'board' : ''">
        <el-col
          ref="mainIssueWrapper"
          :span="24"
          :sm="isFromBoard ? 24 : isIssueFormOpened ? 16 : 24"
          @mousemove.native="detectEditorHeight"
          @mouseup.native="detectEditorHeight(false)"
          @mouseleave.native="detectEditorHeight(false)"
        >
          <el-row>
            <el-col :span="24">
              <IssueToolbar
                :is-button-disabled="isButtonDisabled"
                :issue-link="issueLink"
                :issue-id="issueId"
                :issue-tracker="formTrackerName"
                :project-id="form.project_id"
                :count-relation-issue="countRelationIssue"
                :is-open-matrix="isOpenMatrix"
                :is-from-board="isFromBoard"
                :is-issue-form-opened="isIssueFormOpened"
                @add-sub-issue="$parent.toggleAddSubIssue"
                @is-loading="$parent.showLoading"
                @related-collection="$parent.toggleDialogVisible"
                @toggle-issue-matrix="$parent.toggleIssueMatrixDialog"
                @updateWhiteBoard="$parent.updateWhiteBoard"
                @changeIssueFormOpened="changeIssueFormOpened"
              />
            </el-col>
          </el-row>
          <el-row
            ref="mainIssue"
            :gutter="10"
            class="issueHeight"
          >
            <el-collapse-transition>
              <el-col
                v-if="isAddSubIssue"
                id="AddSubIssueWrapper"
                ref="AddSubIssueWrapper"
                class="mb-3"
                :span="24"
              >
                <AddSubIssue
                  ref="AddSubIssue"
                  :parent-data="issue"
                  :issue-id="issueId"
                  :parent="parent"
                  :relations.sync="relations"
                  :form.sync="form"
                  @close="$parent.isAddSubIssue = !isAddSubIssue"
                  @update="$parent.historyUpdate"
                />
              </el-col>
            </el-collapse-transition>
            <el-col :span="24">
              <IssueDescription
                ref="IssueDescription"
                v-model="form.description"
                :old-value="originForm.description"
                :issue-id="issueId"
                :issue-name="issueName"
                :is-button-disabled="isButtonDisabled"
                :assigned-to="assignedTo"
                :issue-form-width="issueFormWidth"
                :data-loaded="dataLoaded"
                :is-issue-edited="isIssueEdited"
                @filterImage="$parent.filterImage"
                @update="$parent.historyUpdate"
              />
            </el-col>
            <el-col :span="24">
              <el-collapse
                v-if="files.length > 0 || testFiles.length > 0 || countRelationIssue > 0 || isFromBoard"
                v-model="relationVisible"
                accordion
              >
                <el-collapse-item
                  v-if="files.length > 0"
                  name="files"
                >
                  <div slot="title" class="text-sm font-bold">
                    {{ $t('Issue.Files') + `(${files.length})` }}
                  </div>
                  <IssueFiles
                    :is-button-disabled="isButtonDisabled"
                    :issue-file.sync="files"
                  />
                </el-collapse-item>
                <el-collapse-item
                  v-if="testFiles.length > 0"
                  v-loading="isLoadingTestFile"
                  name="testFiles"
                >
                  <div slot="title" class="text-sm font-bold">
                    {{ $t('Test.TestPlan.file_name') + `(${testFiles.length})` }}
                  </div>
                  <IssueCollection
                    :selected-collections.sync="testFiles"
                    :is-button-disabled="isButtonDisabled"
                    @update="$parent.updateTestCollection"
                  />
                </el-collapse-item>
                <el-collapse-item
                  v-if="countRelationIssue > 0"
                  v-loading="isLoadingFamily"
                  name="relatedIssue"
                >
                  <div slot="title" class="text-sm font-bold">
                    {{ $t('Issue.RelatedIssue') + `(${countRelationIssue})` }}
                  </div>
                  <IssueExpand
                    :issue="$parent.$data"
                    :family="countRelationIssue > 0"
                    :popup="true"
                    :is-button-disabled="isButtonDisabled"
                    :reload="relationVisible"
                    @update="$parent.historyUpdate"
                    @on-context-menu="$parent.onContextMenu"
                    @popup-dialog="$parent.onRelationIssueDialog"
                  />
                </el-collapse-item>
                <el-collapse-item v-if="isFromBoard" name="issueForm">
                  <div slot="title" class="text-sm font-bold">
                    {{ $t('general.AdvancedSettings') }}
                  </div>
                  <IssueForm
                    ref="IssueForm"
                    class="mx-3 text-xs"
                    :is-button-disabled="isButtonDisabled"
                    :issue="issue"
                    :issue-id="issueId"
                    :issue-project="issueProject"
                    :is-from-board="isFromBoard"
                    :data-loaded="dataLoaded"
                    :form.sync="form"
                    :parent="parent"
                    :children-issue="children"
                    :is-issue-edited="isIssueEdited"
                    :is-form-collapse-open="relationVisible === 'issueForm'"
                    @update="$parent.historyUpdate"
                  />
                </el-collapse-item>
              </el-collapse>
            </el-col>
            <el-col
              ref="moveEditor"
              :span="24"
              class="mb-3"
              style="position: sticky; top: 0; z-index: 3; background-color: white;"
            >
              <IssueNotesEditor
                ref="IssueNotesEditor"
                v-model="form.notes"
                :issue-id="issueId"
                :issue-name="issueName"
                :is-button-disabled="isButtonDisabled"
                :assigned-to="assignedTo"
                :is-issue-edited="isIssueEdited"
                :data-loaded="dataLoaded"
                :is-description-empty="originForm.description === ''"
                @filterImage="$parent.filterImage"
                @update="$parent.historyUpdate"
              />
            </el-col>
            <el-col :span="24">
              <el-tabs
                v-model="$parent.issueTabs"
                type="border-card"
                class="m-3 mt-0"
              >
                <el-tab-pane
                  v-loading="historyLoading"
                  name="history"
                >
                  <template slot="label">
                    <span>
                      <em class="ri-history-line" />
                      {{ $t('Issue.History') }}
                    </span>
                  </template>
                  <IssueNotesDialog
                    :height="dialogHeight"
                    :data="journals"
                    @show-parent-issue="$parent.onRelationIssueDialog"
                  />
                </el-tab-pane>
                <el-tab-pane name="commitLog">
                  <template slot="label">
                    <span>
                      <em class="ri-git-commit-line" />
                      {{ $t('Issue.Commit') }}
                    </span>
                  </template>
                  <AdminCommitLog
                    ref="AdminCommitLog"
                    :issue-id="issueId"
                    :issue-name="form.name"
                    :get-data="$parent.getGitCommitLogData"
                    :height="dialogHeight"
                  />
                </el-tab-pane>
                <el-tab-pane v-if="isHasWhiteBoard" name="whiteBoard">
                  <template slot="label">
                    <span>
                      <em class="el-icon-monitor" />
                      {{ $t('Excalidraw.Whiteboard') }}
                    </span>
                  </template>
                  <WhiteBoardTable
                    ref="WhiteBoardTable"
                    :issue-id="issueId"
                    :excalidraw-data="issue.excalidraw"
                    :height="dialogHeight"
                    @update="$parent.fetchIssueLink"
                  />
                </el-tab-pane>
              </el-tabs>
            </el-col>
          </el-row>
        </el-col>
        <el-col
          v-show="isIssueFormOpened"
          class="issueOptionHeight"
          :span="24"
          :sm="8"
        >
          <IssueForm
            v-if="!isFromBoard"
            ref="IssueForm"
            :is-button-disabled="isButtonDisabled"
            :issue="issue"
            :issue-id="issueId"
            :issue-project="issueProject"
            :data-loaded="dataLoaded"
            :form.sync="form"
            :parent="parent"
            :children-issue="children"
            :is-issue-edited="isIssueEdited"
            @update="$parent.historyUpdate"
          />
        </el-col>
      </el-row>
    </el-card>
    <el-backtop
      target=".issueHeight"
      :visibility-height="500"
      :right="issueFormWidth"
      :bottom="50"
    />
    <el-dialog
      :visible.sync="relationIssue.visible"
      width="90%"
      top="3vh"
      append-to-body
      destroy-on-close
      :before-close="$parent.handleRelationIssueDialogBeforeClose"
    >
      <IssueDetail
        v-if="relationIssue.visible"
        ref="children"
        :is-open-matrix="isOpenMatrix"
        :props-issue-id="relationIssue.id"
        :is-in-dialog="true"
        @update="$parent.showLoading"
        @delete="$parent.handleRelationDelete"
      />
    </el-dialog>
    <el-dialog
      :visible.sync="relatedCollectionDialogVisible"
      :close-on-click-modal="false"
      width="80%"
      :show-close="false"
      custom-class="relatedCollectionDialog"
      append-to-body
      destroy-on-close
    >
      <RelatedCollectionDialog
        ref="relatedCollectionDialog"
        :selected-collections.sync="testFiles"
        @update="$parent.updateTestCollection"
        @close-dialog="$parent.toggleDialogVisible"
      />
    </el-dialog>
    <el-dialog
      :visible.sync="issueMatrixDialog.visible"
      width="80%"
      top="20px"
      append-to-body
      destroy-on-close
      :title="$t('Issue.TraceabilityMatrix') + '(#' + issue.id + ' - ' + issue.name + ')'"
    >
      <IssueMatrix
        v-if="issueMatrixDialog.visible"
        :row.sync="issue"
        @update-issue="$parent.handleUpdated"
        @onCloseIssueMatrix="issueMatrixDialog.visible = false"
      />
    </el-dialog>
    <el-dialog
      :visible.sync="$parent.isShowDialog"
      append-to-body
      destroy-on-close
      width="30%"
      :close-on-click-modal="false"
      @close="$parent.onCancel"
    >
      <span>
        <em class="el-icon-warning" :style="$parent.getStyle('danger')" />
        {{ $t('Notify.ChangeProject') }}
      </span>
      <span slot="footer">
        <el-button @click="$parent.onCancel">
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button type="primary" @click="$parent.onConfirm">
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </el-dialog>
    <SubIssueDialog
      :is-issue-dialog.sync="$parent.isDeleteIssueDialog"
      :is-delete-issue="true"
      :issue="issue"
      @editWhiteBoard="$parent.editWhiteBoard"
      @handleDelete="$parent.handleDelete"
    />
  </div>
</template>

<script>
import { Status, Tracker, IssueExpand } from '@/components/Issue'
import {
  IssueForm,
  IssueNotesDialog,
  IssueNotesEditor,
  IssueFiles,
  IssueDescription,
  IssueTitle,
  IssueToolbar,
  IssueMatrix,
  IssueCollection,
  WatchButton,
  WhiteBoardTable,
  AddSubIssue,
  AddToCalendar,
  AdminCommitLog,
  ShareButton,
  SubIssueDialog
} from './components'
import RelatedCollectionDialog from '@/views/Test/TestFile/components/RelatedCollectionDialog'

export default {
  name: 'ProjectIssueDetail',
  components: {
    IssueCollection,
    Status,
    Tracker,
    IssueTitle,
    IssueDescription,
    IssueForm,
    IssueNotesDialog,
    IssueNotesEditor,
    IssueToolbar,
    IssueFiles,
    IssueMatrix,
    RelatedCollectionDialog,
    IssueExpand,
    WatchButton,
    WhiteBoardTable,
    AddSubIssue,
    AddToCalendar,
    AdminCommitLog,
    ShareButton,
    SubIssueDialog,
    IssueDetail: () => import('./index.vue')
  },
  // mixins: [ContextMenu],
  props: {
    propsIssueId: {
      type: [String, Number],
      default: null
    },
    isInDialog: {
      type: Boolean,
      default: false
    },
    isFromBoard: {
      type: Boolean,
      default: false
    },
    isOpenMatrix: {
      type: Boolean,
      default: false
    },
    originForm: {
      type: Object,
      default: () => ({})
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    issueMatrixDialog: {
      type: Object,
      default: () => ({})
    },
    rootProjectId: {
      type: [String, Number],
      default: null
    },
    issueLink: {
      type: String,
      default: ''
    },
    issue: {
      type: Object,
      default: () => ({})
    },
    issueId: {
      type: Number,
      default: null
    },
    issueName: {
      type: String,
      default: ''
    },
    author: {
      type: String,
      default: ''
    },
    createdDate: {
      type: String,
      default: ''
    },
    tracker: {
      type: String,
      default: ''
    },
    view: {
      type: Object,
      default: () => ({})
    },
    form: {
      type: Object,
      default: () => ({})
    },
    files: {
      type: Array,
      default: () => []
    },
    testFiles: {
      type: Array,
      default: () => []
    },
    journals: {
      type: Array,
      default: () => []
    },
    requestGitLabLastTime: {
      type: Number,
      default: null
    },
    parent: {
      type: Object,
      default: () => ({})
    },
    children: {
      type: Array,
      default: () => []
    },
    tags: {
      type: Array,
      default: () => []
    },
    relationIssue: {
      type: Object,
      default: () => ({})
    },
    relations: {
      type: Array,
      default: () => []
    },
    relatedCollectionDialogVisible: {
      type: Boolean,
      default: false
    },
    tagsString: {
      type: String,
      default: ''
    },
    isLoadingFamily: {
      type: Boolean,
      default: false
    },
    isLoadingTestFile: {
      type: Boolean,
      default: false
    },
    projectRelationList: {
      type: Array,
      default: () => []
    },
    storagePId: {
      type: [String, Number],
      default: null
    },
    issueProject: {
      type: Object,
      default: () => ({})
    },
    isAddSubIssue: {
      type: Boolean,
      default: false
    },
    historyLoading: {
      type: Boolean,
      default: false
    },
    assignedTo: {
      type: Array,
      default: () => []
    },
    countRelationIssue: {
      type: Number,
      default: 0
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    },
    formProjectId: {
      type: [String, Number],
      default: null
    },
    isHasWhiteBoard: {
      type: Boolean,
      default: false
    },
    isIssueEdited: {
      type: Object,
      default: () => ({})
    },
    dataLoaded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      relationVisible: '',
      isIssueFormOpened: !this.isFromBoard,
      issueFormWidth: 80,
      mode: 'view',
      editorHeight: '100px',
      dialogHeight: '100%'
    }
  },
  computed: {
    formTrackerName() {
      if (!this.form.tracker_id || !this.$refs['IssueForm']) return null
      const getTrackerName = this.$refs['IssueForm'].tracker.find((item) => item.id === this.form.tracker_id)
      if (!getTrackerName) return null
      return getTrackerName.name
    },
    isLite() {
      return process.env.VUE_APP_PROJECT === 'LITE'
    }
  },
  watch: {
    mode(value) {
      if (value === 'view') {
        this.editorHeight = '100px'
      } else {
        this.editorHeight = '390px'
      }
    },
    propsIssueId() {
      this.$refs.IssueForm.watchForm()
    },
    dataLoaded(value) {
      if (!value) return
      setInterval(() => { this.$emit('update:dataLoaded', false) }, 5000)
    }
  },
  methods: {
    detectEditorHeight(event) {
      const [IssueDescription, IssueNotesEditor] = [this.$refs.IssueDescription, this.$refs.IssueNotesEditor]
      const { movementY } = event
      if (!event) {
        IssueDescription.isMoving = false
        IssueNotesEditor.isMoving = false
      }
      if (IssueDescription.isMoving) {
        this.updateEditorHeight(IssueDescription, movementY)
      } else if (IssueNotesEditor.isMoving) {
        this.updateEditorHeight(IssueNotesEditor, movementY)
      }
    },
    updateEditorHeight(IssueEditor, movementY) {
      const { edit, isMoving } = IssueEditor
      if (!edit) return
      const { $el, editor } = IssueEditor.$refs.mdEditor
      const editorHeight = $el.clientHeight
      const movableArea = editorHeight + movementY > 200 && editorHeight + movementY < 600
      if (isMoving && movableArea) editor.setHeight(`${editorHeight + movementY}px`)
    },
    changeIssueFormOpened() {
      this.isIssueFormOpened = !this.isIssueFormOpened
      this.calcIssueFormWidth()
    },
    calcIssueFormWidth() {
      this.$nextTick(() => {
        if (this.isFromBoard) {
          this.issueFormWidth = 80
        } else {
          if (!this.$refs.IssueDetails) return
          const clientWidth = this.$refs.IssueForm.$el.clientWidth
          this.issueFormWidth = this.isIssueFormOpened ? clientWidth + 130 : 100
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
@import 'src/styles/theme/mixin.scss';

::v-deep .is-align-bottom {
  align-items: center;
}

.issueHeight {
  height: calc(95vh - 50px - 80px - 30px - 82px);
  overflow-y: auto;
}

.board {
  .issueHeight {
    height: calc(95vh - 50px - 80px - 30px - 34px);
  }
}

.issueOptionHeight {
  height: calc(95vh - 50px - 80px - 58px);
  overflow-y: auto;
}

.point {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
  display: inline-block;

  &.feature {
    background: $feature;
  }

  &.document {
    background: $document;
  }

  &.bug {
    background: $bug;
  }

  &.research {
    background: $research;
  }
}

.el-tag {
  &--secondary {
    @include background-border-color($secondary, $secondary);
  }
}

.previous {
  font-size: 0.75em;
}

::v-deep .el-collapse-item__arrow {
  margin: 0 8px 0 8px;
}

::v-deep .relatedCollectionDialog.el-dialog {
  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 10px 20px;
  }
}

::v-deep .el-button+.el-button {
  margin: 0;
}
.grey-title {
  color: grey;
  ::v-deep .point {
    background-color: grey !important;
  }
}
.in-dialog {
  padding: 0;
  ::v-deep {
    .el-card.is-always-shadow, .el-card.is-hover-shadow:focus, .el-card.is-hover-shadow:hover {
      box-shadow: none;
    }
    .el-dialog__body {
      padding: 22px;
    }
  }
}
</style>
