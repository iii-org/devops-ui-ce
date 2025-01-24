<template>
  <div>
    <el-popover placement="bottom" trigger="click">
      <el-form>
        <el-form-item>
          <div slot="label">
            {{ $t('general.Active') }}
          </div>
          <el-select
            v-model="isDisabled"
            :placeholder="$t('Issue.SelectStatus')"
            multiple
            @change="onChangeFilter"
          >
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <el-button
        slot="reference"
        class="header-text-color"
        icon="el-icon-s-operation"
        type="text"
      >
        {{ displayFilterValue }}
        <em class="el-icon-arrow-down el-icon--right"></em>
      </el-button>
    </el-popover>
    <el-divider direction="vertical" />
    <el-input
      v-if="searchVisible"
      v-model="keyword"
      :placeholder="$t('Project.SearchProjectNameOrIdOrManager')"
      clearable
      prefix-icon="el-icon-search"
      style="width: 250px"
      @blur="searchVisible = !searchVisible"
    />
    <el-button
      v-else
      class="header-text-color"
      icon="el-icon-search"
      type="text"
      @click="searchVisible = !searchVisible"
    >
      {{ $t('general.Search') + (keyword ? ': ' + keyword : '') }}
    </el-button>
    <template v-if="isFilterChanged">
      <el-divider direction="vertical" />
      <el-button
        icon="el-icon-close"
        plain
        size="small"
        type="warning"
        @click="cleanFilter"
      >
        {{ $t('Issue.CleanFilter') }}
      </el-button>
    </template>
    <slot name="updateButton"></slot>
  </div>
</template>

<script>
export default {
  name: 'SearchFilter',
  data() {
    this.options = [
      {
        value: 'enable',
        label: this.$t('general.Enable')
      },
      {
        value: 'disable',
        label: this.$t('general.Disable')
      }
    ]
    return {
      isDisabled: ['enable'],
      keyword: '',
      searchVisible: false
    }
  },
  computed: {
    displayFilterValue() {
      const list = []
      this.isDisabled.forEach((item) => {
        const idx = this.options.findIndex((option) => option.value === item)
        list.push(this.options[idx].label)
      })
      const listJoined = list.join(', ')
      return list.length > 0
        ? `${this.$t('general.Filter')}: ${listJoined}`
        : `${this.$t('general.Filter')}`
    },
    isFilterChanged() {
      return !!this.keyword || this.isDisabled.length > 0
    }
  },
  watch: {
    keyword(val) {
      this.$emit('update:keyword', val)
    }
  },
  methods: {
    async onChangeFilter() {
      this.$emit('changeFilter')
    },
    cleanFilter() {
      this.isDisabled = []
      this.keyword = ''
      this.onChangeFilter()
    }
  }
}
</script>
