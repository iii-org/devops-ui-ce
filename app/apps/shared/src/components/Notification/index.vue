<template>
  <div class="flex right-menu items-center">
    <router-link v-if="isAllowRole" :to="{ name: 'MyWork' }" class="work-hover">
      <el-tooltip :content="$t('route.MyWork')" placement="bottom">
        <em class="ri-home-office-fill text-2xl" style="color: #5a5e66"></em>
      </el-tooltip>
    </router-link>
    <VersionChecker v-if="notifications?.new_version?.notifications?.length" />
    <AbnormalChecker
      v-if="notifications?.others?.notifications?.length"
      :notifications="notifications.others"
      @read="readMessage"
    />
    <NormalChecker :notifications="notifications.info" @read="readMessage" />
    <MessageDialog ref="messageDialog" :message="message" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import MessageDialog from './components/MessageDialog.vue'
import { initSocket } from '@/utils/request'
import { readNotification } from '@/api_v3/notifications'

export default {
  name: 'Notification',
  components: {
    VersionChecker: () => import('./VersionChecker'),
    AbnormalChecker: () => import('./AbnormalChecker'),
    NormalChecker: () => import('./NormalChecker'),
    MessageDialog
  },
  data() {
    return {
      notifications: {},
      message: {},
      msgIds: [],
      socket: null,
      dateNow: new Date().toJSON().slice(0, 10)
    }
  },
  computed: {
    ...mapGetters(['userId', 'userRole']),
    isAllowRole() {
      const allowRoles = ['Project Manager', 'Engineer']
      return allowRoles.includes(this.userRole)
    }
  },
  mounted() {
    this.socket = initSocket('/notifications')
    this.connectSocket()
  },
  beforeDestroy() {
    this.socket.disconnect()
  },
  methods: {
    async connectSocket() {
      this.setSocketListener()
      await this.socket.connect()
      await this.socket.emit('join', '')
    },
    setSocketListener() {
      this.socket.on('latest', async (data) => {
        this.notifications = data.notifications
      })

      this.socket.on('create', (data) => {
        const { notification, unread } = data
        if (notification.type === 'new_version') {
          this.notifications.new_version.notifications = notification
        } else if (notification.level === 'info') {
          this.notifications.info.notifications.unshift(notification)
        } else {
          this.notifications.others.notifications.unshift(notification)
        }

        this.notifications.info.unread = unread.info
        this.notifications.others.unread = unread.other

        this.showAlert(notification)
      })

      this.socket.on('update', (data) => {
        const { notification, unread } = data
        const { key, index } = this.findIndexData(notification.notification_id)

        if (index !== -1) {
          if (
            this.notifications[key].notifications[index].level ===
            notification.level
          ) {
            this.$set(
              this.notifications[key].notifications,
              index,
              notification
            )
          } else {
            this.$delete(this.notifications[key].notifications, index)
            if (notification.level === 'info') {
              this.notifications.info.notifications.unshift(notification)
            } else {
              this.notifications.others.notifications.unshift(notification)
            }
          }
          this.notifications.info.unread = unread.info
          this.notifications.others.unread = unread.other

          this.showAlert(notification)
        }
      })

      this.socket.on('read', (data) => {
        const { notification, unread } = data
        const { key, index } = this.findIndexData(notification.notification_id)
        if (index !== -1) {
          this.$set(
            this.notifications[key].notifications[index],
            'is_read',
            notification.is_read
          )
        }
        this.notifications.info.unread = unread.info
        this.notifications.others.unread = unread.other
      })

      this.socket.on('deleted', (data) => {
        const { id, unread } = data
        const { key, index } = this.findIndexData(id)
        if (index !== -1) {
          this.$delete(this.notifications[key].notifications, index)
        }
        this.notifications.info.unread = unread.info
        this.notifications.others.unread = unread.other
      })

      this.socket.on('disconnect', (reason) => {
        if (reason !== 'io client disconnect') {
          this.connectSocket()
        }
      })
    },
    readMessage(msg) {
      this.$refs.messageDialog.dialogVisible = true
      this.message = msg
      if (msg.is_read === false) readNotification(msg.notification_id)
    },
    findIndexData(id) {
      // Find the index of the notification in the notifications object
      const keys = ['new_version', 'info', 'others']
      for (const key of keys) {
        if (!this.notifications[key]) continue
        const index = this.notifications[key].notifications.findIndex(
          (msg) => msg.notification_id === id
        )
        if (index !== -1) {
          return { key, index }
        }
      }
      return null
    },
    showAlert(notification) {
      // Platform notification
      const h = this.$createElement
      const level =
        notification.level === 'urgent' ? 'danger' : notification.level

      this.$notify({
        title: notification.title,
        message: h(
          'i',
          { style: 'color: gray' },
          notification.content.substring(0, 10) + '...'
        ),
        iconClass: `el-icon-message text-[16px] font-bold text-white bg-${level} p-1 rounded-full`,
        offset: 40
      })

      // Native notification
      this.$notification.show(
        'III DevSecOps',
        {
          body: notification.title,
          badge:
            'https://www.iiidevops.org/wp-content/uploads/2021/07/IIIDevOps-logo.png',
          icon: 'https://www.iiidevops.org/wp-content/uploads/2021/07/IIIDevOps-logo.png'
        },
        {
          onclick: () => this.readMessage(notification)
        }
      )
    }
  }
}
</script>
<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.work-hover {
  padding: 0 7px;
  height: 100%;
  display: flex;
  align-items: center;

  &:hover {
    background: $navbarHover;
    border-radius: 6px;
    transition: background 0.3s;
  }
}
</style>
