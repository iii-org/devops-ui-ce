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
        icon="el-icon-s-operation"
        class="header-text-color"
        type="text"
      >
        {{ displayFilterValue }}
        <em class="el-icon-arrow-down el-icon--right" />
      </el-button>
    </el-popover>
    <el-divider direction="vertical" />
    <el-input
      v-if="searchVisible"
      v-model="keyword"
      :placeholder="$t('Project.SearchProjectNameOrIdOrManager')"
      style="width: 250px"
      prefix-icon="el-icon-search"
      clearable
      @blur="searchVisible=!searchVisible"
    />
    <el-button
      v-else type="text"
      icon="el-icon-search"
      class="header-text-color"
      @click="searchVisible=!searchVisible"
    >
      {{ $t('general.Search') + ((keyword) ? ': ' + keyword : '') }}
    </el-button>
    <template v-if="isFilterChanged">
      <el-divider direction="vertical" />
      <el-button
        size="small"
        icon="el-icon-close"
        class="button-secondary-reverse"
        @click="cleanFilter"
      >
        {{ $t('Issue.CleanFilter') }}
      </el-button>
    </template>
    <slot name="updateButton" />
  </div>
</template>

<script>
export default {
  name: 'SearchFilter',
  data() {
    this.options = [
      {
        value: 0,
        label: this.$t('general.Enable')
      },
      {
        value: 1,
        label: this.$t('general.Disable')
      }
    ]
    return {
      isDisabled: [0],
      keyword: '',
      searchVisible: false
    }
  },
  computed: {
    displayFilterValue() {
      const list = []
      this.isDisabled.forEach(item => {
        list.push(this.options[item].label)
      })
      const listJoined = list.join(', ')
      return list.length > 0 ? `${this.$t('general.Filter')}: ${listJoined}` : `${this.$t('general.Filter')}`
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
