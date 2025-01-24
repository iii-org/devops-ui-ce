<template>
  <div class="div-container">
    <el-row>
      <!-- tree-props 取消第二個子議題箭頭-->
      <ElTableResponsive
        ref="issueList"
        :columns="tableColumns"
        :data="pagedData"
        :row-class-name="getRowClass"
        :tree-props="{ children: 'child' }"
        class="w-screen"
        fit
        highlight-current-row
        row-key="id"
      >
        <template #expand="{ row }">
          <div class="ml-3" style="color: #409eff">
            {{ $t('Release.releaseNote') }}
          </div>
          <Viewer :initial-value="'\n' + row.note" class="ml-5 primary" />
        </template>
        <template #created_at="{ row }">
          {{ getLocalTime(row.create_at) }}
        </template>
        <template #branch="{ row }">
          <el-link
            :href="row.git_url"
            :underline="false"
            target="_blank"
            type="primary"
          >
            <div>
              <em v-if="row.branch" class="ri-git-branch-line mr-1"></em>
              {{ row.branch }}
            </div>
            <div class="font-code">
              <em class="ri-git-commit-line"></em>
              {{ row.commit }}
            </div>
          </el-link>
        </template>
        <template #tag_name_list="{ row }">
          <el-link
            :underline="false"
            type="primary"
            @click="showClosedIssue(row.tag_name)"
          >
            {{ row.tag_name }}
          </el-link>
        </template>
        <template #docker="{ row }">
          <el-popover
            v-for="(image, idx) in row.docker"
            :key="image.repo"
            :close-delay="50"
            :open-delay="300"
            placement="top"
            trigger="click"
            width="400"
          >
            <CommandSelector
              v-if="image"
              :idx="idx"
              :image="image"
              :row="row"
              @onUpdated="loadData"
            />
            <span slot="reference">
              <el-link :underline="false" class="text-xl mr-2" type="primary">
                <svg-icon icon-class="harbor" />
              </el-link>
            </span>
          </el-popover>
          <span v-if="row.docker.length === 0">{{ $t('Issue.NoImage') }}</span>
        </template>
        <template #image_tags="{ row }">
          <div id="release-tag">
            <div
              v-if="row.image_tags && row.image_tags.length > 1 && !isExpand"
            >
              <div slot="reference">
                <div class="cursor-pointer">
                  <el-tag style="font-size: 14px">
                    {{ getImageTags(row.image_tags[0]) }}
                  </el-tag>
                  <span
                    :style="getStyle('linkTextColor')"
                    class="small"
                    @click="isExpand = true"
                  >
                    +{{ $t('general.SeeMore') }}
                  </span>
                </div>
              </div>
            </div>
            <template v-else-if="isExpand || row.image_tags.length === 1">
              <div
                v-for="(tag, idx) in row.image_tags"
                :key="idx"
                :close-delay="50"
                :open-delay="300"
                placement="top"
                trigger="click"
                width="400"
              >
                <div slot="reference">
                  <div class="cursor-pointer">
                    <el-tag style="font-size: 14px">
                      {{ getImageTags(tag) }}
                      <em
                        v-if="isEditTag"
                        :style="getStyle('danger')"
                        class="el-icon-error cursor-pointer button"
                        @click="deleteTag(row, tag)"
                      ></em>
                    </el-tag>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
        <template #actions="{ row }">
          <ActionInput
            :row="row"
            @onEditTag="onEditTag"
            @onShowAll="isExpand = true"
            @onUpdated="loadData"
          />
        </template>
      </ElTableResponsive>
      <Pagination
        :layout="paginationLayout"
        :limit="listQuery.limit"
        :page="listQuery.page"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        :total="filteredData.length"
        @pagination="onPagination"
      />
    </el-row>
  </div>
</template>

<script>
import { deleteReleaseTag } from '@/api_v2/release'
import { getProjectReleaseList } from '@/api_v3/projects'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import { getLocalTime } from '@shared/utils/handleTime'
import variables from '@/styles/theme/variables.module.scss'
import { mapGetters } from 'vuex'

export default {
  name: 'ReleaseTable',
  components: {
    CommandSelector: () => import('./CommandSelector'),
    ActionInput: () => import('./ActionInput'),
    Viewer: () => import('@toast-ui/vue-editor').then(({ Viewer }) => Viewer),
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [BasicData, Pagination, SearchBar],
  model: {
    prop: 'keyword',
    event: 'changed'
  },
  props: {
    keywords: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isExpand: false,
      isEditTag: false,
      listLoading: false,
      searchKeys: ['commit', 'tag_name'],
      activeNames: []
    }
  },
  computed: {
    ...mapGetters(['device', 'services']),
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
          label: '',
          prop: 'expand',
          slot: 'expand',
          type: 'expand'
        },
        {
          label: this.$t('TestCase.Index'),
          prop: 'index',
          width: 80,
          align: 'center',
          type: 'index'
        },
        {
          label: this.$t('Issue.ReleaseTime'),
          prop: 'created_at',
          sortable: true,
          width: 120,
          align: 'center',
          slot: 'created_at'
        },
        {
          label: this.$t('Version.Version'),
          prop: 'tag_name',
          sortable: true,
          align: 'center'
        },
        {
          label: this.$t('Issue.SourceCode'),
          prop: 'branch',
          sortable: true,
          width: 120,
          align: 'center',
          slot: 'branch'
        },
        {
          label: this.$t('Issue.IssueList'),
          prop: 'tag_name_list',
          sortable: true,
          align: 'center',
          slot: 'tag_name_list'
        },
        {
          label: this.$t('PodsList.Image'),
          prop: 'docker',
          sortable: true,
          align: 'center',
          slot: 'docker'
        },
        {
          label: this.$t('Release.Tags'),
          prop: 'image_tags',
          sortable: true,
          width: 250,
          align: 'center',
          slot: 'image_tags'
        }
      ]
      if (this.services.gitlab) {
        columns.push({
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          slot: 'actions',
          minWidth: 100
        })
      }
      return columns
    }
  },
  watch: {
    keywords(val) {
      this.keyword = val
    }
  },
  methods: {
    async fetchData() {
      const res = await getProjectReleaseList(this.selectedProject.id)
      return res.data
    },
    showClosedIssue(tag_name) {
      this.$router.push({
        name: 'ClosedIssueList',
        params: { issueTag: tag_name, projectName: this.selectedProject.name }
      })
    },
    getLocalTime(time) {
      return getLocalTime(time)
    },
    getImageTags(tag) {
      const [key] = Object.keys(tag)
      return key
    },
    getStyle(colorCode) {
      const color = variables[`${colorCode}`]
      return {
        color
      }
    },
    onEditTag(isEditTag) {
      this.isEditTag = isEditTag
    },
    async deleteTag(row, tag) {
      await deleteReleaseTag(
        this.selectedProjectId,
        row.id,
        Object.keys(tag)[0]
      ).then(() => {
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        this.loadData()
      })
    },
    getRowClass({ row }) {
      return row.note ? '' : 'row-expand-cover'
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .row-expand-cover .el-table__expand-icon {
  display: none;
}

.el-link {
  font-size: 16px;
}

.small {
  font-size: 10px;
}
</style>
