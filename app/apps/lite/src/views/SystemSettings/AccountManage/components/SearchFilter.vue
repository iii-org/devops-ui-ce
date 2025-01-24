<template>
  <span>
    <el-button
      class="header-text-color"
      icon="el-icon-download"
      type="text"
      @click="$emit('downloadExcel')"
    >
      <span v-if="!isMobile">
        {{ $t('File.Download') }}
      </span>
    </el-button>
    <el-divider direction="vertical" />
    <el-popover placement="bottom" trigger="click">
      <el-form class="display-column">
        <el-form-item v-for="item in columnsOptions" :key="item.field">
          <el-checkbox
            :label="item.display"
            :value="getCheckColumnValue(item.field)"
            @change="onCheckColumnChange(item.field)"
          >
            {{ item.display }}
          </el-checkbox>
        </el-form-item>
      </el-form>
      <el-button slot="reference" class="header-text-color" type="text">
        <em class="ri-layout-column-fill align-middle"></em>
        <span v-if="!isMobile">
          {{ $t('Milestone.Display') }}
        </span>
        <em class="el-icon-arrow-down el-icon--right"></em>
      </el-button>
    </el-popover>
    <el-divider direction="vertical" />
    <el-popover placement="bottom" popper-class="h-auto" trigger="click">
      <el-form v-loading="listLoading" label-position="top">
        <el-form-item>
          <div slot="label">
            {{ $t('general.Status') }}
          </div>
          <el-select v-model="filterValue.disabled" class="w-full">
            <el-option :label="$t('general.All')" value="all" />
            <el-option :label="$t('general.Enable')" :value="false" />
            <el-option :label="$t('general.Disable')" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="userRole === 'sysadmin'"
          :label="$t('Organization.Organization')"
        >
          <el-select
            v-model="filterValue.organization_id"
            :disabled="isDisableOrg"
            class="w-full"
            clearable
          >
            <el-option
              v-for="item in organizationList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <div slot="label">
            {{ $t('general.CreateTime') }}
          </div>
          <el-date-picker
            v-model="filterValue.create_at"
            :end-placeholder="$t('Issue.EndDate')"
            :picker-options="pickerOptions"
            :start-placeholder="$t('Issue.StartDate')"
            align="right"
            range-separator="-"
            type="datetimerange"
          />
        </el-form-item>
        <el-form-item>
          <div slot="label">
            {{ $t('User.LastLogin') }}
          </div>
          <el-date-picker
            v-model="filterValue.last_login"
            :end-placeholder="$t('Issue.EndDate')"
            :picker-options="pickerOptions"
            :start-placeholder="$t('Issue.StartDate')"
            align="right"
            range-separator="-"
            type="datetimerange"
          />
        </el-form-item>
      </el-form>
      <el-button
        slot="reference"
        class="header-text-color"
        icon="el-icon-s-operation"
        type="text"
      >
        {{ isMobile ? '' : displayFilterValue }}
        <em class="el-icon-arrow-down el-icon--right"></em>
      </el-button>
    </el-popover>
    <el-divider direction="vertical" />
    <el-input
      v-if="searchVisible"
      v-model="keyword"
      :placeholder="$t('User.SearchAccount')"
      :size="isMobile ? 'small' : 'medium'"
      :style="{ width: isMobile ? 'auto' : '250px' }"
      clearable
      prefix-icon="el-icon-search"
      @blur="searchVisible = !searchVisible"
    />
    <el-button
      v-else
      class="header-text-color"
      icon="el-icon-search"
      type="text"
      @click="searchVisible = !searchVisible"
    >
      {{
        isMobile ? '' : $t('general.Search') + (keyword ? ': ' + keyword : '')
      }}
    </el-button>
  </span>
</template>

<script>
import SearchBar from '@/mixins/SearchBar'
import dayjs from 'dayjs'
import { mapGetters } from 'vuex'

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
    },
    organizationList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      keyword: '',
      searchVisible: false,
      isDisableOrg: false,
      filterValue: {
        disabled: 'all',
        create_at: '',
        last_login: '',
        organization_id: ''
      },
      pickerOptions: {
        shortcuts: [
          {
            text: this.$t('User.LastWeek'),
            onClick: (picker) => {
              this.rangeDays(picker, 7)
            }
          },
          {
            text: this.$t('User.LastMonth'),
            onClick: (picker) => {
              this.rangeDays(picker, 30)
            }
          },
          {
            text: this.$t('User.LastThreeMonth'),
            onClick: (picker) => {
              this.rangeDays(picker, 90)
            }
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['userRole']),
    columnsOptions() {
      const options = [
        { display: this.$t('Activities.User'), field: 'first_name' },
        { display: this.$t('general.Department'), field: 'department' },
        { display: this.$t('User.Phone'), field: 'phone' },
        { display: this.$t('general.CreateTime'), field: 'create_at' },
        { display: this.$t('User.LastLogin'), field: 'last_login' }
      ]
      if (this.userRole === 'sysadmin') {
        options.splice(1, 0, {
          display: this.$t('Organization.Organization'),
          field: 'organization_id'
        })
      }
      return Object.freeze(options)
    },
    displayFilterValue() {
      const filterWord = []
      const { create_at, last_login, organization_id } = this.filterValue
      filterWord.push(this.$t('general.Status') + ': ' + this.status())
      if (create_at) {
        filterWord.push(
          this.$t('general.CreateTime') +
            ': ' +
            create_at.map((day) => dayjs(day).format('YYYY-MM-DD')).join(' - ')
        )
      }
      if (last_login) {
        filterWord.push(
          this.$t('User.LastLogin') +
            ': ' +
            last_login.map((day) => dayjs(day).format('YYYY-MM-DD')).join(' - ')
        )
      }

      if (organization_id !== '') {
        const organization = this.organizationList.find(
          (item) => item.id === organization_id
        )
        filterWord.push(
          this.$t('Organization.Organization') + ' : ' + organization.name
        )
      }

      return filterWord.length === 0
        ? this.$t('general.Filter')
        : this.$t('general.Filter') + `: ${filterWord.join(', ')}`
    }
  },
  watch: {
    async keyword(value) {
      if (value) this.params.search = value
      else delete this.params.search
      this.params.page = 1
      this.storeKeyword()
      this.$emit('loadData')
    },
    filterValue: {
      handler(value) {
        const { disabled, create_at, last_login, organization_id } = value
        if (disabled !== 'all') {
          this.params.disabled = disabled
        } else delete this.params.disabled

        if (organization_id !== '') {
          this.params.organization_id = organization_id
        } else delete this.params.organization_id

        if (create_at) {
          this.params.create_at_begin = dayjs(create_at[0]).format(
            'YYYY-MM-DDTHH:mm:ss'
          )
          this.params.create_at_end = dayjs(create_at[1]).format(
            'YYYY-MM-DDTHH:mm:ss'
          )
        } else {
          delete this.params.create_at_begin
          delete this.params.create_at_end
        }
        if (last_login) {
          this.params.last_login_begin = dayjs(last_login[0]).format(
            'YYYY-MM-DDTHH:mm:ss'
          )
          this.params.last_login_end = dayjs(last_login[1]).format(
            'YYYY-MM-DDTHH:mm:ss'
          )
        } else {
          delete this.params.last_login_begin
          delete this.params.last_login_end
        }
        this.params.page = 1
        this.$emit('loadData')
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
        const columnIndex = fields.findIndex((item) => item === value)
        fields.splice(columnIndex, 1)
      } else {
        fields.push(value)
      }
      if (fields.length <= 0) {
        fields = this.columnsOptions.map((item) => item.field)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.display-column {
  .el-form-item {
    margin: 0;
  }
}
</style>
