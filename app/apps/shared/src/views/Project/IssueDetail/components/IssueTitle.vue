<template>
  <span
    v-if="edit"
    v-loading="isLoading"
    class="p-3"
  >
    <span class="el-input inline">
      <input
        v-model="newValue"
        v-autowidth="{
          maxWidth: isFromBoard ? '480px' : '960px',
          minWidth: '120px',
          comfortZone: 0
        }"
        type="text"
        :placeholder="$t('general.Title')"
        class="el-input__inner text-xl"
      >
      <el-button
        class="action"
        type="success"
        size="mini"
        icon="el-icon-check"
        @click="updateTitle"
      />
      <el-button
        class="action"
        type="danger"
        size="mini"
        icon="el-icon-close"
        @click="cancelInput"
      />
    </span>
  </span>
  <span
    v-else-if="isButtonDisabled"
    class="cursor-not-allowed"
  >
    {{ value }}
  </span>
  <span
    v-else
    class="title cursor-text p-1"
    @click="edit = true"
  >
    {{ value }}
  </span>
</template>

<script>
import VueInputAutoWidth from 'vue-input-autowidth'
import Vue from 'vue'
import { updateIssue } from '@/api/issue'

Vue.use(VueInputAutoWidth)

export default {
  name: 'IssueTitle',
  props: {
    value: {
      type: String,
      default: null
    },
    oldValue: {
      type: String,
      default: null
    },
    issueId: {
      type: [String, Number],
      default: null
    },
    isFromBoard: {
      type: Boolean,
      default: false
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoading: false,
      edit: false,
      newValue: this.value
    }
  },
  watch: {
    value(newVal) {
      this.newValue = newVal
    },
    newValue(value) {
      this.$emit('input', value)
    },
    oldValue() {
      this.edit = !this.issueId
    }
  },
  mounted() {
    this.newValue = this.value
  },
  methods: {
    async updateTitle() {
      this.isLoading = true
      const sendForm = new FormData()
      sendForm.append('name', this.newValue)
      await updateIssue(this.issueId, sendForm).then(() => {
        this.$emit('update')
        this.edit = false
      })
      this.isLoading = false
    },
    cancelInput() {
      this.newValue = this.oldValue
      this.edit = !this.issueId
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';
.title:hover {
  @apply bg-gray-100 rounded;
}

.el-button--success{
  color: $success;
  border: 1px solid #989898;
  background: none;
  -webkit-transition: all .6s ease;
  transition: all .6s ease;
  &:hover {
    color: #fff;
    border: 1px solid $success;
    background: $success;
  }
}

.el-button--danger{
  color: $danger;
  border: 1px solid #989898;
  background: none;
  -webkit-transition: all .6s ease;
  transition: all .6s ease;
  &:hover {
    color: #fff;
    border: 1px solid $danger;
    background: $danger;
  }
}

.action {
  margin: 0;
  &.el-button--mini {
    padding: 5px;
  }
}
</style>
