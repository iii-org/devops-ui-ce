<template>
  <el-row class="el-upload-list">
    <el-row
      v-for="(file,idx) in selectedCollections"
      :key="idx"
      class="el-upload-list__item is-ready"
    >
      <el-col :span="20">
        <span
          :ref="'file'+idx"
          class="el-upload-list__item-name"
        >
          <em class="el-icon-document"></em>
          {{ file.software_name }} - {{ file.name }} ({{ file.file_name }})
        </span>
      </el-col>
      <el-col
        :span="4"
        class="text-right"
      >
        <el-popconfirm
          :confirm-button-text="$t('general.Delete')"
          :cancel-button-text="$t('general.Cancel')"
          :title="$t('Issue.UnlinkIssueCollection')"
          icon="el-icon-info"
          popper-class="danger"
          @confirm="deleteIssueCollection(file)"
        >
          <el-button
            slot="reference"
            :type="isButtonDisabled ? 'info' : 'danger'"
            :disabled="isButtonDisabled"
            size="mini"
            icon="el-icon-remove"
          >
            {{ $t('Issue.Unlink') }}
          </el-button>
        </el-popconfirm>
      </el-col>
    </el-row>
  </el-row>
</template>

<script>
export default {
  name: 'IssueCollection',
  props: {
    selectedCollections: {
      type: Array,
      default: () => []
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    deleteIssueCollection(row) {
      const idx = this.selectedCollections.findIndex((item) => item.id === row.id)
      this.selectedCollections.splice(idx, 1)
      this.$emit('update')
    }
  }
}
</script>
