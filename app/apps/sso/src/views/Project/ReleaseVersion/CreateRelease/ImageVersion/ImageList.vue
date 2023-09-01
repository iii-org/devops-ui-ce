<template>
  <div class="mb-3">
    <el-row :gutter="4" width="100%">
      <el-col :xs="24" :sm="4"><h3>{{ $t('Release.ImageList') }}</h3></el-col>
      <el-col :xs="24" :sm="8" class="my-3">
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
      <el-col :xs="24" :sm="12">
        <el-col :xs="24" :sm="12" class="my-3">
          <el-switch
            v-model="hasAllCommit"
            :active-text="$t('Release.RenderAllCommit')"
            class="mr-2"
            @change="onSwitch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" class="my-3">
          <el-switch
            v-model="hasImage"
            :active-text="$t('Release.OnlyImage')"
            @change="onSwitch"
          />
        </el-col>
      </el-col>
    </el-row>
    <ElTableResponsive
      ref="imageList"
      v-loading="isLoading"
      row-class-name="imageList"
      :data="imageList"
      :columns="tableColumns"
      highlight-current-row
      @current-change="handleCurrentChange"
      @row-click="handleRowClick"
    >
      <template v-slot:image="{row}">
        <template v-if="typeof row.image === 'object'">
          <el-select
            v-if="row.image.length > 0"
            v-model="row.selectedImage"
            @change="imageTag => handleImageChange(row, imageTag)"
          >
            <el-option
              v-for="imageData in row.image"
              :key="imageData.image_tag"
              :label="getImage(imageData.image)"
              :value="imageData.image_tag"
            >
              <span>{{ getImage(imageData.image) }}</span>
              <span style="color: #8492a6;">({{ imageData.image_tag }})</span>
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
      <template v-slot:push_time="{row}">
        <span>{{ getPushTime(row.push_time) }}</span>
      </template>
      <template v-slot:tag="{row}">
        <span>{{ row.tag ? row.tag : '-' }}</span>
      </template>
    </ElTableResponsive>
    <Pagination
      :total="listQuery.total"
      :page="listQuery.current"
      :limit="listQuery.limit"
      :page-sizes="[listQuery.limit]"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getImageList } from '@/api_v2/release'
import { Table, Pagination } from '@/mixins'
import { getLocalTime } from '@shared/utils/handleTime'
import { ElTableResponsive } from '@shared/components'

const initParam = {
  page: 1,
  limit: 3
}

export default {
  name: 'ImageList',
  components: {
    ElTableResponsive
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
    }
  },
  data() {
    return {
      isLoading: false,
      imageList: [],
      branch: this.branchName,
      hasImage: true,
      hasAllCommit: false,
      currentRow: null
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId', 'device']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
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
        only_image: this.hasImage,
        limit: limit || this.listQuery.limit,
        offset: this.listQuery.offset,
        not_all: !this.hasAllCommit
      }
      if (params.limit === 0) return
      this.isLoading = true
      await getImageList(this.selectedProjectId, params)
        .then((res) => {
          this.handleImageListData(res.data.image_list)
          this.listQuery = res.data.page
        })
        .catch((err) => console.error(err))
        .finally(() => {
          this.isLoading = false
        })
    },
    handleImageListData(list) {
      this.imageList = list.map(images => {
        if (images.image_tag === this.image) {
          this.$refs.imageList.$refs.responsiveTable.setCurrentRow(images)
        } else if (!images.image_tag && images.commit_id === this.commitId) {
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
      const { page, limit } = listQuery
      this.listQuery.offset = page * limit - limit
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
    }
  }
}
</script>
