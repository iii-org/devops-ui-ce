<template>
  <div class="app-container">
    <div class="text-right">
      <SearchFilter
        ref="filter"
        :keyword.sync="keyword"
        @changeFilter="fetchData"
      >
        <UpdateButton
          slot="updateButton"
          :list-loading.sync="listLoading"
          @update="updateList"
        />
      </SearchFilter>
    </div>
    <el-divider />
    <el-table
      v-loading="listLoading"
      :data="listData"
      :element-loading-text="$t('Loading')"
      fit
    >
      <el-table-column align="center" prop="is_starred" width="60">
        <template slot-scope="scope">
          <em
            v-if="scope.row.is_starred"
            class="el-icon-star-on text-yellow-500 text-2xl"
            @click="setStar(scope.row.id, false)"
          ></em>
          <em
            v-else
            class="el-icon-star-off text-gray-400 text-xl"
            @click="setStar(scope.row.id, true)"
          ></em>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Project.NameIdentifier')"
        :show-overflow-tooltip="true"
        align="center"
        min-width="230"
      >
        <template slot-scope="scope">
          <div class="flex justify-start">
            <div class="flex items-center mr-5">
              <!-- gitlab button -->
              <el-popover
                v-if="scope.row.git_url && services.gitlab"
                :close-delay="50"
                :disabled="scope.row.is_disabled || scope.row.is_locked"
                :open-delay="300"
                class="mr-1"
                placement="top"
                trigger="hover"
                width="400"
              >
                <p class="text-center">
                  <span class="text-title">
                    {{ scope.row.git_url }}
                  </span>
                </p>
                <div class="flex justify-center">
                  <el-button
                    circle
                    class="mr-2"
                    icon="el-icon-copy-document"
                    size="mini"
                    @click="copyUrl(scope.row.git_url)"
                  />
                  <a :href="scope.row.git_url" target="_blank">
                    <el-button circle size="mini">
                      <em class="ri-external-link-line"></em>
                    </el-button>
                  </a>
                </div>
                <el-link
                  slot="reference"
                  :disabled="scope.row.is_disabled || scope.row.is_locked"
                  :underline="false"
                  style="font-size: 18px; padding: 0 3px"
                >
                  <svg-icon icon-class="gitlab" />
                </el-link>
              </el-popover>
              <!-- harbor button -->
              <el-link
                v-if="scope.row.harbor_url && services.harbor"
                :disabled="scope.row.is_disabled || scope.row.is_locked"
                :href="scope.row.harbor_url"
                :underline="false"
                style="font-size: 18px; padding: 0 3px"
                target="_blank"
              >
                <svg-icon icon-class="harbor" />
              </el-link>
            </div>
            <div>
              <el-link
                :class="
                  scope.row.is_disabled || scope.row.is_locked
                    ? ''
                    : 'link-text-color'
                "
                :disabled="scope.row.is_disabled || scope.row.is_locked"
                :underline="false"
                @click="handleClick(scope.row)"
              >
                {{ scope.row.display_name }}
              </el-link>
              <br />
              <span class="text-info text-sm" style="float: left">
                #{{ scope.row.identifier }}
              </span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Project.WorkloadValue')"
        align="center"
        width="120"
      >
        <template slot-scope="scope">
          {{ scope.row.issues.total >= 0 ? scope.row.issues.total : '-' }}
        </template>
      </el-table-column>
      <ElTableColumnTime
        :label="$t('Project.UpcomingDeadline')"
        prop="next_d_time"
      />
      <el-table-column
        :label="$t('Project.LastTest')"
        align="center"
        width="190"
      >
        <template slot-scope="scope">
          <span v-if="scope.row.last_test_time === ''">No Test</span>
          <el-tooltip
            v-else
            :content="getLocalTime(scope.row.last_test_time)"
            placement="bottom"
          >
            <span>{{ getRelativeTime(scope.row.last_test_time) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Project.LastTestResult')"
        align="center"
        width="170"
      >
        <template slot-scope="scope">
          <el-tag
            v-if="scope.row.last_test_result !== undefined"
            :type="returnTagType(scope.row)"
            class="el-tag--circle"
            effect="dark"
            size="large"
          >
            <em
              v-if="returnTagType(scope.row) === 'success'"
              class="el-icon-success"
            ></em>
            <em v-else class="el-icon-error"></em>
            <span>{{ testResults(scope.row) }}</span>
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('general.owner_name')"
        align="center"
        prop="owner_name"
      />
      <el-table-column
        :label="$t('ProjectSettings.Status')"
        align="center"
        min-width="90"
      >
        <template slot-scope="scope">
          <el-tooltip
            :content="scope.row.lock_reason"
            :disabled="!permission(scope.row) || scope.row.is_locked !== true"
            :open-delay="200"
            placement="bottom"
          >
            <el-tag v-if="scope.row.is_locked" type="info">
              {{ $t('errorDetail.locked') }}
            </el-tag>
            <el-tag v-else :type="scope.row.is_disabled ? 'danger' : 'success'">
              {{
                scope.row.is_disabled
                  ? $t('general.Disable')
                  : $t('general.Enable')
              }}
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <template slot="empty">
        <el-empty :description="$t('general.NoData')" />
      </template>
    </el-table>
    <Pagination
      :layout="'total, sizes, prev, pager, next'"
      :limit="params.limit"
      :page="params.page"
      :total="projectListTotal"
      @pagination="onPagination"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { deleteStarProject, postStarProject } from '@/api_v3/projects'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import Table from '@/mixins/Table'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'

const params = () => ({
  limit: 10,
  page: 1,
  test_result: true,
  root: false
})

export default {
  name: 'ProjectListRD',
  components: {
    ElTableColumnTime: () => import('@shared/components/ElTableColumnTime'),
    SearchFilter: () => import('./components/SearchFilter'),
    UpdateButton: () => import('./components/UpdateButton')
  },
  mixins: [BasicData, Pagination, SearchBar, Table],
  data() {
    return {
      searchKeys: ['display_name', 'identifier', 'owner_name'],
      params: params(),
      listData: []
    }
  },
  computed: {
    ...mapGetters([
      'userId',
      'userRole',
      'projectList',
      'projectListTotal',
      'projectOptions',
      'services'
    ])
  },
  watch: {
    keyword(val) {
      if (val !== null) {
        if (val.length > 2 || val === '') {
          this.params.page = 1
          this.params.limit = 10
          this.params.search = this.keyword
          this.fetchData()
        }
      } else this.keyword = ''
    }
  },
  methods: {
    ...mapActions('projects', [
      'setSelectedProject',
      'getMyProjectList',
      'getMyProjectOptions'
    ]),
    async fetchData() {
      this.listLoading = true
      if (this.$refs.filter) this.getParams()
      await this.getMyProjectList(this.params)
      this.listLoading = false
      this.listData = this.projectList
      // const filteredArray = this.projectList.filter((obj) => {
      //   return obj.is_locked !== true && obj.is_disabled !== true
      // })
      // if (filteredArray.length > 0) {
      //   this.getCalculateProjectData(filteredArray)
      // }
      return this.projectList
    },
    getParams() {
      if (this.keyword !== '') {
        this.params.search = this.keyword
      } else delete this.params.search
      if (this.$refs.filter.isDisabled.length === 1) {
        this.params.is_disabled = this.$refs.filter.isDisabled[0]
      } else {
        delete this.params.is_disabled
      }
    },
    // async getCalculateProjectData(project) {
    //   const ids = project.map(function (el) {
    //     return el.id
    //   })
    //   const calculated = (await getCalculateProjectList(ids.join())).data
    //   for (const i in calculated.project_list) {
    //     calculated.project_list[i].id = parseInt(calculated.project_list[i].id)
    //   }
    //   const merged = []
    //   for (const item of this.listData) {
    //     merged.push({
    //       ...item,
    //       ...calculated.project_list.find((itmInner) => itmInner.id === item.id)
    //     })
    //   }
    //   this.listData = merged
    // },
    async updateList() {
      this.getMyProjectOptions()
      await this.fetchData()
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      // const offset = limit * (page - 1)
      // this.params.offset = offset
      this.params.limit = limit
      this.params.page = page
      await this.fetchData()
      this.initParams()
    },
    initParams() {
      this.params = params()
    },
    permission(row) {
      const { creator_id, owner_id } = row
      if (
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      ) {
        return false
      }
      if (this.userRole === 'QA') {
        if (creator_id !== this.userId) return true
      } else {
        if (owner_id !== this.userId) return true
      }
    },
    returnTagType(row) {
      if (row.last_test_result) {
        const { success, total } = row.last_test_result
        if (!success || !total) return 'info'
        return success === total ? 'success' : 'danger'
      }
    },
    testResults(row) {
      if (row.last_test_result) {
        const { success, total } = row.last_test_result
        if (!success || !total) return 'No Test'
        return `${success} / ${total}`
      } else {
        return '-'
      }
    },
    copyUrl(text) {
      this.$copyText(text).then(() => {
        const message = this.$t('Notify.Copied')
        this.showSuccessMessage(message)
      })
    },
    async setStar(id, star) {
      const message = this.$t('Notify.Updated')
      star ? await postStarProject(id) : await deleteStarProject(id)
      await this.updateList()
      this.showSuccessMessage(message)
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    },
    handleClick(projectObj) {
      const { id } = projectObj
      const selectedProject = this.projectOptions.filter((elm) => {
        return elm.id === id
      })[0]
      this.setSelectedProject(selectedProject)
      localStorage.setItem('projectId', id)
      this.$router.push({
        name: 'Overview',
        params: { projectName: selectedProject.identifier }
      })
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
