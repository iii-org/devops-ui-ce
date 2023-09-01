<template>
  <div class="div-container">
    <el-row>
      <!-- tree-props 取消第二個子議題箭頭-->
      <ElTableResponsive
        ref="issueList"
        class="w-screen"
        :data="pagedData"
        :columns="tableColumns"
        fit
        highlight-current-row
        row-key="id"
        :tree-props="{ children: 'child' }"
        :row-class-name="getRowClass"
      >
        <template v-slot:expand="{row}">
          <div class="ml-3" style="color: #409EFF;">
            {{ $t('Release.releaseNote') }}
          </div>
          <Viewer
            class="ml-5 primary"
            :initial-value="'\n' + row.note"
          />
        </template>
        <template v-slot:created_at="{row}">
          {{ getLocalTime(row.create_at) }}
        </template>
        <template v-slot:branch="{row}">
          <el-link
            class="linkTextColor"
            :underline="false"
            :href="row.git_url"
            target="_blank"
          >
            <span>
              <em v-if="row.branch" class="ri-git-branch-line mr-1" />
              {{ row.branch }}
            </span>
            <span>
              <svg-icon
                v-if="row.commit"
                class="mr-1"
                icon-class="ion-git-commit-outline"
              />
              {{ row.commit }}
            </span>
          </el-link>
        </template>
        <template v-slot:tag_name_list="{row}">
          <el-link
            class="linkTextColor"
            :underline="false"
            @click="showClosedIssue(row.tag_name)"
          >{{ row.tag_name }}</el-link>
        </template>
        <template v-slot:docker="{row}">
          <el-popover
            v-for="(image, idx) in row.docker"
            :key="image.repo"
            placement="top"
            width="400"
            trigger="click"
            :open-delay="300"
            :close-delay="50"
          >
            <CommandSelector
              v-if="image"
              :row="row"
              :image="image"
              :idx="idx"
              @onUpdated="loadData"
            />
            <span slot="reference">
              <el-link
                class="text-xl mr-2"
                :underline="false"
              >
                <svg-icon icon-class="harbor" />
              </el-link>
            </span>
          </el-popover>
          <span v-if="row.docker.length === 0">{{ $t('Issue.NoImage') }}</span>
        </template>
        <template v-slot:image_tags="{row}">
          <div id="release-tag">
            <div v-if="row.image_tags && row.image_tags.length > 1 && !isExpand">
              <div slot="reference">
                <div class="cursor-pointer">
                  <el-tag style="font-size:14px;">
                    {{ getImageTags(row.image_tags[0]) }}
                  </el-tag>
                  <span
                    :style="getStyle('menuActiveText')"
                    class="small"
                    @click="isExpand = true"
                  >
                    +{{ $t('general.SeeMore') }}
                  </span>
                </div>
              </div>
            </div>
            <div
              v-for="(tag, idx) in row.image_tags"
              v-else-if="isExpand || row.image_tags.length === 1"
              :key="idx"
              placement="top"
              width="400"
              trigger="click"
              :open-delay="300"
              :close-delay="50"
            >
              <div slot="reference">
                <div class="cursor-pointer">
                  <el-tag style="font-size:14px;">
                    {{ getImageTags(tag) }}
                    <em
                      v-if="isEditTag"
                      class="el-icon-error cursor-pointer button"
                      :style="getStyle('danger')"
                      @click="deleteTag(row, tag)"
                    />
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-slot:actions="{row}">
          <ActionInput
            :row="row"
            @onEditTag="onEditTag"
            @onUpdated="loadData"
            @onShowAll="isExpand = true"
          />
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
    </el-row>
  </div>
</template>

<script>
import { getReleaseVersion, deleteReleaseTag } from '@/api_v2/release'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { getLocalTime } from '@shared/utils/handleTime'
import { ElTableResponsive } from '@shared/components'
import variables from '@/styles/theme/variables.scss'
import { Viewer } from '@toast-ui/vue-editor'
import { mapGetters } from 'vuex'

export default {
  name: 'ReleaseTable',
  components: {
    CommandSelector: () => import('./CommandSelector'),
    ActionInput: () => import('./ActionInput'),
    Viewer,
    ElTableResponsive
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
    ...mapGetters(['device']),
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
          label: this.$t('ProcessDevEnvironment.Image'),
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
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          sortable: true,
          align: 'center',
          slot: 'actions'
        }
      ]
    }
  },
  watch: {
    keywords(val) {
      this.keyword = val
    }
  },
  methods: {
    async fetchData() {
      const res = await getReleaseVersion(this.selectedProject.id)
      return res.data.releases
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
      await deleteReleaseTag(this.selectedProjectId, row.id, Object.keys(tag)[0])
        .then(() => {
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
  display: none
}
.el-link {
  font-size: 16px;
}
.small {
  font-size: 10px;
}
</style>
