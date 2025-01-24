<template>
  <div style="padding: 0">
    <el-row class="my-2 sticky top-0">
      <el-col :class="form.subject ? 'issue-title truncate' : ''">
        <el-button
          v-if="!isInDialog"
          class="previous link-text-color px-3"
          icon="el-icon-arrow-left"
          size="medium"
          type="text"
          @click="$parent.handleBackPage"
        />
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
          <span v-else>{{ $t('Issue.Issue') }}</span>
          <span>#{{ issueId }} - </span>
          <span
            v-if="form.subject"
            @click="isEditTitleVisible = !isEditTitleVisible"
          >
            {{ form.subject }}
          </span>
          <el-input
            v-else
            v-model="form.subject"
            placeholder="Please input issue subject"
            size="small"
            style="width: 50%"
          />
        </span>
      </el-col>
    </el-row>
    <div>
      <el-tabs
        v-model="activeTab"
        v-loading="isLoading"
        stretch
        tab-position="bottom"
        type="border-card"
      >
        <el-tab-pane name="form">
          <em slot="label" class="ri-survey-line text-xl align-middle"></em>
          <div class="card">
            <el-card>
              <IssueDescription
                ref="IssueDescription"
                v-model="form.description"
                :assigned="assigned"
                :is-button-disabled="isButtonDisabled"
                :is-issue-edited="isIssueEdited"
                :issue-id="issueId"
                :issue-subject="issueSubject"
                :old-value="originForm.description"
                @filterImage="$parent.filterImage"
                @update="$parent.getData"
              />
            </el-card>
            <IssueForm
              ref="IssueForm"
              :activity-list="activityList"
              :children-issue="children"
              :form.sync="form"
              :is-button-disabled="isButtonDisabled"
              :is-from-board="isFromBoard"
              :is-issue-edited="isIssueEdited"
              :issue="issue"
              :issue-id="issueId"
              :issue-project="issueProject"
              :parent="parent"
              class="content"
              @update="$parent.historyUpdate"
              @update-spent-time="handleSpentTimeUpdate"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane name="relation">
          <em slot="label" class="ri-stackshare-line text-xl align-middle"></em>
          <div class="card notes" style="margin-bottom: 80px">
            <div class="item">
              <div slot="title" class="text-sm font-bold title">
                <el-divider direction="vertical" />
                <span class="text">
                  {{ $t('Issue.RelatedIssue') + ` (${countRelationIssue})` }}
                </span>
              </div>
              <el-divider />
              <IssueExpand
                v-if="countRelationIssue > 0"
                :family="countRelationIssue > 0"
                :is-button-disabled="isButtonDisabled"
                :issue="$parent.$data"
                :popup="true"
                :reload="'relatedIssue'"
                @update="$parent.historyUpdate"
                @on-context-menu="$parent.onContextMenu"
                @popup-dialog="$parent.onRelationIssueDialog"
              />
              <el-empty v-else :description="$t('general.NoData')" />
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane name="files">
          <em slot="label" class="ri-attachment-line text-xl align-middle"></em>
          <div class="card notes">
            <div class="item">
              <div slot="title" class="text-sm font-bold title">
                <el-divider direction="vertical" />
                <span class="text">
                  {{ $t('Issue.Files') + ` (${files.length})` }}
                </span>
              </div>
              <el-divider />
              <IssueFiles
                v-if="files.length > 0"
                :is-button-disabled="isButtonDisabled"
                :issue-file.sync="files"
                :issue-id="issueId"
              />
              <el-empty v-else :description="$t('general.NoData')" />
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane name="history">
          <em slot="label" class="ri-history-line text-xl align-middle"></em>
          <div v-loading="historyLoading" class="card notes">
            <div class="item">
              <div slot="title" class="text-sm font-bold title">
                <el-divider direction="vertical" />
                <span class="text">{{ $t('Issue.History') }}</span>
              </div>
              <el-divider />
              <IssueNotesDialog
                :data="journals"
                height="auto"
                @show-parent-issue="$parent.onRelationIssueDialog"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <Fab
      :actions="fabActions"
      bg-color="#409eff"
      icon-size="small"
      main-icon="ri-more-2-fill"
      position="bottom-right"
      @addComment="handleAddComment"
      @addToCalendar="isCalDrawerVisible = !isCalDrawerVisible"
      @copyIssue="$parent.copyUrl"
      @unwatchIssue="setStar(false)"
      @watchIssue="setStar(true)"
    />
    <el-drawer
      v-loading="isLoading"
      :visible.sync="isCalDrawerVisible"
      class="drawer"
      destroy-on-close
      direction="btt"
      size="auto"
    >
      <div slot="title" class="title">
        <span>
          <el-divider direction="vertical" />
          <span class="text">{{ $t('Issue.AddToCalendar') }}</span>
        </span>
      </div>
      <div class="container">
        <el-card shadow="never">
          <AddToCalendar :form="form" :issue-id="issueId" />
        </el-card>
      </div>
    </el-drawer>
    <el-drawer
      v-loading="isLoading"
      :visible.sync="isAddCommentVisible"
      class="drawer"
      destroy-on-close
      direction="btt"
      size="auto"
    >
      <div slot="title" class="title">
        <span class="flex justify-between items-center">
          <span>
            <el-divider direction="vertical" />
            <span class="text">{{ $t('Issue.Notes') }}</span>
          </span>
          <el-button
            class="action align-middle rounded-md"
            size="small"
            @click="updateAddComment"
          >
            {{ $t('general.Save') }}
          </el-button>
        </span>
      </div>
      <div class="container">
        <el-card shadow="never">
          <IssueNotesEditor
            ref="IssueNotesEditor"
            v-model="form.notes"
            :assigned="assigned"
            :is-button-disabled="isButtonDisabled"
            :is-drawer="true"
            :issue-id="issueId"
            :issue-subject="issueSubject"
            @filterImage="$parent.filterImage"
            @update="$parent.historyUpdate"
          />
        </el-card>
      </div>
    </el-drawer>
    <el-drawer
      v-loading="isLoading"
      :visible.sync="isEditTitleVisible"
      class="drawer"
      destroy-on-close
      direction="btt"
      size="auto"
      @close="handleDicardEditTitle"
    >
      <div slot="title" class="title">
        <span class="flex justify-between items-center">
          <span>
            <el-divider direction="vertical" />
            <span class="text">
              {{ $t('Dashboard.ADMIN.IssueRank.issue_name') }}
            </span>
          </span>
          <el-button
            class="action align-middle rounded-md"
            size="small"
            @click="updateIssueTitle"
          >
            {{ $t('general.Save') }}
          </el-button>
        </span>
      </div>
      <div class="container">
        <el-card shadow="never">
          <el-input
            v-model="form.subject"
            placeholder="Please input issue subject"
            style="width: 100%"
          />
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  addIssueWatcher,
  getIssueDetails,
  removeIssueWatcher,
  updateIssue
} from '@/api_v3/issues'
import { mapGetters } from 'vuex'

export default {
  name: 'IssueDetailMobile',
  components: {
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker'),
    IssueDescription: () => import('./components/IssueDescription'),
    IssueForm: () => import('./components/IssueForm'),
    IssueExpand: () => import('@/components/Issue/IssueExpand'),
    IssueFiles: () => import('./components/IssueFiles'),
    IssueNotesDialog: () => import('./components/IssueNotesDialog'),
    IssueNotesEditor: () => import('./components/IssueNotesEditor'),
    AddToCalendar: () => import('./components/AddToCalendar'),
    Fab: () => import('@shared/components/Fab')
  },
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
    form: {
      type: Object,
      default: () => ({})
    },
    tracker: {
      type: String,
      default: ''
    },
    issueId: {
      type: Number,
      default: null
    },
    issueSubject: {
      type: String,
      default: ''
    },
    originForm: {
      type: Object,
      default: () => ({})
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    },
    assigned: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    issueProject: {
      type: Object,
      default: () => ({})
    },
    parent: {
      type: Object,
      default: () => ({})
    },
    children: {
      type: Array,
      default: () => []
    },
    issue: {
      type: Object,
      default: () => ({})
    },
    countRelationIssue: {
      type: Number,
      default: 0
    },
    files: {
      type: Array,
      default: () => []
    },
    journals: {
      type: Array,
      default: () => []
    },
    historyLoading: {
      type: Boolean,
      default: false
    },
    isIssueEdited: {
      type: Object,
      default: () => ({})
    },
    activityList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      previousTouch: 0,
      isCalDrawerVisible: false,
      isAddCommentVisible: false,
      isEditTitleVisible: false,
      activeTab: 'form'
    }
  },
  computed: {
    ...mapGetters(['device', 'userId', 'userName']),
    isWatched() {
      return this.issue.watchers?.some((watcher) =>
        watcher.name.includes(this.userName)
      )
    },
    fabActions() {
      // icon = https://fonts.google.com/icons
      const action = [
        {
          name: 'addComment',
          icon: 'ri-message-2-line',
          color: '#409eff'
        },
        {
          name: 'addToCalendar',
          icon: 'ri-calendar-2-line',
          color: '#F56C6C'
        },
        {
          name: 'copyIssue',
          icon: 'ri-file-copy-line',
          color: '#67c23a'
        }
      ]
      if (this.isWatched) {
        action.push({
          name: 'unwatchIssue',
          icon: 'ri-eye-off-line',
          color: '#606260'
        })
      } else {
        action.push({
          name: 'watchIssue',
          icon: 'ri-eye-line',
          color: '#e6a23c'
        })
      }
      return action
    }
  },
  methods: {
    async setStar(status) {
      this.$emit('update:isLoading', true)
      if (status) {
        await addIssueWatcher(this.issue.id)
      } else {
        await removeIssueWatcher(this.issue.id)
      }
      const issue = await getIssueDetails(this.issue.id)
      this.$emit('update:issue', issue.data)
      this.$emit('update:isLoading', false)
    },
    handleAddComment() {
      this.isAddCommentVisible = true
    },
    async updateAddComment() {
      await this.$refs.IssueNotesEditor.updateNotes().then(() => {
        this.isAddCommentVisible = false
        this.activeTab = 'history'
      })
    },
    async updateIssueTitle() {
      this.$emit('update:isLoading', true)
      await updateIssue(this.issueId, { subject: this.form.subject }).then(
        (issue) => {
          this.$set(this.form, 'subject', issue.data.subject)
          this.$set(this.originForm, 'subject', issue.data.subject)
          this.isEditTitleVisible = false
        }
      )
      this.$emit('update:isLoading', false)
    },
    handleDicardEditTitle() {
      this.form.subject = this.originForm.subject
      this.isEditTitleVisible = false
    },
    async handleSpentTimeUpdate() {
      await this.$parent.fetchIssue()
      this.$parent.issueTabs = 'SpentHours'
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';
@import 'src/styles/theme/mixin.scss';

.grey-title {
  color: grey;

  ::v-deep .point {
    background-color: grey !important;
  }
}

.card::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera*/
}

.card {
  border-radius: 5px;
  min-height: calc(100vh - 50px - 50px - 50px - 10px);
  max-height: calc(100vh - 50px - 50px - 50px - 10px);
  overflow-y: auto;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  ::v-deep .el-card__body,
  .el-main {
    padding: 18px 12px;
  }

  ::v-deep .el-card {
    margin: 0;
    color: #606266;
  }

  ::v-deep .el-card__body .el-divider--horizontal {
    margin-top: 0;
  }

  ::v-deep .el-card.is-always-shadow {
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .title {
    margin-top: 5px;
    margin-bottom: 5px;

    ::v-deep .el-divider--vertical {
      width: 6px;
      margin: 0;
      border-radius: 3px 0 0 3px;
      height: 18px;
      background-color: $warning !important;
    }

    .text {
      font-size: 15px;
      font-weight: bold;
      color: #72767b;
      vertical-align: middle;
    }
  }

  .content {
    margin-bottom: 80px;
  }
}

.notes {
  padding-bottom: 80px;

  .item {
    background-color: white;
    padding: 10px;
    border-radius: 0;
    box-shadow: none;
    min-height: inherit;
  }
}

.issue-title {
  padding-right: 10px;
}

.drawer {
  ::v-deep {
    .el-drawer {
      border-radius: 10px 10px 0 0;
    }

    .el-divider--horizontal {
      margin: 14px -14px !important;
      background-color: #f1f1f1;
    }

    .el-drawer__header {
      margin-bottom: 0 !important;
      padding: 10px;
    }

    .el-card {
      border-radius: 0 !important;
    }

    .el-card__body {
      padding: 14px !important;
    }
  }

  .title {
    margin-top: 5px;
    margin-bottom: 5px;

    ::v-deep .el-divider--vertical {
      width: 6px;
      margin: 0;
      border-radius: 3px 0 0 3px;
      height: 18px;
      background-color: $warning !important;
    }

    .text {
      font-size: 15px;
      font-weight: bold;
      color: #72767b;
      vertical-align: middle;
    }
  }
}

::v-deep {
  .el-tabs--bottom.el-tabs--border-card .el-tabs__header.is-bottom {
    position: fixed;
    bottom: 0;
    width: 100%;
  }

  .el-tabs--border-card > .el-tabs__content {
    padding: 0;
  }

  .el-tabs--border-card {
    @include css-prefix(box-shadow, none);
    background: none;
    border-radius: 0 !important;
  }

  .el-tabs--bottom.el-tabs--border-card .el-tabs__item.is-bottom {
    height: 47px;
  }

  .fab-main {
    padding: 22px !important;
  }

  .fab-wrapper {
    bottom: 100px !important;
    right: 10px !important;
  }

  .mx-3 {
    margin: 0 !important;
  }

  .move-bar {
    display: none !important;
  }
}
</style>
