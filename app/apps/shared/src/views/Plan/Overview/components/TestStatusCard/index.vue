<template>
  <el-card
    v-loading="isLoading"
    :element-loading-text="$t('Loading')"
    class="mb-3"
  >
    <div class="flex justify-between h-8">
      <span class="flex items-center font-semibold">
        <em class="el-icon-circle-check mx-1"></em>
        {{ $t('Dashboard.TestStatus') }}
      </span>
      <el-button
        :class="
          Object.keys(projectTestObj).length === 0 ? '' : 'link-text-color'
        "
        :disabled="Object.keys(projectTestObj).length === 0"
        icon="el-icon-refresh"
        size="mini"
        type="text"
        @click="updateProjectTestList()"
      >
        {{ $t('general.Refresh') }}
      </el-button>
    </div>
    <el-empty
      v-if="Object.keys(projectTestObj).length === 0"
      :description="$t('general.NoData')"
      :image-size="100"
    />
    <el-row v-else :gutter="14" class="mt-3 column">
      <el-col
        v-for="result in testResultList"
        :key="result.Software"
        :span="24"
        class="mb-3"
      >
        <el-card shadow="never">
          <div
            class="flex justify-between items-center mb-1"
            @click="handleClick(result.Software)"
          >
            <span class="text-xl link-text-color font-semibold capitalize">
              {{ result.Software }}
            </span>
            <em class="el-icon-right cursor-pointer"></em>
          </div>
          <el-tooltip
            :content="result.runAt ? getLocalTime(result.runAt) : '-'"
            :open-delay="200"
            placement="right"
          >
            <span class="text-sm">
              <em class="mr-1 ri-time-line"></em>
              <span>
                {{ result.runAt ? getRelativeTime(result.runAt) : '-' }}
              </span>
            </span>
          </el-tooltip>
          <div class="mt-3">
            <span
              v-if="Object.keys(result.informationText).length === 0"
              class="text-gray-400"
            >
              {{ $t('general.NoData') }}
            </span>
            <div
              v-for="item in result.informationText"
              :key="item.status"
              class="flex justify-between mb-1"
            >
              <span class="text-sm">
                {{ item.status }}
              </span>
              <span class="text-title">
                {{ item.count }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script>
import { testFormatter } from './formatter'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'

export default {
  name: 'TestStatusCard',
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    projectTestObj: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      testResultList: []
    }
  },
  watch: {
    projectTestObj(val) {
      this.testResultList = this.handleTestRes(val)
    },
    '$i18n.locale'() {
      this.testResultList = this.handleTestRes(this.projectTestObj)
    }
  },
  methods: {
    handleTestRes(testResult) {
      const result = []
      const keys = Object.keys(testResult)
      const mapFormatter = {
        postman: testFormatter,
        checkmarx: testFormatter,
        webinspect: testFormatter,
        sbom: testFormatter,
        sbom_code: testFormatter,
        sonarqube: testFormatter,
        sideex: testFormatter,
        zap: testFormatter,
        cmas: testFormatter,
        harbor: testFormatter,
        semgrep: testFormatter
      }
      keys.forEach((key) => {
        testResult[key].name = key
        if (key === 'sbom_code') {
          result.push(mapFormatter[key](testResult[key], 'code'))
        } else {
          result.push(mapFormatter[key](testResult[key]))
        }
      })
      return result
    },
    handleClick(target) {
      this.$router.push({
        name: `${target.charAt(0).toUpperCase()}${target.slice(1)}`
      })
    },
    updateProjectTestList() {
      this.$emit('update')
    },
    getLocalTime(time) {
      return getLocalTime(time)
    },
    getRelativeTime(time) {
      return getRelativeTime(time)
    }
  }
}
</script>

<style lang="scss" scoped>
.column {
  column-count: 2;
  gap: 0;
}

@media screen and (max-width: 450px) {
  .column {
    column-count: 1;
  }
}
</style>
