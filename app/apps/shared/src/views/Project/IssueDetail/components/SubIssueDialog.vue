<template>
  <el-dialog
    :visible="isIssueDialog"
    :width="device === 'desktop' ? (hasChildrenIssue ? '60vw' : '30vw') : '95%'"
    append-to-body
    destroy-on-close
    @close="handleCancel()"
  >
    <template slot="title">
      <Tracker v-if="tracker" :name="$t(`Issue.${tracker}`)" :type="tracker" />
      <span> {{ title }} </span>
    </template>
    <template v-if="!isLoading && issue.subject">
      <span class="block text-lg font-bold p-3">
        <em class="el-icon-warning text-danger"></em>
        {{ $t(`Issue.${type}`, { issueName: issue.subject }) }}
      </span>
      <template v-if="hasChildrenIssue || isHasWhiteBoard">
        <el-divider v-if="hasChildrenIssue" content-position="left">
          {{ $t('Issue.RelatedIssue') }}
        </el-divider>
        <ul
          v-if="hasChildrenIssue"
          class="overflow-auto"
          style="max-height: 200px"
        >
          <li v-for="item in children" :key="item.id" class="p-1">
            <Status
              :name="$t(`Issue.${item.status.name}`)"
              :type="item.status.name"
              class="mx-1"
              size="mini"
            />
            <Tracker
              :name="$t(`Issue.${item.tracker.name}`)"
              :type="item.tracker.name"
              size="mini"
            />
            {{ `#${item.id} - ` }}
            <template v-if="item.tags && item.tags.length > 0">
              <span v-for="tag in item.tags" :key="tag.id">
                <el-tag class="mx-1" type="mini">
                  {{ tag.name }}
                </el-tag>
              </span>
            </template>
            {{ item.subject }}
            <template v-if="item.assigned">
              {{
                `(${$t(`Issue.assigned`)}:${item.assigned.full_name} - ${
                  item.assigned.username
                })`
              }}
            </template>
          </li>
        </ul>
        <span v-if="isHasWhiteBoard">
          <el-divider class="w-auto m-3" />
          <span class="block text-center text-danger">
            <el-checkbox
              v-model="checkDeleteWhiteBoard"
              :label="$t('Notify.DeleteExcalidrawWarning')"
            />
          </span>
          <ul class="overflow-auto mt-0" style="max-height: 100px">
            <li v-for="item in excalidraws" :key="item.id" class="p-1">
              <el-link type="primary" @click="$emit('editWhiteBoard', item)">
                {{ item.name }}
              </el-link>
            </li>
          </ul>
        </span>
      </template>
      <span slot="footer">
        <el-button @click="handleCancel()">
          {{ $t('general.Cancel') }}
        </el-button>
        <el-button type="primary" @click="handleConfirm()">
          {{ $t('general.Confirm') }}
        </el-button>
      </span>
    </template>
    <el-skeleton v-else animated class="px-3 pt-3" />
  </el-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { getIssueFamily } from '@/api_v3/issues'

export default {
  name: 'SubIssueDialog',
  components: {
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker')
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    tracker: {
      type: String,
      default: ''
    },
    issue: {
      type: Object,
      default: () => ({})
    },
    isIssueDialog: {
      type: Boolean,
      default: false
    },
    isDeleteIssue: {
      type: Boolean,
      default: false
    },
    changedStatus: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isLoading: false,
      children: [],
      checkDeleteWhiteBoard: false
    }
  },
  computed: {
    ...mapGetters(['device']),
    type() {
      if (this.hasChildrenIssue) {
        return this.isDeleteIssue
          ? 'ConfirmDeleteIssueWithSub'
          : 'ConfirmCloseIssueWithSub'
      } else {
        return this.isDeleteIssue ? 'ConfirmDeleteIssue' : 'ConfirmCloseIssue'
      }
    },
    excalidraws() {
      return this.issue.excalidraw
    },
    hasChildrenIssue() {
      return this.children?.length > 0
    },
    isHasWhiteBoard() {
      return this.issue.excalidraw?.length > 0
    }
  },
  watch: {
    issue(value) {
      this.getIssueFamilyData(value)
    }
  },
  methods: {
    async getIssueFamilyData(issue) {
      if (issue.hasOwnProperty('children')) {
        this.$set(this, 'children', issue.children)
      } else {
        try {
          this.isLoading = true
          const family = await getIssueFamily(issue.id)
          const data = family.data
          this.$set(
            this,
            'children',
            data.hasOwnProperty('children') ? data.children : []
          )
        } catch (e) {
          console.error(e)
        } finally {
          this.isLoading = false
        }
      }
    },
    handleConfirm() {
      if (this.isDeleteIssue) {
        this.handleDeleteIssue()
      } else {
        this.handleCloseIssue()
      }
      this.handleCancel()
    },
    handleCloseIssue() {
      const { id } = this.changedStatus
      this.$emit('handleClose', {
        column: 'status_id',
        id: id,
        close_all: true
      })
    },
    async handleDeleteIssue() {
      this.$emit('handleDelete', this.checkDeleteWhiteBoard)
    },
    handleCancel() {
      if (this.isDeleteIssue) {
        this.checkDeleteWhiteBoard = false
      } else {
        this.$emit('handleCancel')
      }
      this.$emit('update:isIssueDialog', false)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-dialog__body {
  padding: 0 20px;
}
</style>
