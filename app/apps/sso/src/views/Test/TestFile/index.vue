<template>
  <div class="app-container">
    <ProjectListSelector>
      <el-button
        id="btn-add-issue"
        slot="button"
        class="buttonPrimary"
        icon="el-icon-plus"
        :size="isMobile ? 'small' : 'medium'"
        :disabled="selectedProjectId === -1"
        @click="handleUploadDialog"
      >
        <span v-if="!isMobile">{{ $t('Test.TestFile.UploadTestSet') }}</span>
      </el-button>
      <el-button
        icon="el-icon-s-operation"
        class="buttonPrimaryReverse mr-1"
        :size="isMobile ? 'small' : 'medium'"
        @click="filterVisible = !filterVisible"
      />
      <el-input
        id="input-search"
        v-model="keyword"
        prefix-icon="el-icon-search"
        :placeholder="$t('Issue.SearchNameOrAssignee')"
        :style="{ width: isMobile ? '100px' : '250px' }"
        :size="isMobile ? 'small' : 'medium'"
      />
    </ProjectListSelector>
    <el-divider />
    <el-row v-if="filterVisible" type="flex" :gutter="10">
      <el-col :span="16">
        <el-form inline label-position="left">
          <el-form-item v-for="item in software" :key="item.id">
            <el-checkbox v-model="item.visible" :label="item.name" />
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <ElTableResponsive
      ref="testFile"
      v-loading="listLoading"
      :data="pagedData"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      fit
      :highlight-current-row="!isMobile"
      row-key="file_name"
      :tree-props="{ children: 'child' }"
      height="60vh"
      :row-class-name="getRowClass"
      @expand-change="toggleExpandedRows"
    >
      <template v-slot:expand="{row}">
        <ul class="family">
          <li>
            <span class="title">{{ $t('Issue.Test Plan') }}:</span>
            <ul class="issue-list">
              <li v-for="plan in row.test_plans" :key="plan.id" class="issue-item">
                <IssueRow
                  :issue="plan"
                  @click-title="onRelationIssueDialog"
                  @show-context-menu="handleContextMenu(plan, '', $event)"
                  @remove-confirm="removeTestPlanRelation(plan.test_files, row.file_name)"
                />
              </li>
            </ul>
          </li>
        </ul>
      </template>
      <template v-slot:branch="{row}">
        <div v-if="row.the_last_test_result && Object.keys(row.the_last_test_result).length > 0">
          <div>
            {{ row.the_last_test_result.branch }}
          </div>
          <el-link
            class="linkTextColor"
            target="_blank"
            style="font-size: 16px"
            :underline="false"
            :href="row.the_last_test_result.commit_url"
          >
            <svg-icon class="mr-1" icon-class="ion-git-commit-outline" />
            {{ row.the_last_test_result.commit_id }}
          </el-link>
        </div>
      </template>
      <template v-slot:test_result="{row}">
        <el-link class="linkTextColor" :underline="false" @click="toResultList(row)">
          <template v-if="row.the_last_test_result && Object.keys(row.the_last_test_result).length > 0">
            <div v-if="row.software_name === 'Postman'" class="mt-2">
              {{
                `${row.the_last_test_result.success}/${
                  row.the_last_test_result.success + row.the_last_test_result.failure
                }`
              }}
            </div>
            <div
              v-else-if="row.software_name === 'SideeX' && row.the_last_test_result.result"
              class="mt-2"
            >
              {{
                `${row.the_last_test_result.result.casesPassed}/${row.the_last_test_result.result.casesTotal}`
              }}
            </div>
          </template>
        </el-link>
      </template>
      <template v-slot:actions="{row}">
        <el-tooltip
          v-if="row.software_name === 'SideeX'"
          placement="bottom"
          :content="$t('Test.TestFile.CreateTestData')"
        >
          <em
            class="ri-file-add-line finished operate-button"
            @click="handleCreateTestData(row)"
          />
        </el-tooltip>
        <el-tooltip
          v-if="row.software_name === 'SideeX' && isResultExist"
          placement="bottom"
          :content="$t('Test.TestFile.HistoryTestData')"
        >
          <em
            class="ri-history-line info operate-button"
            @click="handleHistoryTestData(row)"
          />
        </el-tooltip>
        <el-tooltip
          placement="bottom"
          :content="$t('Test.TestFile.ConnectTestPlan')"
        >
          <el-popover
            placement="bottom"
            trigger="click"
          >
            <div>
              <el-link
                style="display: block; font-size: 14px;"
                :underline="false"
                @click="handleRelatedPlan(row)"
              >
                {{ $t('Test.TestFile.SetPlan') }}
              </el-link>
              <el-link
                style="display: block; font-size: 14px;"
                :underline="false"
                @click="handleCreatePlan(row)"
              >
                {{ $t('Test.TestFile.AddPlan') }}
              </el-link>
            </div>
            <em
              slot="reference"
              class="ri-links-line active operate-button"
            />
          </el-popover>
        </el-tooltip>
        <el-tooltip
          placement="bottom"
          :content="$t('Test.TestFile.DeleteTestFile')"
        >
          <el-popconfirm
            :confirm-button-text="$t('general.Delete')"
            :cancel-button-text="$t('general.Cancel')"
            icon="el-icon-info"
            popper-class="danger"
            :title="$t('Issue.DeleteFile')"
            @confirm="deleteTestFile(row.software_name, row.file_name)"
          >
            <em
              slot="reference"
              class="ri-delete-bin-2-line danger operate-button"
            />
          </el-popconfirm>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      :total="filteredData.length"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
    <el-dialog
      :visible.sync="relatedPlanDialogVisible"
      :close-on-click-modal="false"
      :width="isMobile ? '95%' : '80%'"
      :top="isMobile ? '1vh' : '8vh'"
      :show-close="false"
      :class="isMobile ? 'mobile' : ''"
      append-to-body
      destroy-on-close
    >
      <div slot="title" class="hidden" />
      <RelatedPlanDialog
        ref="relatedPlan"
        :collection="selectedCollection"
        @close-dialog="toggleDialogVisible"
        @save="saveCollectionRelation"
      />
    </el-dialog>
    <el-dialog
      v-loading="listLoading"
      :element-loading-text="$t('Loading')"
      :visible.sync="uploadDialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :width="isMobile ? '95%' : '80%'"
      :top="isMobile ? '1vh' : '8vh'"
      :show-close="false"
      :class="isMobile ? 'mobile' : ''"
      append-to-body
      destroy-on-close
    >
      <CollectionFileUploader ref="collectionFileUpload" @update="loadData" />
      <template slot="footer">
        <el-button
          class="buttonSecondaryReverse"
          :size="isMobile ? 'small' : 'medium'"
          @click="closeUploadCollection"
        >
          {{ $t('general.Close') }}
        </el-button>
        <el-button
          class="buttonPrimary"
          :size="isMobile ? 'small' : 'medium'"
          @click="uploadCollection"
        >
          {{ $t('File.Upload') }}
        </el-button>
      </template>
    </el-dialog>
    <CreateTestDataDialog
      v-if="createTestDataDialogVisible"
      ref="createTestDataDialog"
      :dialog-visible.sync="createTestDataDialogVisible"
      :preview-dialog-visible.sync="previewTestDataDialogVisible"
      :file-name="selectedFileName"
      :is-history.sync="isHistory"
      :variable-list.sync="variableList"
      @update="fetchData"
    />
    <PreviewTestDataDialog
      v-if="previewTestDataDialogVisible"
      ref="previewTestDataDialog"
      :dialog-visible.sync="previewTestDataDialogVisible"
      :create-dialog-visible.sync="createTestDataDialogVisible"
      :file-name="selectedFileName"
      :is-history.sync="isHistory"
      :variable-list.sync="variableList"
      @update="fetchData"
    />
    <ContextMenu
      ref="contextmenu"
      :visible="contextMenu.visible"
      :row="contextMenu.row"
      :filter-column-options="filterOptions"
      :selection-options="contextOptions"
      @update="loadData"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Fuse from 'fuse.js'
import {
  deleteTestFile,
  deleteTestPlanWithTestFile,
  getTestFileList,
  postTestFile,
  postTestPlanWithTestFile
} from '@/api/qa'
import { isSideexResultExist } from '@/api/sideex'
import { BasicData, Pagination, SearchBar, ContextMenu } from '@/mixins'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'
import IssueRow from '@/components/Issue/components/IssueRow'
import {
  RelatedPlanDialog,
  CollectionFileUploader,
  CreateTestDataDialog,
  PreviewTestDataDialog
} from './components'

export default {
  name: 'TestFile',
  components: {
    ProjectListSelector,
    IssueRow,
    CollectionFileUploader,
    CreateTestDataDialog,
    PreviewTestDataDialog,
    RelatedPlanDialog,
    ElTableResponsive
  },
  mixins: [BasicData, Pagination, SearchBar, ContextMenu],
  data() {
    return {
      filterVisible: false,
      quickAddTopicDialogVisible: false,
      addTopicDialogVisible: false,
      searchKey: 'name',
      parentId: 0,
      parentName: '',
      fixed_version: [],
      software: [],
      softwareSelectAll: true,
      listFilterSoftwareData: [],
      form: {},
      selectedCollection: {},
      selectedFileName: '',
      relationIssue: {
        visible: false,
        id: null
      },
      variableList: [],
      isHistory: true,
      isResultExist: false,
      createTestDataDialogVisible: false,
      previewTestDataDialogVisible: false,
      relatedPlanDialogVisible: false,
      uploadDialogVisible: false,
      expandedRow: []
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'userRole', 'userName', 'test_filename', 'device']),
    filteredData() {
      return this.listFilterSoftwareData.filter((data) => {
        return this.keyword === '' || data[this.searchKey].toLowerCase().includes(this.keyword.toLowerCase())
      })
    },
    softwareValue() {
      return this.software.filter((item) => item.visible === true)
    },
    hasUploadFile() {
      if (!this.$refs['collectionFileUpload']) return false
      return this.$refs['collectionFileUpload'].uploadFileList.length > 0
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: '',
          prop: 'expand',
          slot: 'expand',
          type: 'expand'
        },
        {
          label: this.$t('Test.TestFile.TestSoftware'),
          prop: 'software_name',
          width: 150
        },
        {
          label: this.$t('File.File'),
          prop: 'file_name',
          showOverflowTooltip: true
        },
        {
          label: this.$t('Test.TestFile.TestName'),
          prop: 'name',
          showOverflowTooltip: true
        },
        {
          label: `${this.$t('ProgressPipelines.Branch')} / ${this.$t('ProgressPipelines.Commit')}`,
          prop: 'branch',
          align: 'center',
          width: 160,
          slot: 'branch'
        },
        {
          label: this.$t('ProgressPipelines.TestItems'),
          prop: 'test_result',
          align: 'center',
          width: 120,
          slot: 'test_result'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          minWidth: 100,
          slot: 'actions'
        }
      ]
    }
  },
  watch: {
    listData: {
      deep: true,
      handler() {
        this.updateData()
      }
    },
    softwareValue: {
      deep: true,
      handler() {
        this.updateData()
      }
    }
  },
  mounted() {
    if (this.test_filename) {
      this['qa/removeFileName']()
    }
  },
  methods: {
    ...mapActions(['projects/getProjectList', 'qa/setFileName']),
    async fetchData() {
      this.isResultExist = (await isSideexResultExist(this.selectedProjectId)).data.result_file_exist
      let data = await getTestFileList(this.selectedProjectId)
      data = data.data
      this.software = [
        { id: 1, name: 'Postman' },
        { id: 2, name: 'Sideex' }
      ]
      this.software.forEach((item, idx) => {
        this.$set(this.software[idx], 'visible', true)
      })
      return data
    },
    handleCreateTestData(row) {
      this.selectedFileName = row.file_name
      this.toggleDialogVisible('createTestData')
    },
    handleHistoryTestData(row) {
      this.selectedFileName = row.file_name
      this.toggleDialogVisible('previewTestData')
    },
    handleRelatedPlan(collection) {
      this.toggleDialogVisible('relatedPlan')
      this.selectedCollection = collection
    },
    async deleteTestFile(software_name, file_name) {
      this.listLoading = true
      try {
        await deleteTestFile(this.selectedProjectId, software_name, file_name)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        await this.loadData()
      } catch (err) {
        console.err(err)
      }
      this.listLoading = false
    },
    toggleDialogVisible(value) {
      this[value + 'DialogVisible'] = !this[value + 'DialogVisible']
    },
    handleCreatePlan(collection) {
      this['qa/setFileName'](collection)
      this.$router.push({ name: 'IssueDetail' })
    },
    resetFilterVersionSoftwareData() {
      this.listFilterSoftwareData = this.listData
    },
    onToggleSelect() {
      const select = this.software.filter((item) => item.visible === true)
      const checker = select.length > 0
      this.software.forEach((item, idx) => {
        this.$set(this.software[idx], 'visible', !checker)
      })
    },
    updateData() {
      this.resetFilterVersionSoftwareData()
      const softwareOpt = {
        keys: ['software_name'],
        useExtendedSearch: true
      }

      if (this.softwareValue.length > 0) {
        this.searchIssueList(this.softwareValue, softwareOpt)
      } else {
        this.listFilterSoftwareData = []
      }
    },
    searchIssueList(value, opt) {
      const fuse = new Fuse(this.listData, opt)
      let search = `="${value}"`
      if (Array.isArray(value) && value.length >= 1) {
        search = { $or: value.map((item) => ({ $path: [opt['keys'][0]], $val: `="${item.name}"` })) }
      }
      const res = fuse.search(search)
      this.listFilterSoftwareData = res.map((items) => items.item)
    },
    handleEdit(id) {
      this.$router.push({ name: 'IssueDetail', params: { issueId: id }})
    },
    emitAddTopicDialogVisible(visible) {
      this.addTopicDialogVisible = visible
      if (!visible) {
        this.$refs['quickAddIssue'].form.name = ''
      }
    },
    async saveCollectionRelation({ collection, test_plans }) {
      const apiRequest = []
      test_plans.append.forEach((item) => {
        const data = {
          issue_id: item,
          file_name: collection.file_name,
          software_name: collection.software_name
        }
        apiRequest.push(postTestPlanWithTestFile(this.selectedProjectId, data))
      })
      test_plans.remove.forEach((relation_id) => {
        apiRequest.push(deleteTestPlanWithTestFile(this.selectedProjectId, relation_id))
      })
      if (apiRequest.length > 0) {
        return await Promise.all(apiRequest).then(() => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Updated'),
            type: 'success'
          })
          this.loadData()
          this.addTopicDialogVisible = false
        })
      }
    },
    uploadCollection() {
      this.$refs['collectionFileUpload'].$refs['uploadForm'].validate(async (valid) => {
        if (valid) {
          const fileList = await this.$refs['collectionFileUpload'].handleUpload()
          await this.uploadFiles(fileList)
          this.uploadDialogVisible = false
        }
      })
    },
    closeUploadCollection() {
      this.$refs['collectionFileUpload'].resetUpload()
      this.uploadDialogVisible = false
    },
    isParentIssue(row) {
      return row.parent_id === null && row.children.length === 0
    },
    handleUploadDialog() {
      this.uploadDialogVisible = !this.uploadDialogVisible
    },
    getFilterCount(name) {
      return this.listData.filter((item) => item.software.name === name).length
    },
    advancedAddIssue(form) {
      this.addTopicDialogVisible = true
      this.parentId = 0
      this.form = form
    },
    onRelationIssueDialog(id) {
      this.$router.push({ name: 'IssueDetail', params: { issueId: id }})
    },
    async removeTestPlanRelation(file_relation, file_name) {
      this.listLoading = true
      try {
        const id = file_relation.find((item) => item.file_name === file_name).id
        await deleteTestPlanWithTestFile(this.selectedProjectId, id)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        await this.loadData()
      } catch (err) {
        console.error(err)
      }
      this.listLoading = false
    },
    toResultList(row) {
      const target = row.software_name.toLowerCase()
      this.$router.push({ name: `${target.charAt(0).toUpperCase()}${target.slice(1)}` })
    },
    hasTestPlans(row) {
      return row.hasOwnProperty('test_plans') && row.test_plans.length > 0
    },
    getRowClass({ row }) {
      const result = []
      if (!this.hasTestPlans(row)) {
        result.push('row-expand-cover')
        const getTableRef = this.$refs['testFile'].$refs.responsiveTable
        if (getTableRef) {
          const getExpanded = this.expandedRow
          if (Array.isArray(getExpanded) && getExpanded.length > 0) {
            const getRow = getExpanded.find((item) => item.file_name === row.file_name)
            if (getRow) {
              this.toggleExpandedRows(getRow, getExpanded)
              getTableRef.toggleRowExpansion(getRow, getExpanded)
            }
          }
        }
      }
      result.push('cursor-pointer')
      return result.join(' ')
    },
    toggleExpandedRows(row, expandedRows) {
      this.expandedRow = expandedRows
    },
    async uploadFiles({ fileList, software_name }) {
      this.listLoading = true
      const _this = this
      // use one by one edit issue to upload file
      try {
        const uploadApi = fileList.map(function (item) {
          const sendForm = new FormData()
          sendForm.delete('test_file')
          sendForm.append('test_file', item.raw, item.raw.name)
          return postTestFile(_this.selectedProjectId, software_name, sendForm)
        })
        await Promise.all(uploadApi)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        await this.loadData()
      } catch (err) {
        console.error(err)
        this.$message({
          title: this.$t('general.Error'),
          message: err.message,
          type: 'error'
        })
      }
      this.listLoading = false
    }
  }
}
</script>

<style lang="scss" scoped>
.family {
  @apply space-y-3;
  .title {
    @apply text-sm font-bold;
  }
  .issue-list {
    @apply space-y-1;
    .issue-item:hover {
      @apply bg-gray-100 text-primary font-bold;
    }
  }
}
::v-deep .el-dialog__header {
  display: none;
}

::v-deep .row-expand-cover .el-table__expand-column .cell {
  display: none;
}

::v-deep .el-table__expanded-cell {
  font-size: 0.875em;
  padding-top: 10px;
  padding-bottom: 10px;
}
.mobile {
  ::v-deep .el-dialog__body {
    padding: 10px;
  }
  ::v-deep .el-card__body {
    padding: 5px;
  }
}
</style>
