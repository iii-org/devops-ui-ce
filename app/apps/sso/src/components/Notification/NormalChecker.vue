<template>
  <div class="flex right-menu items-center">
    <el-dropdown v-if="msgs.length > 0" trigger="click">
      <span class="flex items-center">
        <el-badge :value="msgs.length" :hidden="msgs.length === 0" class="flex items-center">
          <em class="ri-mail-fill text-warning text-2xl cursor-pointer" />
        </el-badge>
      </span>
      <el-dropdown-menu slot="dropdown" style="width: 300px; max-height: 50%" class="filter-list">
        <el-dropdown-item
          v-for="msg in newMsgs"
          :key="msg.id"
          @click.native="showMessage(msg)"
        >
          <div class="flex pr-3 py-1" style="font-size: 13px;">
            <em class="ri-information-fill text-2xl mr-2 ml-2 text-success self-center" />
            <span>
              <div class="msg-text">{{ msg.title ? msg.title : 'No Title' }}</div>
              <div style="color: #909399; line-height: 20px"> {{ getRelativeTime(msg.created_at) }} </div>
            </span>
          </div>
          <el-divider class="m-0" />
        </el-dropdown-item>
        <el-dropdown-item class="inbox-btn">
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
    <span v-else>
      <el-tooltip :content="$t('route.Inbox')" class="flex items-center">
        <router-link :to="{ name: 'InboxParent' }">
          <em class="ri-mail-fill text-warning text-2xl cursor-pointer" />
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
    getRelativeTime(value) {
      return getRelativeTime(value)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
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
    padding-right: 22px;
  }
  .inbox-btn:hover {
    background-color: transparent !important;
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
  .el-badge__content.is-fixed {
    top: 4px;
  }
}
</style>
