<template>
  <div>
    <el-row slot="title" align="middle" type="flex">
      <el-col :md="16" :xs="24">
        <el-button
          class="previous text-h6 link-text-color"
          icon="el-icon-arrow-left"
          size="medium"
          type="text"
          @click="onBack"
        >
          {{ $t('general.Back') }}
        </el-button>
        <span class="text-h6">{{ issueName }}</span>
      </el-col>
      <el-col :md="8" :xs="24" class="text-right">
        <el-button :loading="btnConfirmLoading" @click="handleAddConfirm">
          {{ $t('general.Close') }}
        </el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-col>
        <h2>管理測試檔案</h2>
      </el-col>
    </el-row>
    <el-row class="el-card">
      <el-col class="el-card__header">
        <el-row>
          <el-col :span="24">
            <el-input
              v-model="searchValue"
              :placeholder="$t('general.SearchName')"
              :style="{ width: '300px' }"
              prefix-icon="el-icon-search"
              size="medium"
            />
          </el-col>
        </el-row>
      </el-col>
      <el-col class="el-card__body">
        <el-table
          ref="collectionTable"
          :cell-style="{ height: rowHeight + 'px' }"
          :data="pagedData"
          :element-loading-text="$t('Loading')"
          fit
          height="40vh"
          highlight-current-row
          @cell-click="handleClick"
        >
          <el-table-column type="first" width="55">
            <template slot-scope="scope">
              <el-checkbox
                :value="isSelectedCollection(scope.row)"
                class="el-checkbox"
                @change="toggleCollection(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="測試軟體" prop="software_name" width="100" />
          <el-table-column label="檔案" prop="file_name" />
          <el-table-column label="測試名稱" prop="name" show-overflow-tooltip />
          <el-table-column
            label="設計模組"
            min-width="150"
            prop="test_plans"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              {{ getTestPlan(scope.row) }}
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :layout="'total, prev, pager, next'"
          :limit="listQuery.limit"
          :page="listQuery.page"
          :page-sizes="[listQuery.limit]"
          :total="filteredData.length"
          @pagination="onPagination"
        />
      </el-col>
      <el-col v-if="selectedList.length > 0" class="el-card__footer">
        <el-col :md="2" :xs="8">
          <div class="selected_count">
            {{ $t('User.Selected')
            }}<span class="value">{{ selectedList.length }}</span>
          </div>
        </el-col>
        <el-col :md="22" :xs="16" class="scroll-x">
          <el-tag
            v-for="(item, idx) in selectedList"
            :key="idx"
            class="item"
            closable
            @close="onRemoveCollection(item)"
          >
            <strong>{{ idx + 1 }}</strong>.{{ item.name }}
          </el-tag>
        </el-col>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getTestFileList } from '@/api/qa'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import SearchBar from '@/mixins/SearchBar'
import Table from '@/mixins/Table'
import Fuse from 'fuse.js'
import { mapGetters } from 'vuex'

export default {
  name: 'RelatedCollectionDialog',
  mixins: [BasicData, Pagination, SearchBar, Table],
  props: {
    issueName: {
      type: String,
      default: null
    },
    selectedCollections: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      dialogVisible: false,
      collectionList: [],
      selectedList: [],
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
      inputVisible: false,
      searchValue: '',
      form: {}
    }
  },
  computed: {
    ...mapGetters(['selectedProject']),
    selectedProjectId() {
      return this.selectedProject.id
    },
    filteredData() {
      if (this.collectionList.length <= 0) return []
      if (this.searchValue.length <= 0) return this.collectionList
      const fuse = new Fuse(this.collectionList, {
        includeScore: true,
        keys: ['name', 'description', 'assigned_to.name']
      })
      const res = fuse.search('!' + this.searchValue)
      return res.map((items) => items.item)
    }
  },
  watch: {
    selectedCollections: {
      deep: true,
      handler(value) {
        this.selectedList = value
      }
    },
    selectedList: {
      deep: true,
      handler(value) {
        this.$emit('update', value)
      }
    },
    selectedProjectId() {
      this.fetchData()
    },
    pagedData(value) {
      const getSelectedListName = this.selectedList.map(
        (item) => item.file_name
      )
      const getSelectedRow = value.filter((item) =>
        getSelectedListName.includes(item.file_name)
      )
      getSelectedRow.forEach((row) => {
        this.$refs['collectionTable'].toggleRowSelection(row)
      })
    }
  },
  async mounted() {
    this.collectionList = await this.fetchData()
    this.selectedList = this.selectedCollections
  },
  methods: {
    fetchData() {
      return getTestFileList(this.selectedProjectId)
        .then((res) => {
          return Promise.resolve(res.data)
        })
        .catch((e) => {
          return Promise.reject(e)
        })
    },
    toggleSelectAllCollection(event) {
      if (event) {
        this.$refs['collectionTable'].data.forEach((item) => {
          this.onAddCollection(item)
        })
      } else {
        this.$refs['collectionTable'].data.forEach((item) => {
          this.onRemoveCollection(item)
        })
      }
    },
    toggleCollection(row) {
      if (this.isSelectedCollection(row)) {
        this.onRemoveCollection(row)
      } else {
        this.onAddCollection(row)
      }
    },
    onAddCollection(row) {
      this.selectedList.push({ ...row, edit: true })
    },
    onRemoveCollection(row) {
      this.selectedList.splice(this.selectedList.indexOf(row), 1)
    },
    onBack() {
      this.selectedList = this.selectedCollections
      this.handleAddConfirm()
    },
    isSelectedCollection(row) {
      return (
        this.selectedList
          .map((item) => item.file_name)
          .indexOf(row.file_name) >= 0
      )
    },
    getTestPlan(row) {
      return row.test_plans.map((item) => item.name).join('、')
    },
    handleClick(row, column) {
      if (column.type !== 'first') {
        this.toggleCollection(row)
      }
    },
    handleAddConfirm() {
      this.$emit('close-dialog', 'relatedCollection')
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
    height: 75px;

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
      padding: 12px 10px;
      font-size: 14px;
      border-radius: 4px;

      .value {
        @apply text-white bg-danger;
        padding: 2px 5px;
        margin-left: 5px;
        border-radius: 50%;
      }
    }

    .scroll-x {
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
    }

    .item {
      font-size: 16px;
      margin: 0 10px;
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
