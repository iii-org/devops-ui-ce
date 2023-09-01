<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <el-input
          v-model="keyword"
          :placeholder="$t('general.SearchName')"
          :style="{ width: isMobile ? 'auto' : '200px' }"
          :size="isMobile ? 'small' : 'medium'"
          prefix-icon="el-icon-search"
        />
      </ProjectListSelector>
      <el-divider />
      <el-table-responsive
        v-loading="listLoading"
        :data="pagedData"
        :columns="tableColumns"
        :element-loading-text="$t('Loading')"
        fit
      >
        <template v-slot:containerName="{row}">
          <div
            v-for="(container, idx) in row.containers"
            :key="container + idx"
          >
            {{ container.name }}
          </div>
        </template>
        <template v-slot:containerImage="{row}">
          <div
            v-for="(container, idx) in row.containers"
            :key="container + idx"
          >
            {{ container.image }}
          </div>
        </template>
        <template v-slot:status="{row}">
          <el-progress
            :percentage="calcPercentage(row.available_pod_number, row.total_pod_number)"
            :status="format(row.available_pod_number, row.total_pod_number)"
          />
          <span>{{ `${row.available_pod_number} / ${row.total_pod_number}` }}</span>
        </template>
        <template v-slot:actions="{row}">
          <el-tooltip
            placement="bottom"
            :content="$t('general.Redeploy')"
          >
            <em
              class="el-icon-refresh active operate-button"
              @click="redeploy(row.name)"
            />
          </el-tooltip>
          <el-tooltip
            placement="bottom"
            :content="$t('general.Delete')"
          >
            <el-popconfirm
              :confirm-button-text="$t('general.Delete')"
              :cancel-button-text="$t('general.Cancel')"
              icon="el-icon-info"
              icon-color="red"
              :title="$t('Notify.confirmDelete')"
              @confirm="handleDelete(row.name)"
            >
              <em
                slot="reference"
                class="ri-delete-bin-2-line danger operate-button"
              />
            </el-popconfirm>
          </el-tooltip>
        </template>
      </el-table-responsive>
      <Pagination
        :total="filteredData.length"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :page-sizes="[listQuery.limit]"
        :layout="paginationLayout"
        :pager-count="isMobile ? 5 : 7"
        :small="isMobile"
        @pagination="onPagination"
      />
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { deleteDeployment, getDeploymentList, updateDeployment } from '@/api/kubernetes'
import { BasicData, SearchBar, Pagination, Table } from '@/mixins'
import { ElTableResponsive, ProjectListSelector } from '@/components'

export default {
  name: 'DeploymentList',
  components: { ProjectListSelector, ElTableResponsive },
  mixins: [BasicData, SearchBar, Pagination, Table],
  data() {
    return {
      btnLoading: false
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    paginationLayout() {
      return this.isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next'
    },
    tableColumns() {
      return [
        {
          label: this.$t('DeploymentList.DeployName'),
          align: 'center',
          prop: 'name',
          minWidth: 200
        },
        {
          label: this.$t('general.CreateTime'),
          align: 'center',
          prop: 'created_time',
          type: 'time'
        },
        {
          label: this.$t('DeploymentList.Container'),
          prop: 'container.name',
          align: 'center',
          minWidth: 200,
          slot: 'containerName'
        },
        {
          label: this.$t('DeploymentList.Image'),
          prop: 'containers.image',
          align: 'center',
          minWidth: 250,
          slot: 'containerImage'
        },
        {
          label: this.$t('general.Status'),
          align: 'center',
          width: 200,
          slot: 'status'
        },
        {
          label: this.$t('general.Actions'),
          align: 'center',
          width: 140,
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getDeploymentList(this.selectedProjectId)
      return res.data
    },
    async handleDelete(deploymentName) {
      this.listLoading = true
      try {
        await deleteDeployment(this.selectedProjectId, deploymentName)
        await this.loadData()
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async redeploy(deploymentName) {
      this.btnLoading = true
      try {
        await updateDeployment(this.selectedProjectId, deploymentName)
        await this.loadData()
      } catch (error) {
        console.error(error)
      }
      this.btnLoading = false
    },
    format(a, b) {
      return a / b === 1 ? 'success' : 'warning'
    },
    calcPercentage(a, b) {
      return (a / b) * 100
    }
  }
}
</script>
