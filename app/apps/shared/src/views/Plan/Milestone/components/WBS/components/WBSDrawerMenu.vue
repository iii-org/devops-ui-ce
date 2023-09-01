<template>
  <el-drawer
    v-loading="isLoading"
    :visible.sync="isShowDrawer"
    direction="btt"
    class="drawer"
    size="auto"
    destroy-on-close
  >
    <div slot="title" class="title">
      <span>
        <el-divider direction="vertical" />
        <span
          class="text"
          @click="onRelationIssueDialog(issue)"
        >
          {{ issue.name }}
        </span>
      </span>
    </div>
    <div class="container">
      <el-collapse v-model="activeName" accordion>
        <el-collapse-item title="Tag" name="1" :disabled="disabled">
          <el-checkbox-group
            v-model="tagValue"
            size="small"
            class="radio-group"
          >
            <el-col class="settings">
              <el-checkbox
                v-for="item in tags"
                :key="item.id"
                :label="item.id"
                :value="item.id"
                border
                @change="handleUpdateIssue({value:{'tags': item.id}, row: issue})"
              >
                {{ item.name }} {{ item.message }}
              </el-checkbox>
            </el-col>
          </el-checkbox-group>
        </el-collapse-item>
        <div class="navigator" :class="disabled ? 'disabled' : ''" @click="onRelationIssueDialog(issue)">{{ $t('route.IssueDetail') }}</div>
        <div class="navigator" :class="disabled ? 'disabled' : ''" @click="toggleIssueMatrixDialog(issue)">{{ $t('Issue.TraceabilityMatrix') }}</div>
        <div class="navigator" :class="disabled ? 'disabled' : ''" @click="appendIssue(issue)">{{ $t('Issue.AddIssue') }}</div>
        <div class="navigator" :class="disabled ? 'disabled' : ''" @click="toggleRelationDialog('Children')">{{ $t('general.Settings', { name: $t('Issue.ChildrenIssue') }) }}</div>
        <div class="navigator" :class="disabled ? 'disabled' : ''" @click="appendIssue(issue, false, issue)">{{ $t('Issue.CopyIssue') }}</div>
        <el-collapse-item :title="$t('Issue.AddToCalendar')" name="7" :disabled="disabled">
          <div class="navigator child" @click="addToCalendar('google', issue)">
            <svg-icon icon-class="google" class="text-md" />
            <span>Google</span>
          </div>
          <div class="navigator child" @click="addToCalendar('microsoft', issue)">
            <svg-icon icon-class="microsoft" class="text-md" />
            <span>Outlook.com</span>
          </div>
          <div class="navigator child" @click="addToCalendar('office365', issue)">
            <svg-icon icon-class="office365" class="text-md" />
            <span>Microsoft 365</span>
          </div>
          <div class="navigator child" @click="addToCalendar('ics', issue)">
            <svg-icon icon-class="ical" class="text-md" />
            <span>ICalendar</span>
          </div>
        </el-collapse-item>
      </el-collapse>
      <el-button
        icon="el-icon-delete"
        type="danger"
        class="w-full mt-2"
        :disabled="disabled"
        @click="handleRemoveIssue(issue, 'ConfirmDelete', false)"
      >
        {{ $t('general.Delete') }}
      </el-button>
    </div>
  </el-drawer>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'WBSIssueDrawer',
  props: {
    tags: {
      type: Array,
      default: () => []
    },
    permission: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      issue: {},
      isLoading: false,
      isShowDrawer: false,
      tagValue: [],
      activeName: ''
    }
  },
  computed: {
    ...mapGetters(['userRole']),
    disabled() {
      return !this.permission.includes(this.userRole)
    }
  },
  methods: {
    getContextMenuCurrentValue(column, item) {
      return this.issue[column]?.map((subItem) => subItem.id).includes(item.id)
    },
    handleUpdateIssue({ value, row }) {
      if (!this.disabled) {
        this.$emit('handleUpdateIssue', { value, row })
        this.isShowDrawer = false
      }
    },
    toggleIssueMatrixDialog(row) {
      if (!this.disabled) {
        this.$emit('toggleIssueMatrixDialog', row)
        this.isShowDrawer = false
      }
    },
    appendIssue(row, isSubIssue, copyIssue) {
      if (!this.disabled) {
        this.$emit('appendIssue', row, isSubIssue, copyIssue)
        this.isShowDrawer = false
      }
    },
    toggleRelationDialog(type) {
      if (!this.disabled) {
        this.$emit('toggleRelationDialog', type, this.issue)
        this.isShowDrawer = false
      }
    },
    addToCalendar(type, row) {
      if (!this.disabled) {
        this.$emit('addToCalendar', type, row)
        this.isShowDrawer = false
      }
    },
    handleRemoveIssue(row, message, isSubIssue) {
      if (!this.disabled) {
        this.$emit('handleRemoveIssue', row, message, isSubIssue)
        this.isShowDrawer = false
      }
    },
    handleInputDrawerMenu(row) {
      this.isShowDrawer = true
      this.issue = row
      this.tagValue = row.tags?.map((item) => item.id)
    },
    onRelationIssueDialog() {
      if (!this.disabled) this.$router.push({ name: 'IssueDetail', params: { issueId: this.issue.id }})
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
.drawer {
  ::v-deep .el-drawer {
    border-radius: 10px 10px 0 0;
  }
  ::v-deep .el-drawer__header {
    margin-bottom: 0 !important;
    padding: 10px;
  }
  .title {
    ::v-deep .el-divider--vertical {
      width: 6px;
      margin: 0;
      border-radius: 3px 0 0 3px;
      height: 18px;
      background-color: $warning;
    }
    .text {
      font-size: 15px;
      font-weight: bold;
      color: #72767b;
      vertical-align: middle;
    }
  }

  .container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }
  .container {
    padding: 10px;
    max-width: 768px;
    max-height: 90vh;
    overflow-y: auto;
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    ::v-deep .el-divider {
      background-color: #EBEEF5;
    }
    ::v-deep .el-collapse-item__content {
      padding-bottom: 0;
    }
    .navigator {
      align-items: center;
      height: 48px;
      line-height: 48px;
      background-color: #fff;
      color: #303133;
      cursor: pointer;
      border-bottom: 1px solid #ebeef5;
      font-size: 13px;
      font-weight: 500;
    }
    .disabled {
      color: #bbb;
      cursor: not-allowed;
    }
    .child {
      border-bottom: none;
      padding-left: 16px;
      height:40px;
      line-height: 40px;
    }
    .current {
      @apply text-success font-bold;
    }
    .radio-group {
      display: grid;
      margin-bottom: 10px;
      .settings::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera*/
      }
      .settings {
        max-width: 768px;
        margin: 0 auto;
        display: grid;
        gap: 6px;
        overflow-x: auto;
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none; /* Firefox */
        ::v-deep .el-checkbox {
          margin-left: 0;
          margin-right: 0;
        }
        ::v-deep .el-checkbox.is-bordered.is-checked {
          border: 1px solid $warning;
        }
      }
    }
  }
}
@media (min-width: 350px) {
  .settings { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 500px) {
  .settings { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 650px) {
  .settings { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 750px) {
  .settings { grid-template-columns: repeat(5, 1fr); }
}
</style>
