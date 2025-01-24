/**
 * ! Before using this module, you need to know:
 * 1. The feature of Columns mixins is define table column that need to show up.
 */

import { getIssueFieldDisplay } from '@/api_v3/user'

/**
 * * How to use Columns component
 * ! for required
 * ? for optional
 *
 * ! @columnsOptions {Array}
 * ! @displayFields {Array}
 * ? @filterValue {Object}
 * ! @type {String}
 *
 * * Component example
 *  <Columns
 *    :columns-options="columnsOptions"
 *    :display-fields.sync="displayFields"
 *    :filter-value="filterValue"
 *    :type="'issue_list' or 'wbs_cache'"
 *  />
 */

export default {
  components: {
    Columns: () => import('@/components/Issue/Columns')
  },
  data() {
    return {
      columnsOptions: Object.freeze([
        { display: this.$t('Issue.name'), field: 'subject' },
        { display: this.$t('Issue.tracker'), field: 'tracker' },
        { display: this.$t('Issue.status'), field: 'status' },
        { display: this.$t('Issue.version'), field: 'version' },
        { display: this.$t('Issue.StartDate'), field: 'StartDate' },
        { display: this.$t('Issue.EndDate'), field: 'EndDate' },
        { display: this.$t('Issue.priority'), field: 'priority' },
        { display: this.$t('Issue.assigned'), field: 'assigned' },
        { display: this.$t('Issue.DoneRatio'), field: 'done_ratio' }
      ]),
      displayFields: []
    }
  },
  computed: {
    columns() {
      if (this.displayFields.length <= 0) {
        return this.columnsOptions.map((item) => item.field)
      }
      return this.displayFields
    },
    deploy_column() {
      const columns = {}
      this.columnsOptions.forEach((item) => {
        let field = item.field
        if (item.field === 'StartDate') {
          field = 'start_date'
        } else if (item.field === 'EndDate') {
          field = 'due_date'
        }
        columns[field] = this.columns.includes(item.field)
      })
      return columns
    }
  },
  async mounted() {
    await this.loadDisplayColumns()
  },
  methods: {
    async loadDisplayColumns() {
      const res = await getIssueFieldDisplay({
        type: this.type
      })
      this.displayFields = res.data
    }
  }
}
