<template>
  <el-card
    shadow="never"
    class="card"
    :class="{ preview: isPreview }"
  >
    <div class="logo-container">
      <img src="@/assets/logo.png" class="logo" alt="logo">
      <h1 class="title">{{ title }} </h1>
    </div>
    <div
      class="text-center font-bold clearfix"
      style="
            line-height: 7px;
            color: #429470;
            font-size: 32px;
            text-shadow: #b3b1b1 0.05em 0.05em 0.1em;
          "
    >{{ $t('Docker.Title') }}</div>
    <div style="padding: 40px;">
      <ul class="text-base mb-10 font-semibold">
        <li>{{ $t('general.project_name') }}: {{ propsData.projectName }}</li>
        <li>{{ $t('TestReport.TestTime') }}: {{ propsData.timeNow }}</li>
        <li>
          {{ $t('general.Branch') }} / {{ $t('TestReport.Commit') }}:
          {{ propsData.branch }} /<svg-icon class="mr-1" icon-class="ion-git-commit-outline" />
          {{ propsData.commitId }}
        </li>
        <li>{{ $t('Sbom.PackageCount') }}: {{ propsData.packageCount }}</li>
      </ul>
      <!-- white box test -->
      <div
        class="text-center font-bold"
        style="
              width: 40%;
              font-size: 20px;
              margin: 0 auto;
              padding-bottom: 10px;
              border-bottom: 1px solid
            "
      >
        {{ $t('Docker.Overview') }}
      </div>
      <el-row
        :gutter="12"
        class="mt-3"
        style="width: 80%; margin: 0 auto;"
      >
        <el-col
          v-for="item in summaryData"
          :key="item.severity"
          :span="4"
        >
          <el-card
            class="text-center font-bold mb-10 "
            style="box-shadow: 12px 12px 12px 0 rgb(0 0 0 / 10%)"
            :body-style="{
              padding: 0,
              color:severityColor(item.severity)
            }"
          >
            <p>{{ $t(`Docker.${item.severity}`) }}</p>
            <p style="font-size: 40px; margin: 10px;">
              {{ item.value || 0 }}
            </p>
          </el-card>
        </el-col>
      </el-row>
      <div
        class="text-center font-bold"
        style="
              padding: 10px;
              background: #606260;
              color: #fff;
            "
      >
        {{ $t('Docker.AlertDetail') }}
      </div>
      <el-table
        v-loading="listLoading"
        :row-class-name="getRowClass"
        :element-loading-text="$t('Loading')"
        :data="listData"
        size="small"
        fit
        @sort-change="$emit('handleSortChange')"
      >
        <el-table-column type="expand">
          <template slot-scope="{row}">
            <p class="ml-3">
              {{ row.description }}
            </p>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Docker.Package')"
          prop="name"
          align="center"
          sortable="custom"
        />
        <el-table-column
          :label="$t('Docker.Vulnerability')"
          prop="id"
          align="center"
        >
          <template slot-scope="{row}">
            <el-link
              type="primary"
              target="_blank"
              :href="row.dataSource"
            >
              {{ row.id }}
            </el-link>
          </template>
        </el-table-column>
        <ElTableColumnTag
          :label="$t('Docker.Severity')"
          prop="severity"
          size="small"
          location="docker"
          min-width="50"
          i18n-key="Docker"
          sortable="custom"
        />
        <el-table-column
          :label="$t('Docker.Licenses')"
          prop="licenses"
          align="center"
          min-width="100"
        >
          <template slot-scope="{row}">
            <el-tooltip
              v-if="row.licenses"
              effect="dark"
              placement="right"
              :disabled="row.licenses.length < 4"
            >
              <ul
                slot="content"
                class="text-left"
                style="margin: 0; padding-left: 1rem;"
              >
                <li
                  v-for="(item, index) in row.licenses"
                  :key="index"
                >
                  {{ item }}
                </li>
              </ul>
              <ul
                class="text-left"
                style="margin: 0; padding-left: 1rem;"
              >
                <li
                  v-for="(item, index) in row.licenses.slice(0,row.licenses.length === 3 ? 3 : 2)"
                  :key="index"
                >
                  {{ item }}
                  <div
                    v-if="row.licenses.length > 3 && index === 1"
                    class="font-bold"
                  >
                    more . . .
                  </div>
                </li>
              </ul>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Docker.Type')"
          prop="type"
          align="center"
        />
        <el-table-column
          :label="$t('Docker.CurrentVersion')"
          prop="version"
          align="center"
        />
        <el-table-column
          :label="$t('Docker.FixedVersion')"
          prop="versions"
          align="center"
          min-width="100"
          sortable="custom"
        >
          <template slot-scope="{row}">
            <el-tooltip
              v-if="row.versions"
              effect="dark"
              placement="left"
              :disabled="row.versions.length < 4"
            >
              <ul
                slot="content"
                class="text-left"
                style="margin: 0; padding-left: 1rem;"
              >
                <li
                  v-for="(item, index) in row.versions"
                  :key="index"
                >
                  {{ item }}
                </li>
              </ul>
              <ul
                class="text-left"
                style="margin: 0; padding-left: 1rem;"
              >
                <li
                  v-for="(item, index) in row.versions.slice(0,row.licenses.length === 3 ? 3 : 2)"
                  :key="index"
                >
                  {{ item }}
                  <div
                    v-if="row.licenses.length > 3 && index === 1"
                    class="font-bold"
                  >
                    more . . .
                  </div>
                </li>
              </ul>
            </el-tooltip>
          </template>
        </el-table-column>
        <template slot="empty">
          <el-empty :description="$t('general.NoData')" />
        </template>
      </el-table>
      <slot name="pagination" />
    </div>
  </el-card>
</template>

<script>
import { ElTableColumnTag } from '@shared/components'

export default {
  name: 'SbomReportFile',
  components: {
    ElTableColumnTag
  },
  props: {
    propsData: {
      type: Object,
      default: () => ({
        projectName: '',
        timeNow: null,
        branch: '',
        commitId: '',
        packageCount: 0
      })
    },
    summaryData: {
      type: Array,
      default: () => []
    },
    listData: {
      type: Array,
      default: () => []
    },
    listLoading: {
      type: Boolean,
      default: false
    },
    isPreview: {
      type: Boolean,
      default: false
    }
  },
  data() {
    this.title = 'III DevOps'
    return {}
  },
  methods: {
    severityColor(item) {
      switch (item) {
        case 'Critical':
          return '#f56c6c'
        case 'High':
          return '#e6a23c'
        case 'Medium':
          return '#409eff'
        case 'Low':
          return '#606260'
        case 'Negligible':
          return '#67c23a'
        case 'Unknown':
          return '#606260'
      }
    },
    getRowClass({ row }) {
      return row.description ? '' : 'row-expand-cover'
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

::v-deep .row-expand-cover .el-table__expand-column .cell {
  display: none;
}

::v-deep .el-divider__text {
  font-size: 18px;
}

::v-deep .el-link--inner{
  border-bottom: 1px solid #409eff;
}

.logo-container {
  position: relative;
  left: 10px;
  width: 100%;
  height: 50px;
  line-height: 50px;
  text-align: left;
  overflow: hidden;

  .logo {
    width: 32px;
    height: 32px;
    vertical-align: middle;
    margin-right: 12px;
  }

  .title {
    display: inline-block;
    margin: 0;
    font-weight: 600;
    line-height: 50px;
    font-size: 14px;
    font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
    vertical-align: middle;
  }
}

.preview {
  width: 1000px;
  margin: 0 auto;
}
</style>
