<template>
  <div class="flex right-menu items-center">
    <el-dropdown trigger="click">
      <span class="flex items-center">
        <el-badge :value="msgs.length" class="flex items-center">
          <svg-icon icon-class="warning" class="text-danger text-2xl cursor-pointer swing" />
        </el-badge>
      </span>
      <el-dropdown-menu slot="dropdown" style="width: 300px; max-height: 50%" class="filter-list">
        <el-dropdown-item
          v-for="msg in newMsgs"
          :key="msg.id"
          class="pa-0"
          @click.native="showMessage(msg)"
        >
          <div class="flex pr-3 py-1" style="font-size: 13px;">
            <em
              class="ri-error-warning-fill text-2xl mr-2 ml-2 self-center"
              :style="{color: iconColor(msg.alert_level.id)}"
            />
            <span>
              <div class="msg-text">{{ msg.title ? msg.title : 'No Title' }}</div>
              <div style="color: #909399; line-height: 20px"> {{ getRelativeTime(msg.created_at) }} </div>
            </span>
          </div>
          <el-divider class="m-0" />
        </el-dropdown-item>
        <el-dropdown-item>
          <router-link
            :to="{ name: 'InboxParent' }"
            class="linkTextColor"
          >
            <el-button class="w-full buttonPrimaryReverse" size="small">
              {{ $t('route.Inbox') }}
            </el-button>
          </router-link>
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import { getRelativeTime } from '@shared/utils/handleTime'
import colors from '@/styles/theme/variables.scss'

export default {
  name: 'AbnormalChecker',
  props: {
    msgs: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    newMsgs() {
      if (this.msgs.length > 10) {
        return this.msgs.slice(0, 10)
      }
      return this.msgs
    }
  },
  methods: {
    showMessage(msg) {
      this.$emit('read', msg)
    },
    iconColor(alert_level) {
      // alert level = { 2: WARNING, 3: URGENT, 102: SYSTEM ALERT, 103: SYSTEM WARNING }
      if (alert_level === 2 || alert_level === 103) return colors.warning
      else return colors.danger
    },
    getRelativeTime(value) {
      return getRelativeTime(value)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
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
.filter-list {
  max-height: 80vh;
  overflow-x: hidden;
  overflow-y: auto;
  .msg-text {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 220px;
    line-height: 22px;
    font-weight: bold;
    padding-right: 10px;
  }
}
.dialog-title {
  font-weight: bold;
  font-size: 24px;
  line-height: 28px;
  color: #45474b
}
::v-deep {
  .el-dropdown-menu__item {
    padding: 0;
    margin: 0 12px;
  }
}
</style>
