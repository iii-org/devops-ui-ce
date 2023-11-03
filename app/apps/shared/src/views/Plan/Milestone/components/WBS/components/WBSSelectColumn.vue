<template>
  <el-table-column v-bind="$props">
    <template slot-scope="{row, $index}">
      <template v-if="row.create">
        <el-select
          v-model="row[propKey]['id']"
          @keyup.enter.native="handlerCreate(row, $index)"
          @keyup.esc.native="handlerResetCreate(row, $index)"
        >
          <el-option
            v-for="item in createDynamicOptions"
            :key="item.login ? item.login : item.id"
            :value="item.id"
            :label="$te(`Issue.${item.name}`)?$t(`Issue.${item.name}`):item.name"
            :class="item.class"
            :disabled="item.status&&!(item.status==='open'||item.status==='enable')"
          >
            <template v-if="components">
              <component :is="components" :name="$t(`Issue.${item.name}`)" :type="item.name" />
            </template>
            <template v-else>
              {{ item.name }}
            </template>
          </el-option>
        </el-select>
      </template>
      <template v-else-if="row.editColumn===propKey&&row.id===editRowId&&editable(row)">
        <el-select
          v-model="row[propKey]['id']"
          @change="handleEdit(row, $index)"
          @keyup.enter.native="handleEdit(row, $index)"
          @keyup.esc.native="handleReset(row, $index)"
        >
          <el-option
            v-for="item in editDynamicOptions"
            :key="(item.login) ? item.login : item.id"
            :value="item.id"
            :label="$te(`Issue.${item.name}`)?$t(`Issue.${item.name}`):item.name"
            :class="item.class"
            :disabled="item.status&&!(item.status==='open'||item.status==='enable')"
          >
            <template v-if="components">
              <component :is="components" :name="$t(`Issue.${item.name}`)" :type="item.name" /> {{ item.message }}
            </template>
            <template v-else>
              {{ item.name }}
            </template>
          </el-option>
        </el-select>
      </template>
      <template v-else>
        <template v-if="components">
          <component
            :is="components"
            :name="$t(`Issue.${row[propKey].name}`)"
            :type="row[propKey].name"
            :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'"
          />
        </template>
        <template v-else>
          <div v-if="row[propKey].name" :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'">
            {{ row[propKey].name }}
          </div>
          <div
            v-else
            :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'"
          >
            -
          </div>
        </template>
      </template>
    </template>
    <SubIssueDialog
      :is-issue-dialog.sync="isCloseIssueDialog"
      :issue="editedRow"
      @handleClose="handleEdit(editedRow, editedArrayId, false, true)"
      @handleCancel="handleReset(editedRow, editedArrayId)"
    />
    <el-dialog
      :visible.sync="isAssignDialog"
      append-to-body
      destroy-on-close
      width="30%"
      :title="$t('Issue.IssueNeedAssigneeWarning')"
      @close="handleReset(editedRow, editedArrayId)"
    >
      <el-select
        v-model="assigned_to_id"
        style="width: 100%"
        clearable
        :placeholder="$t('RuleMsg.PleaseSelect')"
        filterable
        @change="handleEdit(editedRow, editedArrayId, false, false, true)"
      >
        <el-option
          v-for="item in assignedOptions"
          :key="item.login"
          :class="item.class"
          :label="item.name+' ('+item.login+')'"
          :value="item.id"
        >
          {{ item.name }} ({{ item.login }})
        </el-option>
      </el-select>
    </el-dialog>
  </el-table-column>
</template>

<script>
import i18n from '@/lang'
import { getCheckIssueClosable } from '@/api/issue'
import { cloneDeep } from 'lodash'
import SubIssueDialog from '@shared/views/Project/IssueDetail/components/SubIssueDialog'

export default {
  name: 'WBSSelectColumn',
  components: { SubIssueDialog },
  props: {
    prop: {
      type: String,
      required: true
    },
    propKey: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: i18n.t('general.LastUpdateTime')
    },
    minWidth: {
      type: String,
      default: null
    },
    width: {
      type: String,
      default: null
    },
    sortable: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default: () => []
    },
    strictOptions: {
      type: Array,
      default: () => []
    },
    isParentExist: {
      type: Boolean,
      default: false
    },
    components: {
      type: Object,
      default: () => {}
    },
    required: {
      type: Boolean,
      default: false
    },
    hasChildEdit: {
      type: Boolean,
      default: false
    },
    showOverflowTooltip: {
      type: Boolean,
      default: false
    },
    editRowId: {
      type: [String, Number],
      default: null
    },
    assignedTo: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      dynamicStatusList: this.options,
      isCloseIssueDialog: false,
      editedRow: {},
      editedArrayId: null,
      isAssignDialog: false,
      assigned_to_id: ''
    }
  },
  computed: {
    editDynamicOptions() {
      if (this.propKey === 'status') {
        return this.dynamicStatusList
      } else if (this.propKey === 'tracker' && this.isParentExist === false) {
        return this.strictOptions
      } else {
        return this.options
      }
    },
    createDynamicOptions() {
      return (this.propKey === 'tracker' && this.isParentExist === false) ? this.strictOptions : this.options
    },
    assignedOptions() {
      return this.assignedTo.filter((item) => item.id !== 'null')
    }
  },
  methods: {
    hasRequired(row) {
      return this.required && row[this.propKey].length <= 0
    },
    editable(row) {
      if (this.hasChildEdit) {
        return true
      } else {
        return !row['has_children']
      }
    },
    async handleEdit(row, index, treeNode, forceClose, forceAssign) {
      const data = { value: { [`${this.propKey}_id`]: row[this.propKey]['id'] }, row, index, treeNode }
      if (this.propKey === 'status') {
        this.editedRow = row
        this.editedArrayId = index
        if (row[this.propKey]['id'] === 6 && !forceClose) {
          this.isCloseIssueDialog = true
          return
        } else if (forceClose) {
          data.value['close_all'] = true
        } else if (row[this.propKey]['id'] === 1 && row.assigned_to.id && row.assigned_to.id !== '' && row.assigned_to.id !== 'null') {
          const confirm = await this.$confirm(this.$t('Issue.IssueHasAssigneeWarning'), this.$t('general.Warning'), {
            confirmButtonText: this.$t('general.Confirm'),
            cancelButtonText: this.$t('general.Cancel'),
            type: 'warning'
          }).then(() => {
            data.value['assigned_to_id'] = ''
            return true
          }).catch(() => {
            this.handleReset(this.editedRow, this.editedArrayId)
            return false
          })
          if (!confirm) return
        } else if (row[this.propKey]['id'] > 1 &&
            row[this.propKey]['id'] !== 6 &&
            (!row.assigned_to.id || row.assigned_to.id === '' || row.assigned_to.id === 'null') &&
            !forceAssign
        ) {
          this.isAssignDialog = true
          return
        } else if (forceAssign) {
          data.value['assigned_to_id'] = this.assigned_to_id
          this.isAssignDialog = false
        }
      } else if (this.propKey === 'assigned_to') {
        if (row.status.id === 1 && (row[this.propKey]['id'] !== '' && row[this.propKey]['id'] !== 'null')) {
          data.value['status_id'] = 2
        } else if ((row[this.propKey]['id'] === '' || row[this.propKey]['id'] === 'null') && row.status.id > 1 && row.status.id !== 6) {
          data.value['status_id'] = 1
        }
      }
      this.$emit('edit', data)
    },
    handlerCreate(row, index, treeNode) {
      this.$emit('create', { value: { [`${this.propKey}_id`]: row[this.propKey]['id'] }, row, index, treeNode })
    },
    handleReset(row, index, treeNode) {
      this.$emit('reset-edit', { value: this.propKey, row, index, treeNode })
    },
    handlerResetCreate(row, index, treeNode) {
      this.$emit('reset-create', { value: this.propKey, row, index, treeNode })
    },
    async getClosable(id) {
      let result = true
      try {
        const checkClosable = await getCheckIssueClosable(id)
        result = checkClosable.data
      } catch (e) {
        // log
      }
      await this.getDynamicStatusList(result)
    },
    getDynamicStatusList(value) {
      const deepStatus = cloneDeep(this.options)
      this.$set(this.$data, 'dynamicStatusList', deepStatus.map((item) => {
        if ((!value) && item.is_closed) {
          item.status = true
          item.message = '(' + this.$t('Issue.ChildrenNotClosed') + ')'
        }
        return item
      }))
    }
  }
}
</script>
