<template>
  <div>
    <el-popover placement="bottom" trigger="click" width="225">
      <el-form>
        <el-form-item :label="$t('general.Search')">
          <el-checkbox
            v-model="is_closed"
            :label="$t('Issue.DisplayClosedIssue')"
            @change="onChangeFilter"
          />
          <el-input
            v-model="keyword"
            :placeholder="$t('Project.SearchProjectNameOrId')"
            clearable
            prefix-icon="el-icon-search"
            @input="onChangeFilter"
          />
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
    <template v-if="isFilterChanged">
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
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'SearchFilter',
  data() {
    return {
      is_closed: false,
      keyword: ''
    }
  },
  computed: {
    displayFilterValue() {
      const filterWord = []
      if (this.is_closed) filterWord.push(this.$t('Issue.DisplayClosedIssue'))
      if (this.keyword) filterWord.push(this.keyword)
      return filterWord.length === 0
        ? this.$t('general.Filter')
        : this.$t('general.Filter') + `: ${filterWord.concat()}`
    },
    isFilterChanged() {
      return this.is_closed || !!this.keyword
    }
  },
  methods: {
    async onChangeFilter() {
      this.$emit('changeFilter', {
        is_closed: this.is_closed,
        keyword: this.keyword
      })
    },
    cleanFilter() {
      this.is_closed = false
      this.keyword = ''
      this.onChangeFilter()
    }
  }
}
</script>
