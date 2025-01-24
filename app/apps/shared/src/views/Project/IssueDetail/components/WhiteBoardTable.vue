<template>
  <div>
    <el-table v-loading="listLoading" :data="excalidrawData" fit>
      <el-table-column
        :label="$t('general.Index')"
        align="center"
        type="index"
        width="100"
      />
      <el-table-column
        :label="$t('Plugins.excalidraw.Name')"
        align="center"
        prop="name"
      >
        <template slot-scope="scope">
          <el-link
            slot="reference"
            style="font-size: 16px"
            type="primary"
            @click="handleEdit(scope.row)"
          >
            {{ scope.row.name }}
          </el-link>
          <ShareButton
            :assigned-to="assigned_to"
            :row="row"
            @loadData="row = scope.row"
          />
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Issue.project')"
        align="center"
        prop="project.display_name"
      />
      <el-table-column
        :label="$t('general.Creator')"
        align="center"
        prop="operator.name"
      />
      <el-table-column
        :label="$t('general.Actions')"
        align="center"
        width="240"
      >
        <template slot-scope="scope">
          <el-popconfirm
            :cancel-button-text="$t('general.Cancel')"
            :confirm-button-text="$t('Issue.Unlink')"
            :title="$t('Notify.confirmUnlink')"
            icon="el-icon-info"
            popper-class="warning"
            @confirm="handleUnlink(scope.row)"
          >
            <el-tooltip
              slot="reference"
              :content="$t('Issue.Unlink')"
              effect="dark"
              placement="bottom"
            >
              <em class="ri-link-unlink-m warning table-button"></em>
            </el-tooltip>
          </el-popconfirm>
          <el-popconfirm
            :cancel-button-text="$t('general.Cancel')"
            :confirm-button-text="$t('general.Delete')"
            :title="$t('Notify.confirmDelete')"
            icon="el-icon-info"
            popper-class="danger"
            @confirm="handleDelete(scope.row)"
          >
            <el-tooltip
              slot="reference"
              :content="$t('general.Delete')"
              effect="dark"
              placement="bottom"
            >
              <em class="ri-delete-bin-2-line danger table-button"></em>
            </el-tooltip>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getProjectAssignable } from '@/api/projects'
import { deleteExcalidraw, updateExcalidraw } from '@/api_v2/excalidraw'
import ShareButton from '@/views/WhiteBoard/components/ShareButton'
import { mapGetters } from 'vuex'

export default {
  name: 'WhiteBoardTable',
  components: { ShareButton },
  props: {
    issueId: {
      type: Number,
      default: 0
    },
    excalidrawData: {
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
      listLoading: false,
      row: {},
      assigned_to: []
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId'])
  },
  mounted() {
    this.getAssignedTo()
  },
  methods: {
    async getAssignedTo() {
      this.assigned_to = (
        await getProjectAssignable(this.selectedProjectId)
      ).data.user_list
    },
    handleEdit(row) {
      this.$router.push({
        name: 'Excalidraw',
        params: {
          projectName: row.project.name,
          excalidrawId: row.id
        },
        query: { prev_page: this.$route }
      })
    },
    async handleUnlink(row) {
      this.listLoading = true
      try {
        const sendData = new FormData()
        sendData.append('name', row.name)
        sendData.append(
          'issue_ids',
          row.issue_ids.filter((item) => {
            return item !== this.issueId
          })
        )
        await updateExcalidraw(row.id, sendData)
        const message = this.$t('Notify.Updated')
        this.showSuccessMessage(message)
        this.$emit('update')
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    async handleDelete(row) {
      this.listLoading = true
      try {
        await deleteExcalidraw(row.id)
        const message = this.$t('Notify.Deleted')
        this.showSuccessMessage(message)
        this.$emit('update')
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    }
  }
}
</script>
