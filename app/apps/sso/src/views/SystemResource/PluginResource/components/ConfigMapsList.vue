<template>
  <el-row class="app-container">
    <el-col>
      <ProjectListSelector>
        <el-button
          slot="returnButton"
          type="text"
          size="medium"
          icon="el-icon-arrow-left"
          class="text-title linkTextColor"
          @click="onBackClick"
        >
          {{ $t('general.Back') }}
        </el-button>
        <el-input
          v-model="keyword"
          :placeholder="$t('general.SearchName')"
          :style="{ width: isMobile ? 'auto' : '250px' }"
          :size="isMobile ? 'small' : 'medium'"
          prefix-icon="el-icon-search"
        />
      </ProjectListSelector>
      <el-divider />
      <ElTableResponsive
        v-loading="listLoading"
        :data="pagedData"
        :columns="tableColumns"
        :element-loading-text="$t('Loading')"
        fit
      >
        <template v-slot:name="{row}">
          <span :style="isMobile ? 'white-space: normal; text-align: right;' : ''">
            <div class="font-bold">{{ row.name }}</div>
            <div class="text-xs">
              Keys：<span v-for="(key, keyIdx) in row.keys" :key="keyIdx">
                {{ key }}
                <span v-if="keyIdx !== row.keys.length - 1">/</span>
              </span>
            </div>
          </span>
        </template>
        <template v-slot:actions="{row}">
          <el-tooltip
            placement="bottom"
            :content="$t('general.Detail')"
          >
            <em
              class="ri-file-list-2-line active operate-button"
              @click="showEditDialog(row.name, row.configMaps)"
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
              popper-class="danger"
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
      </ElTableResponsive>
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
      <el-dialog
        :title="`Config Map ${$t('general.Detail')} `"
        :visible.sync="editDialogVisible"
        :width="isMobile ? '95%' :'80%'"
        @close="closeEditDialog"
      >
        <div class="text-title">Config Map Name</div>
        <div>{{ configMapName }}</div>
        <el-row
          v-for="(configMap, configMapIdx) in configMapData"
          :key="configMap + configMapIdx"
          :gutter="12"
          class="mt-3"
        >
          <el-col :span="6" :xs="24">
            <div class="text-title">key {{ configMapIdx + 1 }}</div>
            <div>{{ configMapData[configMapIdx].key }}</div>
          </el-col>
          <el-col :span="18" :xs="24">
            <div class="text-title">value {{ configMapIdx + 1 }}</div>
            <div>{{ configMapData[configMapIdx].value }}</div>
          </el-col>
        </el-row>

        <span slot="footer" class="dialog-footer">
          <el-button class="buttonPrimary" @click="closeEditDialog">
            {{ $t('general.Close') }}
          </el-button>
        </span>
      </el-dialog>
    </el-col>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { deleteConfigmap, getConfigmapList } from '@/api/kubernetes'
import { BasicData, SearchBar, Pagination, Table } from '@/mixins'
import { ProjectListSelector, ElTableResponsive } from '@shared/components'

export default {
  name: 'ConfigMapsList',
  components: { ProjectListSelector, ElTableResponsive },
  mixins: [BasicData, SearchBar, Pagination, Table],
  data() {
    return {
      editDialogVisible: false,
      configMapName: '',
      configMapData: []
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
          label: this.$t('general.Name'),
          prop: 'name',
          headerAlign: 'center',
          slot: 'name'
        },
        {
          label: this.$t('general.Actions'),
          align: 'center',
          width: '80',
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    async fetchData() {
      const res = await getConfigmapList(this.selectedProjectId)
      return res.data.map(configMap => {
        if (configMap.data) {
          return {
            name: configMap.name,
            keys: Object.keys(configMap.data),
            configMaps: Object.entries(configMap.data).map(item => ({
              key: item[0],
              value: item[1]
            }))
          }
        } else {
          return {
            name: configMap.name,
            keys: '-'
          }
        }
      })
    },
    async handleDelete(configMapName) {
      this.listLoading = true
      try {
        await deleteConfigmap(this.selectedProjectId, configMapName)
        await this.loadData()
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    showEditDialog(configMapName, configMaps) {
      this.editDialogVisible = true
      this.configMapName = configMapName
      this.configMapData = configMaps.map(item => item)
    },
    closeEditDialog() {
      this.editDialogVisible = false
    },
    onBackClick() {
      this.$router.push({ name: 'PluginResourceParent' })
    }
  }
}
</script>
