<template>
  <div class="mb-3" style="border-top: 1px solid #e5e7eb">
    <el-row :gutter="4" width="100%">
      <el-col :sm="4" :xs="24">
        <h3>{{ $t('Release.ImageList') }}</h3>
      </el-col>
      <el-col :sm="8" :xs="24" class="my-3">
        <el-select
          v-if="branches.length > 0"
          v-model="branch"
          filterable
          @change="getImageList()"
        >
          <el-option
            v-for="item in branches"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-col>
      <el-col :sm="12" :xs="24">
        <el-col :sm="12" :xs="24" class="my-3">
          <el-switch
            v-model="switchData.hasAllCommit"
            :active-text="$t('Release.RenderAllCommit')"
            class="mr-2"
            @change="onSwitch"
          />
        </el-col>
        <el-col :sm="12" :xs="24" class="my-3">
          <el-switch
            v-model="switchData.hasImage"
            :active-text="$t('Release.OnlyImage')"
            :disabled="!services.harbor"
            @change="onSwitch"
          />
        </el-col>
      </el-col>
    </el-row>
    <ElTableResponsive
      ref="imageList"
      v-loading="isLoading"
      :columns="tableColumns"
      :data="imageList"
      highlight-current-row
      row-class-name="imageList"
      @current-change="handleCurrentChange"
      @row-click="handleRowClick"
    >
      <template #image="{ row }">
        <template v-if="typeof row.image === 'object'">
          <el-select
            v-if="row.image.length > 0"
            v-model="row.selectedImage"
            @change="(imageTag) => handleImageChange(row, imageTag)"
          >
            <el-option
              v-for="imageData in row.image"
              :key="imageData.image_tag"
              :label="getImage(imageData.image)"
              :value="imageData.image_tag"
            >
              <span>{{ getImage(imageData.image) }}</span>
              <span style="color: #8492a6">({{ imageData.image_tag }})</span>
            </el-option>
          </el-select>
        </template>
        <template v-else>
          <el-tooltip :content="row.commit_message" placement="top">
            <div v-if="!row.image_tag && row.image" class="cursor-pointer">
              <div>{{ getImage(row.image) }}</div>
            </div>
            <div v-else class="cursor-pointer">
              <div>{{ row.image_tag }}</div>
              <div>({{ getImage(row.image) }})</div>
            </div>
          </el-tooltip>
        </template>
      </template>
      <template #push_time="{ row }">
        <span>{{ getPushTime(row.push_time) }}</span>
      </template>
      <template #tag="{ row }">
        <span>{{ row.tag ? row.tag : '-' }}</span>
      </template>
      <template #report="{ row }">
        <el-tooltip :content="$t('PipeLines.Report')" placement="bottom">
          <em
            class="ri-survey-line primary table-button"
            @click="handleOpenDrawer(row)"
          ></em>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page="listQuery.current"
      :page-sizes="[listQuery.limit]"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="listQuery.total"
      @pagination="onPagination"
    />
    <el-drawer
      :title="$t('Release.ReportPreview')"
      :visible.sync="isShowDrawer"
      direction="rtl"
      size="75%"
    >
      <TestReport v-if="isShowDrawer" :commit-params="commitParams" />
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getProjectImageList } from '@/api_v3/projects'
import Table from '@/mixins/Table'
import Pagination from '@/mixins/Pagination'
import { getLocalTime } from '@shared/utils/handleTime'

const initParam = {
  page: 1,
  limit: 3
}

export default {
  name: 'ImageList',
  components: {
    ElTableResponsive: () => import('@shared/components/ElTableResponsive'),
    TestReport: () =>
      import('@shared/views/Progress/Pipelines/components/TestReport')
  },
  mixins: [Table, Pagination],
  props: {
    branches: {
      type: Array,
      default: () => []
    },
    commitId: {
      type: String,
      default: ''
    },
    branchName: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    switchData: {
      type: Object,
      default: () => ({
        hasImage: true,
        hasAllCommit: false
      })
    }
  },
  data() {
    return {
      isLoading: false,
      imageList: [],
      branch: this.branchName,
      currentRow: null,
      isShowDrawer: false,
      commitParams: {
        projectId: '',
        branch: '',
        commitId: '',
        startedAt: ''
      }
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device', 'services']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      const columns = [
        {
          label: this.$t('general.Branch'),
          prop: 'branch',
          align: 'center'
        },
        {
          label: this.$t('general.Commit'),
          prop: 'commit_id',
          align: 'center'
        },
        {
          label: 'Image',
          prop: 'image',
          align: 'center',
          slot: 'image'
        },
        {
          label: this.$t('Release.CommitTime'),
          prop: 'push_time',
          align: 'center',
          slot: 'push_time'
        },
        {
          label: this.$t('Release.TableReleaseVersion'),
          prop: 'tag',
          align: 'center',
          slot: 'tag'
        }
      ]
      if (this.services.gitlab) {
        columns.push({
          label: this.$t('Release.ReportPreview'),
          prop: 'report',
          align: 'center',
          slot: 'report'
        })
      }
      return columns
    }
  },
  watch: {
    'services.harbor': {
      handler(val) {
        if (!val) {
          this.switchData.hasImage = false
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.getImageList()
  },
  methods: {
    getImageList() {
      this.fetchData(5)
    },
    async fetchData(limit) {
      const params = {
        branch_name: this.branch,
        only_image: this.switchData.hasImage,
        limit: limit || this.listQuery.limit,
        offset: this.listQuery.offset,
        not_all: !this.switchData.hasAllCommit,
        store: false
      }
      if (params.limit === 0) return
      this.isLoading = true
      await getProjectImageList(this.selectedProjectId, params)
        .then((res) => {
          this.handleImageListData(res.data.items)
          this.listQuery = res.data.pagination
        })
        .catch((err) => console.error(err))
        .finally(() => {
          this.isLoading = false
        })
    },
    handleImageListData(list) {
      this.imageList = list.map((images) => {
        if (
          images.image_tag === this.image ||
          (!images.image_tag && images.commit_id === this.commitId)
        ) {
          this.$refs.imageList.$refs.responsiveTable.setCurrentRow(images)
        }

        if (typeof images.image === 'object') {
          if (!images?.image) images.image = []
          if (images.image.length === 1) {
            images.commit_id = images.image[0].commit_id
            images.image = images.image[0].image
          }
          images.selectedImage = images.image[0]
        }
        images.branch = this.branch
        return images
      })
    },
    getImage(image) {
      return image ? image.substr(0, 15) : '-'
    },
    getPushTime(time) {
      return getLocalTime(time)
    },
    async onPagination(listQuery) {
      const { page } = listQuery
      this.listQuery.page = page
      await this.getImageList()
    },
    onSwitch() {
      this.onPagination(initParam)
    },
    handleCurrentChange(row) {
      this.currentRow = row
    },
    handleRowClick(row) {
      if (typeof row.image === 'object' && row.image.length > 0) return
      this.$refs.imageList.$refs.responsiveTable.setCurrentRow(row)
      this.$emit('onChangeImage', row)
    },
    handleImageChange(row, imageTag) {
      const data = row.image.find((rowData) => rowData.image_tag === imageTag)
      data.branch = row.branch
      this.handleRowClick(data)
    },
    handleOpenDrawer(row) {
      const { branch, commit_id, push_time } = row
      this.isShowDrawer = true
      this.commitParams = {
        projectId: this.selectedProjectId,
        branch,
        commitId: commit_id,
        startedAt: push_time
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-drawer__header {
  margin-bottom: 30px;
}
</style>
