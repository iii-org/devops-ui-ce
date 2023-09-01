<template>
  <div class="app-container">
    <div class="flex justify-between">
      <div>
        <el-button
          type="text"
          icon="el-icon-arrow-left"
          class="text-title linkTextColor"
          :size="isMobile ? 'small' : 'medium'"
          @click="handleBack"
        >
          {{ $t('general.Back') }}
        </el-button>
        <el-button
          class="buttonSecondary"
          icon="ri-mail-add-fill"
          :size="isMobile ? 'small' : 'medium'"
          @click="createMessage"
        >
          <span v-if="!isMobile">{{ $t('Inbox.CreateMessage') }}</span>
        </el-button>
      </div>
      <SearchFilter
        ref="filter"
        :options="options"
        :is-message-console="true"
        :keyword.sync="keyword"
        @changeFilter="changeFilter"
      />
    </div>
    <el-divider />
    <div class="notification">
      <span style="vertical-align: -webkit-baseline-middle;">
        {{ $t('Inbox.MessageNote') }}
      </span>
    </div>
    <ElTableResponsive
      v-loading="listLoading"
      :data="pagedData"
      :columns="tableColumns"
      :element-loading-text="$t('Loading')"
      fit
    >
      <template v-slot:title="{row}">
        {{ row.title ? row.title : 'No Title' }}
      </template>
      <template v-slot:alert_level="{row}">
        <el-tag
          effect="dark"
          :size="isMobile ? 'small' : 'medium'"
          :style="{
            'background-color': tagColor(row.alert_level),
            'border-color': tagColor(row.alert_level)
          }"
        >
          {{ messageType(row.alert_level) }}
        </el-tag>
      </template>
      <template v-slot:sender="{row}">
        {{ `${row.creator.name} (${row.creator.login})` }}
      </template>
      <template v-slot:senderTitle="{row}">
        {{ receiverName(row.types[0].type_id) }}
      </template>
      <template v-slot:owner_name="{row}">
        {{ row.already_receive_number }} / {{ row.total_receive_number }}
      </template>
      <template v-slot:status="{row}">
        <el-tag
          :type="row.close ? 'info' : 'success'"
          :size="isMobile ? 'small' : 'medium'"
        >
          {{ row.close ? $t('Version.closed') : $t('Version.open') }}
        </el-tag>
      </template>
      <template v-slot:actions="{row}">
        <el-tooltip
          v-if="row.alert_level.id < 100"
          placement="bottom"
          :content="$t('general.Edit')"
        >
          <em
            class="ri-file-edit-line finished operate-button"
            :disabled="row.close"
            @click.stop="handleEdit(row)"
          />
        </el-tooltip>
        <el-tooltip
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
        <el-tooltip
          v-if="row.alert_level.id < 100"
          placement="bottom"
          :content="$t('general.Close')"
        >
          <em
            class="el-icon-circle-close inProgress operate-button"
            :disabled="row.close"
            @click.stop="handleClose(row)"
          />
        </el-tooltip>
      </template>
    </ElTableResponsive>
    <Pagination
      ref="pagination"
      :total="listQuery.total"
      :page.sync="listQuery.current"
      :limit="listQuery.limit"
      :page-sizes="[10, 25, 50, 100]"
      :layout="paginationLayout"
      :pager-count="isMobile ? 5 : 7"
      :small="isMobile"
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
import { mapGetters } from 'vuex'
import { getMessageListAdmin, deleteMessage, closeMessage } from '@/api_v2/monitoring'
import { BasicData, Pagination } from '@/mixins'
import { ElTableResponsive } from '@shared/components'
import SearchFilter from './components/SearchFilter'
import colorVariables from '@/styles/theme/variables.scss'

const params = () => ({
  limit: 10,
  offset: 0
})

export default {
  name: 'Inbox',
  components: {
    SearchFilter,
    ElTableResponsive,
    CreateMessage: () => import('./components/CreateMessage.vue')
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
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('Inbox.No'),
          prop: 'row_id',
          width: 50,
          align: 'center'
        },
        {
          label: this.$t('Inbox.Title'),
          prop: 'title',
          headerAlign: 'center',
          minWidth: 450,
          slot: 'title'
        },
        {
          label: this.$t('Inbox.Type'),
          prop: 'alert_level',
          align: 'center',
          slot: 'alert_level'
        },
        {
          label: this.$t('Inbox.Date'),
          prop: 'created_at',
          align: 'center',
          type: 'time'
        },
        {
          label: this.$t('Inbox.Sender'),
          prop: 'creator.name',
          align: 'center',
          minWidth: 100,
          slot: 'sender'
        },
        {
          label: this.$t('Inbox.GroupReceiverTitle'),
          prop: 'creator.login',
          align: 'center',
          slot: 'senderTitle'
        },
        {
          label: this.$t('general.Status'),
          prop: 'status',
          align: 'center',
          slot: 'status'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          align: 'center',
          minWidth: 80,
          slot: 'actions'
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
      const res = await getMessageListAdmin(this.params)
      this.messageList = res.data.notification_message_list
      const start_id = res.data.page.limit * (res.data.page.current - 1) + 1
      this.messageList.forEach((item, i) => {
        item.row_id = start_id + i
      })
      this.listQuery = Object.assign({}, res.data.page)
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
          offset: this.params.offset
        }
      }
      if (
        Object.prototype.hasOwnProperty.call(this.params, 'include_system_message') &&
        !this.params.include_system_message
      ) {
        delete this.params.include_system_message
      }
      await this.loadData()
    },
    async onPagination(listQuery) {
      const { limit, page } = listQuery
      const offset = limit * (page - 1)
      this.params.offset = offset
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
        await deleteMessage(row.id)
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
    async handleClose(row) {
      this.listLoading = true
      await closeMessage(row.id)
        .then(async () => {
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Inbox.NotifyClosed'),
            type: 'success'
          })
          this.fetchData()
        })
        .catch((err) => {
          console.error(err)
          this.isLoading = false
        })
    },
    handleBack() {
      this.$refs.filter.cleanFilter()
      this.$router.push({ name: 'Inbox' })
    }
  }
}
</script>
