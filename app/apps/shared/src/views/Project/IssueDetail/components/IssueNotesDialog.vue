<template>
  <el-row v-if="data.length > 0">
    <el-row ref="dialog" :style="{ height: height }" class="dialog_wrapper">
      <el-radio-group
        v-model="status"
        class="flex justify-center pb-3"
        size="mini"
      >
        <el-radio-button label="all">
          {{ $t('Issue.All') }}
        </el-radio-button>
        <el-radio-button label="status">
          {{ $t('Issue.status') }}
        </el-radio-button>
        <el-radio-button label="message">
          {{ $t('Issue.Message') }}
        </el-radio-button>
      </el-radio-group>
      <DialogContent
        v-for="(item, idx) in filteredIssueHistory"
        :id="`dialog-content-${idx}`"
        :key="idx"
        :note="item"
        :right="filterAuthor(item)"
        @show-parent-issue="showParentIssue"
      />
    </el-row>
  </el-row>
  <el-col v-else>
    <NoData />
  </el-col>
</template>

<script>
import { mapGetters } from 'vuex'
import DialogContent from './widget/DialogContent'

export default {
  name: 'IssueNotesDialog',
  components: {
    DialogContent,
    NoData: () => import('@shared/components/NoData')
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    height: {
      type: String,
      default: '250px'
    }
  },
  data() {
    return {
      status: 'all'
    }
  },
  computed: {
    ...mapGetters(['userId']),
    filteredIssueHistory() {
      return this.data.filter((note) => {
        switch (this.status) {
          case 'all':
            return note
          case 'status':
            return note.details.length > 0 || this.filterObject(note)
          case 'message':
            return (
              note.details.length === 0 &&
              note.notes !== '' &&
              !this.filterObject(note)
            )
        }
      })
    }
  },
  methods: {
    filterObject(note) {
      try {
        return typeof JSON.parse(note.notes) === 'object'
      } catch (e) {
        return false
      }
    },
    filterAuthor(note) {
      return note.user.id === this.userId
    },
    showParentIssue(id) {
      this.$emit('show-parent-issue', id)
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog_wrapper {
  overflow-y: auto;
}
</style>
