<template>
  <span>
    <el-popover
      placement="bottom"
      trigger="click"
    >
      <el-form class="display-column">
        <el-form-item
          v-for="item in columnsOptions"
          :key="item.field"
        >
          <el-checkbox
            :label="item.display"
            :value="getCheckColumnValue(item.field)"
            @change="onCheckColumnChange(item.field)"
          >
            {{ item.display }}
          </el-checkbox>
        </el-form-item>
      </el-form>
      <el-button
        slot="reference"
        type="text"
        class="header-text-color"
      >
        <em class="ri-layout-column-fill align-middle" />
        <span v-if="!isMobile">
          {{ $t('Milestone.Display') }}
        </span>
        <em class="el-icon-arrow-down el-icon--right" />
      </el-button>
    </el-popover>
    <el-divider direction="vertical" />
    <el-popover
      popper-class="h-auto"
      placement="bottom"
      trigger="click"
    >
      <el-form v-loading="listLoading" label-position="top">
        <el-form-item>
          <div slot="label">
            {{ $t('general.Status') }}
          </div>
          <el-select
            v-model="filterValue.disabled"
            class="w-full"
          >
            <el-option :label="$t('general.All')" value="all" />
            <el-option :label="$t('general.Enable')" :value="false" />
            <el-option :label="$t('general.Disable')" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <div slot="label">
            {{ $t('general.CreateTime') }}
          </div>
          <el-date-picker
            v-model="filterValue.create_at"
            type="datetimerange"
            :picker-options="pickerOptions"
            :start-placeholder="$t('Issue.StartDate')"
            :end-placeholder="$t('Issue.EndDate')"
            range-separator="-"
            align="right"
          />
        </el-form-item>
        <el-form-item>
          <div slot="label">
            {{ $t('User.LastLogin') }}
          </div>
          <el-date-picker
            v-model="filterValue.last_login"
            type="datetimerange"
            :picker-options="pickerOptions"
            :start-placeholder="$t('Issue.StartDate')"
            :end-placeholder="$t('Issue.EndDate')"
            range-separator="-"
            align="right"
          />
        </el-form-item>
      </el-form>
      <el-button
        slot="reference"
        icon="el-icon-s-operation"
        type="text"
        class="header-text-color"
      >
        {{ isMobile ? '': $t('general.Filter') }}
        <em class="el-icon-arrow-down el-icon--right" />
      </el-button>
    </el-popover>
    <el-divider direction="vertical" />
    <el-input
      v-if="searchVisible"
      v-model="keyword"
      prefix-icon="el-icon-search"
      :placeholder="$t('User.SearchAccount')"
      :style="{width: isMobile ? 'auto' : '250px'}"
      :size="isMobile ? 'small' : 'medium'"
      clearable
      @blur="searchVisible=!searchVisible"
    />
    <el-button
      v-else
      type="text"
      icon="el-icon-search"
      class="header-text-color"
      @click="searchVisible = !searchVisible"
    >
      {{ isMobile ? '' : ($t('general.Search') + ((keyword) ? ': ' + keyword : '')) }}
    </el-button>
  </span>
</template>

<script>
import { SearchBar } from '@/mixins'
import dayjs from 'dayjs'

export default {
  name: 'SearchFilter',
  mixins: [SearchBar],
  props: {
    listLoading: {
      type: Boolean,
      default: false
    },
    isMobile: {
      type: Boolean,
      default: false
    },
    params: {
      type: Object,
      default: () => ({})
    },
    displayFields: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      keyword: '',
      searchVisible: false,
      filterValue: {
        disabled: 'all',
        create_at: '',
        last_login: ''
      },
      pickerOptions: {
        shortcuts: [{
          text: this.$t('User.LastWeek'),
          onClick: (picker) => { this.rangeDays(picker, 7) }
        }, {
          text: this.$t('User.LastMonth'),
          onClick: (picker) => { this.rangeDays(picker, 30) }
        }, {
          text: this.$t('User.LastThreeMonth'),
          onClick: (picker) => { this.rangeDays(picker, 90) }
        }]
      },
      columnsOptions: Object.freeze([
        { display: this.$t('Activities.User'), field: 'avatar' },
        { display: this.$t('general.Department'), field: 'department' },
        { display: this.$t('User.Phone'), field: 'phone' },
        { display: this.$t('general.CreateTime'), field: 'create_at' },
        { display: this.$t('User.LastLogin'), field: 'last_login' }
      ])
    }
  },
  watch: {
    async keyword(value) {
      if (value) this.params.search = value
      else delete this.params.search
      this.params.page = 1
      this.storeKeyword()
      this.$emit('load-data')
    },
    filterValue: {
      handler(value) {
        const { disabled, create_at, last_login } = value
        if (disabled !== 'all') this.params.disabled = disabled
        else delete this.params.disabled
        if (create_at) {
          this.params.create_at = create_at.map((item) =>
            dayjs(item).format('YYYY-MM-DDTHH:mm:ss'))
        } else {
          delete this.params.create_at
        }
        if (last_login) {
          this.params.last_login = last_login.map((item) =>
            dayjs(item).format('YYYY-MM-DDTHH:mm:ss'))
        } else {
          delete this.params.last_login
        }
        this.params.page = 1
        this.$emit('load-data')
      },
      deep: true
    }
  },
  methods: {
    rangeDays(picker, days) {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * days)
      picker.$emit('pick', [start, end])
    },
    getCheckColumnValue(value) {
      if (this.displayFields.length <= 0) return true
      return this.displayFields.includes(value)
    },
    async onCheckColumnChange(value) {
      let fields = this.displayFields
      if (fields.includes(value)) {
        const columnIndex = fields.findIndex(item => item === value)
        fields.splice(columnIndex, 1)
      } else {
        fields.push(value)
      }
      if (fields.length <= 0) {
        fields = this.columnsOptions.map(item => item.field)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.display-column {
  .el-form-item {
    margin: 0;
  }
}
</style>
