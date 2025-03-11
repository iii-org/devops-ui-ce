<template>
  <div class="flex right-menu items-center">
    <el-popover placement="bottom" trigger="click" width="300">
      <h5 class="my-1">Alert</h5>
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
            <div
              :class="
                msg.level === 'warning' ? 'bg-warning-50' : 'bg-danger-50'
              "
              class="mx-2 rounded self-center"
            >
              <em
                :class="
                  msg.level === 'warning' ? 'text-warning' : 'text-danger'
                "
                class="ri-error-warning-line text-xl mx-1 self-center"
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
            class="ri-alert-fill text-danger text-xl cursor-pointer swing"
          ></em>
        </el-badge>
      </span>
    </el-popover>
  </div>
</template>

<script>
import { getRelativeTime } from '@shared/utils/handleTime'

export default {
  name: 'AbnormalChecker',
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

.swing {
  animation: swing 1.5s infinite;
}

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
