<template>
  <div style="padding: 0;">
    <el-row class="my-2 sticky top-0">
      <el-col :class="form.name ? 'issue-title truncate' : ''">
        <el-button
          v-if="!isInDialog"
          type="text"
          size="medium"
          icon="el-icon-arrow-left"
          class="previous link-text-color px-3"
          @click="$parent.handleBackPage"
        />
        <span :class="form.status_id === 6 ? 'grey-title' : ''" class="align-middle">
          <Status v-if="form.status_id === 6" :name="$t(`Issue.Closed`)" class="mx-1" type="Closed" />
          <Tracker v-if="tracker" :name="$t(`Issue.${tracker}`)" :type="tracker" />
          <span v-else>{{ $t('Issue.Issue') }}</span>
          <span>#{{ issueId }} - </span>
          <span v-if="form.name" @click="isEditTitleVisible = !isEditTitleVisible">{{ form.name }}</span>
          <el-input v-else v-model="form.name" size="small" style="width: 50%;" placeholder="Please input issue name" />
        </span>
      </el-col>
    </el-row>
    <div>
      <el-tabs v-loading="isLoading" v-model="activeTab" type="border-card" tab-position="bottom" stretch>
        <el-tab-pane name="form">
          <em slot="label" class="ri-survey-line text-xl align-middle" />
          <div class="card">
            <el-card>
              <IssueDescription
                ref="IssueDescription"
                v-model="form.description"
                :old-value="originForm.description"
                :issue-id="issueId"
                :issue-name="issueName"
                :is-button-disabled="isButtonDisabled"
                :assigned-to="assignedTo"
                :is-issue-edited="isIssueEdited"
                @filterImage="$parent.filterImage"
                @update="$parent.getData"
              />
            </el-card>
            <IssueForm
              ref="IssueForm"
              :is-button-disabled="isButtonDisabled"
              :issue="issue"
              :issue-id="issueId"
              :issue-project="issueProject"
              :is-from-board="isFromBoard"
              :form.sync="form"
              :parent="parent"
              :children-issue="children"
              :is-issue-edited="isIssueEdited"
              class="content"
              @update="$parent.historyUpdate"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane name="relation">
          <em slot="label" class="ri-stackshare-line text-xl align-middle" />
          <div class="card notes" style="margin-bottom: 80px;">
            <div class="item">
              <div slot="title" class="text-sm font-bold title">
                <el-divider direction="vertical" />
                <span class="text">{{ $t('Issue.RelatedIssue') + ` (${countRelationIssue})` }}</span>
              </div>
              <el-divider />
              <IssueExpand
                v-if="countRelationIssue > 0"
                :issue="$parent.$data"
                :family="countRelationIssue > 0"
                :popup="true"
                :is-button-disabled="isButtonDisabled"
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
          <em slot="label" class="ri-attachment-line text-xl align-middle" />
          <div class="card notes">
            <div class="item">
              <div slot="title" class="text-sm font-bold title">
                <el-divider direction="vertical" />
                <span class="text">{{ $t('Issue.Files') + ` (${files.length})` }}</span>
              </div>
              <el-divider />
              <IssueFiles
                v-if="files.length > 0"
                :is-button-disabled="isButtonDisabled"
                :issue-file.sync="files"
              />
              <el-empty v-else :description="$t('general.NoData')" />
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane name="history">
          <em slot="label" class="ri-history-line text-xl align-middle" />
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
      position="bottom-right"
      bg-color="#409eff"
      icon-size="small"
      main-icon="more_vert"
      @addComment="handleAddComment"
      @addToCalendar="isCalDrawerVisible = !isCalDrawerVisible"
      @copyIssue="$parent.copyUrl"
      @watchIssue="setStar(true)"
      @unwatchIssue="setStar(false)"
    />
    <el-drawer
      v-loading="isLoading"
      :visible.sync="isCalDrawerVisible"
      direction="btt"
      class="drawer"
      size="auto"
      destroy-on-close
    >
      <div slot="title" class="title">
        <span>
          <el-divider direction="vertical" />
          <span class="text">{{ $t('Issue.AddToCalendar') }}</span>
        </span>
      </div>
      <div class="container">
        <el-card shadow="never">
          <AddToCalendar
            :issue-id="issueId"
            :form="form"
          />
        </el-card>
      </div>
    </el-drawer>
    <el-drawer
      v-loading="isLoading"
      :visible.sync="isAddCommentVisible"
      direction="btt"
      class="drawer"
      size="auto"
      destroy-on-close
    >
      <div slot="title" class="title">
        <span class="flex justify-between items-center">
          <span>
            <el-divider direction="vertical" />
            <span class="text">{{ $t('Issue.Notes') }}</span>
          </span>
          <el-button
            class="action button-secondary align-middle rounded-md"
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
            :issue-id="issueId"
            :issue-name="issueName"
            :is-button-disabled="isButtonDisabled"
            :assigned-to="assignedTo"
            :is-drawer="true"
            @filterImage="$parent.filterImage"
            @update="$parent.historyUpdate"
          />
        </el-card>
      </div>
    </el-drawer>
    <el-drawer
      v-loading="isLoading"
      :visible.sync="isEditTitleVisible"
      direction="btt"
      class="drawer"
      size="auto"
      destroy-on-close
      @close="handleDicardEditTitle"
    >
      <div slot="title" class="title">
        <span class="flex justify-between items-center">
          <span>
            <el-divider direction="vertical" />
            <span class="text">{{ $t('Dashboard.ADMIN.IssueRank.issue_name') }}</span>
          </span>
          <el-button
            class="action button-secondary align-middle rounded-md"
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
            v-model="form.name"
            style="width: 100%;"
            placeholder="Please input issue name"
          />
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { Status, Tracker, IssueExpand } from '@/components/Issue'
import { IssueDescription, IssueForm, IssueFiles, IssueNotesDialog, IssueNotesEditor, AddToCalendar } from './components'
import Fab from 'vue-fab'
import { addWatcher, removeWatcher } from '@/api_v2/issue'
import { getIssue, updateIssue } from '@/api/issue'

export default {
  name: 'IssueDetailMobile',
  components: { Status, Tracker, IssueDescription, IssueForm, IssueExpand, IssueFiles, IssueNotesDialog, IssueNotesEditor, Fab, AddToCalendar },
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
    issueName: {
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
    assignedTo: {
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
      return this.issue.watchers?.some((watcher) => watcher.name.includes(this.userName))
    },
    fabActions() {
      // icon = https://fonts.google.com/icons
      const action = [
        {
          name: 'addComment',
          icon: 'chat',
          color: '#409eff'
        },
        {
          name: 'addToCalendar',
          icon: 'calendar_month',
          color: '#F56C6C'
        },
        {
          name: 'copyIssue',
          icon: 'content_copy',
          color: '#67c23a'
        }
      ]
      if (this.isWatched) {
        action.push({
          name: 'unwatchIssue',
          icon: 'visibility_off',
          color: '#606260'
        })
      } else {
        action.push({
          name: 'watchIssue',
          icon: 'visibility',
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
        await addWatcher(this.issue.id, { userId: this.userId })
      } else {
        await removeWatcher(this.issue.id, this.userId)
      }
      const issue = await getIssue(this.issue.id)
      this.$emit('update:issue', issue.data)
      this.$emit('update:isLoading', false)
    },
    handleAddComment() {
      this.isAddCommentVisible = true
    },
    async updateAddComment() {
      await this.$refs.IssueNotesEditor.updateNotes()
        .then(() => {
          this.isAddCommentVisible = false
          this.activeTab = 'history'
        })
    },
    async updateIssueTitle() {
      this.$emit('update:isLoading', true)
      const sendForm = new FormData()
      sendForm.append('name', this.form.name)
      await updateIssue(this.issueId, sendForm).then((issue) => {
        this.$set(this.form, 'name', issue.data.name)
        this.$set(this.originForm, 'name', issue.data.name)
        this.isEditTitleVisible = false
      })
      this.$emit('update:isLoading', false)
    },
    handleDicardEditTitle() {
      this.form.name = this.originForm.name
      this.isEditTitleVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
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
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  ::v-deep .el-card__body, .el-main {
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
  .el-tabs--border-card>.el-tabs__content {
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
    bottom: 70px !important;
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
