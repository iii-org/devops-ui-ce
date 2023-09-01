<template>
  <el-card shadow="never" :class="{ preview: isPreview }">
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
    <div class="text-center font-bold" style="padding-top: 20px;">
      {{ propsData.scanner.name }} {{ propsData.scanner.version }}
    </div>
    <div style="padding: 40px; width: 100%;">
      <ul class="text-base font-semibold">
        <li>{{ $t('general.project_name') }}: {{ propsData.projectName }}</li>
        <li>{{ $t('TestReport.TestTime') }}: {{ propsData.timeNow }}</li>
        <li>
          {{ $t('general.Branch') }} / {{ $t('TestReport.Commit') }}:
          {{ propsData.branch }} /<svg-icon class="mr-1" icon-class="ion-git-commit-outline" />
          {{ propsData.commitId }}
        </li>
        <li>{{ $t('Docker.Size') }}: {{ propsData.size }}</li>
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
            <p
              style="
                    fontSize: 40px;
                    margin: 10px;
                  "
            >
              {{ item.value }}
            </p>
          </el-card>
        </el-col>
      </el-row>
      <div style="width: 100%;">
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
          ref="table_checkmarx"
          v-loading="listLoading"
          class="mb-10"
          :element-loading-text="$t('Loading')"
          :data="listData"
          size="small"
          border
          fit
        >
          <el-table-column align="center" type="index" width="50" />
          <el-table-column
            :label="$t('Docker.Vulnerability')"
            align="center"
            width="180px"
            prop="id"
          >
            <template slot-scope="scope">
              <el-link
                class="linkTextColor"
                target="_blank"
                style="font-size: 16px"
                :href="scope.row.links[0]"
              >
                {{ scope.row.id }}
              </el-link>
            </template>
          </el-table-column>
          <ElTableColumnTag
            :label="$t('Docker.Severity')"
            prop="severity"
            size="small"
            min-width="130"
            location="docker"
            i18n-key="Docker"
          />
          <el-table-column align="center" :label="$t('Docker.Package')" prop="package" />
          <el-table-column align="center" :label="$t('Docker.CurrentVersion')" prop="version" />
          <el-table-column align="center" :label="$t('Docker.FixedVersion')" prop="fix_version" />
        </el-table>
        <div
          class="text-center font-bold"
          style="
                padding: 10px;
                background: #606260;
                color: #fff;
              "
        >
          {{ $t('Docker.Reference') }}
        </div>
        <el-table
          ref="table_checkmarx"
          v-loading="listLoading"
          class="mb-10"
          :element-loading-text="$t('Loading')"
          :data="listData"
          size="small"
          border
          fit
        >
          <el-table-column align="center" type="index" width="50" />
          <el-table-column align="center" width="180px" :label="$t('Docker.Vulnerability')" prop="id">
            <template slot-scope="scope">
              <el-link
                class="linkTextColor"
                target="_blank"
                style="font-size: 16px"
                :href="scope.row.links[0]"
              >
                {{ scope.row.id }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column header-align="center" :label="$t('general.Description')" prop="description">
            <template slot-scope="scope">
              {{ scope.row.description || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-card>
</template>

<script>
import { ElTableColumnTag } from '@/components'

export default {
  name: 'DockerReportFile',
  components: { ElTableColumnTag },
  props: {
    propsData: {
      type: Object,
      default: () => ({
        projectName: '',
        timeNow: null,
        branch: '',
        commitId: '',
        size: '-',
        scanner: []
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
    }
  }
}
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}

::v-deep .el-divider__text {
  font-size: 18px;
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
