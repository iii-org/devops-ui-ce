/**
 * ! Before using this module, you need to know:
 * 1. The feature of IssueExpand mixins is offer public function.
 */

import { getIssueFamily } from '@/api_v3/issues'

/**
 * * How to use IssueExpand component
 * ! for required
 * ? for optional
 *
 * ! @issue {Object}
 * ? @popup {Boolean}
 * ? @family {Boolean}
 * ? @reload {String, Number}
 * ? @isButtonDisabled {Boolean}
 * ! @update {Function}
 * ? @popupDialog {Function}
 * ? @onContextMenu {Function}
 *
 * * Component example
 *  <IssueExpand
 *    :issue="row"
 *    :popup="true"
 *    :family="countRelationIssue > 0"
 *    :reload="relationVisible"
 *    :is-button-disabled="isButtonDisabled"
 *    @update="getIssueFamilyData(issue)"
 *    @popup-dialog="onRelationIssueDialog"
 *    @on-context-menu="onContextMenu"
 *  />
 */

export default {
  components: {
    IssueExpand: () => import('@/components/Issue/IssueExpand')
  },
  methods: {
    async getIssueFamilyData() {
      this.expands = []
      const store = this.$refs['Desktop']
        ? this.$refs['Desktop'].$refs['issueList'].layout.store
        : this.$refs['issueList'].layout.store
      const { expandRows } = store.states
      const row = expandRows.length > 1 ? expandRows[1] : expandRows[0]
      if (expandRows.length) this.expands.push(row.id)
      if (!expandRows.some((item) => item.id === row.id)) return
      try {
        await this.$set(row, 'isLoadingFamily', true)
        const family = await getIssueFamily(row.id)
        const data = family.data
        this.formatIssueFamilyData(row, data)
        this.$set(row, 'isLoadingFamily', false)
      } catch (e) {
        //   null
      }
      return Promise.resolve()
    },
    formatIssueFamilyData(row, data) {
      if (data.hasOwnProperty('parent')) {
        this.$set(row, 'parent', data.parent)
      }
      if (data.hasOwnProperty('children')) {
        this.$set(row, 'children', data.children)
      }
      if (data.hasOwnProperty('relations')) {
        this.$set(row, 'relations', data.relations)
      }
    }
  }
}
