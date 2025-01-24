<template>
  <div class="w-full" style="padding: 30px 30px 0 30px">
    <el-descriptions class="mb-5" :column="isMobile ? 1 : 2">
      <el-descriptions-item>
        <template slot="label">
          {{ $t('general.project_name') }}
        </template>
        {{ projectName }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template slot="label">
          {{ $t('Version.Version') }}
        </template>
        <el-skeleton :loading="isLoading" class="w-[50px]" animated>
          <template slot="template">
            <el-skeleton-item variant="text" />
          </template>
          <template>
            <span>{{ listData.version?.main }}</span>
          </template>
        </el-skeleton>
      </el-descriptions-item>
      <el-descriptions-item>
        <template slot="label">
          {{ $t('TestReport.TestTime') }}
        </template>
        {{ getLocalTime(params.createAt) }}
      </el-descriptions-item>
      <el-descriptions-item v-loading="isLoading">
        <template slot="label"> Analyzer </template>
        <el-skeleton :loading="isLoading" class="w-[50px]" animated>
          <template slot="template">
            <el-skeleton-item variant="text" class="w-full" />
          </template>
          <template>
            <span>{{ listData.version?.analyzer }}</span>
          </template>
        </el-skeleton>
      </el-descriptions-item>
      <el-descriptions-item v-loading="isLoading">
        <template slot="label"> Scanner </template>
        <el-skeleton :loading="isLoading" class="w-[50px]" animated>
          <template slot="template">
            <el-skeleton-item variant="text" class="w-full" />
          </template>
          <template>
            <span>{{ listData.version?.scanner }}</span>
          </template>
        </el-skeleton>
      </el-descriptions-item>
      <el-descriptions-item>
        <template slot="label">
          <span>{{ $t('general.Branch') }}</span>
        </template>
        <span>{{ params.branch }}</span>
      </el-descriptions-item>
      <el-descriptions-item>
        <template slot="label">
          <span>{{ $t('TestReport.Commit') }}</span>
        </template>
        <span>
          <em class="ri-git-commit-line"></em>
        </span>
        <span class="font-code">{{ params.commit }}</span>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script>
import { getLocalTime } from '@shared/utils/handleTime'
import { mapGetters } from 'vuex'

export default {
  name: 'ReportDescription',
  props: {
    listData: {
      type: Object,
      default: () => ({
        details: [],
        summary: {},
        version: {}
      })
    },
    params: {
      type: Object,
      default: () => ({
        branch: '',
        commit: '',
        commitUrl: '',
        createAt: ''
      })
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      getLocalTime
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device']),
    projectName() {
      return this.selectedProject.display_name
    },
    isMobile() {
      return this.device === 'mobile'
    }
  }
}
</script>
