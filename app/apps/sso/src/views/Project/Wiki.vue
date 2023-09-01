<template>
  <div class="app-container">
    <ProjectListSelector>
      <el-button
        slot="button"
        icon="el-icon-plus"
        class="buttonPrimary"
        :size="isMobile ? 'small' : 'medium'"
        :disabled="selectedProjectId === -1"
        @click="handleAdding"
      >
        <span v-if="!isMobile">{{ $t('Wiki.AddWiki') }}</span>
      </el-button>
      <el-input
        v-model="keyword"
        prefix-icon="el-icon-search"
        :placeholder="$t('Wiki.SearchTitle')"
        :size="isMobile ? 'small' : 'medium'"
        :style="{ width: isMobile ? '100px' : '250px' }"
      />
    </ProjectListSelector>
    <el-divider />
    <ElTableResponsive
      v-loading="listLoading"
      :data="pagedData"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      fit
      highlight-current-row
    >
      <template v-slot:actions="{row}">
        <el-tooltip
          placement="bottom"
          :content="$t('Wiki.Content')"
        >
          <em
            class="ri-file-list-2-line active operate-button"
            @click="handleDetail(row)"
          />
        </el-tooltip>
        <el-tooltip
          placement="bottom"
          :content="$t('general.Edit')"
        >
          <em
            class="ri-file-edit-line finished operate-button"
            @click="handleEdit(row)"
          />
        </el-tooltip>
        <el-tooltip
          v-permission="['Administrator','Project Manager','QA']"
          placement="bottom"
          :content="$t('general.Delete')"
        >
          <el-popconfirm
            :confirm-button-text="$t('general.Delete')"
            :cancel-button-text="$t('general.Cancel')"
            icon="el-icon-info"
            popper-class="danger"
            :title="$t('Notify.confirmDelete')"
            @confirm="handleDelete(row)"
          >
            <em
              slot="reference"
              class="ri-delete-bin-2-line danger operate-button"
            />
          </el-popconfirm>
        </el-tooltip>
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
    <el-drawer
      :title="`${drawerTitle} Wiki`"
      :visible.sync="dialogVisible"
      :direction="isMobile ? 'btt' : 'rtl'"
      :before-close="handleClose"
      :append-to-body="true"
      :with-header="false"
      :size="isMobile? '100%' : '80%'"
      :class="isMobile ? 'mobile' : ''"
    >
      <div class="container">
        <el-form
          v-if="drawerTitle === 'Add'"
          ref="form"
          :model="form"
          :rules="formRules"
          label-position="top"
        >
          <el-form-item
            ref="wikiTitle"
            :label="$t('general.Title')"
            prop="wikiTitle"
          >
            <el-input
              v-model="form.wikiTitle"
              :placeholder="`${$t('general.PleaseInput')} ${$t('general.Title')}`"
            />
          </el-form-item>
        </el-form>
        <h3 v-else>{{ wikiData.title }}</h3>
        <div class="form__body">
          <br>
          <template>
            <Editor
              v-if="dialogVisible"
              id="md_editor"
              ref="mdEditor"
              :initial-value="wikiContent"
              initial-edit-type="wysiwyg"
              height="500px"
            />
          </template>
        </div>
        <div class="form__footer">
          <el-button class="buttonSecondaryReverse" @click="onCancelClick">
            {{ $t('general.Cancel') }}
          </el-button>
          <el-button
            v-if="drawerTitle === 'Edit'"
            class="buttonPrimary"
            :loading="editBtnLoading"
            @click="handleUpdate"
          >
            {{ $t('general.Confirm') }}
          </el-button>
          <el-button
            v-else-if="drawerTitle === 'Add'"
            class="buttonPrimary"
            :loading="editBtnLoading"
            @click="handleConfirmAdd"
          >
            {{ $t('general.Confirm') }}
          </el-button>
        </div>
      </div>
    </el-drawer>
    <el-drawer
      class="wiki"
      :title="`${drawerTitle} Wiki`"
      :visible.sync="detailVisible"
      :direction="isMobile ? 'btt' : 'rtl'"
      :before-close="handleClose"
      :append-to-body="true"
      :with-header="false"
      :size="isMobile? '100%' : '80%'"
      :class="isMobile ? 'mobile' : ''"
    >
      <div class="container">
        <div class="form__title">
          <h3>{{ wikiData.title }}</h3>
          <div
            v-if="detailVisible"
            style="text-align: right;"
          >
            {{ $t('Wiki.edited', { user: wikiData.author.name }) }}
          </div>
          <el-divider />
        </div>
        <div class="form__body view">
          <VueShowdown :markdown="wikiContent" />
        </div>
        <div class="form__footer">
          <el-button class="buttonSecondaryReverse" @click="detailVisible = false"> {{ $t('general.Close') }}</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { deleteWiki, getWikiDetail, getWikiList, putWikiDetail } from '@/api/wiki'
import { BasicData, Pagination, SearchBar } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@shared/components'
import '@toast-ui/editor/dist/toastui-editor.css'
import { Editor } from '@toast-ui/vue-editor'

export default {
  name: 'Wiki',
  components: {
    ProjectListSelector,
    ElTableResponsive,
    Editor: Editor
  },
  mixins: [BasicData, Pagination, SearchBar],
  data() {
    return {
      editBtnLoading: false,
      wikiData: {},
      wikiContent: '',
      detailVisible: false,
      dialogVisible: false,
      dialogVisibleEdit: false,
      drawerTitle: '',
      wikiTitle: '',
      searchKeys: ['title'],
      formRules: {
        wikiTitle: [
          {
            required: true,
            message: `${this.$t('general.PleaseInput')} ${this.$t('general.Title')}`,
            trigger: 'change'
          },
          {
            pattern: /^((?![,.\/?;:|]).)*$/,
            message: 'Not allowing special characters (, . / ? ; : |)',
            trigger: 'blur'
          }
        ]
      },
      form: { wikiTitle: '' }
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
          label: this.$t('Wiki.Title'),
          prop: 'title',
          align: 'center',
          minWidth: 120
        },
        {
          label: this.$t('Version.Version'),
          prop: 'version',
          align: 'center',
          minWidth: 50
        },
        {
          label: this.$t('general.CreateTime'),
          prop: 'created_on',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.LastUpdateTime'),
          prop: 'updated_on',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          minWidth: 100,
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      return (await getWikiList(this.selectedProjectId)).data.wiki_pages
    },
    showNoProjectWarning() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.NoProject'),
        type: 'warning'
      })
      this.listLoading = false
    },
    handleClose() {
      this.detailVisible = false
    },
    async handleUpdate() {
      this.editBtnLoading = true
      const text = this.$refs.mdEditor.invoke('getMarkdown')
      try {
        await putWikiDetail(this.selectedProjectId, this.wikiData.title, { wiki_text: text })
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Updated'),
          type: 'success'
        })
        this.dialogVisible = false
        await this.loadData()
      } catch (error) {
        console.error(error)
      }
      this.editBtnLoading = false
    },
    async handleEdit(row) {
      this.listLoading = true
      this.drawerTitle = 'Edit'
      try {
        const res = await getWikiDetail(this.selectedProjectId, row.title)
        const { wiki_page } = res.data
        this.wikiData = wiki_page
        this.wikiTitle = wiki_page.title
        this.wikiContent = wiki_page.text
        this.dialogVisible = true
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async handleDelete(row) {
      this.listLoading = true
      try {
        await deleteWiki(this.selectedProjectId, row.title)
        await this.loadData()
      } catch (error) {
        console.error(error)
      }

      this.listLoading = false
    },
    async handleDetail(row) {
      try {
        this.listLoading = false
        this.drawerTitle = 'Detail'
        const res = await getWikiDetail(this.selectedProjectId, row.title)
        const { wiki_page } = res.data
        this.wikiData = wiki_page
        this.wikiContent = wiki_page.text
        this.detailVisible = true
        this.dialogVisibleEdit = false
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    async handleAdding() {
      this.dialogVisible = true
      this.drawerTitle = 'Add'
      this.wikiContent = '# ' + this.$t('Wiki.Title')
      this.form.wikiTitle = ''
    },
    async handleConfirmAdd() {
      this.$refs['form'].validate(async (valid) => {
        if (!valid) {
          return
        }
        this.editBtnLoading = true
        const text = this.$refs.mdEditor.invoke('getMarkdown')
        try {
          await putWikiDetail(this.selectedProjectId, this.form.wikiTitle, { wiki_text: text })
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Created'),
            type: 'success'
          })
        } catch (error) {
          console.error(error)
        } finally {
          this.dialogVisible = false
          this.editBtnLoading = false
          await this.loadData()
        }
      })
    },
    onCancelClick() {
      this.dialogVisible = false
      this.dialogVisibleEdit = false
      this.$refs.form.resetFields()
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-drawer__body {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 5px;
}

.clearfix {
  clear: both;
}

.wiki {
  a {
    text-decoration: underline;
  }
}

.container {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 20px;

  .form__title {
    flex-basis: 60px;
  }

  .form__body {
    flex: 1;
  }

  .form__footer {
    flex-basis: 60px;
    padding-top: 20px;
    text-align: right;
  }

  table {
    border-top: 1px solid #ccc;
    border-left: 1px solid #ccc;
  }

  table td,
  table th {
    border-bottom: 1px solid #ccc;
    border-right: 1px solid #ccc;
    padding: 3px 5px;
  }

  table th {
    border-bottom: 2px solid #ccc;
    text-align: center;
  }

  blockquote {
    display: block;
    border-left: 8px solid #d0e5f2;
    padding: 5px 10px;
    margin: 10px 0;
    line-height: 1.4;
    font-size: 100%;
    background-color: #f1f1f1;
  }

  code {
    display: inline-block;
    *display: inline;
    *zoom: 1;
    background-color: #f1f1f1;
    border-radius: 3px;
    padding: 3px 5px;
    margin: 0 3px;
  }

  pre code {
    display: block;
  }

  ul,
  ol {
    margin: 10px 0 10px 20px;
  }

  #editor-container {
    flex: 1;
  }

  .file-commit-message {
    flex-basis: 160px;
  }

  > #w-e-text {
    white-space: pre-line;
  }
}
.mobile {
  ::v-deep .container {
    padding: 10px;
  }
  ::v-deep .view {
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 5px;
  }
  ::v-deep .toastui-editor-popup {
    max-width: 250px;
    margin-left: 0px;
  }
  ::v-deep .toastui-editor-popup-add-table .toastui-editor-table-cell {
    width: 20px;
    height: 20px;
  }
  ::v-deep .toastui-editor-defaultUI-toolbar button {
    margin: 7px 0px;
  }
  ::v-deep .toastui-editor-defaultUI-toolbar {
    padding: 0 5px;
  }
  ::v-deep .toastui-editor-toolbar-divider {
    margin: 14px 0px;
  }
  ::v-deep .toastui-editor-dropdown-toolbar {
    right: 0px !important;
  }
}
</style>
