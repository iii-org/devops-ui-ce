<template>
  <el-table-column v-bind="$props">
    <template slot-scope="{ row, $index }">
      <template v-if="row.create">
        <el-select
          v-model="row[propKey]['id']"
          @keyup.enter.native="handlerCreate(row, $index)"
          @keyup.esc.native="handlerResetCreate(row, $index)"
        >
          <el-option
            v-for="item in createDynamicOptions"
            :key="item.username ? item.username : item.id"
            :class="item.class"
            :disabled="
              item.status &&
                !(item.status === 'open' || item.status === 'enable')
            "
            :label="
              $te(`Issue.${item.name}`) ? $t(`Issue.${item.name}`) : item.name
            "
            :value="item.id"
          >
            <template v-if="components">
              <component
                :is="components"
                :name="$t(`Issue.${item.name}`)"
                :type="item.name"
              />
            </template>
            <template v-else>
              {{ item.name }}
            </template>
          </el-option>
        </el-select>
      </template>
      <template
        v-else-if="
          row.editColumn === propKey && row.id === editRowId && editable(row)
        "
      >
        <el-select
          :ref="`${propKey}_${row.id}`"
          v-model="row[propKey]['id']"
          automatic-dropdown
          @blur="handleBlur(row, $index)"
          @change="handleEdit(row, $index)"
          @keyup.enter.native="handleEdit(row, $index)"
          @keyup.esc.native="handleReset(row, $index)"
        >
          <el-option
            v-for="item in editDynamicOptions"
            :key="item.username ? item.username : item.id"
            :class="item.class"
            :disabled="
              item.status &&
                !(item.status === 'open' || item.status === 'enable')
            "
            :label="
              $te(`Issue.${item.name}`) ? $t(`Issue.${item.name}`) : item.name
            "
            :value="item.id"
          >
            <template v-if="components">
              <component
                :is="components"
                :name="$t(`Issue.${item.name}`)"
                :type="item.name"
              />
              {{ item.message }}
            </template>
            <template v-else>
              {{
                $te(`Issue.${item.name}`) ? $t(`Issue.${item.name}`) : item.name
              }}
            </template>
          </el-option>
        </el-select>
      </template>
      <template v-else>
        <template v-if="components">
          <component
            :is="components"
            :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'"
            :name="$t(`Issue.${row[propKey]?.name || row[propKey]?.full_name}`)"
            :type="row[propKey]?.name"
          />
        </template>
        <template v-else>
          <div
            v-if="row[propKey]?.name || row[propKey]?.full_name"
            :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'"
            class="w-full"
          >
            {{ row[propKey]?.name || row[propKey]?.full_name }}
          </div>
          <div
            v-else
            :class="editable(row) ? 'cursor-pointer' : 'cursor-not-allowed'"
            class="w-full"
          >
            -
          </div>
        </template>
      </template>
    </template>
    <SubIssueDialog
      :is-issue-dialog.sync="isCloseIssueDialog"
      :issue="editedRow"
      @handleCancel="handleReset(editedRow, editedArrayId)"
      @handleClose="handleEdit(editedRow, editedArrayId, false, true)"
    />
    <el-dialog
      :title="$t('Issue.IssueNeedAssigneeWarning')"
      :visible.sync="isAssignDialog"
      append-to-body
      destroy-on-close
      width="30%"
      @close="handleReset(editedRow, editedArrayId)"
    >
      <el-select
        v-model="assigned_id"
        :placeholder="$t('RuleMsg.PleaseSelect')"
        clearable
        filterable
        style="width: 100%"
        @change="handleEdit(editedRow, editedArrayId, false, false, true)"
      >
        <el-option
          v-for="item in assignedOptions"
          :key="item.username"
          :class="item.class"
          :label="item.name + ' (' + item.username + ')'"
          :value="item.id"
        >
          {{ item.name }} ({{ item.username }})
        </el-option>
      </el-select>
    </el-dialog>
  </el-table-column>
</template>

<script>
import i18n from '@/lang'
import { checkIssueClosable } from '@/api_v3/issues'
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
    },
    editRowVersions: {
      type: Array,
      default: () => []
    },
    editRowAssignedTo: {
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
      assigned_id: ''
    }
  },
  computed: {
    editDynamicOptions() {
      if (this.propKey === 'status') {
        return this.dynamicStatusList
        // } else if (this.propKey === 'tracker' && this.isParentExist === false) {
        //   return this.strictOptions
      } else if (this.propKey === 'version') {
        return this.editRowVersions
      } else if (this.propKey === 'assigned') {
        return this.editRowAssignedTo
      } else {
        return this.options
      }
    },
    createDynamicOptions() {
      // return this.propKey === 'tracker' && this.isParentExist === false
      //   ? this.strictOptions
      //   : this.options
      return this.options
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
      const data = {
        value: { [`${this.propKey}_id`]: row[this.propKey]['id'] },
        row,
        index,
        treeNode
      }
      if (this.propKey === 'status') {
        this.editedRow = row
        this.editedArrayId = index
        if (row[this.propKey]['id'] === 6 && !forceClose) {
          this.isCloseIssueDialog = true
          return
        } else if (forceClose) {
          data.value['close_all'] = true
        } else if (
          row[this.propKey]['id'] === 1 &&
          row.assigned.id &&
          row.assigned.id !== '' &&
          row.assigned.id !== 'null'
        ) {
          const confirm = await this.$confirm(
            this.$t('Issue.IssueHasAssigneeWarning'),
            this.$t('general.Warning'),
            {
              confirmButtonText: this.$t('general.Confirm'),
              cancelButtonText: this.$t('general.Cancel'),
              type: 'warning'
            }
          )
            .then(() => {
              data.value['assigned_id'] = ''
              return true
            })
            .catch(() => {
              this.handleReset(this.editedRow, this.editedArrayId)
              return false
            })
          if (!confirm) return
        } else if (
          row[this.propKey]['id'] > 1 &&
          row[this.propKey]['id'] !== 6 &&
          (!row.assigned.id ||
            row.assigned.id === '' ||
            row.assigned.id === 'null') &&
          !forceAssign
        ) {
          this.isAssignDialog = true
          return
        } else if (forceAssign) {
          data.value['assigned_id'] = this.assigned_id
          this.isAssignDialog = false
        }
      } else if (this.propKey === 'assigned') {
        if (
          row.status.id === 1 &&
          row[this.propKey]['id'] !== '' &&
          row[this.propKey]['id'] !== 'null'
        ) {
          data.value['status_id'] = 2
        } else if (
          (row[this.propKey]['id'] === '' ||
            row[this.propKey]['id'] === 'null') &&
          row.status.id > 1 &&
          row.status.id !== 6
        ) {
          data.value['status_id'] = 1
        }
      }
      this.assigned_id = ''
      this.$emit('edit', data)
    },
    handlerCreate(row, index, treeNode) {
      this.$emit('create', {
        value: { [`${this.propKey}_id`]: row[this.propKey]['id'] },
        row,
        index,
        treeNode
      })
    },
    handleReset(row, index, treeNode) {
      this.$emit('reset-edit', { value: this.propKey, row, index, treeNode })
    },
    handlerResetCreate(row, index, treeNode) {
      this.$emit('reset-create', { value: this.propKey, row, index, treeNode })
    },
    handleBlur(row, index) {
      const checkUpdate =
        JSON.stringify(row[this.propKey]) !== JSON.stringify(row.originColumn)
      if (checkUpdate) {
        this.handleEdit(row, index)
      } else if (row.originColumn) {
        this.handleReset(row, index)
      }
    },
    async getClosable(id) {
      let result = true
      try {
        const checkClosable = await checkIssueClosable(id)
        result = checkClosable.data
      } catch (e) {
        // log
      }
      await this.getDynamicStatusList(result)
    },
    getDynamicStatusList(value) {
      const deepStatus = cloneDeep(this.options)
      this.$set(
        this.$data,
        'dynamicStatusList',
        deepStatus.map((item) => {
          if (!value && item.is_closed) {
            item.status = true
            item.message = '(' + this.$t('Issue.ChildrenNotClosed') + ')'
          }
          return item
        })
      )
    }
  }
}
</script>
