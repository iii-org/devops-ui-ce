<template>
  <div class="app-container">
    <div class="flex justify-between">
      <div>
        <el-button
          :size="isMobile ? 'small' : 'medium'"
          class="text-title link-text-color"
          icon="el-icon-arrow-left"
          type="text"
          @click="handleBack"
        >
          {{ $t('general.Back') }}
        </el-button>
        <el-button
          :size="isMobile ? 'small' : 'medium'"
          icon="ri-mail-add-fill"
          type="primary"
          @click="createMessage"
        >
          <span v-if="!isMobile" class="ml-2">{{
            $t('Inbox.CreateMessage')
          }}</span>
        </el-button>
      </div>
      <SearchFilter
        ref="filter"
        :is-message-console="true"
        :keyword.sync="keyword"
        :options="options"
        @changeFilter="changeFilter"
      />
    </div>
    <el-divider />
    <div class="notification-warning">
      <span style="vertical-align: -webkit-baseline-middle">
        {{ $t('Inbox.MessageNote') }}
      </span>
    </div>
    <ElTableResponsive
      v-loading="listLoading"
      :columns="tableColumns"
      :data="pagedData"
      :element-loading-text="$t('Loading')"
      fit
    >
      <template #title="{ row }">
        {{ row.title ? row.title : 'No Title' }}
      </template>
      <template #alert_level="{ row }">
        <el-tag
          :type="row.level === 'urgent' ? 'danger' : row.level"
          class="message-type"
          effect="dark"
          size="small"
        >
          {{ `${$t(`Inbox.${row.level}`)}` }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <el-tooltip :content="$t('general.Edit')" placement="bottom">
          <em
            :disabled="row.close"
            class="ri-edit-box-line success table-button"
            @click.stop="handleEdit(row)"
          ></em>
        </el-tooltip>
        <el-tooltip :content="$t('general.Delete')" placement="bottom">
          <el-popconfirm
            :cancel-button-text="$t('general.Cancel')"
            :confirm-button-text="$t('general.Delete')"
            :title="$t('Notify.confirmDelete')"
            icon="el-icon-info"
            popper-class="danger"
            @confirm="handleDelete(row)"
          >
            <em
              slot="reference"
              class="ri-delete-bin-2-line danger table-button"
            ></em>
          </el-popconfirm>
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      ref="pagination"
      :layout="paginationLayout"
      :limit="listQuery.limit"
      :page-sizes="[10, 25, 50, 100]"
      :page.sync="listQuery.current"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="listQuery.total"
      @pagination="onPagination"
    />
    <CreateMessage
      ref="createDialog"
      :alert-list="options"
      :is-edit="isEdit"
      :message-data="messageData"
      @edit="isEdit = false"
      @load-data="fetchData"
    />
  </div>
</template>

<script>
import {
  deleteNotification,
  getCreatedNotificationList
} from '@/api_v3/notifications'
import BasicData from '@/mixins/BasicData'
import Pagination from '@/mixins/Pagination'
import colorVariables from '@/styles/theme/variables.module.scss'
import { mapGetters } from 'vuex'
import SearchFilter from './components/SearchFilter'

const params = () => ({
  limit: 10,
  page: 1
})

export default {
  name: 'Inbox',
  components: {
    SearchFilter,
    ElTableResponsive: () => import('@shared/components/ElTableResponsive'),
    CreateMessage: () => import('./components/CreateMessage')
  },
  mixins: [BasicData, Pagination],
  data() {
    return {
      keyword: '',
      listLoading: false,
      messageList: [],
      params: params(),
      listQuery: {},
      timeoutId: -1,
      message: {},
      isEdit: false,
      messageData: {}
    }
  },
  computed: {
    ...mapGetters(['userId', 'device']),
    pagedData() {
      return this.messageList
    },
    options() {
      return [
        {
          id: 'info',
          label: this.$t('Inbox.info'),
          color: colorVariables.success
        },
        {
          id: 'warning',
          label: this.$t('Inbox.warning'),
          color: colorVariables.warning
        },
        {
          id: 'urgent',
          label: this.$t('Inbox.urgent'),
          color: colorVariables.warning
        }
      ]
    },
    groupReceiver() {
      return [
        {
          id: 1,
          label: this.$t('Inbox.GroupReceiver.All')
        },
        {
          id: 2,
          label: this.$t('Inbox.GroupReceiver.Project')
        },
        {
          id: 3,
          label: this.$t('Inbox.GroupReceiver.User')
        },
        {
          id: 4,
          label: this.$t('Inbox.GroupReceiver.Role')
        },
        {
          id: 5,
          label: this.$t('Inbox.GroupReceiver.ProjectOwner')
        }
      ]
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('Inbox.No'),
          prop: 'row_id',
          width: 90,
          align: 'center'
        },
        {
          label: this.$t('Inbox.Title'),
          prop: 'title',
          minWidth: 450,
          slot: 'title'
        },
        {
          prop: 'level',
          label: this.$t('Inbox.AlertLevel'),
          align: 'center',
          slot: 'alert_level',
          width: 140
        },
        {
          prop: 'type',
          label: this.$t('Inbox.Type'),
          align: 'center',
          width: 140
        },
        {
          label: this.$t('Inbox.Date'),
          prop: 'created_at',
          align: 'center',
          type: 'time',
          width: 140
        },
        {
          label: this.$t('Inbox.Sender'),
          prop: 'sender.full_name',
          align: 'center',
          minWidth: 100
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          width: 120,
          slot: 'actions',
          fixed: 'right'
        }
      ]
    }
  },
  watch: {
    keyword: {
      handler(val) {
        clearTimeout(this.timeoutId)
        this.timeoutId = window.setTimeout(() => this.onSearch(val), 1000)
      }
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timeoutId)
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      const res = await getCreatedNotificationList(this.params)
      this.messageList = res.data.items
      const start_id =
        res.data.pagination.limit * (res.data.pagination.current - 1) + 1
      this.messageList.forEach((item, i) => {
        item.row_id = start_id + i
      })
      this.listQuery = Object.assign({}, res.data.pagination)
      this.edit = false
      this.listLoading = false
    },
    async onSearch(keyword) {
      this.params.search = keyword
      if (keyword === '') delete this.params.search
      await this.loadData()
    },
    async changeFilter(filter) {
      if (filter) {
        this.params = { ...this.params, ...filter }
      } else {
        this.params = {
          limit: this.params.limit,
          page: this.params.page
        }
      }
      if (
        Object.prototype.hasOwnProperty.call(
          this.params,
          'include_system_message'
        ) &&
        !this.params.include_system_message
      ) {
        delete this.params.include_system_message
      }
      await this.loadData()
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      this.params.page = page
      this.params.limit = limit
      if (this.keyword !== '') this.params.search = this.keyword
      await this.loadData()
    },
    messageType(level) {
      return this.options.find((x) => x.id === level.id).label
    },
    tagColor(level) {
      return this.options.find((x) => x.id === level.id).color
    },
    receiverName(group_id) {
      return this.groupReceiver.find((x) => x.id === group_id).label
    },
    createMessage() {
      this.$refs.createDialog.showDialog = true
    },
    handleEdit(msg) {
      this.$refs.createDialog.showDialog = true
      this.messageData = msg
      this.isEdit = true
    },
    async handleDelete(row) {
      this.listLoading = true
      try {
        await deleteNotification(row.id)
        this.$message({
          title: this.$t('general.Success'),
          message: this.$t('Notify.Deleted'),
          type: 'success'
        })
        await this.fetchData()
      } catch (error) {
        console.error(error)
        this.listLoading = false
      }
    },
    handleBack() {
      this.$refs.filter.cleanFilter()
      this.$router.push({ name: 'Inbox' })
    }
  }
}
</script>
