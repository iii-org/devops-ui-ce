<template>
  <div>
    <Desktop
      v-if="device === 'desktop'"
      ref="IssueDetails"
      :is-open-matrix="isOpenMatrix"
      :props-issue-id="propsIssueId"
      :is-in-dialog="isInDialog"
      :is-from-board="isFromBoard"
      :origin-form.sync="originForm"
      :is-loading.sync="isLoading"
      :issue-matrix-dialog.sync="issueMatrixDialog"
      :root-project-id.sync="rootProjectId"
      :issue-link.sync="issue_link"
      :issue.sync="issue"
      :issue-id.sync="issueId"
      :issue-name.sync="issueName"
      :author.sync="author"
      :created-date.sync="created_date"
      :tracker.sync="tracker"
      :view.sync="view"
      :form.sync="form"
      :files.sync="files"
      :test-files.sync="test_files"
      :journals.sync="journals"
      :request-git-lab-last-time.sync="requestGitLabLastTime"
      :parent-data="parent"
      :children.sync="children"
      :tags.sync="tags"
      :relation-issue.sync="relationIssue"
      :relations.sync="relations"
      :related-collection-dialog-visible.sync="relatedCollectionDialogVisible"
      :tags-string.sync="tagsString"
      :is-loading-family.sync="isLoadingFamily"
      :is-loading-test-file.sync="isLoadingTestFile"
      :project-relation-list.sync="projectRelationList"
      :storage-p-id.sync="storagePId"
      :issue-project.sync="issueProject"
      :is-add-sub-issue.sync="isAddSubIssue"
      :history-loading.sync="historyLoading"
      :assigned-to="assigned_to"
      :count-relation-issue="countRelationIssue"
      :is-button-disabled="isButtonDisabled"
      :form-project-id="formProjectId"
      :is-has-white-board="isHasWhiteBoard"
      :is-issue-edited="isIssueEdited"
      :data-loaded.sync="dataLoaded"
    />
    <Mobile
      v-else
      ref="IssueDetails"
      :is-open-matrix="isOpenMatrix"
      :props-issue-id="propsIssueId"
      :is-in-dialog="isInDialog"
      :is-from-board="isFromBoard"
      :form.sync="form"
      :issue-id.sync="issueId"
      :issue.sync="issue"
      :tracker.sync="tracker"
      :origin-form.sync="originForm"
      :assigned-to="assigned_to"
      :is-button-disabled="isButtonDisabled"
      :is-loading.sync="isLoading"
      :issue-project.sync="issueProject"
      :parent-data="parent"
      :children.sync="children"
      :count-relation-issue="countRelationIssue"
      :files.sync="files"
      :journals.sync="journals"
      :history-loading.sync="historyLoading"
      :is-issue-edited="isIssueEdited"
    />
    <ContextMenu
      ref="contextmenu"
      :visible="contextMenu.visible"
      :row="contextMenu.row"
      :filter-column-options="filterOptions"
      :selection-options="contextOptions"
      @update="getData"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { getRootProjectId, getProjectAssignable } from '@/api/projects'
import { getHasSon, getProjectRelation } from '@/api_v2/projects'
import {
  getIssue,
  updateIssue,
  deleteIssue,
  deleteIssueRelation,
  getIssueGitCommitLog,
  getIssueFamily
} from '@/api/issue'
import { getTestFileByTestPlan, putTestPlanWithTestFile } from '@/api/qa'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'
import { atob } from '@shared/utils/base64'
import getPageTitle from '@shared/utils/getPageTitle'
import { ContextMenu } from '@/mixins'
import variables from '@/styles/theme/variables.scss'
import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'

const commitLimit = 10

export default {
  name: 'IssueDetail',
  components: {
    Desktop,
    Mobile
  },
  mixins: [ContextMenu],
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
      issue_link: '',
      issue: {},
      issueId: null,
      issueName: '',
      author: '',
      created_date: '',
      tracker: '',
      view: {},
      form: {
        parent_id: null,
        relation_ids: [],
        tags: [],
        project_id: 0,
        assigned_to_id: '',
        name: '',
        fixed_version_id: '',
        tracker_id: 0,
        status_id: 1,
        priority_id: 3,
        estimated_hours: 0,
        done_ratio: 0,
        start_date: '',
        due_date: '',
        description: '',
        notes: ''
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
      assigned_to: [],
      dataLoaded: false,
      isIssueEdited: {
        description: false,
        notes: false,
        estimated_hours: false,
        done_ratio: false
      }
    }
  },
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
        this.$confirm(this.$t('Notify.UnSavedChanges'), this.$t('general.Warning'), {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        })
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
  computed: {
    ...mapGetters([
      'selectedProject',
      'userProjectList',
      'selectedProjectId',
      'test_filename',
      'userName',
      'userRole',
      'device'
    ]),
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
      return this.$route.params.hasOwnProperty('disableButton') ? this.$route.params.disableButton : false
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
      handler(newPId, oldPId) {
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
        this.$refs.IssueDetails.$refs['mainIssueWrapper']
          .$el.getElementsByClassName('el-collapse-item__header')
      )
      elCollapseItemHeader[elCollapseItemHeader.length - 1]
        .style['justify-content'] = val === 'top' ? '' : 'center'
    },
    device(value) {
      if (value === 'mobile' && this.isInDialog) {
        this.$router.push({ name: 'IssueDetail', params: { issueId: this.propsIssueId }})
      }
    }
    // copyIssueEdited: {
    //   deep: true,
    //   handler(val, oldVal) {
    //     console.log('val', val)
    //     console.log('oldVal', oldVal)
    //     if (Object.keys(oldVal).every((key) => !oldVal[key])) return
    //     let newKey = ''
    //     let oldKey = ''
    //     Object.keys(oldVal).forEach((key) => { if (oldVal[key]) oldKey = key })
    //     Object.keys(val).forEach((key) => { if (val[key] && key !== oldKey) newKey = key })
    //     console.log(newKey, oldKey)
    //     if (newKey !== oldKey) {
    //       this.isIssueEdited[oldKey] = true
    //       this.isIssueEdited[newKey] = false
    //       this.$confirm(this.$t('Notify.UnSavedChanges'),
    //         this.$t('general.Warning'), {
    //           confirmButtonText: this.$t('general.Confirm'),
    //           cancelButtonText: this.$t('general.Cancel'),
    //           type: 'warning'
    //         })
    //         .then(() => {
    //           this.isIssueEdited[oldKey] = false
    //           this.isIssueEdited[newKey] = true
    //         })
    //         .catch(() => {
    //           Object.keys(oldVal).forEach((key) => {
    //             this.isIssueEdited[key] = oldVal[key]
    //           })
    //         })
    //     }
    //   }
    // }
  },
  async mounted() {
    await this.fetchIssueLink()
    await this.getRelationProjectList()
    this.storagePId = this.form.project_id
    this.dataLoaded = true
  },
  methods: {
    ...mapActions('projects', ['setSelectedProject']),
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
        const tracker = this.$refs.IssueDetails.$refs['IssueForm'].tracker.find((item) => item.name === 'Test Plan')
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
        const issue = await getIssue(this.issueId)
        data = issue.data
        this.$route.meta.subject = `[${this.$t('Issue.' + data.tracker.name)}] #${data.id} - ${data.name} @ ${
          data.project.name
        }`
        document.title = getPageTitle(this.$route.meta)
        if (data.hasOwnProperty('relations')) {
          await this.setRelationsIssue(data)
        }
        if (data.tracker && data.tracker.name === 'Test Plan') {
          if (process.env.VUE_APP_PROJECT === 'SSO') {
            const test_files = await getTestFileByTestPlan(this.selectedProjectId, this.issueId)
            this.$set(data, 'test_files', test_files.data)
          }
        }
        if (isOnlyUpload) {
          this.initUploadFiles(data)
        } else {
          this.initIssueDetails(data, true)
        }
      } catch (e) {
        this.handleBackPage()
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
          getIssueId = item.issue_to_id
        } else {
          getIssueId = item.issue_id
        }
        res_api.push(await getIssue(getIssueId))
      }

      const relation_issue = await Promise.allSettled(res_api).then((res) => res.map((item) => item.value))
      relation_issue.forEach((item, idx) => {
        this.$set(data.relations, idx, {
          relation_id: data.relations[idx].id,
          ...data.relations[idx],
          ...item.data,
          name: item.data.name
        })
      })
    },
    initUploadFiles(data) {
      const { attachments } = data
      this.files = attachments
    },
    initIssueDetails(data, updateDescription) {
      const {
        issue_link,
        author,
        attachments,
        created_date,
        journals,
        name,
        tracker,
        parent,
        children,
        test_files,
        relations,
        tags
      } = data
      this.issue = data
      this.issue_link = issue_link
      this.issueName = name
      this.author = author.name
      this.tracker = tracker.name
      this.files = attachments
      this.created_date = created_date
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
      const hasSon = (await getHasSon(this.formProjectId)).has_child
      if (hasSon) {
        const projectRelation = (await getProjectRelation(this.formProjectId)).data
        this.projectRelationList.push(projectRelation[0].parent.id)
        projectRelation[0].child.forEach((item) => {
          this.projectRelationList.push(item.id)
        })
      }
    },
    onProjectChange(value) {
      if (this.isInDialog || this.isFromBoard) return
      localStorage.setItem('projectId', value)
      this.setSelectedProject(this.userProjectList.filter((elm) => elm.id === value)[0])
    },
    setIssueId() {
      if (this.propsIssueId) this.issueId = parseInt(this.propsIssueId)
      else if (this.$route.params.issueId) this.issueId = parseInt(this.$route.params.issueId)
    },
    async getRootProject(projectId) {
      this.rootProjectId = (await getRootProjectId(projectId)).root_project_id
    },
    async getGitCommitLogData() {
      await this.getRootProject(this.formProjectId)
      this.setIssueId()
      const params = { limit: commitLimit }
      const res = await getIssueGitCommitLog(this.rootProjectId, this.issueId, params)
      res.data.forEach((item, index) => {
        item['id'] = index
        item['commit_time'] = getLocalTime(item['commit_time'])
      })
      return Promise.resolve(res.data)
    },
    setFormData(data, updateDescription) {
      const {
        project,
        parent,
        assigned_to,
        fixed_version,
        name,
        tracker,
        status,
        priority,
        estimated_hours,
        done_ratio,
        start_date,
        due_date,
        description
      } = data
      this.form.parent_id = parent ? parent.id : ''
      this.form.project_id = project ? project.id : ''
      this.form.assigned_to_id = assigned_to ? assigned_to.id : ''
      this.form.name = name
      this.form.fixed_version_id = fixed_version ? fixed_version.id : ''
      this.form.tracker_id = tracker.id
      this.form.status_id = status.id
      this.form.priority_id = priority.id
      this.form.estimated_hours = estimated_hours
      this.form.done_ratio = done_ratio
      this.form.start_date = start_date === null ? '' : start_date
      this.form.due_date = due_date === null ? '' : due_date
      this.form.description = !updateDescription
        ? this.form.description : description === null
          ? '' : description
      this.form.relation_ids = this.relations.length > 0 ? this.relations.map((item) => item.id) : []
      this.form.tags = this.tags.length > 0 ? this.tags.map((item) => item.id) : []
      this.originForm = Object.assign({}, this.form)
    },
    async historyUpdate(isLoadIssueFamily = false) {
      this.$emit('update')
      this.historyLoading = true
      if (isLoadIssueFamily) this.isLoadingFamily = true
      let data = {}
      try {
        const issue = await getIssue(this.issueId)
        data = issue.data
        if (data.hasOwnProperty('relations')) {
          await this.setRelationsIssue(data)
        }
        this.initIssueDetails(data)
      } catch (e) {
        this.handleBackPage()
      }
      if (isLoadIssueFamily) this.isLoadingFamily = false
      this.historyLoading = false
    },
    async handleUpdated(issue_id) {
      if (!this.issueId) {
        this.$router.push({ name: 'IssueDetail', params: { issueId: issue_id }})
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
        this.$router.push(!prev_page.includes('/') ? decodeURIComponent(prev_page) : prev_page)
      } else {
        this.$router.push({
          name: 'IssueList',
          params: {
            projectName: this.selectedProject.name
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
      const arr = dataUrl.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new File([u8arr], fileName, { type: mime })
    },
    filterImage(object) {
      const [value, sendForm, checkDuplicate] = object
      let [array, fileArray, file] = [[], [], '']
      array = value.split(/!\[(.+?)\)/g).filter((item) =>
        (/(.+?)\]\(data:.+/g).test(item)
      )
      if (array.length === 0) return
      array.forEach((item) => {
        fileArray = item.split('](')
        file = this.dataURLtoFile(fileArray[0], fileArray[1])
        const hasSameFile = this.files.some((element) =>
          file.name === element.filename &&
          file.size === element.filesize
        )
        if (checkDuplicate && hasSameFile) return
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
        const formData = this.getFormData({ parent_id: '' })
        await updateIssue(child_issue_id, formData)
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
      return Object.keys(this.isIssueEdited).some((key) =>
        this.isIssueEdited[key]
      )
    },
    handleRelationDelete() {
      this.handleUpdated()
      this.onCloseRelationIssueDialog()
    },
    handleRelationIssueDialogBeforeClose(done) {
      if (this.$refs.IssueDetails.$refs.children.hasUnsavedChanges()) {
        this.$confirm(this.$t('Notify.UnSavedChanges'), this.$t('general.Warning'), {
          confirmButtonText: this.$t('general.Confirm'),
          cancelButtonText: this.$t('general.Cancel'),
          type: 'warning'
        }).then(() => {
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
      const row = this.issue.excalidraw.find((item) => item.name === excalidrawName)
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
      this.resetForm()
      this.isShowDialog = false
    },
    resetForm() {
      this.form.tags = []
      this.form.assigned_to_id = ''
      this.form.fixed_version_id = ''
    },
    getStyle(colorCode) {
      const color = variables[`${colorCode}`]
      return {
        color
      }
    },
    copyUrl() {
      const message = this.$t('Notify.Copied')
      const input = document.createElement('input')
      const url = `${window.location.origin}/#/project/issues/${this.issueId}`
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('Copy')
      input.remove()
      this.showSuccessMessage(message)
    },
    async initIssueStatus() {
      if (this.$refs.IssueDetails && this.device === 'desktop') this.$refs.IssueDetails.calcIssueFormWidth()
      this.assigned_to = (await getProjectAssignable(this.formProjectId)).data.user_list
      this.$nextTick(() => {
        if (!this.$refs.IssueDetails || this.device === 'mobile') return
        if (this.$refs.IssueDetails.$refs.mainIssue.$el.scrollTop > 0) this.$refs.IssueDetails.$refs.mainIssue.$el.scrollTop = 0
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
    }
  }
}
</script>
