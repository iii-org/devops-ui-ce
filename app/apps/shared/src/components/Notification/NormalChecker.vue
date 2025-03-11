<template>
  <div class="flex right-menu items-center">
    <el-popover
      v-if="notifications.notifications?.length"
      placement="bottom"
      trigger="click"
      width="300"
    >
      <h5 class="my-1">Info</h5>
      <div class="max-h-[50vh] overflow-y-auto">
        <div
          v-for="(msg, idx) in notifications.notifications"
          :key="msg.notification_id"
        >
          <el-divider v-if="idx !== 0" />
          <div
            class="flex py-1 my-1 hover:bg-gray-50 cursor-pointer rounded"
            @click="showMessage(msg)"
          >
            <div class="bg-success-50 mx-2 rounded self-center">
              <em
                class="ri-information-line text-success text-xl mx-1 self-center"
              ></em>
            </div>
            <span>
              <div
                :class="{ 'font-bold': !msg.is_read }"
                class="msg-text truncate"
              >
                {{ msg.title ? msg.title : 'No Title' }}
              </div>
              <div class="text-[11px] text-gray-400">
                {{ getRelativeTime(msg.created_at) }}
              </div>
            </span>
          </div>
        </div>
      </div>
      <router-link :to="{ name: 'InboxParent' }">
        <el-button class="w-full mt-1" plain size="small" type="primary">
          {{ $t('LoadMore') }}
        </el-button>
      </router-link>
      <span slot="reference" class="flex items-center">
        <el-badge
          :hidden="!notifications.unread"
          :max="99"
          :value="notifications.unread"
          class="flex items-center"
        >
          <em
            class="ri-notification-4-fill text-warning text-xl cursor-pointer"
          ></em>
        </el-badge>
      </span>
    </el-popover>
    <span v-else>
      <el-tooltip :content="$t('route.Inbox')" class="flex items-center">
        <router-link :to="{ name: 'InboxParent' }">
          <em
            class="ri-notification-4-fill text-warning text-xl cursor-pointer"
          ></em>
        </router-link>
      </el-tooltip>
    </span>
  </div>
</template>

<script>
import { getRelativeTime } from '@shared/utils/handleTime'

export default {
  name: 'NormalChecker',
  props: {
    notifications: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    showMessage(msg) {
      this.$emit('read', msg)
    },
    getRelativeTime(value) {
      return getRelativeTime(value)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.module.scss';

.right-menu {
  padding: 0 7px;
  height: 100%;

  &:hover {
    background: $navbarHover;
    border-radius: 6px;
    transition: background 0.3s;
  }
}

.msg-text {
  width: 220px;
  line-height: 22px;
  font-size: 13px;
}

.dialog-title {
  font-weight: bold;
  font-size: 24px;
  line-height: 28px;
  color: #45474b;
}

::v-deep {
  .el-dropdown-menu__item {
    padding: 0;
    margin: 0 12px;
  }

  .el-badge__content.is-fixed {
    top: 2px;
    font-size: 11px;
    height: 16px;
    line-height: 16px;
    padding: 0 5px;
  }

  .el-divider--horizontal {
    margin: 0 !important;
    background-color: #f4f4f4;
  }
}
</style>
