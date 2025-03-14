<template>
  <div ref="wrapper" v-loading="isLoading" class="wrapper">
    <el-alert
      v-if="getPercentProgress < 100"
      :closable="false"
      class="mb-4 loading"
      type="warning"
    >
      <h2 slot="title">
        <em class="el-icon-loading"></em> {{ $t('Loading') }}
      </h2>
      <el-progress :percentage="getPercentProgress" />
    </el-alert>
    <div class="text-right mb-2">
      <el-popover placement="bottom" trigger="click">
        <el-form
          ref="form"
          :disabled="chartLoading"
          :model="form"
          label-position="left"
          label-width="150px"
        >
          <el-form-item :label="$t('general.group')">
            <el-switch
              v-model="form.group"
              :active-text="$t('general.on')"
              :inactive-text="$t('general.off')"
            />
          </el-form-item>
          <el-form-item>
            <el-switch
              v-model="form.isTracker"
              :active-text="$t('Issue.tracker')"
              :inactive-text="$t('Issue.status')"
            />
          </el-form-item>
          <el-form-item :label="$t('IssueMatrix.Relations')">
            <el-switch
              v-model="form.allRelation"
              :active-text="$t('general.All')"
              :disabled="!hasParent"
              :inactive-text="$t('IssueMatrix.OnlyDown')"
            />
          </el-form-item>
          <el-form-item :label="$t('IssueMatrix.RelatedIssue')">
            <el-switch
              v-model="form.hasRelation"
              :active-text="$t('general.on')"
              :disabled="!hasRelations"
              :inactive-text="$t('general.off')"
            />
          </el-form-item>
          <el-form-item
            :label="$t('IssueMatrix.DisplayItem')"
            prop="displayConditions"
            required
          >
            <el-select
              v-model="form.displayConditions"
              :placeholder="$t('IssueMatrix.SelectDisplayItem')"
              collapse-tags
              multiple
            >
              <el-option
                v-for="condition in displayConditionsList"
                :key="condition.value"
                :label="condition.label"
                :value="condition.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <el-button slot="reference" icon="el-icon-s-tools" type="text">
          {{ $t('IssueMatrix.ConditionSettings') }}
        </el-button>
      </el-popover>
      <el-button
        :disabled="selectedProjectId === -1 || chartLoading"
        icon="el-icon-download"
        plain
        type="primary"
        @click="downloadSVG"
      >{{ $t('Track.DownloadSVG') }}
      </el-button>
    </div>
    <div
      v-show="data.length > 0"
      ref="matrix"
      v-dragscroll
      :style="{ height: `${tableHeight}px` }"
      class="mermaid-wrapper"
    >
      <VueMermaid
        v-if="data.length > 0"
        ref="mermaid"
        :class="`w-${zoom}`"
        :config="{
          securityLevel: 'loose',
          flowChart: { htmlLabels: true },
          logLevel: 5
        }"
        :nodes="data"
        type="flowchart LR"
        @nodeClick="editNode"
      />
      <div class="toolbar">
        <el-slider v-model="zoom" :max="500" :min="25" :step="25" />
      </div>
    </div>
    <el-empty v-if="data.length <= 0" :description="$t('general.NoData')" />
    <el-dialog
      :before-close="handleRelationIssueDialogBeforeClose"
      :visible.sync="relationIssue.visible"
      append-to-body
      destroy-on-close
      top="3vh"
      width="90%"
    >
      <ProjectIssueDetail
        v-if="relationIssue.visible"
        ref="children"
        :is-in-dialog="true"
        :is-open-matrix="true"
        :props-issue-id="relationIssue.id"
        @delete="handleRelationUpdate"
        @update="handleRelationUpdate"
      />
    </el-dialog>
  </div>
</template>

<script>
import { getIssueFamily } from '@/api_v3/issues'
import { mapGetters } from 'vuex'
import { camelCase } from 'lodash'
import { dragscroll } from 'vue-dragscroll'
import { getTestFileByTestPlan } from '@/api/qa'
import { getLocalTime } from '@shared/utils/handleTime'
import resolveConfig from 'tailwindcss/resolveConfig'
import myConfig from '@tailwind'

const tailwindConfig = resolveConfig(myConfig)

function Form() {
  return {
    group: false,
    isTracker: false, // status or tracker
    allRelation: false,
    // level: '',
    hasRelation: false,
    displayConditions: ['id', 'subject', 'status', 'tracker', 'version']
  }
}

export default {
  name: 'IssueMatrix',
  components: {
    VueMermaid: () => import('./components/VueMermaid'),
    ProjectIssueDetail: () => import('@/views/Project/IssueDetail')
  },
  directives: {
    dragscroll
  },
  props: {
    row: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    this.displayConditionsList = [
      { value: 'id', label: this.$t('IssueMatrix.Id') },
      { value: 'subject', label: this.$t('IssueMatrix.Name') },
      { value: 'status', label: this.$t('IssueMatrix.Status') },
      { value: 'tracker', label: this.$t('IssueMatrix.Tracker') },
      { value: 'assignee', label: this.$t('IssueMatrix.Assignee') },
      { value: 'version', label: this.$t('IssueMatrix.Version') }
    ]
    return {
      tableHeight: 0,
      zoom: 100,
      chartIssueList: [],
      // chartProgress: {
      //   level: 0,
      //   now: 0,
      //   total: 0
      // },
      accessedIssueId: [],
      relationLine: {},
      relationIssue: {
        visible: false,
        id: null
      },
      trackerColor: Object.freeze(tailwindConfig.theme.backgroundColor),
      form: new Form(),
      isLoading: false
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'tracker', 'status']),
    getPercentProgress() {
      return Math.round(
        (this.chartIssueList.length / this.accessedIssueId.length) * 100
      )
    },
    chartLoading() {
      return this.accessedIssueId.length !== this.chartIssueList.length
    },
    data() {
      const chartData = this.chartIssueList.map((issue) =>
        this.formatChartData(issue)
      )
      let testFileList = this.chartIssueList
        .map((issue) => (issue.test_files ? issue.test_files : null))
        .filter((issue) => issue)
      testFileList = testFileList
        .flat()
        .map((test_file) => this.formatTestFile(test_file))
        .flat()
      return chartData.concat(testFileList)
    },
    hasParent() {
      const rowIssue = this.chartIssueList.find(
        (item) => item.id === this.row.id
      )
      if (!rowIssue || !rowIssue.id) return false
      return !!(rowIssue.parent && rowIssue.parent.id)
    },
    hasRelations() {
      const rowIssue = this.chartIssueList.find(
        (item) => item.id === this.row.id
      )
      if (!rowIssue || !rowIssue.id) return false
      if (rowIssue.relations && rowIssue.relations.length === 0) return false
      return !!(rowIssue.relations && rowIssue.relations[0].id)
    }
  },
  watch: {
    selectedProjectId() {
      this.initChart()
    },
    row: {
      handler() {
        if (!this.isLoading) return
        this.isLoading = false
        this.initChart()
      },
      deep: true
    },
    'form.isTracker'(val) {
      if (val && !this.form.displayConditions.includes('status')) {
        this.form.displayConditions.push('status')
      } else if (!val && !this.form.displayConditions.includes('tracker')) {
        this.form.displayConditions.push('tracker')
      }
      this.zoom = 100
    },
    'form.allRelation'(val) {
      this.initChart()
    },
    'form.hasRelation'(val) {
      this.initChart()
    },
    'form.displayConditions'(val) {
      this.$refs.form.validate((valid) => {
        if (this.form.group && this.form.isTracker && !val.includes('status')) {
          this.showWarning(this.$t('IssueMatrix.CancelStatusWarning'))
          this.form.displayConditions.push('status')
        } else if (
          this.form.group &&
          !this.form.isTracker &&
          !val.includes('tracker')
        ) {
          this.showWarning(this.$t('IssueMatrix.CancelTrackerWarning'))
          this.form.displayConditions.push('tracker')
        } else if (val.length === 0 || !valid) {
          this.showWarning(this.$t('IssueMatrix.DisplayItemWarning'))
          this.form.displayConditions.push('name')
        }
      })
    }
    // 'form.level'(val) {
    //   if (val) {
    //     this.chartProgress.now = 0
    //     this.chartProgress.total = 0
    //   }
    //   this.initChart()
    // }
  },
  mounted() {
    this.initChart()
    this.$nextTick(() => {
      this.tableHeight = this.$refs['wrapper'].clientHeight - 30
    })
    window.onresize = () => {
      this.$nextTick(() => {
        this.tableHeight = this.$refs['wrapper'].clientHeight - 30
      })
    }
  },
  methods: {
    async initChart() {
      await this.onPaintChart()
    },
    highLight: function (value) {
      if (!value) return ''
      if (!this.issueQuery) return value
      const reg = new RegExp(this.issueQuery, 'gi')
      return value.replace(reg, function (str) {
        return (
          "<span class='bg-yellow-200 text-danger p-1'><strong>" +
          str +
          '</strong></span>'
        )
      })
    },
    checkUniqueRelationLine(subIssue_id, issue_id) {
      return !(
        Object.keys(this.relationLine).includes(subIssue_id.toString()) &&
        this.relationLine[subIssue_id].includes(issue_id)
      )
    },
    formatChartData(issue) {
      const link = []
      let children = []
      let relations = []
      if (issue['children']) {
        children = issue['children'].map((item) => item.id)
        children.forEach(() => {
          link.push('-->')
        })
      }
      if (issue['relations']) {
        relations = issue['relations']
          .map((item) =>
            this.checkUniqueRelationLine(item.id, issue.id) ? item.id : null
          )
          .filter((item) => item !== null)
        relations.forEach(() => {
          link.push('-.' + this.$t('Issue.RelatedIssue') + '.-')
        })
        this.relationLine[issue.id] = relations
      }
      children = children.concat(relations)
      if (issue['test_files']) {
        const test_files = issue['test_files'].map((item) => `file_${item.id}`)
        test_files.forEach(() => {
          link.push('-.->')
        })
        children = children.concat(test_files)
      }
      return this.getChartLayout(issue, link, children)
    },
    getChartLayout(issue, link, children) {
      const checkIssueName = issue.subject.replace(/"/g, '&quot;')
      const point = {
        id: issue.id,
        link,
        next: children,
        editable: true,
        edgeType: 'round'
      }
      if (issue.id === this.row.id) {
        point['edgeType'] = 'stadium'
      }

      point['text'] = `"`
      if (this.isConditionSelected('id')) point['text'] += `#${issue.id}`
      if (this.isConditionSelected('subject')) {
        point['text'] += ` - ${checkIssueName}`
      }
      if (point['text'] !== `"`) point['text'] += `<br/>`
      if (
        this.isConditionSelected('version') &&
        issue.version &&
        issue.version.name
      ) {
        point[
          'text'
        ] += `<span style=\'border-radius: 0.25rem; background: white; font-size: 0.75em; padding: 3px 5px; margin: 3px 5px;\'>${issue.version.name}</span>`
      }

      if (this.form.group) {
        if (this.form.isTracker) {
          if (this.isConditionSelected('status')) {
            point['text'] += `(${this.$t('Issue.' + issue.status.name)})`
          }
          point['group'] = `${this.$t('Issue.' + issue.tracker.name)}`
        } else {
          if (this.isConditionSelected('tracker')) {
            point['text'] += `(${this.$t('Issue.' + issue.tracker.name)})`
          }
          point['group'] = `${this.$t('Issue.' + issue.status.name)}`
        }
      } else {
        if (this.isConditionSelected('tracker')) {
          point['text'] += `${this.$t('Issue.' + issue.status.name)}`
        }
        if (this.isConditionSelected('status')) {
          point['text'] += ` - (${this.$t('Issue.' + issue.tracker.name)})`
        }
      }
      if (this.form.isTracker) {
        point['style'] = `fill:${
          this.trackerColor[camelCase(issue.tracker.name)]
        }, stroke: transparent`
      } else {
        point['style'] = `fill:${
          this.trackerColor[camelCase(issue.status.name)]
        }, stroke: transparent`
      }
      if (point['text'] !== `"`) point['text'] += `<br/>`
      if (
        this.isConditionSelected('assignee') &&
        issue.assigned &&
        issue.assigned.full_name
      ) {
        point['text'] += `${issue.assigned.full_name}`
      }
      point['text'] += `"`
      return point
    },
    isConditionSelected(item) {
      return this.form.displayConditions.includes(item)
    },
    formatTestFile(test_file) {
      const result = []
      const file = {
        id: `file_${test_file.id}`,
        name: test_file.file_name,
        link: ['-.->'],
        next: [`file_result_${test_file.id}`],
        editable: false
      }
      if (this.form.group) {
        file['group'] = `${this.$t('Issue.TestFile')}`
        file['text'] = `"${test_file.file_name}"`
      } else {
        file['text'] = `"${this.$t('Issue.TestFile')}<br/>${
          test_file.file_name
        }"`
        // file['style'] = `fill:${fullConfig.theme.colors[issue.tracker.name.toLowerCase()]}`
      }
      result.push(file)
      let last_result = null
      if (test_file.software_name === 'Postman') {
        const success =
          test_file.the_last_test_result &&
          test_file.the_last_test_result.success >= 0
            ? test_file.the_last_test_result.success
            : '-'
        const failure =
          test_file.the_last_test_result &&
          test_file.the_last_test_result.failure >= 0
            ? test_file.the_last_test_result.failure
            : '-'
        const total =
          test_file.the_last_test_result &&
          test_file.the_last_test_result.success >= 0 &&
          test_file.the_last_test_result.failure >= 0
            ? success + failure
            : '-'
        last_result = this.getTestLayout(success, total, test_file)
      } else if (test_file.software_name === 'SideeX') {
        const success = test_file?.the_last_test_result?.result
          ? test_file.the_last_test_result.result.casesPassed
          : '-'
        const total = test_file?.the_last_test_result?.result
          ? test_file.the_last_test_result.result.casesTotal
          : '-'
        last_result = this.getTestLayout(success, total, test_file)
      }
      const file_result = {
        id: `file_result_${test_file.id}`,
        name: `${test_file.software_name}.${test_file.file_name}_result`,
        link: ['-.->'],
        text: `"${last_result}"`,
        editable: true
      }
      if (this.form.group) {
        file_result['group'] = `${this.$t('TestCase.TestResult')}`
        file_result['text'] = `"${last_result}"`
      } else {
        file_result['text'] = `"${this.$t(
          'TestCase.TestResult'
        )}<br/>${last_result}"`
        // file_result['style'] = `fill:${fullConfig.theme.colors[issue.tracker.name.toLowerCase()]}`
      }
      result.push(file_result)
      return result
    },
    getTestLayout(success, total, test_file) {
      const color = {
        pass: this.trackerColor['success'],
        failure: this.trackerColor['danger']
      }
      const commit_icon = 'Commit: '
      let status_light = ''
      let count_result = ''
      let last_result = null
      if (success === total && success !== '-' && total !== '-') {
        status_light = `<div style=\'width:10px; height: 10px; background-color: ${color['pass']}; display:inline-block; border-radius: 99999px; \'></div>`
        count_result = `${status_light} <span style=\'color: ${color['pass']}; font-weight:600;\'>Pass</span>`
      } else {
        status_light = `<div style=\'width:10px; height: 10px; background-color: ${color['failure']}; display:inline-block; border-radius: 99999px; \'></div>`
        count_result = `${status_light} <span style=\'color: ${color['failure']}; font-weight:600;\'>Failure (${success} / ${total})</span>`
      }
      if (!test_file.the_last_test_result) {
        last_result = `${count_result}<br/>${this.$t('general.NoTestResult')}`
      } else {
        last_result =
          count_result +
          '<br/>' +
          test_file.the_last_test_result.branch +
          '<br/> ' +
          commit_icon +
          test_file.the_last_test_result.commit_id
      }
      return last_result
    },
    async onPaintChart() {
      this.accessedIssueId = []
      this.chartIssueList = []
      const family = (await getIssueFamily(this.row.id)).data
      this.accessedIssueId.push(this.row.id)
      await this.handlePaintFamily(this.row, family)
    },
    async handlePaintFamily(issue, issueFamily) {
      await this.getChartIssueList(issue, issueFamily)
      await this.paintAllFamily(issue, issueFamily)
    },
    async paintAllFamily(issue, issueFamily) {
      const getFamilyList = await this.combineFamilyList(issue, issueFamily)
      const getIssuesFamilyList = await this.getIssueFamilyData(getFamilyList)
      getFamilyList.forEach(async (subIssue, index) => {
        await this.handlePaintFamily(subIssue, getIssuesFamilyList[index])
      })
    },
    async getChartIssueList(issue, issueFamily) {
      if (issue.tracker.name === 'Test Plan') {
        const test_files = await this.getTestPlan(issue.id)
        this.chartIssueList.push({ ...issue, ...issueFamily, test_files })
      } else {
        this.chartIssueList.push({ ...issue, ...issueFamily })
      }
    },
    async getTestPlan(issueId) {
      if (import.meta.env.VITE_APP_PROJECT === 'LITE') return
      const testFiles = await getTestFileByTestPlan(
        this.selectedProjectId,
        issueId
      )
      return testFiles.data
    },
    async getIssueFamilyData(chartIssueList) {
      const getIssueFamilyAPI = chartIssueList.map((issue) => {
        this.accessedIssueId.push(issue.id)
        return getIssueFamily(issue.id)
      })
      const response = await Promise.allSettled(getIssueFamilyAPI)
      return Promise.resolve(response.map((res) => res.value.data))
    },
    combineFamilyList(issue, family) {
      const bug = this.tracker.find((item) => item.name === 'Bug').id
      const close = this.status.find((item) => item.name === 'Closed').id
      let familyList = []
      Object.keys(family).forEach((relationType) => {
        if (!this.form.hasRelation && relationType === 'relations') return
        if (!this.form.allRelation && relationType === 'parent') return
        if (!family[relationType]) return
        if (family[relationType] && !Array.isArray(family[relationType])) {
          family[relationType] = [family[relationType]]
        }
        family[relationType] = family[relationType].filter(
          (item) => !(item.status_id === close && item.tracker_id === bug)
        )
        family[relationType] = this.formatFamilyList(
          issue,
          family[relationType],
          relationType
        )
        if (family.hasOwnProperty(relationType)) {
          familyList = familyList.concat(family[relationType])
        }
      })
      familyList = familyList.filter(
        (item) => !this.accessedIssueId.includes(item.id)
      )
      return Promise.resolve(familyList)
    },
    formatFamilyList(issue, family, relationTarget) {
      return family.map((item) => ({
        ...item,
        relation_type: relationTarget,
        relation_id: issue.id
      }))
    },
    editNode(nodeId) {
      if (
        this.$route.name === 'IssueDetail' &&
        parseInt(nodeId) === this.accessedIssueId[0]
      ) {
        return
      }
      this.onRelationIssueDialog(nodeId)
    },
    handleRelationUpdate(nodeId) {
      this.onCloseRelationIssueDialog()
      if (nodeId === this.accessedIssueId[0]) {
        this.$emit('onCloseIssueMatrix')
        return
      }
      this.onCloseRelationIssueDialog()
      this.$emit('update-issue')
      this.isLoading = true
    },
    onRelationIssueDialog(id) {
      this.$set(this.relationIssue, 'visible', true)
      this.$set(this.relationIssue, 'id', id)
    },
    onCloseRelationIssueDialog() {
      this.$set(this.relationIssue, 'visible', false)
      this.$set(this.relationIssue, 'id', null)
    },
    handleRelationIssueDialogBeforeClose(done) {
      if (this.$refs.children.hasUnsavedChanges()) {
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
    downloadSVG() {
      try {
        const svg = document
          .getElementById('mermaid')
          .getElementsByTagName('svg')[0]
        const htmls = svg.getElementsByClassName('nodeLabel')
        for (const html of htmls) {
          html.style = 'font-size:0.8em'
        }
        const serializer = new XMLSerializer()
        let source = serializer.serializeToString(svg)
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source
        const url =
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
        const downloadLink = document.createElement('a')
        downloadLink.href = url
        downloadLink.download = `TraceabilityMatrix_${getLocalTime(Date.now())}`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      } catch (e) {
        // nothing to do.
      }
    },
    showWarning(message) {
      this.$message({
        title: this.$t('general.Warning'),
        type: 'warning',
        message
      })
    }
  }
}
</script>
<style lang="scss" scoped>
$max_height: calc(100vh - 50px - 20px - 50px - 50px);
$max_width: calc(100vw - 50px - 20px - 50px - 50px);
.wrapper {
  height: #{$max_height};
  @apply overflow-hidden;
}

.mermaid-wrapper {
  @apply cursor-move static overflow-auto;
  .toolbar {
    @apply absolute bottom-10 right-10 z-50 w-1/6;
  }

  @for $i from 1 through 20 {
    .w-#{25 * $i} {
      width: calc(#{$max_width} * 0.25 * #{$i});
      height: calc(#{$max_height} * 0.25 * #{$i});

      ::v-deep svg {
        width: 25% * $i;
        height: calc(25% * #{$i} - 20px);
        transform-origin: top left;
        transform: scale(0.25 * $i);
      }
    }
  }
}

.relation_settings {
  ::v-deep .el-form-item__content {
    @apply clear-both;
  }

  .item {
    @apply mx-1 inline-block;
  }
}

.el-form {
  padding: 10px;

  .el-form-item {
    margin-bottom: 0;
  }
}

.issue-select {
  ::v-deep .el-tag {
    //width: 100%;
    height: fit-content;
    white-space: normal;

    .el-select__tags-text {
      width: 100%;
    }
  }
}

.loading {
  ::v-deep .el-alert__content {
    width: 100%;
  }
}

//::v-deep . el-card {
//  .el-card__body {
//    height: 100%;
//    overflow-y: auto;
//  }
//}
</style>
