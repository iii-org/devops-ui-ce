<template>
  <ElTableResponsive
    v-loading="isLoading||listLoading"
    :data="listData"
    :columns="tableColumns"
    :element-loading-text="$t('Loading')"
    :style="isMobile ? '' : 'margin: 0 auto; width: 90%;'"
    size="mini"
    fit
  >
    <template v-slot:status="{row}">
      <el-popover
        v-if="row.error_message"
        placement="bottom"
        width="300"
        trigger="hover"
        :content="row.error_message"
      >
        <em
          slot="reference"
          class="el-icon-error"
          :style="getStyle('danger')"
        />
      </el-popover>
      <template v-else>
        <template v-if="!row.disabled">
          <span class="text-sm">
            {{ row.status }}
          </span>
          <Status :id="row.status_id" />
        </template>
        <template v-else>
          {{ $t('Deploy.Stopped') }}
          <Status :id="0" />
        </template>
      </template>
    </template>
    <template v-slot:total_pods="{row}">
      <span v-if="row.deployment">
        <el-progress
          :percentage="calcPercentage(row.deployment)"
          :status="format(row.deployment)"
        />
        <span v-if="isPodNumberNotNull(row.deployment)">
          {{ row.deployment.available_pod_number }} / {{ row.deployment.total_pod_number }}
        </span>
      </span>
    </template>
    <template v-slot:actions="{row}">
      <el-dropdown
        v-if="row.status_id !== 9"
        split-button
        size="small"
        :type="row.disabled ? 'warning' : 'success'"
        @click="handleServiceStatus(row)"
      >
        <em :class="row.disabled| getActionIcon" />
        {{ getActionText(row.disabled) }}
        <el-dropdown-menu slot="dropdown">
          <template v-if="row.public_endpoint">
            <el-dropdown-item
              type="danger"
              icon="el-icon-copy-document"
              @click.native="copyUrl(row.public_endpoint)"
            >
              {{ $t('Deploy.CopyApplicationIP') }}
            </el-dropdown-item>
            <el-dropdown-item
              type="danger"
              icon="el-icon-link"
              @click.native="toEndpoint(row.public_endpoint)"
            >
              {{ $t('Deploy.LinkToApplication') }}
            </el-dropdown-item>
            <el-dropdown-item>
              <el-divider class="m-0" />
            </el-dropdown-item>
          </template>
          <el-dropdown-item
            size="mini"
            icon="el-icon-refresh-right"
            @click.native="handleRedeploy(row.id)"
          >
            {{ $t('Deploy.Redeploy') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </template>
  </ElTableResponsive>
</template>

<script>
import Status from './Status'
import {
  patchService,
  patchServiceRedeploy
} from '@/api/deploy'
import variables from '@/styles/theme/variables.scss'
import { mapGetters } from 'vuex'
import { ElTableResponsive } from '@shared/components'

export default {
  name: 'Applications',
  components: { Status, ElTableResponsive },
  filters: {
    getActionIcon(value) {
      return value ? 'el-icon-video-play' : 'el-icon-video-pause'
    }
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    listData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      listLoading: false
    }
  },
  computed: {
    ...mapGetters(['device']),
    isPodNumberNotNull() {
      return function(deployment) {
        const { available_pod_number, total_pod_number } = deployment
        return available_pod_number !== null && total_pod_number !== null
      }
    },
    format() {
      return function (deployment) {
        const { available_pod_number, total_pod_number } = deployment
        if (available_pod_number && total_pod_number) {
          return available_pod_number / total_pod_number === 1 ? 'success' : 'warning'
        }
      }
    },
    calcPercentage() {
      return function (deployment) {
        const { available_pod_number, total_pod_number } = deployment
        if (available_pod_number && total_pod_number) {
          return (available_pod_number / total_pod_number) * 100
        }
      }
    },
    isMobile() {
      return this.device === 'mobile'
    },
    tableColumns() {
      return [
        {
          label: this.$t('general.Index'),
          prop: 'index',
          minWidth: 80,
          align: 'center',
          type: 'index'
        },
        {
          prop: 'name',
          label: this.$t('Deploy.Name'),
          minWidth: 150,
          align: 'center'
        },
        {
          prop: 'status',
          label: this.$t('Deploy.Status'),
          minWidth: 150,
          align: 'center',
          slot: 'status'
        },
        {
          prop: 'total_pods',
          label: this.$t('Deploy.Pod'),
          minWidth: 150,
          align: 'center',
          slot: 'total_pods'
        },
        {
          label: this.$t('general.Actions'),
          prop: 'actions',
          minWidth: 240,
          align: 'center',
          slot: 'actions'
        }
      ]
    }
  },
  methods: {
    getStyle(colorCode) {
      const color = variables[`${colorCode}`]
      return { color }
    },
    getActionText(value) {
      return value ? this.$t('Deploy.Start') : this.$t('Deploy.Stop')
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        type: 'success',
        message
      })
    },
    async handleServiceStatus(row) {
      this.listLoading = true
      try {
        await patchService(row.id, { disabled: !row.disabled })
        this.showSuccessMessage(this.$t('Notify.Updated'))
      } catch (e) {
        console.error(e)
      }
      await this.$emit('loadData')
      this.listLoading = false
    },
    async handleRedeploy(id) {
      this.listLoading = true
      try {
        await patchServiceRedeploy(id)
        this.showSuccessMessage(this.$t('Notify.Updated'))
      } catch (e) {
        console.error(e)
      }
      await this.$emit('loadData')
      this.listLoading = false
    },
    toEndpoint(url) {
      window.open(url, '_blank')
    },
    copyUrl(text) {
      this.$copyText(text).then(() => {
        this.showSuccessMessage(this.$t('Notify.Copied'))
      })
    }
  }
}
</script>
