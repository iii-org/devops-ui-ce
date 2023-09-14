<template>
  <div>
    <el-table
      v-loading="listLoading"
      :data="excalidrawData"
      fit
    >
      <el-table-column
        :label="$t('general.Index')"
        type="index"
        align="center"
        width="100"
      />
      <el-table-column
        :label="$t('Excalidraw.Name')"
        prop="name"
        align="center"
      >
        <template slot-scope="scope">
          <el-link
            slot="reference"
            type="primary"
            style="font-size: 16px"
            @click="handleEdit(scope.row)"
          >
            {{ scope.row.name }}
          </el-link>
          <ShareButton
            :row="row"
            :assigned-to="assigned_to"
            @loadData="row = scope.row"
          />
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('Issue.project')"
        prop="project.display"
        align="center"
      />
      <el-table-column
        :label="$t('general.Creator')"
        prop="operator.name"
        align="center"
      />
      <el-table-column
        :label="$t('general.Actions')"
        align="center"
        width="240"
      >
        <template slot-scope="scope">
          <el-popconfirm
            :title="$t('Notify.confirmUnlink')"
            :confirm-button-text="$t('Issue.Unlink')"
            :cancel-button-text="$t('general.Cancel')"
            popper-class="warning"
            icon="el-icon-info"
            @confirm="handleUnlink(scope.row)"
          >
            <el-tooltip
              slot="reference"
              :content="$t('Issue.Unlink')"
              effect="dark"
              placement="bottom"
            >
              <em class="ri-link-unlink-m warning table-button" />
            </el-tooltip>
          </el-popconfirm>
          <el-popconfirm
            :title="$t('Notify.confirmDelete')"
            :confirm-button-text="$t('general.Delete')"
            :cancel-button-text="$t('general.Cancel')"
            popper-class="danger"
            icon="el-icon-info"
            @confirm="handleDelete(scope.row)"
          >
            <el-tooltip
              slot="reference"
              :content="$t('general.Delete')"
              effect="dark"
              placement="bottom"
            >
              <em class="ri-delete-bin-2-line danger table-button" />
            </el-tooltip>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { updateExcalidraw, deleteExcalidraw } from '@/api_v2/excalidraw'
import { getProjectAssignable } from '@/api/projects'
import { ShareButton } from '@/views/WhiteBoard/components'

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
      this.assigned_to = (await getProjectAssignable(this.selectedProjectId)).data.user_list
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
        sendData.append('issue_ids', row.issue_ids.filter((item) => {
          return item !== this.issueId
        }))
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
