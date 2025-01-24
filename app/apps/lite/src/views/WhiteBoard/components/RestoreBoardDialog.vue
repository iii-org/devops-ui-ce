<template>
  <el-dialog
    :before-close="onDialogClosed"
    :close-on-click-modal="false"
    :title="row.name + ' - ' + $t('Plugins.excalidraw.HistoricalRecord')"
    :visible.sync="dialogVisible"
    :width="isMobile ? '95%' : '50%'"
  >
    <el-table
      v-loading="listLoading"
      :data="listData"
      :element-loading-text="$t('Loading')"
      fit
    >
      <el-table-column
        :label="$t('general.Index')"
        align="center"
        type="index"
        width="100"
      />
      <el-table-column
        :label="$t('general.Updater')"
        align="center"
        prop="user_name"
      />
      <ElTableColumnTime
        :label="$t('Plugins.excalidraw.AutoSavedTime')"
        prop="updated_at"
      />
      <el-table-column
        :label="$t('Plugins.excalidraw.Size')"
        align="center"
        prop="size"
      >
        <template slot-scope="scope">
          {{ scope.row.size + 'k' }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('general.Actions')" align="center">
        <template slot-scope="scope">
          <el-button
            icon="el-icon-refresh-left"
            plain
            size="mini"
            type="success"
            @click="handleRestore(scope.row)"
          >
            {{ $t('general.Restore') }}
          </el-button>
        </template>
      </el-table-column>
      <template slot="empty">
        <el-empty :description="$t('general.NoData')" />
      </template>
    </el-table>
  </el-dialog>
</template>

<script>
import {
  getExcalidrawHistory,
  restoreExcalidrawHistory
} from '@/api_v2/excalidraw'
import BasicData from '@/mixins/BasicData'
import { mapGetters } from 'vuex'

export default {
  name: 'RestoreBoardDialog',
  components: {
    ElTableColumnTime: () => import('@shared/components/ElTableColumnTime')
  },
  mixins: [BasicData],
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    },
    row: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    }
  },
  methods: {
    async fetchData() {
      return (await getExcalidrawHistory(this.row.id)).data
    },
    async handleRestore(row) {
      this.$msgbox({
        title: this.$t('general.caution'),
        type: 'warning',
        message: this.$t('Notify.confirmRestore'),
        showCancelButton: true,
        confirmButtonText: this.$t('general.Confirm'),
        cancelButtonText: this.$t('general.Cancel')
      }).then(async () => {
        this.listLoading = true
        try {
          await restoreExcalidrawHistory(row.id)
          this.$message({
            title: this.$t('general.Success'),
            message: this.$t('Notify.Restored'),
            type: 'success'
          })
          this.listLoading = false
          this.$emit('update')
        } catch (error) {
          console.error(error)
          this.$emit('handleError')
        } finally {
          this.onDialogClosed()
        }
      })
    },
    onDialogClosed() {
      this.$emit('update:dialogVisible', false)
    }
  }
}
</script>
