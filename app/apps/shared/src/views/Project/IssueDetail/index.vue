<template>
  <div>
    <Desktop
      v-if="device === 'desktop'"
      ref="IssueDetails"
      :activity-list="activityList"
      :assigned="assigned"
      :author.sync="author"
      :children.sync="children"
      :count-relation-issue="countRelationIssue"
      :create-at.sync="create_at"
      :data-loaded.sync="dataLoaded"
      :files.sync="files"
      :form-project-id="formProjectId"
      :form.sync="form"
      :history-loading.sync="historyLoading"
      :is-add-sub-issue.sync="isAddSubIssue"
      :is-button-disabled="isButtonDisabled"
      :is-from-board="isFromBoard"
      :is-has-white-board="isHasWhiteBoard"
      :is-in-dialog="isInDialog"
      :is-issue-edited="isIssueEdited"
      :is-loading-family.sync="isLoadingFamily"
      :is-loading-test-file.sync="isLoadingTestFile"
      :is-loading.sync="isLoading"
      :is-open-matrix="isOpenMatrix"
      :issue-id.sync="issueId"
      :issue-matrix-dialog.sync="issueMatrixDialog"
      :issue-project.sync="issueProject"
      :issue-subject.sync="issueSubject"
      :issue.sync="issue"
      :journals.sync="journals"
      :origin-form.sync="originForm"
      :parent-data="parent"
      :project-relation-list.sync="projectRelationList"
      :props-issue-id="propsIssueId"
      :related-collection-dialog-visible.sync="relatedCollectionDialogVisible"
      :relation-issue.sync="relationIssue"
      :relations.sync="relations"
      :request-git-lab-last-time.sync="requestGitLabLastTime"
      :root-project-id.sync="rootProjectId"
      :storage-p-id.sync="storagePId"
      :tags-string.sync="tagsString"
      :tags.sync="tags"
      :test-files.sync="test_files"
      :tracker.sync="tracker"
      :view.sync="view"
    />
    <Mobile
      v-else
      ref="IssueDetails"
      :activity-list="activityList"
      :assigned="assigned"
      :children.sync="children"
      :count-relation-issue="countRelationIssue"
      :files.sync="files"
      :form.sync="form"
      :history-loading.sync="historyLoading"
      :is-button-disabled="isButtonDisabled"
      :is-from-board="isFromBoard"
      :is-in-dialog="isInDialog"
      :is-issue-edited="isIssueEdited"
      :is-loading.sync="isLoading"
      :is-open-matrix="isOpenMatrix"
      :issue-id.sync="issueId"
      :issue-project.sync="issueProject"
      :issue.sync="issue"
      :journals.sync="journals"
      :origin-form.sync="originForm"
      :parent-data="parent"
      :props-issue-id="propsIssueId"
      :tracker.sync="tracker"
    />
    <ContextMenu
      ref="contextmenu"
      :filter-column-options="filterOptions"
      :row="contextMenu.row"
      :selection-options="contextOptions"
      :visible="contextMenu.visible"
      @update="getData"
    />
  </div>
</template>

<script>
import {
  deleteIssue,
  deleteIssueRelation,
  getIssueDetails,
  getIssueFamily,
  getTimeEntryActivities,
  updateIssue
} from '@/api_v3/issues'
import { getTestFileByTestPlan, putTestPlanWithTestFile } from '@/api/qa'
import {
  getProjectRelation,
  getProjectUserList,
  getRootProjectId
} from '@/api_v3/projects'
import { getIssueCommitHookList } from '@/api_v3/gitlab'
import ContextMenu from '@/mixins/ContextMenu'
import variables from '@/styles/theme/variables.module.scss'
import getPageTitle from '@shared/utils/getPageTitle'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'
import { mapActions, mapGetters } from 'vuex'

const commitLimit = 10

export default {
  name: 'IssueDetail',
  components: {
    Desktop: () => import('./Desktop'),
    Mobile: () => import('./Mobile')
  },
  mixins: [ContextMenu],
  beforeRouteEnter(to, from, next) {
    if (to.query.prev_page || from.name === null) {
      next()
    } else {
      const newTo = Object.assign({}, to, {
        query: {
          ...to.query,
          prev_page: from.fullPath
        }
      })
      next(newTo)
    }
  },
  beforeRouteLeave(to, from, next) {
    if (this.hasUnsavedChanges()) {
      setTimeout(() => {
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
            this.$route.meta.subject = null
            document.title = getPageTitle(this.$route.meta)
            next()
          })
          .catch(() => {
            next(false)
          })
      }, 1)
    } else {
      this.$route.meta.subject = null
      document.title = getPageTitle(this.$route.meta)
      next()
    }
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
    }
  },
  data() {
    this.assignedError = {
      title: this.$t('Kanban.assignedErrorTitle'),
      content: this.$t('Kanban.assignedErrorContent')
    }
    return {
      originForm: {},
      isLoading: false,
      issueMatrixDialog: {
        visible: false
      },
      rootProjectId: '',
      issue: {},
      issueId: null,
      issueSubject: '',
      author: '',
      create_at: '',
      tracker: '',
      view: {},
      form: {
        parent_id: null,
        relation_ids: [],
        tags: [],
        project_id: '',
        assigned_id: '',
        subject: '',
        version_id: '',
        tracker_id: 0,
        status_id: 1,
        priority_id: 2,
        spent_hours: 0,
        estimated_hours: 0,
        total_spent_hours: 0,
        done_ratio: 0,
        start_date: '',
        due_date: '',
        description: '',
        notes: '',
        boards: []
      },
      files: [],
      test_files: [],
      journals: [],
      requestGitLabLastTime: null,
      parent: {},
      children: [],
      tags: [],
      relationIssue: {
        visible: false,
        id: null
      },
      relations: [],
      relatedCollectionDialogVisible: false,
      tagsString: '',
      errorMsg: [],
      showAlert: false,
      isLoadingFamily: false,
      isLoadingTestFile: false,
      projectRelationList: [],
      isShowDialog: false,
      storagePId: '',
      issueProject: {},
      issueTabs: 'history',
      isDeleteIssueDialog: false,
      isIssueFormOpened: !this.isFromBoard,
      isAddSubIssue: false,
      historyLoading: false,
      assigned: [],
      dataLoaded: false,
      isIssueEdited: {
        description: false,
        notes: false,
        estimated_hours: false,
        done_ratio: false
      },
      activityList: []
    }
  },
  computed: {
    ...mapGetters([
      'selectedProject',
      'projectOptions',
      'selectedProjectId',
      'test_filename',
      'userName',
      'userRole',
      'device'
    ]),
    isLite() {
      return import.meta.env.VITE_APP_PROJECT === 'LITE'
    },
    countRelationIssue() {
      let parent = 0
      let children = 0
      let relations = 0
      if (this.parent && Object.keys(this.parent).length > 0) {
        parent = 1
      }
      if (this.children !== undefined) {
        children = this.children.length
      }
      if (this.relations !== undefined) {
        relations = this.relations.length
      }
      return parent + children + relations
    },
    isButtonDisabled() {
      return this.$route.params.hasOwnProperty('disableButton')
        ? this.$route.params.disableButton
        : false
    },
    formProjectId() {
      return this.form.project_id || this.selectedProjectId
    },
    isHasWhiteBoard() {
      return this.issue.excalidraw && this.issue.excalidraw.length > 0
    }
    // copyIssueEdited() {
    //   // for watch
    //   return JSON.parse(JSON.stringify(this.isIssueEdited))
    // }
  },
  watch: {
    propsIssueId() {
      this.fetchIssueLink()
      this.isAddSubIssue = false
    },
    'form.project_id': {
      handler(newPId) {
        if (this.$route.name === 'Milestone') return
        if (this.storagePId && newPId !== this.storagePId) {
          this.isShowDialog = true
        }
      }
    },
    'issue.excalidraw'(val) {
      if (val.length === 0) this.issueTabs = 'history'
    },
    scrollType(val) {
      if (this.device === 'mobile') return
      const elCollapseItemHeader = Array.from(
        this.$refs.IssueDetails.$refs[
          'mainIssueWrapper'
        ].$el.getElementsByClassName('el-collapse-item__header')
      )
      elCollapseItemHeader[elCollapseItemHeader.length - 1].style[
        'justify-content'
      ] = val === 'top' ? '' : 'center'
    },
    device(value) {
      if (value === 'mobile' && this.isInDialog) {
        this.$router.push({
          name: 'IssueDetail',
          params: { issueId: this.propsIssueId }
        })
      }
    }
  },
  async mounted() {
    await this.fetchActivityList()
    await this.fetchIssueLink()
    await this.getRelationProjectList()
    this.storagePId = this.form.project_id
    this.dataLoaded = true
  },
  methods: {
    ...mapActions('projects', ['setSelectedProject', 'isProjectHasChildren']),
    ...mapActions('qa', ['removeFileName']),
    async getData() {
      await this.fetchIssueLink()
      await this.getIssueFamilyData(this.issue)
    },
    async fetchIssueLink() {
      this.isLoading = true
      if (this.propsIssueId) {
        this.issueId = parseInt(this.propsIssueId)
        await this.fetchIssue()
      } else if (this.$route.params.issueId) {
        this.issueId = parseInt(this.$route.params.issueId)
        this.issueProject = this.$route.params.project
        await this.fetchIssue()
      } else {
        this.form.project_id = this.selectedProjectId
        const tracker = this.$refs.IssueDetails.$refs['IssueForm'].tracker.find(
          (item) => item.name === 'Test Plan'
        )
        this.form.tracker_id = tracker.id
        if (this.test_filename) {
          this.test_files.push({ ...this.test_filename, edit: true })
          this['removeFileName']()
        }
      }
      await this.initIssueStatus()
      this.isLoading = false
    },
    async fetchIssue(isOnlyUpload) {
      this.isLoading = true
      let data = {}
      try {
        const issue = await getIssueDetails(this.issueId)
        data = issue.data
        this.$route.meta.subject = `[${this.$t(
          'Issue.' + data.tracker.name
        )}] #${data.id} - ${data.subject} @ ${data.project.display_name}`
        document.title = getPageTitle(this.$route.meta)
        if (data.hasOwnProperty('relations')) {
          await this.setRelationsIssue(data)
        }
        if (data.tracker && data.tracker.name === 'Test Plan') {
          if (import.meta.env.VITE_APP_PROJECT === 'SSO') {
            const test_files = await getTestFileByTestPlan(
              this.selectedProjectId,
              this.issueId
            )
            this.$set(data, 'test_files', test_files.data)
          }
        }
        if (isOnlyUpload) {
          this.initUploadFiles(data)
        } else {
          this.initIssueDetails(data, true)
        }
      } catch (e) {
        // this.handleBackPage()
        // this.$message({
        //   message: this.$t('Issue.RemovedIssue'),
        //   type: 'warning'
        // })
      }
      this.isLoading = false
      return data
    },
    async setRelationsIssue(data) {
      const res_api = []
      for (const item of data.relations) {
        let getIssueId
        if (data.id === item.issue_id) {
          getIssueId = item.issue_id_to
        } else {
          getIssueId = item.issue_id
        }
        res_api.push(await getIssueDetails(getIssueId))
      }

      const relation_issue = await Promise.allSettled(res_api).then((res) =>
        res.map((item) => item.value)
      )
      relation_issue.forEach((item, idx) => {
        this.$set(data.relations, idx, {
          relation_id: data.relations[idx].id,
          ...data.relations[idx],
          ...item.data
        })
      })
    },
    initUploadFiles(data) {
      const { attachments } = data
      this.files = attachments
    },
    initIssueDetails(data, updateDescription) {
      const {
        author,
        attachments,
        create_at,
        journals,
        subject,
        tracker,
        parent,
        children,
        test_files,
        relations,
        tags
      } = data
      this.issue = data
      this.issueSubject = subject
      this.author = author.full_name
      this.tracker = tracker.name
      this.files = attachments
      this.create_at = create_at
      if (journals) {
        this.journals = journals.reverse()
      } else {
        this.journals = []
      }
      this.test_files = test_files || []
      this.relations = relations || []
      this.parent = parent || {}
      this.children = children || []
      this.tags = tags || []
      this.setFormData(data, updateDescription)
      this.view = data
      if (
        (Object.keys(data.project).length > 0 &&
          this.selectedProjectId !== data.project.id &&
          !this.projectRelationList.includes(data.project.id)) ||
        !this.isFromBoard
      ) {
        // Cori keeps both but remove the code from develop
        //        !this.getRelationProjectList().includes(data.project.id) &&
        //        !this.isFromBoard
        //       ( !this.projectRelationList.includes(data.project.id) || (
        //        !this.getRelationProjectList().includes(data.project.id) &&
        //        !this.isFromBoard))
        // )
        // this.onProjectChange(data.project.id)
      }
      if (this.$refs?.IssueDetails?.$refs?.IssueForm) {
        this.$refs.IssueDetails.$refs.IssueForm.getClosable()
      }
      this.issueProject = data.project
    },
    async getRelationProjectList() {
      const hasChildren = await this.isProjectHasChildren(
        this.selectedProjectId
      )
      if (hasChildren) {
        const projectRelation = (await getProjectRelation(this.formProjectId))
          .data
        this.projectRelationList.push(projectRelation[0].parent.id)
        projectRelation[0].child.forEach((item) => {
          this.projectRelationList.push(item.id)
        })
      }
    },
    // onProjectChange(value) {
    //   if (this.isInDialog || this.isFromBoard) return
    //   localStorage.setItem('projectId', value)
    //   this.setSelectedProject(
    //     this.projectOptions.filter((elm) => elm.id === value)[0]
    //   )
    // },
    setIssueId() {
      if (this.propsIssueId) this.issueId = parseInt(this.propsIssueId)
      else if (this.$route.params.issueId) {
        this.issueId = parseInt(this.$route.params.issueId)
      }
    },
    async getRootProject(projectId) {
      this.rootProjectId = (await getRootProjectId(projectId)).data?.id
    },
    async getGitCommitLogData() {
      await this.getRootProject(this.formProjectId)
      this.setIssueId()
      const params = { limit: commitLimit, issue_id: this.issueId }
      const res = await getIssueCommitHookList(params)
      res.data.forEach((item, index) => {
        item['committed_date'] = getLocalTime(item['committed_date'])
      })
      return Promise.resolve(res.data)
    },
    setFormData(data, updateDescription) {
      const {
        assigned,
        boards,
        description,
        done_ratio,
        due_date,
        estimated_hours,
        parent,
        priority,
        project,
        spent_hours,
        start_date,
        status,
        subject,
        total_spent_hours,
        tracker,
        version
      } = data
      this.form.parent_id = parent ? parent.id : ''
      this.form.project_id = project ? project.id : ''
      this.form.assigned_id = assigned ? assigned.id : ''
      this.form.subject = subject
      this.form.version_id = version ? version.id : ''
      this.form.tracker_id = tracker.id
      this.form.status_id = status.id
      this.form.priority_id = priority.id
      this.form.estimated_hours = estimated_hours
      this.form.spent_hours = spent_hours
      this.form.total_spent_hours = total_spent_hours
      this.form.done_ratio = done_ratio
      this.form.start_date = start_date === null ? '' : start_date
      this.form.due_date = due_date === null ? '' : due_date
      this.form.description = !updateDescription
        ? this.form.description
        : description === null
        ? ''
        : description
      this.form.relation_ids =
        this.relations.length > 0 ? this.relations.map((item) => item.id) : []
      this.form.tags =
        this.tags.length > 0 ? this.tags.map((item) => item.id) : []
      if (!this.isLite) {
        this.form.boards =
          boards && boards.length > 0 ? boards.map((item) => item.id) : []
        this.form.boardList =
          boards && boards.length > 0
            ? boards.map((item) => {
                item.name = '[ ' + item.name + ' ] ' + item.item.name
                return item
              })
            : []
      }
      this.originForm = Object.assign({}, this.form)
    },
    async historyUpdate(isLoadIssueFamily = false) {
      this.$emit('update')
      this.historyLoading = true
      if (isLoadIssueFamily) this.isLoadingFamily = true
      let data = {}
      try {
        const issue = await getIssueDetails(this.issueId)
        data = issue.data
        if (data.hasOwnProperty('relations')) {
          await this.setRelationsIssue(data)
        }
        this.initIssueDetails(data)
      } catch (e) {
        // this.handleBackPage()
      }
      if (isLoadIssueFamily) this.isLoadingFamily = false
      this.historyLoading = false
    },
    async handleUpdated(issue_id) {
      if (!this.issueId) {
        this.$router.push({
          name: 'IssueDetail',
          params: { issueId: issue_id }
        })
      } else {
        await this.$refs.IssueDetails.$refs.IssueForm.getClosable()
      }
      this.isLoading = false
      await this.fetchIssue()
      this.$emit('update-table')
    },
    async handleUploadUpdated() {
      await this.fetchIssue(true)
      this.isLoading = false
    },
    handleBackPage() {
      const { prev_page } = this.$route.query
      if (prev_page) {
        this.$router.push(
          !prev_page.includes('/') ? decodeURIComponent(prev_page) : prev_page
        )
      } else {
        this.$router.push({
          name: 'IssueList',
          params: {
            projectName: this.selectedProject.identifier
          }
        })
      }
    },
    showLoading(status) {
      if (status && status.hasOwnProperty('upload') && status.upload) {
        this.isLoading = status.status
        this.handleUploadUpdated()
      } else {
        this.isLoading = status.status
        this.handleUpdated()
      }
    },
    dataURLtoFile(fileName, dataUrl) {
      const [mime, url] = dataUrl.split(',')
      const mimeType = mime.match(/:(.*?);/)[1]
      const bstr = atob(url)
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new File([u8arr], fileName, { type: mimeType })
    },
    filterImageUrls(markdown) {
      const regex = /!\[([^\]]+)\]\(([^)]+)\)/g
      const matches = []
      let match
      while ((match = regex.exec(markdown)) !== null) {
        matches.push(match[0])
      }
      return matches
    },
    // TODO: remove filterImage
    filterImage(object) {
      const { value, sendForm } = object
      const imageUrls = this.filterImageUrls(value)
      if (imageUrls.length === 0) return
      imageUrls.forEach((imageUrl) => {
        const match = imageUrl.match(/!\[([^\]]+)\]\(([^)]+)\)/)
        if (!match) return
        const file = this.dataURLtoFile(match[1], match[2])
        if (
          this.files.some(
            (f) => file.name === f.filename && file.size === f.filesize
          )
        ) {
          return
        }
        sendForm.append('upload_files', file)
      })
    },
    handleErrorAlert(key) {
      const { title, content } = this[key]
      this.errorMsg.push(this.getErrorAlert(title, content))
    },
    getErrorAlert(title, content) {
      const h = this.$createElement
      return h('li', [h('b', title), h('p', content)])
    },
    showErrorAlert(errorMsg) {
      const h = this.$createElement
      if (!this.showAlert) {
        this.showAlert = true
        this.$msgbox({
          message: h('ul', errorMsg),
          title: this.$t('Kanban.ChangeIssueError')
        }).then(() => {
          this.showAlert = false
        })
      }
      this.errorMsg = []
    },
    getFormData(data) {
      const formData = new FormData()
      Object.keys(data).forEach((item) => {
        formData.append(item, data[item])
      })
      return formData
    },
    async removeIssueRelation(child_issue_id) {
      this.isLoading = true
      try {
        await updateIssue(child_issue_id, { parent_id: '' })
        // this.$message({
        //   title: this.$t('general.Success'),
        //   message: this.$t('Notify.Updated'),
        //   type: 'success'
        // })
        await this.handleUpdated()
      } catch (err) {
        console.error(err)
      }
      this.isLoading = false
    },
    async removeRelationIssue(relation_id) {
      this.listLoading = true
      try {
        await deleteIssueRelation(relation_id)
        // this.$message({
        //   title: this.$t('general.Success'),
        //   message: this.$t('Notify.Updated'),
        //   type: 'success'
        // })
        await this.handleUpdated()
      } catch (err) {
        console.error(err)
      }
      this.listLoading = false
    },
    hasUnsavedChanges() {
      return Object.keys(this.isIssueEdited).some(
        (key) => this.isIssueEdited[key]
      )
    },
    handleRelationDelete() {
      this.handleUpdated()
      this.onCloseRelationIssueDialog()
    },
    handleRelationIssueDialogBeforeClose(done) {
      if (this.$refs.IssueDetails.$refs.children.hasUnsavedChanges()) {
        this.$confirm(
          this.$t('Notify.UnSavedChanges'),
          this.$t('general.Warning'),
          {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }
        ).then(() => {
          done()
        })
      } else {
        done()
      }
    },
    async handleDelete(isDeleteWhiteBoard) {
      this.isLoading = true
      const params = { force: this.children?.length > 0 }
      if (isDeleteWhiteBoard) params.delete_excalidraw = true
      try {
        await deleteIssue(this.issueId, params)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        if (this.isInDialog) {
          this.$emit('delete', this.issueId)
        } else {
          this.handleBackPage()
        }
      } catch (err) {
        this.$message({
          title: this.$t('general.Error'),
          message: err,
          type: 'error'
        })
      }
      this.isLoading = false
    },
    onRelationIssueDialog(id) {
      if (this.device === 'desktop') {
        this.$set(this.relationIssue, 'visible', true)
        this.$set(this.relationIssue, 'id', id)
      } else {
        this.$router.push({
          name: 'IssueDetail',
          params: { issueId: id, project: this.issueProject },
          query: { prev_page: this.$route }
        })
      }
    },
    onCloseRelationIssueDialog() {
      this.$set(this.relationIssue, 'visible', false)
      this.$set(this.relationIssue, 'id', null)
    },
    async getIssueFamilyData(row) {
      try {
        this.isLoadingFamily = true
        const family = await getIssueFamily(row.id)
        const data = family.data
        this.formatIssueFamilyData(row, data)
      } catch (e) {
        //   null
        return Promise.resolve()
      } finally {
        this.isLoadingFamily = false
      }
      return Promise.resolve()
    },
    formatIssueFamilyData(row, data) {
      if (data.hasOwnProperty('parent')) {
        this.$set(row, 'parent', data.parent)
        this.$set(this, 'parent', data.parent)
      } else {
        this.originForm.parent_id = ''
        this.form.parent_id = ''
        this.$set(row, 'parent', {})
        this.$set(this, 'parent', {})
      }
      if (data.hasOwnProperty('children')) {
        this.$set(row, 'children', data.children)
        this.$set(this, 'children', data.children)
      } else {
        this.$set(row, 'children', [])
        this.$set(this, 'children', [])
      }
      if (data.hasOwnProperty('relations')) {
        this.originForm.relation_ids = data.relations.map((item) => item.id)
        this.form.relation_ids = data.relations.map((item) => item.id)
        this.$set(row, 'relations', data.relations)
        this.$set(this, 'relations', data.relations)
      } else {
        this.originForm.relation_ids = []
        this.form.relation_ids = []
        this.$set(row, 'relations', [])
        this.$set(this, 'relations', [])
      }
    },
    toggleIssueMatrixDialog() {
      this.issueMatrixDialog.visible = !this.issueMatrixDialog.visible
    },
    toggleDialogVisible(value) {
      this[value + 'DialogVisible'] = !this[value + 'DialogVisible']
    },
    async updateTestCollection() {
      this.isLoadingTestFile = true
      const data = {
        issue_id: this.issueId,
        test_files: this.test_files.map((item) => ({
          software_name: item.software_name,
          file_name: item.file_name
        }))
      }
      await putTestPlanWithTestFile(this.form.project_id, data)
      this.isLoadingTestFile = false
    },
    onContextMenu({ row, column, event }) {
      this.handleContextMenu(row, column, event)
    },
    async updateWhiteBoard(excalidrawName) {
      await this.fetchIssueLink()
      this.issueTabs = 'whiteBoard'
      const row = this.issue.excalidraw.find(
        (item) => item.name === excalidrawName
      )
      this.editWhiteBoard(row)
    },
    editWhiteBoard(row) {
      this.$refs.IssueDetails.$refs['WhiteBoardTable'].handleEdit(row)
    },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
    getLocalTime(value) {
      return getLocalTime(value)
    },
    getRelativeTime(value) {
      return getRelativeTime(value)
    },
    onCancel() {
      this.form.project_id = this.storagePId
      this.isShowDialog = false
    },
    onConfirm() {
      this.storagePId = this.form.project_id
      this.$refs.IssueDetails.$refs.IssueForm.updateIssue('project_id')
      this.resetForm()
      this.isShowDialog = false
    },
    resetForm() {
      this.form.tags = []
      this.form.assigned_id = ''
      this.form.version_id = ''
    },
    getStyle(colorCode) {
      const color = variables[`${colorCode}`]
      return {
        color
      }
    },
    copyUrl() {
      const url = `${window.location.origin}/#/project/issues/${this.issueId}`
      this.$copyText(url).then(() => {
        const message = this.$t('Notify.Copied')
        this.showSuccessMessage(message)
      })
    },
    async initIssueStatus() {
      if (this.$refs.IssueDetails && this.device === 'desktop') {
        this.$refs.IssueDetails.calcIssueFormWidth()
      }
      this.assigned = (await getProjectUserList(this.formProjectId)).data
      this.$nextTick(() => {
        if (!this.$refs.IssueDetails || this.device === 'mobile') return
        if (this.$refs.IssueDetails.$refs.mainIssue.$el.scrollTop > 0) {
          this.$refs.IssueDetails.$refs.mainIssue.$el.scrollTop = 0
        }
        this.$refs.IssueDetails.$refs.IssueForm.$refs.form.clearValidate()
      })
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    },
    toggleAddSubIssue() {
      this.isAddSubIssue = !this.isAddSubIssue
      this.$nextTick(() => {
        const element = document.getElementById('AddSubIssueWrapper')
        element.scrollIntoView({ behavior: 'smooth' })
      })
    },
    async fetchActivityList() {
      await getTimeEntryActivities().then((res) => {
        this.activityList = res.data
      })
    }
  }
}
</script>
