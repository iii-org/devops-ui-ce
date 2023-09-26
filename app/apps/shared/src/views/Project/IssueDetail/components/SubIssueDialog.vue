<template>
  <el-dialog
    :visible="isIssueDialog"
    append-to-body
    destroy-on-close
    :width="device === 'desktop' ? hasChildrenIssue ? '60vw' : '30vw' : '95%'"
    @close="handleCancel()"
  >
    <template v-if="!isLoading">
      <span class="block text-center text-lg font-bold">
        <em class="el-icon-warning text-danger" />
        {{ this.$t(`Issue.${type}`, { issueName: issue.name }) }}
      </span>
      <template v-if="hasChildrenIssue || isHasWhiteBoard">
        <ul v-if="hasChildrenIssue">
          <li
            v-for="item in children"
            :key="item.id"
            class="p-1"
          >
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
            {{ item.name }}
            <template v-if="item.assigned_to && Object.keys(item.assigned_to).length > 0">
              {{ `(${$t(`Issue.assigned_to`)}:${item.assigned_to.name} - ${item.assigned_to.login})` }}
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
          <ul class="mt-0">
            <li
              v-for="item in excalidraws"
              :key="item.id"
              class="p-1"
            >
              <el-link
                type="primary"
                @click="$emit('editWhiteBoard',item)"
              >
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
    <el-skeleton
      v-else
      animated
      class="px-3 pt-3"
    />
  </el-dialog>
</template>

<script>
import { getIssueFamily } from '@/api/issue'
import { mapGetters } from 'vuex'

export default {
  name: 'SubIssueDialog',
  components: {
    Status: () => import('@/components/Issue/Status'),
    Tracker: () => import('@/components/Issue/Tracker')
  },
  props: {
    isIssueDialog: {
      type: Boolean,
      default: false
    },
    isDeleteIssue: {
      type: Boolean,
      default: false
    },
    issue: {
      type: Object,
      default: () => ({})
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
        return this.isDeleteIssue ? 'ConfirmDeleteIssueWithSub' : 'ConfirmCloseIssueWithSub'
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
          this.$set(this, 'children', data.hasOwnProperty('children') ? data.children : [])
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
