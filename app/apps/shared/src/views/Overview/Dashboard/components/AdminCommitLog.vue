<template>
  <el-col v-loading="listLoading" class="inner">
    <template v-if="listData.length > 0">
      <transition-group name="slide-fade" tag="el-timeline">
        <el-timeline-item
          v-for="(commit, idx) in listData"
          :key="commit.id"
          :timestamp="commit.commit_time"
          placement="top"
        >
          <template #dot>
            <div
              :class="{ 'flash-dot': idx === 0, 'normal-dot': idx !== 0 }"
            ></div>
          </template>
          <el-card class="timeline-item-card">
            <p class="text-sm font-bold m-0">{{ commit.commit_title }}</p>
            <el-divider />
            <p v-if="compareCommitContent(commit)">
              {{ commit.commit_message }}
            </p>
            <p class="author">
              {{ commit.author_name }} @ {{ commit.pj_name }}
            </p>
          </el-card>
        </el-timeline-item>
      </transition-group>
    </template>
    <NoData v-else />
  </el-col>
</template>

<script>
export default {
  name: 'AdminCommitLog',
  components: { NoData: () => import('@shared/components/NoData') },
  props: {
    getData: {
      type: Function,
      default: () => []
    }
  },
  data() {
    return {
      listData: [],
      detailDialog: false,
      listLoading: false
    }
  },
  computed: {
    compareCommitContent() {
      return function (commit) {
        return commit.commit_message.trim() !== commit.commit_title
      }
    },
    firstEightCommitId() {
      return function (commitId) {
        return commitId.slice(0, 8)
      }
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.listLoading = true
      this.listData = await this.getData()
      this.listLoading = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.inner {
  height: 305px;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 0 !important;
  padding-top: 10px;
}

.timeline-item-card {
  ::v-deep .el-card__body {
    padding: 10px;
  }

  .author {
    margin: 0;
  }
}

.slide-fade-enter-active {
  transition: all 0.5s ease;
}

.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter, .slide-fade-leave-to
  /* .slide-fade-leave-active for below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}

::v-deep {
  .el-timeline {
    padding-left: 10px;
  }

  .el-card__body .el-divider--horizontal {
    margin: 6px -12px !important;
  }

  .el-timeline-item__dot {
    left: -1px;
  }
}

.flash-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: $linkTextColor; /* Change to your preferred color */
  animation: flash-shadow 1.5s infinite;
}

.normal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e4e7ed; /* Same color as flash-dot without animation */
}
</style>
