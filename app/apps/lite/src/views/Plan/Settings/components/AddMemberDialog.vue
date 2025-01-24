<template>
  <el-dialog
    :close-on-click-modal="false"
    :title="$t(`Member.AddMember`)"
    :visible.sync="dialogVisible"
    :width="isMobile ? '95vw' : '80vw'"
    append-to-body
    destroy-on-close
    top="3vh"
    @closed="onDialogClosed"
  >
    <el-row class="el-card">
      <el-col class="el-card__header">
        <el-row>
          <el-col :span="8">
            <el-input
              v-model="keyword"
              :placeholder="$t('general.SearchName')"
              :size="isMobile ? 'small' : 'medium'"
              :style="{ width: isMobile ? 'auto' : '140px' }"
              prefix-icon="el-icon-search"
            />
          </el-col>
          <el-col :span="16" class="text-right">
            <el-button
              :size="isMobile ? 'small' : 'medium'"
              @click="dialogVisible = false"
            >
              {{ $t('general.Cancel') }}
            </el-button>
            <el-button
              :loading="btnConfirmLoading"
              :size="isMobile ? 'small' : 'medium'"
              type="primary"
              @click="handleAddConfirm"
            >
              {{ $t('general.Confirm') }}
            </el-button>
          </el-col>
        </el-row>
      </el-col>
      <el-col class="el-card__body">
        <el-table
          v-if="dialogVisible"
          ref="userTable"
          :data="pagedData"
          :element-loading-text="$t('Loading')"
          fit
          highlight-current-row
          @cell-click="handleClick"
        >
          <el-table-column type="first" width="55">
            <template slot-scope="scope">
              <el-checkbox
                :value="isSelectedMember(scope.row)"
                class="el-checkbox"
                @change="toggleMember(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column :label="$t('general.Name')" prop="full_name" />
          <el-table-column
            v-if="!isMobile"
            :label="$t('User.Department')"
            prop="department"
          />
          <el-table-column
            v-if="!isMobile"
            :label="$t('User.Title')"
            prop="title"
          />
          <el-table-column :label="$t('User.Account')" prop="username" />
        </el-table>
        <Pagination
          :layout="paginationLayout"
          :limit="listQuery.limit"
          :page="listQuery.page"
          :page-sizes="[listQuery.limit]"
          :pager-count="isMobile ? 5 : 7"
          :small="isMobile"
          :total="filteredData.length"
          @pagination="onPagination"
        />
      </el-col>
      <el-col v-if="selectedUser.length > 0" class="el-card__footer">
        <div style="display: inline-flex">
          <div class="selected_count">
            {{ $t('User.Selected')
            }}<span class="value">{{ selectedUser.length }}</span>
          </div>
          <div>
            <el-tag
              v-for="(item, idx) in selectedUser"
              :key="idx"
              class="item"
              closable
              size="small"
              @close="onRemoveMember(item)"
            >
              <span>{{ idx + 1 }}.</span>
              {{ item.full_name }}
            </el-tag>
          </div>
        </div>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script>
import { addProjectMember, getProjectUserList } from '@/api_v3/projects'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import Table from '@/mixins/Table'
import Fuse from 'fuse.js'
import { mapGetters } from 'vuex'

export default {
  name: 'AddMemberDialog',
  mixins: [BasicData, Pagination, SearchBar, Table],
  data() {
    return {
      dialogVisible: false,
      assignableUserList: [],
      selectedUser: [],
      search: [],
      isLoading: false,
      btnConfirmLoading: false,
      selectorQuery: '',
      focusRoleName: '',
      rowHeight: 20,
      listQuery: {
        page: 1,
        limit: 5
      },
      inputVisible: false
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'device']),
    selectedProjectId() {
      return this.selectedProject.id
    },
    filteredData() {
      if (this.assignableUserList.length <= 0) return []
      if (this.keyword.length <= 0) return this.assignableUserList
      const fuse = new Fuse(this.assignableUserList, {
        // includeScore: true,
        threshold: 0.5,
        keys: ['full_name', 'username', 'department', 'title']
      })
      const res = fuse.search('!' + this.keyword)
      return res.map((items) => items.item)
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    }
  },
  watch: {
    selectedProjectId() {
      this.fetchData()
    },
    pagedData() {
      this.selectedUser.forEach((row) => {
        this.$refs['userTable'].toggleRowSelection(row)
      })
    },
    async dialogVisible(val) {
      if (!val) {
        this.keyword = ''
      }
    }
  },
  methods: {
    async fetchData() {
      return getProjectUserList(this.selectedProjectId, { exclude: true })
        .then((res) => {
          this.assignableUserList = res.data.map((user) => ({
            id: user.id,
            full_name: user.full_name,
            department: user.department,
            title: user.title,
            username: user.username,
            role_name: user.role.name
          }))
        })
        .catch((e) => {
          return Promise.reject(e)
        })
    },
    toggleSelectAllMember(event) {
      if (event) {
        this.$refs['userTable'].data.forEach((item) => {
          this.onAddMember(item)
        })
      } else {
        this.$refs['userTable'].data.forEach((item) => {
          this.onRemoveMember(item)
        })
      }
    },
    toggleMember(row) {
      if (this.isSelectedMember(row)) {
        this.onRemoveMember(row)
      } else {
        this.onAddMember(row)
      }
    },
    onAddMember(row) {
      this.selectedUser.push(row)
    },
    onRemoveMember(row) {
      this.selectedUser.splice(this.selectedUser.indexOf(row), 1)
    },
    isSelectedMember(row) {
      return this.selectedUser.indexOf(row) >= 0
    },
    onDialogClosed() {
      this.$nextTick(() => {
        this.selectedUser = []
      })
    },
    handleClick(row, column) {
      if (column.type !== 'first') {
        this.toggleMember(row)
      }
    },
    handleAddConfirm() {
      if (this.selectedUser.length > 0) {
        this.btnConfirmLoading = true
        this.selectedUser.forEach((user) => {
          addProjectMember(this.selectedProjectId, { user_id: user.id })
            .then(() => {
              this.$message({
                title: this.$t('general.Success'),
                message: this.$t('Notify.Added'),
                type: 'success'
              })
              this.fetchData()
              this.$emit('update')
            })
            .catch((err) => console.error(err))
            .then(() => {
              this.btnConfirmLoading = false
              this.dialogVisible = false
            })
        })
        this.selectedUser = []
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

::v-deep .el-card {
  &__footer {
    padding: 18px 20px;
    border-top: 1px solid #ebeef5;
    box-sizing: border-box;
    width: 100%;
    height: auto;

    .selected_count {
      @apply bg-white;
      @include css-prefix(appearance, none);
      @include css-prefix(box-sizing, border-box);
      @include css-prefix(transition, 0.1s);
      display: inline-block;
      line-height: 1;
      white-space: nowrap;
      border: 1px solid #dcdfe6;
      color: #606266;
      text-align: center;
      outline: 0;
      margin: 0;
      font-weight: 500;
      padding: 5px 6px;
      font-size: 13px;
      border-radius: 4px;
      height: fit-content;

      .value {
        @apply bg-danger text-white;
        padding: 0px 5px;
        margin-left: 5px;
        border-radius: 50%;
      }
    }

    .item {
      font-size: 14px;
      margin-bottom: 10px;
    }
  }
}

::v-deep .pagination-container {
  padding: 10px 0;
}

::v-deep .el-table .el-button {
  @apply text-white #{!important};

  &:hover {
    @apply text-white #{!important};
  }

  &--success {
    @apply bg-success #{!important};
  }

  &--warning {
    @apply bg-warning #{!important};
  }

  &--slow {
    @apply bg-slow #{!important};
  }
}

::v-deep .el-tag {
  &.el-tag {
    margin-left: 10px;
  }
}

.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

::v-deep .el-form {
  display: inline;
  margin: 0 0 0 10px;

  .el-form-item {
    margin: 0;
  }
}
</style>
