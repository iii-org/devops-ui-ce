<template>
  <div class="app-container">
    <div :class="userId === 1 ? 'flex justify-between' : ''" :style="userId === 1 ? '' : 'text-align: right'">
      <el-button
        v-if="userId === 1"
        class="buttonPrimary"
        :size="isMobile ? 'small' : 'medium'"
        :style="isMobile ? { 'height': 'fit-content', 'margin-top': '3px' } : ''"
        @click="messageConsole"
      >
        <em class="ri-mail-send-fill" />
        {{ $t('Inbox.MessageConsole') }}
      </el-button>
      <SearchFilter
        ref="filter"
        :options="options"
        :keyword.sync="keyword"
        :is-read-disable="isReadAllDisable"
        @changeFilter="changeFilter"
        @readAll="handleReadAll"
      />
    </div>
    <el-divider />
    <el-table-responsive
      v-loading="listLoading"
      :data="messageList"
      :element-loading-text="$t('Loading')"
      :row-class-name="tableRowStyle"
      :columns="tableColumns"
      fit
      @row-click="showMessage"
    >
      <template v-slot:title="{ row }">
        {{ row.title ? row.title : $t('Inbox.NoTitle') }}
      </template>
      <template v-slot:alert_level="{ row }">
        <el-tag
          effect="dark"
          size="small"
          :style="{ 'background-color': tagColor(row.alert_level), 'border-color': tagColor(row.alert_level) }"
        >
          {{ messageType(row.alert_level) }}
        </el-tag>
      </template>
      <template v-slot:creator="{ row }">
        {{ row.creator.name }}
      </template>
    </el-table-responsive>
    <Pagination
      :total="listQuery.total"
      :page.sync="listQuery.current"
      :limit.sync="listQuery.limit"
      :page-sizes="[10, 20, 50, 100]"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
      @pagination="onPagination"
    />
    <el-row type="flex" class="ps" justify="end">
      {{ $t('Inbox.MessageNote') }}
    </el-row>
    <MessageDialog ref="messageDialog" :message="message" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getMessageList, setReadMessage } from '@/api_v2/monitoring'
import { Pagination } from '@/mixins'
import SearchFilter from './components/SearchFilter.vue'
import MessageDialog from '@/components/Notification/components/MessageDialog.vue'
import { ElTableResponsive } from '@/components'
import { getLocalTime, getRelativeTime } from '@/utils/handleTime'

const params = () => ({
  limit: 10,
  offset: 0
})

export default {
  name: 'Inbox',
  components: {
    SearchFilter,
    MessageDialog,
    ElTableResponsive
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
    ...mapGetters(['userId', 'messageIds', 'device']),
    options() {
      return [
        {
          id: 1,
          label: this.$t('Inbox.Info'),
          color: '#67c23a'
        },
        {
          id: 2,
          label: this.$t('Inbox.Warning'),
          color: '#e6d53c'
        },
        {
          id: 3,
          label: this.$t('Inbox.Urgent'),
          color: '#e6a23c'
        },
        {
          id: 101,
          label: this.$t('Inbox.NewVersion'),
          color: ''
        },
        {
          id: 102,
          label: this.$t('Inbox.SystemAlert'),
          color: '#f56c6c'
        },
        {
          id: 103,
          label: this.$t('Inbox.SystemWarning'),
          color: '#e6d53c'
        }
      ]
    },
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          prop: 'row_id',
          width: 70,
          align: 'center',
          label: this.$t('Inbox.No'),
          hideOnMobile: true
        },
        {
          prop: 'title',
          label: this.$t('Inbox.Title'),
          headerAlign: 'center',
          width: 500
        },
        {
          prop: 'alert_level',
          label: this.$t('Inbox.Type'),
          align: 'center',
          slot: 'alert_level'
        },
        {
          prop: 'created_at',
          label: this.$t('Inbox.Date'),
          type: 'time',
          align: 'center'
        },
        {
          prop: 'creator.name',
          label: this.$t('Inbox.Sender'),
          align: 'center',
          slot: 'creator'
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
      const res = await getMessageList(this.params)
      this.messageList = res.data.notification_message_list
      const start_id = res.data.page.limit * (res.data.page.current - 1) + 1
      this.messageList.forEach((item, i) => {
        item.row_id = start_id + i
      })
      this.listQuery = Object.assign({}, res.data.page)
      this.listLoading = false
      window.setTimeout(() => {
        this.isReadAllDisable = false
      }, 3000)
    },
    async onSearch(keyword) {
      this.params.search = keyword
      if (keyword === '') delete this.params.search
      await this.fetchData()
    },
    async changeFilter(filter) {
      if (filter) {
        this.params = { ...this.params, ...filter }
      } else {
        this.params = {
          limit: this.params.limit,
          offset: this.params.offset
        }
      }
      if (Object.prototype.hasOwnProperty.call(this.params, 'unread') && !this.params.unread) {
        delete this.params.unread
      }
      await this.fetchData()
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      const offset = limit * (page - 1)
      this.params.offset = offset
      this.params.limit = limit
      if (this.keyword !== '') this.params.search = this.keyword
      await this.fetchData()
    },
    messageType(level) {
      const alert = this.options.find((x) => x.id === level.id)
      return alert ? alert.label : this.$t('Inbox.' + level.name)
    },
    tagColor(level) {
      const alert = this.options.find((x) => x.id === level.id)
      if (alert) return alert.color
      else if (level.id >= 200 && level.id < 300) return '#67c23a'
      else if (level.id >= 300 && level.id < 400) return '#f56c6c'
      else return ''
    },
    tableRowStyle({ row }) {
      if (row.read === false) {
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
      if (msg.users_can_read === true && msg.read === false) {
        try {
          await setReadMessage(this.userId, { message_ids: [msg.id] }).then(() => {
            const findChangeIndex = this.messageList.findIndex((item) => parseInt(msg.id) === parseInt(item.id))
            this.setReadMessage(findChangeIndex)
          })
        } catch (err) {
          console.error(err)
        }
      }
    },
    setReadMessage(idx) {
      this.message.read = true
      this.$set(this.messageList, idx, this.message)
    },
    messageConsole() {
      this.$refs.filter.cleanFilter()
      this.$router.push({ name: 'MessageConsole' })
    },
    async handleReadAll() {
      this.listLoading = true
      await setReadMessage(this.userId, { message_ids: this.messageIds }).then(() => {
        const updateIds = this.messageList.filter((x) => x.users_can_read === true).map((a) => a.id)
        for (const msg_id of updateIds) {
          const findChangeIndex = this.messageList.findIndex((item) => parseInt(msg_id) === parseInt(item.id))
          this.messageList[findChangeIndex].read = true
        }
      })
      this.listLoading = false
    }
  }
}
</script>

<style lang="scss">
.ps {
  margin-top: 12px;
}
.readRow {
  font-weight: bold !important;
}
</style>
