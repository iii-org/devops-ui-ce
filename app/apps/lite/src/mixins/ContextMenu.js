import { getIssueDetails } from '@/api_v3/issues'

export default {
  components: {
    ContextMenu: () => import('@/components/Issue/ContextMenu')
  },
  data() {
    return {
      contextMenu: {
        row: { version: { id: 'null' }, assigned: { id: 'null' }},
        visible: false,
        left: 0,
        top: 0
      },
      filterOptions: Object.freeze([
        {
          id: 1,
          label: this.$t('Issue.FilterDimensions.status'),
          value: 'status',
          placeholder: 'Status',
          tag: true
        },
        {
          id: 3,
          label: this.$t('Issue.FilterDimensions.tracker'),
          value: 'tracker',
          placeholder: 'Type',
          tag: true
        },
        {
          id: 4,
          label: this.$t('Issue.FilterDimensions.assigned'),
          value: 'assigned',
          placeholder: 'Member'
        },
        {
          id: 5,
          label: this.$t('Issue.FilterDimensions.version'),
          value: 'version',
          placeholder: 'Version'
        },
        {
          id: 6,
          label: this.$t('Issue.FilterDimensions.priority'),
          value: 'priority',
          placeholder: 'Priority',
          tag: true
        }
      ]),
      isTable: true
    }
  },
  computed: {
    contextOptions() {
      const result = {}
      const getOptions = ['assigned', 'version', 'tags']
      getOptions.forEach((item) => {
        result[item] = this[item]
      })
      return result
    }
  },
  methods: {
    onContextMenu({ row, column, event }) {
      this.handleContextMenu(row, column, event)
    },
    handleContextMenu(row, column, event) {
      this.isTable = column !== ''
      event.preventDefault()
      const eventX = event.pageX
      const eventY = event.pageY
      this.$refs.contextmenu.$refs.contextmenu.show()
      this.$nextTick(() => {
        const contextmenuPosition = {
          top: eventY,
          left: eventX
        }
        const contextmenuWidth =
          this.$refs.contextmenu.$refs.contextmenu.$el.clientWidth
        const contextmenuHeight =
          this.$refs.contextmenu.$refs.contextmenu.$el.clientHeight
        if (contextmenuWidth <= 50 && contextmenuHeight <= 50) {
          this.handleContextMenu(row, column, event)
        }
        if (contextmenuHeight + eventY >= window.innerHeight) {
          contextmenuPosition.top -= contextmenuHeight
        }
        if (contextmenuWidth + eventX >= window.innerWidth) {
          contextmenuPosition.left -= contextmenuWidth
        }
        this.contextMenu.top = contextmenuPosition.top
        this.contextMenu.left = contextmenuPosition.left
        this.contextMenu.row = row
        this.contextMenu.visible = true
        this.$refs.contextmenu.$refs.contextmenu.style = {
          top: this.contextMenu.top + 'px',
          left: this.contextMenu.left + 'px'
        }
        document.addEventListener('click', this.hideContextMenu)
      })
    },
    hideContextMenu() {
      this.contextMenu.visible = false
      document.removeEventListener('click', this.hideContextMenu)
    },
    async getContextRow(issueId) {
      const issue = await getIssueDetails(issueId)
      this.$nextTick(() => {
        this.contextMenu.row = issue.data
      })
    }
  }
}
