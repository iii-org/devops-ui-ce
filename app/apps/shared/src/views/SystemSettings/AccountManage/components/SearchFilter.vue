<template>
  <span>
    <el-button
      class="header-text-color"
      icon="el-icon-download"
      type="text"
      @click="$emit('download-excel')"
    >
      <span v-if="!isMobile">
        {{ $t('File.Download') }}
      </span>
    </el-button>
    <el-divider direction="vertical" />
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
        class="header-text-color"
        type="text"
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
            :picker-options="pickerOptions"
            :start-placeholder="$t('Issue.StartDate')"
            :end-placeholder="$t('Issue.EndDate')"
            type="datetimerange"
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
            :picker-options="pickerOptions"
            :start-placeholder="$t('Issue.StartDate')"
            :end-placeholder="$t('Issue.EndDate')"
            type="datetimerange"
            range-separator="-"
            align="right"
          />
        </el-form-item>
      </el-form>
      <el-button
        slot="reference"
        class="header-text-color"
        icon="el-icon-s-operation"
        type="text"
      >
        {{ isMobile ? '': displayFilterValue }}
        <em class="el-icon-arrow-down el-icon--right" />
      </el-button>
    </el-popover>
    <el-divider direction="vertical" />
    <el-input
      v-if="searchVisible"
      v-model="keyword"
      :placeholder="$t('User.SearchAccount')"
      :style="{width: isMobile ? 'auto' : '250px'}"
      :size="isMobile ? 'small' : 'medium'"
      prefix-icon="el-icon-search"
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
  computed: {
    displayFilterValue() {
      const filterWord = []
      const { disabled, create_at, last_login } = this.filterValue
      filterWord.push(
        this.$t('general.Status') + ': ' + this.status()
      )
      if (create_at) {
        filterWord.push(
          this.$t('general.CreateTime') + ': ' +
            create_at.map((day) => dayjs(day).format('YYYY-MM-DD')).join(' - ')
        )
      }
      if (last_login) {
        filterWord.push(
          this.$t('User.LastLogin') + ': ' +
            last_login.map((day) => dayjs(day).format('YYYY-MM-DD')).join(' - ')
        )
      }
      return filterWord.length === 0 ? this.$t('general.Filter')
        : this.$t('general.Filter') + `: ${filterWord.concat()}`
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
    status() {
      switch (this.filterValue.disabled) {
        case 'all':
          return this.$t('general.All')
        case true:
          return this.$t('general.Disable')
        case false:
          return this.$t('general.Enable')
      }
    },
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
