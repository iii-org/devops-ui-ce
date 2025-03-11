<template>
  <div class="app-container">
    <div :class="isAdmin ? 'flex justify-between text-right' : 'text-right'">
      <el-button
        v-if="isAdmin"
        :size="isMobile ? 'small' : 'medium'"
        :style="isMobile ? { height: 'fit-content', 'margin-top': '5px' } : ''"
        type="primary"
        @click="messageConsole"
      >
        <em class="ri-mail-send-fill"></em>
        {{ $t('Inbox.MessageConsole') }}
      </el-button>
      <SearchFilter
        ref="filter"
        :is-read-disable="isReadAllDisable"
        :keyword.sync="keyword"
        :options="options"
        @changeFilter="changeFilter"
        @readAll="handleReadAll"
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
      :data="messageList"
      :element-loading-text="$t('Loading')"
      :row-class-name="tableRowStyle"
      fit
      @row-click="showMessage"
    >
      <template #title="{ row }">
        {{ row.title ? row.title : $t('Inbox.NoTitle') }}
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
    </ElTableResponsive>
    <Pagination
      :layout="paginationLayout"
      :limit.sync="listQuery.limit"
      :page-sizes="[10, 20, 50, 100]"
      :page.sync="listQuery.current"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      :total="listQuery.total"
      @pagination="onPagination"
    />
    <MessageDialog ref="messageDialog" :message="message" />
  </div>
</template>

<script>
import MessageDialog from '@shared/components/Notification/components/MessageDialog'
import Pagination from '@/mixins/Pagination'
import colorVariables from '@/styles/theme/variables.module.scss'
import { getLocalTime, getRelativeTime } from '@shared/utils/handleTime'
import { mapGetters } from 'vuex'
import SearchFilter from './components/SearchFilter'
import {
  getNotifications,
  readAllNotifications,
  readNotification
} from '@/api_v3/notifications'

const params = () => ({
  limit: 10,
  page: 1
})

export default {
  name: 'Inbox',
  components: {
    SearchFilter,
    MessageDialog,
    ElTableResponsive: () => import('@shared/components/ElTableResponsive')
  },
  mixins: [Pagination],
  data() {
    return {
      keyword: '',
      listLoading: false,
      messageList: [],
      params: params(),
      listQuery: {},
      timeoutId: -1,
      message: {},
      isReadAllDisable: true,
      getLocalTime: getLocalTime,
      getRelativeTime: getRelativeTime
    }
  },
  computed: {
    ...mapGetters(['userRole', 'device']),
    options() {
      return [
        {
          id: 1,
          label: this.$t('Inbox.Info'),
          color: colorVariables.success
        },
        {
          id: 2,
          label: this.$t('Inbox.Warning'),
          color: colorVariables.warning
        },
        {
          id: 3,
          label: this.$t('Inbox.Urgent'),
          color: colorVariables.warning
        },
        {
          id: 101,
          label: this.$t('Inbox.NewVersion'),
          color: colorVariables.slow
        },
        {
          id: 102,
          label: this.$t('Inbox.SystemAlert'),
          color: colorVariables.danger
        },
        {
          id: 103,
          label: this.$t('Inbox.SystemWarning'),
          color: colorVariables.warning
        }
      ]
    },
    isMobile() {
      return this.device === 'mobile'
    },
    isAdmin() {
      return (
        this.userRole === 'sysadmin' || this.userRole === 'Organization Owner'
      )
    },
    paginationLayout() {
      return this.isMobile
        ? 'total, prev, pager, next'
        : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          prop: 'row_id',
          width: 90,
          align: 'center',
          label: this.$t('Inbox.No'),
          hideOnMobile: true
        },
        {
          prop: 'title',
          label: this.$t('Inbox.Title')
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
          prop: 'created_at',
          label: this.$t('Inbox.Date'),
          type: 'time',
          align: 'center',
          width: 140
        },
        {
          prop: 'sender.full_name',
          label: this.$t('Inbox.Sender'),
          align: 'center',
          width: 140
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
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      const res = await getNotifications(this.params)
      this.messageList = res.data.items
      const start_id =
        res.data.pagination.limit * (res.data.pagination.current - 1) + 1
      this.messageList.forEach((item, i) => {
        item.row_id = start_id + i
      })
      this.listQuery = Object.assign({}, res.data.pagination)
      this.listLoading = false
      this.isReadAllDisable = false
    },
    async onSearch(keyword) {
      this.params.search = keyword
      if (keyword === '') delete this.params.search
      await this.fetchData()
    },
    async changeFilter(filter) {
      const params = filter
        ? { ...this.params, ...filter }
        : { limit: this.params.limit, page: this.params.page }
      this.params = params
      if (
        Object.prototype.hasOwnProperty.call(this.params, 'unread') &&
        !this.params.unread
      ) {
        delete this.params.unread
      }
      if (this.params.from_date === null) {
        delete this.params.from_date
      }
      if (this.params.to_date === null) {
        delete this.params.to_date
      }
      await this.fetchData()
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      this.params.page = page
      this.params.limit = limit
      if (this.keyword !== '') this.params.search = this.keyword
      await this.fetchData()
    },
    messageType(level) {
      const alert = this.options.find((x) => x.id === level.id)
      return alert ? alert.label : this.$t('Inbox.' + level.name)
    },
    tableRowStyle({ row }) {
      if (row.is_read === false) {
        return 'readRow'
      }
      return ''
    },
    showMessage(msg) {
      this.$refs.messageDialog.dialogVisible = true
      this.message = msg
      this.readMessage(msg)
    },
    async readMessage(msg) {
      try {
        if (msg.is_read === false) {
          await readNotification(msg.notification_id).then(() => {
            const findChangeIndex = this.messageList.findIndex(
              (item) =>
                parseInt(msg.notification_id) === parseInt(item.notification_id)
            )
            this.setReadMessage(findChangeIndex)
          })
        }
      } catch (err) {
        console.error(err)
      }
    },
    setReadMessage(idx) {
      this.message.is_read = true
      this.$set(this.messageList, idx, this.message)
    },
    messageConsole() {
      this.$refs.filter.cleanFilter()
      this.$router.push({ name: 'MessageConsole' })
    },
    async handleReadAll() {
      this.listLoading = true
      await readAllNotifications().then(() => {
        this.fetchData()
      })
      this.listLoading = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.message-type {
  max-width: 100px;
  word-break: break-word;
  white-space: normal;
  height: auto;
  line-height: normal;
  padding: 3px 6px;
}

::v-deep {
  .readRow {
    font-weight: bold !important;
  }

  .ps {
    margin-top: 12px;
  }
}
</style>
