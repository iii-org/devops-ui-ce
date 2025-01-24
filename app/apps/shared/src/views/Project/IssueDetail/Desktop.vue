<template>
  <div
    :class="isInDialog ? 'in-dialog' : ''"
    :style="isFromBoard ? 'padding: 0' : ''"
    class="app-container"
  >
    <el-card
      v-loading="isLoading"
      :body-style="{ 'min-height': '78vh' }"
      :element-loading-text="$t('Loading')"
      :style="!isFromBoard ? 'height: 91vh; overflow: auto;' : ''"
    >
      <el-row slot="header">
        <el-row align="bottom" justify="space-between" type="flex">
          <el-row>
            <el-col
              :style="isFromBoard ? 'max-width: 500px;' : ''"
              class="text-xl mr-3"
            >
              <el-button
                v-if="!isInDialog"
                class="previous link-text-color"
                icon="el-icon-arrow-left"
                size="medium"
                type="text"
                @click="$parent.handleBackPage"
              >
                {{ $t('general.Back') }}
              </el-button>
              <span
                :class="form.status_id === 6 ? 'grey-title' : ''"
                class="align-middle"
              >
                <Status
                  v-if="form.status_id === 6"
                  :name="$t(`Issue.Closed`)"
                  class="mx-1"
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
                <span> #{{ issueId }} - </span>
                <IssueTitle
                  ref="IssueTitle"
                  v-model="form.subject"
                  :is-button-disabled="isButtonDisabled"
                  :is-from-board="isFromBoard"
                  :issue-id="issueId"
                  :old-value="originForm.subject"
                  @update="$parent.historyUpdate"
                />
              </span>
            </el-col>
          </el-row>
          <el-col :span="8" class="text-right">
            <el-row class="mb-3">
              <span v-if="!isLoading && issueId" class="text-sm">
                {{
                  $t('Issue.AddBy', {
                    user: author,
                    create_at: $parent.getRelativeTime(createAt)
                  })
                }}
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
                :assigned="assigned"
                :issue="issue"
                @copyUrl="$parent.copyUrl"
              />
              <el-tooltip :content="$t('general.CopyUrl')" placement="bottom">
                <el-button circle size="small" @click="$parent.copyUrl">
                  <em class="el-icon-copy-document"></em>
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="isFromBoard"
                :content="$t('general.PopUp')"
                placement="bottom"
              >
                <el-button circle size="small" @click="$parent.$emit('popup')">
                  <em class="ri-external-link-line"></em>
                </el-button>
              </el-tooltip>
              <AddToCalendar :form="form" :issue-id="issueId" />
              <el-tooltip
                v-if="!isFromBoard"
                v-permission="[
                  'sysadmin',
                  'Organization Owner',
                  'Project Manager',
                  'QA'
                ]"
                :content="$t('general.Delete')"
                placement="bottom"
              >
                <el-button
                  :disabled="isButtonDisabled"
                  :type="isButtonDisabled ? 'info' : 'danger'"
                  circle
                  size="small"
                  @click="$parent.isDeleteIssueDialog = true"
                >
                  <em class="el-icon-delete"></em>
                </el-button>
              </el-tooltip>
            </el-row>
          </el-col>
        </el-row>
      </el-row>
      <el-row :class="isFromBoard ? 'board' : ''" :gutter="20">
        <el-col
          ref="mainIssueWrapper"
          :sm="isFromBoard ? 24 : isIssueFormOpened ? 16 : 24"
          :span="24"
          @mousemove.native="detectEditorHeight"
          @mouseup.native="detectEditorHeight(false)"
          @mouseleave.native="detectEditorHeight(false)"
        >
          <el-row>
            <el-col :span="24">
              <IssueToolbar
                :count-relation-issue="countRelationIssue"
                :is-button-disabled="isButtonDisabled"
                :is-from-board="isFromBoard"
                :is-issue-form-opened="isIssueFormOpened"
                :is-open-matrix="isOpenMatrix"
                :issue="issue"
                :issue-id="issueId"
                :project-id="form.project_id"
                @changeIssueFormOpened="changeIssueFormOpened"
                @updateWhiteBoard="$parent.updateWhiteBoard"
                @add-sub-issue="$parent.toggleAddSubIssue"
                @is-loading="$parent.showLoading"
                @related-collection="$parent.toggleDialogVisible"
                @toggle-issue-matrix="$parent.toggleIssueMatrixDialog"
              />
            </el-col>
          </el-row>
          <el-row ref="mainIssue" :gutter="10" class="issueHeight">
            <el-collapse-transition>
              <el-col
                v-if="isAddSubIssue"
                id="AddSubIssueWrapper"
                ref="AddSubIssueWrapper"
                :span="24"
                class="mb-3"
              >
                <AddSubIssue
                  ref="AddSubIssue"
                  :form.sync="form"
                  :issue-id="issueId"
                  :parent="parent"
                  :parent-data="issue"
                  :relations.sync="relations"
                  @close="$parent.isAddSubIssue = !isAddSubIssue"
                  @update="$parent.historyUpdate"
                />
              </el-col>
            </el-collapse-transition>
            <el-col :span="24">
              <IssueDescription
                ref="IssueDescription"
                v-model="form.description"
                :assigned="assigned"
                :data-loaded="dataLoaded"
                :is-button-disabled="isButtonDisabled"
                :is-issue-edited="isIssueEdited"
                :issue-form-width="issueFormWidth"
                :issue-id="issueId"
                :issue-subject="issueSubject"
                :old-value="originForm.description"
                @filterImage="$parent.filterImage"
                @update="$parent.historyUpdate"
              />
            </el-col>
            <el-col :span="24">
              <el-collapse
                v-if="
                  files.length > 0 ||
                    testFiles.length > 0 ||
                    countRelationIssue > 0 ||
                    isFromBoard
                "
                v-model="relationVisible"
                accordion
              >
                <el-collapse-item v-if="files.length > 0" name="files">
                  <div slot="title" class="text-sm font-bold">
                    {{ $t('Issue.Files') + `(${files.length})` }}
                  </div>
                  <IssueFiles
                    :is-button-disabled="isButtonDisabled"
                    :issue-file.sync="files"
                    :issue-id="issueId"
                  />
                </el-collapse-item>
                <el-collapse-item
                  v-if="testFiles.length > 0"
                  v-loading="isLoadingTestFile"
                  name="testFiles"
                >
                  <div slot="title" class="text-sm font-bold">
                    {{
                      $t('Test.TestPlan.file_name') + `(${testFiles.length})`
                    }}
                  </div>
                  <IssueCollection
                    :is-button-disabled="isButtonDisabled"
                    :selected-collections.sync="testFiles"
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
                    :family="countRelationIssue > 0"
                    :is-button-disabled="isButtonDisabled"
                    :issue="issue"
                    :popup="true"
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
                    :activity-list="activityList"
                    :children-issue="children"
                    :data-loaded="dataLoaded"
                    :form.sync="form"
                    :is-button-disabled="isButtonDisabled"
                    :is-form-collapse-open="relationVisible === 'issueForm'"
                    :is-from-board="isFromBoard"
                    :is-issue-edited="isIssueEdited"
                    :issue="issue"
                    :issue-id="issueId"
                    :issue-project="issueProject"
                    :parent="parent"
                    class="mx-3 text-xs"
                    @update="$parent.historyUpdate"
                    @update-spent-time="handleSpentTimeUpdate"
                  />
                </el-collapse-item>
              </el-collapse>
            </el-col>
            <el-col
              ref="moveEditor"
              :span="24"
              class="mb-3"
              style="
                position: sticky;
                top: 0;
                z-index: 3;
                background-color: white;
              "
            >
              <IssueNotesEditor
                ref="IssueNotesEditor"
                v-model="form.notes"
                :assigned="assigned"
                :data-loaded="dataLoaded"
                :is-button-disabled="isButtonDisabled"
                :is-description-empty="originForm.description === ''"
                :is-issue-edited="isIssueEdited"
                :issue-id="issueId"
                :issue-subject="issueSubject"
                @filterImage="$parent.filterImage"
                @update="$parent.historyUpdate"
              />
            </el-col>
            <el-col :span="24">
              <el-tabs
                v-model="$parent.issueTabs"
                class="m-3 mt-0"
                type="border-card"
              >
                <el-tab-pane v-loading="historyLoading" name="history">
                  <template slot="label">
                    <span>
                      <em class="ri-history-line"></em>
                      {{ $t('Issue.History') }}
                    </span>
                  </template>
                  <IssueNotesDialog
                    :data="journals"
                    :height="dialogHeight"
                    @show-parent-issue="$parent.onRelationIssueDialog"
                  />
                </el-tab-pane>
                <el-tab-pane v-if="services.gitlab" name="commitLog">
                  <template slot="label">
                    <span>
                      <em class="ri-git-commit-line"></em>
                      {{ $t('Issue.Commit') }}
                    </span>
                  </template>
                  <AdminCommitLog
                    ref="AdminCommitLog"
                    :get-data="$parent.getGitCommitLogData"
                    :height="dialogHeight"
                    :issue="issue"
                    :issue-id="issueId"
                    :issue-subject="form.subject"
                  />
                </el-tab-pane>
                <el-tab-pane v-if="isHasWhiteBoard" name="whiteBoard">
                  <template slot="label">
                    <span>
                      <em class="el-icon-monitor"></em>
                      {{ $t('Plugins.excalidraw.Whiteboard') }}
                    </span>
                  </template>
                  <WhiteBoardTable
                    ref="WhiteBoardTable"
                    :excalidraw-data="issue.excalidraw"
                    :height="dialogHeight"
                    :issue-id="issueId"
                    @update="$parent.fetchIssueLink"
                  />
                </el-tab-pane>
                <el-tab-pane name="SpentHours">
                  <template slot="label">
                    <span>
                      <em class="el-icon-time"></em>
                      {{ $t('Issue.SpentHours') }}
                    </span>
                  </template>
                  <IssueSpentHoursLog
                    ref="IssueSpentHoursLog"
                    :activity-list="activityList"
                    :issue="issue"
                    :issue-id="issueId"
                    @update-spent-time="handleSpentTimeUpdate"
                  />
                </el-tab-pane>
              </el-tabs>
            </el-col>
          </el-row>
        </el-col>
        <el-col
          v-show="isIssueFormOpened"
          :sm="8"
          :span="24"
          class="issueOptionHeight"
        >
          <IssueForm
            v-if="!isFromBoard"
            ref="IssueForm"
            :activity-list="activityList"
            :children-issue="children"
            :data-loaded="dataLoaded"
            :form.sync="form"
            :is-button-disabled="isButtonDisabled"
            :is-issue-edited="isIssueEdited"
            :issue="issue"
            :issue-id="issueId"
            :issue-project="issueProject"
            :parent="parent"
            @update="$parent.historyUpdate"
            @update-spent-time="handleSpentTimeUpdate"
          />
        </el-col>
      </el-row>
    </el-card>
    <el-backtop
      :bottom="50"
      :right="issueFormWidth"
      :visibility-height="500"
      target=".issueHeight"
    />
    <el-dialog
      :before-close="$parent.handleRelationIssueDialogBeforeClose"
      :visible.sync="relationIssue.visible"
      append-to-body
      destroy-on-close
      top="3vh"
      width="90%"
    >
      <IssueDetail
        v-if="relationIssue.visible"
        ref="children"
        :is-in-dialog="true"
        :is-open-matrix="isOpenMatrix"
        :props-issue-id="relationIssue.id"
        @delete="$parent.handleRelationDelete"
        @update="$parent.showLoading"
      />
    </el-dialog>
    <el-dialog
      :close-on-click-modal="false"
      :show-close="false"
      :visible.sync="relatedCollectionDialogVisible"
      append-to-body
      custom-class="relatedCollectionDialog"
      destroy-on-close
      width="80%"
    >
      <RelatedCollectionDialog
        ref="relatedCollectionDialog"
        :selected-collections.sync="testFiles"
        @update="$parent.updateTestCollection"
        @close-dialog="$parent.toggleDialogVisible"
      />
    </el-dialog>
    <el-dialog
      :title="
        $t('Issue.TraceabilityMatrix') +
          '(#' +
          issue.id +
          ' - ' +
          issue.subject +
          ')'
      "
      :visible.sync="issueMatrixDialog.visible"
      append-to-body
      destroy-on-close
      top="20px"
      width="80%"
    >
      <IssueMatrix
        v-if="issueMatrixDialog.visible"
        :row.sync="issue"
        @onCloseIssueMatrix="issueMatrixDialog.visible = false"
        @update-issue="$parent.handleUpdated"
      />
    </el-dialog>
    <el-dialog
      :close-on-click-modal="false"
      :visible.sync="$parent.isShowDialog"
      append-to-body
      destroy-on-close
      width="30%"
      @close="$parent.onCancel"
    >
      <span>
        <em :style="$parent.getStyle('danger')" class="el-icon-warning"></em>
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
      :is-delete-issue="true"
      :is-issue-dialog.sync="$parent.isDeleteIssueDialog"
      :issue="issue"
      :title="`#${issueId} - ${form.subject}`"
      :tracker="tracker"
      @editWhiteBoard="$parent.editWhiteBoard"
      @handleDelete="$parent.handleDelete"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ProjectIssueDetail',
  components: {
    IssueCollection: () => import('./components/IssueCollection'),
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker'),
    IssueTitle: () => import('./components/IssueTitle'),
    IssueDescription: () => import('./components/IssueDescription'),
    IssueForm: () => import('./components/IssueForm'),
    IssueNotesDialog: () => import('./components/IssueNotesDialog'),
    IssueNotesEditor: () => import('./components/IssueNotesEditor'),
    IssueToolbar: () => import('./components/IssueToolbar'),
    IssueFiles: () => import('./components/IssueFiles'),
    IssueMatrix: () => import('./components/IssueMatrix'),
    RelatedCollectionDialog: () =>
      import('@/views/Test/TestFile/components/RelatedCollectionDialog'),
    IssueExpand: () => import('@/components/Issue/IssueExpand'),
    WatchButton: () => import('./components/WatchButton'),
    WhiteBoardTable: () => import('./components/WhiteBoardTable'),
    AddSubIssue: () => import('./components/AddSubIssue'),
    AddToCalendar: () => import('./components/AddToCalendar'),
    AdminCommitLog: () => import('./components/AdminCommitLog'),
    ShareButton: () => import('./components/ShareButton'),
    SubIssueDialog: () => import('./components/SubIssueDialog'),
    IssueSpentHoursLog: () => import('./components/IssueSpentHoursLog'),
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
    issueSubject: {
      type: String,
      default: ''
    },
    author: {
      type: String,
      default: ''
    },
    createAt: {
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
    assigned: {
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
    },
    activityList: {
      type: Array,
      default: () => []
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
    ...mapGetters(['services']),
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
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
      setInterval(() => {
        this.$emit('update:dataLoaded', false)
      }, 5000)
    }
  },
  methods: {
    detectEditorHeight(event) {
      const [IssueDescription, IssueNotesEditor] = [
        this.$refs.IssueDescription,
        this.$refs.IssueNotesEditor
      ]
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
      const movableArea =
        editorHeight + movementY > 200 && editorHeight + movementY < 600
      if (isMoving && movableArea) {
        editor.setHeight(`${editorHeight + movementY}px`)
      }
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
    },
    async handleSpentTimeUpdate() {
      await this.$parent.fetchIssue()
      await this.$refs.IssueSpentHoursLog.fetchSpentHoursList()
      this.$parent.issueTabs = 'SpentHours'
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
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

::v-deep .el-button + .el-button {
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
    .el-card.is-always-shadow,
    .el-card.is-hover-shadow:focus,
    .el-card.is-hover-shadow:hover {
      box-shadow: none;
    }

    .el-dialog__body {
      padding: 22px;
    }
  }
}
</style>
