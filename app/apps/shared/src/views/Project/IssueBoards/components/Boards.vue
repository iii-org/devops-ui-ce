<template>
  <section>
    <div class="flex">
      <Draggable
        :list="groupByValueOnBoard"
        v-bind="$attrs"
        class="board"
        :class="{'is-panel':relationIssue.visible}"
        :draggable="'.item'"
        :disabled="!isDraggable"
        :force-fallback="true"
        @change="end($event)"
      >
        <Kanban
          v-for="classObj in groupByValueOnBoard"
          :id="'card' + classObj.id"
          :key="classObj.id"
          :class="!isSelectDefaultOption && classObj.id !== 'all' ? 'item' : ''"
          :board-object="classObj"
          :list="classifyIssueList[classObj.id]"
          :relative-list="relativeIssueList"
          :status="status"
          :group="group"
          :dimension="groupBy.dimension"
          :add-issue="saveIssue"
          :element-ids="elementIds"
          :project-id="projectId"
          :filter-type="filterType"
          :group-by-value-on-board="groupByValueOnBoard"
          :is-select-default-option="isSelectDefaultOption"
          :board-id="boardId"
          :params="params"
          :classify-issue-list="classifyIssueList"
          :is-draggable.sync="isDraggable"
          :all-unassigned-issue-list="allUnassignedIssueList"
          @relationIssueId="onRelationIssueDialog($event, classObj.id)"
          @update="updateIssueStatus"
          @update-drag="quickUpdateIssue"
          @contextmenu="handleContextMenu"
          @loadData="$emit('loadData')"
        />
        <el-card
          v-if="!isSelectDefaultOption"
          :body-style="{padding: 0}"
          style="
            min-width: 278px;
            height: 4.3rem;
            margin: 0 5px;
          "
        >
          <el-link
            v-if="!isEdited"
            icon="el-icon-plus"
            :underline="false"
            class="flex items-center"
            style="font-size: 1.1rem; height: 4.3rem;"
            @click="isEdited = true"
          >
            {{ $t('general.Add') + $t('general.Title') }}
          </el-link>
          <template v-else>
            <div class="flex justify-end px-1 mt-1">
              <el-tooltip
                placement="bottom"
                :content="$t('general.Save')"
              >
                <em
                  class="el-icon-check primary table-button"
                  style="font-size: 14px;"
                  @click="createBoardItem"
                />
              </el-tooltip>
              <el-tooltip
                placement="bottom"
                :content="$t('general.Cancel')"
              >
                <em
                  class="el-icon-close danger table-button"
                  style="font-size: 14px;"
                  @click="resetBoardObject"
                />
              </el-tooltip>
            </div>
            <CustomItem
              :board-id="boardId"
              :board-object="boardObject"
              :group-by-value-on-board="groupByValueOnBoard"
              :is-edited="isEdited"
              @loadData="$emit('loadData')"
              @resetBoardObject="resetBoardObject"
            />
          </template>
        </el-card>
      </Draggable>
    </div>
    <transition name="slide-fade">
      <div v-if="relationIssue.visible" class="rightPanel">
        <div
          class="handle-button"
          :style="{'background-color':'#85c1e9'}"
          @click="handleRightPanelVisible"
        >
          <em class="el-icon-d-arrow-right" />
        </div>
        <ProjectIssueDetail
          ref="childrenDrawer"
          :props-issue-id="relationIssue.id"
          :is-in-dialog="true"
          :is-from-board="true"
          @popup="handleRelationIssueDialogBeforeClose"
          @delete="handleRelationDelete"
        />
      </div>
    </transition>
    <el-dialog
      v-if="isProjectDetailPopUp"
      :visible.sync="isProjectDetailPopUp"
      width="90%"
      top="3vh"
      append-to-body
      destroy-on-close
      :before-close="handleRelationIssueDialogBeforeClose"
    >
      <ProjectIssueDetail
        ref="children"
        :props-issue-id="relationIssue.id"
        :is-in-dialog="true"
        :is-from-board="false"
        @delete="handleRelationDelete"
      />
    </el-dialog>
    <ContextMenu
      ref="contextmenu"
      :visible="contextMenu.visible"
      :row="contextMenu.row"
      :filter-column-options="filterOptions"
      :selection-options="contextOptions"
      @update-row="getContextRow"
    />
  </section>
</template>

<script>
import { mapGetters } from 'vuex'
import { getIssue, addIssue, updateIssue } from '@/api/issue'
import {
  createBoardItem,
  updateBoardItem,
  createBoardItemIssue,
  removeBoardItemIssue
} from '@/api_v2/issueBoard'
import Kanban from './Kanban'
import CustomItem from './CustomItem'
import { ContextMenu } from '@/components/Issue'
import Draggable from 'vuedraggable'

const contextMenu = {
  row: {
    fixed_version: { id: 'null' },
    assigned_to: { id: 'null' }
  },
  visible: false,
  left: 0,
  top: 0
}

export default {
  name: 'Boards',
  components: {
    CustomItem,
    Draggable,
    Kanban,
    ContextMenu,
    ProjectIssueDetail: () => import('@/views/Project/IssueDetail')
  },
  props: {
    groupBy: {
      type: Object,
      default: () => ({
        dimension: 'status',
        value: []
      })
    },
    displayClosed: {
      type: Boolean,
      default: false
    },
    // filterOptions: {
    //   type: Array,
    //   default: () => []
    // },
    contextOptions: {
      type: Object,
      default: () => ({})
    },
    relativeIssueList: {
      type: Array,
      default: () => []
    },
    classifyIssueList: {
      type: Object,
      default: () => ({})
    },
    projectIssueList: {
      type: Array,
      default: () => []
    },
    tags: {
      type: Array,
      default: () => []
    },
    elementIds: {
      type: Array,
      default: () => []
    },
    projectId: {
      type: Number,
      default: null
    },
    filterType: {
      type: String,
      default: 'board'
    },
    getStatusSort: {
      type: Array,
      default: () => []
    },
    isSelectDefaultOption: {
      type: Boolean,
      default: false
    },
    params: {
      type: Object,
      default: () => ({})
    },
    boardId: {
      type: Number,
      default: null
    },
    allUnassignedIssueList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      group: 'mission',
      contextMenu: contextMenu,
      isProjectDetailPopUp: false,
      relationIssue: {
        visible: false,
        id: null
      },
      filterOptions: [{
        id: 1,
        label: this.$t('Issue.FilterDimensions.status'),
        value: 'status',
        placeholder: 'Status',
        tag: true
      },
      {
        id: 3,
        label: this.$t('Issue.FilterDimensions.tracker'),
        value: 'tracker',
        placeholder: 'Type',
        tag: true
      },
      {
        id: 4,
        label: this.$t('Issue.FilterDimensions.assigned_to'),
        value: 'assigned_to',
        placeholder: 'Member'
      },
      {
        id: 5,
        label: this.$t('Issue.FilterDimensions.fixed_version'),
        value: 'fixed_version',
        placeholder: 'Version'
      },
      {
        id: 6,
        label: this.$t('Issue.FilterDimensions.priority'),
        value: 'priority',
        placeholder: 'Priority',
        tag: true
      }],
      isEdited: false,
      isDraggable: true,
      boardObject: { id: null, name: '', color: '#409EFF' }
    }
  },
  computed: {
    ...mapGetters(['tracker', 'status', 'priority', 'device']),
    groupByValueOnBoard() {
      if (this.groupBy.value.length <= 0) {
        return this.getStatusSort.map((item) => item)
      }
      return this.groupBy.dimension === 'assigned_to' ? this.filterMe(this.groupBy.value) : this.groupBy.value
    },
    isMobile() {
      return this.device === 'mobile'
    }
  },
  watch: {
    isMobile() {
      if (this.relationIssue.visible) {
        this.$router.push({ name: 'IssueDetail', params: { issueId: this.relationIssue.id }})
      }
    }
  },
  methods: {
    loadData() {
      this.$emit('loadData')
    },
    filterMe(userList) {
      return userList.filter((item) => item.login !== '-Me-')
    },
    filterClosedStatus(statusList) {
      if (this.displayClosed) return statusList
      return statusList.filter((item) => item.is_closed === false)
    },
    async saveIssue(data, itemId) {
      let issueId
      await addIssue(data)
        .then(async (res) => {
          // noinspection JSCheckFunctionSignatures
          // this.showSuccessMessage()
          issueId = res.data.id
          this.addTopicDialogVisible = false
          this.$refs['quickAddIssue'].form.name = ''
          return res
        })
        .catch((error) => {
          return error
        })
      if (!this.isSelectDefaultOption && itemId !== 'all') {
        const formData = this.getFormData({ issue_id: issueId })
        await createBoardItemIssue(this.projectId, this.boardId, itemId, formData)
      }
    },
    showSuccessMessage() {
      this.$message({
        title: this.$t('general.Success'),
        message: this.$t('Notify.Added'),
        type: 'success'
      })
    },
    async updateIssueStatus(evt) {
      if (evt.event.hasOwnProperty('added')) {
        try {
          if (this.isSelectDefaultOption) {
            const updatedData = { [`${this.groupBy.dimension}_id`]: evt.boardObject.id }
            const issueId = evt.event.added.element.id
            await this.updatedIssue(issueId, updatedData)
          } else {
            const issueId = evt.event.added.element.id
            const issue = await getIssue(issueId)
            if (issue.data.board.findIndex((board) => board.id === this.boardId) !== -1) {
              const itemId = issue.data.board.find((board) => board.id === this.boardId).item.id
              await removeBoardItemIssue(this.projectId, this.boardId, itemId, issueId)
            }
            if (evt.boardObject.id !== 'all') {
              const formData = this.getFormData({ issue_id: issueId })
              await createBoardItemIssue(this.projectId, this.boardId, evt.boardObject.id, formData)
            }
          }
        } catch (e) {
          // error
        } finally {
          if (this.isSelectDefaultOption) {
            this.setProjectIssueList(evt)
            this.$emit('getRelativeList')
          }
        }
      }
    },
    getFormData(data) {
      const formData = new FormData()
      Object.keys(data).forEach((item) => {
        formData.append(item, data[item])
      })
      return formData
    },
    async updatedIssue(id, updatedData) {
      const formData = this.getFormData(updatedData)
      const res = await updateIssue(id, formData)
      this.updateRelationIssue(this.projectIssueList, res.data)
    },
    setProjectIssueList(evt) {
      const issueId = evt.event.added.element.id
      const idx = this.projectIssueList.findIndex((item) => item.id === issueId)
      const issue = this.projectIssueList.find((item) => item.id === issueId)
      issue[this.groupBy.dimension] = evt.boardObject
      this.$emit('updateIssueList', idx, issue)
    },
    updateRelationIssue(list, updatedIssue) {
      list.forEach((issue) => {
        if (issue.hasOwnProperty('parent') && issue.parent.id === updatedIssue.id) {
          this.$set(issue, 'parent', updatedIssue)
        }
        this.handleUpdatedIssue('children', updatedIssue)
        this.handleUpdatedIssue('relations', updatedIssue)
      })
    },
    handleUpdatedIssue(key, updatedIssue) {
      if (updatedIssue.hasOwnProperty(key)) this.setUpdatedIssue(key, updatedIssue)
    },
    setUpdatedIssue(key, updatedIssue) {
      const idx = updatedIssue[key].findIndex((item) => item.id === issue.id)
      const issue = updatedIssue[key].find((item) => item.id === issue.id)
      this.$set(issue[key], idx, issue)
    },
    async quickUpdateIssue(event) {
      const { id, params } = event
      this.$parent.isLoading = true
      const filterDimension = Object.keys(params)[0]
      const data = this.handleFilterArrayData(params)
      try {
        await this.updatedIssue(id, data)
      } catch (e) {
        // error
      } finally {
        const idx = this.projectIssueList.findIndex((item) => item.id === id)
        const issue = this.projectIssueList.find((item) => item.id === id)
        issue[filterDimension] = params[filterDimension]
        this.$emit('updateIssueList', idx, issue)
      }
      this.$parent.isLoading = false
    },
    handleFilterArrayData(value) {
      const filterDimension = Object.keys(value)[0]
      let data = { [`${filterDimension}_id`]: value[filterDimension].id }
      if (Array.isArray(value[filterDimension])) {
        data = { [filterDimension]: value[filterDimension].map((item) => item.id).join(',') }
      }
      return data
    },
    getTranslateHeader(value) {
      return this.$te('Issue.' + value) ? this.$t('Issue.' + value) : value
    },
    dragStart(e, item) {
      e.effectAllowed = 'copy'
      e.target.classList.add('draggingObject')
      e.dataTransfer.setData('json', JSON.stringify(item))
    },
    dragEnd(e) {
      e.target.classList.remove('draggingObject')
    },
    getFilterValueList(value) {
      return this[value] || this.contextOptions[value]
    },
    isRightPanelItemHasComponents(name) {
      return ['status', 'tracker'].includes(name)
    },
    handleContextMenu({ row, column, event }) {
      event.preventDefault()
      const eventX = event.pageX
      const eventY = event.pageY
      this.$refs.contextmenu.$refs.contextmenu.show()
      const contextmenu = this.$refs.contextmenu.$refs.contextmenu
      this.$nextTick(() => {
        const contextmenuPosition = {
          top: eventY,
          left: eventX
        }
        const contextmenuWidth = contextmenu.$el.clientWidth
        const contextmenuHeight = contextmenu.$el.clientHeight
        if (contextmenuWidth <= 50) {
          this.handleContextMenu({ row, column, event })
        }
        if (contextmenuHeight + eventY >= window.innerHeight) {
          contextmenuPosition.top -= contextmenuHeight
        }
        if (contextmenuWidth + eventX >= window.innerWidth) {
          contextmenuPosition.left -= contextmenuWidth
        }
        this.contextMenu.top = contextmenuPosition.top
        this.contextMenu.left = contextmenuPosition.left
        this.contextMenu.row = row
        this.contextMenu.visible = true
        contextmenu.style = {
          top: `${this.contextMenu.top}px`,
          left: `${this.contextMenu.left}px`
        }
        document.addEventListener('click', this.hideContextMenu)
      })
    },
    async getContextRow(issueId) {
      const issue = await getIssue(issueId)
      this.$nextTick(() => {
        this.contextMenu.row = issue.data
      })
    },
    hideContextMenu() {
      this.contextMenu.visible = false
      document.removeEventListener('click', this.hideContextMenu)
    },
    onRelationIssueDialog(issue, element) {
      if (!this.isMobile) {
        this.$set(this.relationIssue, 'visible', true)
        this.$set(this.relationIssue, 'id', issue.id)
        setTimeout(() => this.scrollTo(element), 100)
      } else {
        this.$router.push({ name: 'IssueDetail', params: { issueId: issue.id }})
      }
    },
    handleRelationDelete() {
      this.isProjectDetailPopUp = false
      this.$set(this.relationIssue, 'visible', false)
      this.$set(this.relationIssue, 'id', null)
    },
    handleRightPanelVisible() {
      this.$set(this.relationIssue, 'visible', false)
    },
    scrollTo(target) {
      const element = document.getElementById('card' + target)
      this.$nextTick(() => {
        element.scrollIntoView({ behavior: 'smooth' })
      })
    },
    handlePopConfirm(done) {
      this.$confirm(this.$t('Notify.UnSavedChanges'), this.$t('general.Warning'), {
        confirmButtonText: this.$t('general.Confirm'),
        cancelButtonText: this.$t('general.Cancel'),
        type: 'warning'
      })
        .then(() => {
          done()
        })
    },
    handleRelationIssueDialogBeforeClose(done) {
      const ref = done ? 'children' : 'childrenDrawer'
      if (!done) {
        done = () => {
          this.relationIssue.visible = false
          this.isProjectDetailPopUp = true
        }
      }
      if (this.$refs[ref].hasUnsavedChanges()) {
        this.handlePopConfirm(done)
      } else {
        done()
      }
    },
    async end(event) {
      const formData = new FormData()
      formData.append('index', event.moved.newIndex - 1)
      const itemId = event.moved.element.id
      await updateBoardItem(
        this.projectId,
        this.boardId,
        itemId,
        formData
      )
      this.$emit('loadData')
    },
    async createBoardItem() {
      const { name, color } = this.boardObject
      if (name) {
        const itemForm = new FormData()
        itemForm.append('item_name', name)
        itemForm.append('color', color)
        await createBoardItem(this.projectId, this.boardId, itemForm)
        this.resetBoardObject()
        this.loadData()
      } else {
        this.$message({
          message: this.$t('Validation.Input', [this.$t('Issue.BoardName')]),
          type: 'warning'
        })
      }
    },
    resetBoardObject() {
      this.isEdited = false
      this.boardObject = { name: '', color: '#409EFF' }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
@import 'src/styles/theme/mixin.scss';

.board {
  display: flex;
  justify-content: flex-start;
  flex-wrap: nowrap;
  height: calc(100vh - 70px - 40px - 24px - 25px - 10px);
  overflow-x: auto;
  transition: width 1s;

  &.is-panel {
    width: calc(100% - 750px);
    transition: width 1s;
  }
}

// For drag sources
.dragging {
  opacity: 0.25;
}

.draggingObject {
  width: 100%;

  .help_text {
    display: block !important;
    opacity: 1 !important;
  }
}

// For drop target
.hover {
  background-color: rgba(0, 191, 165, 0.04);
}

$tag-options: (
  secondary: $secondary,
  document: $document,
  research: $research,
  bug: $bug,
  feature: $feature
);

@each $key, $value in $tag-options {
  .el-tag--#{$key} {
    @include background-border-color($value, $value);
  }
}

.rightPanel {
  width: 100%;
  max-width: 750px;
  height: calc(100vh - 50px);
  position: fixed;
  top: 50px;
  right: 0;
  background: #fff;
  border-radius: 0 !important;
  ::v-deep .el-card {
    border-radius: 0 !important;
  }
}

.slide-fade-enter-active {
  transition: all .5s ease-in-out;

}
.slide-fade-leave-active {
  transition: all .5s ease-in-out;
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(800px);
}

.handle-button {
  width: 35px;
  height: 50px;
  position: absolute;
  left: -35px;
  top: 0;
  text-align: center;
  font-size: 24px;
  border-radius: 6px 0 0 6px !important;
  z-index: 1;
  pointer-events: auto;
  cursor: pointer;
  color: #fff;
  line-height: 50px;
  background-color:'#85c1e9'
  i {
    font-size: 24px;
    line-height: 50px;
  }
}
</style>
