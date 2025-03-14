<template>
  <el-form
    ref="form"
    :model="form"
    :rules="rules"
    class="custom-list"
    inline
    label-position="top"
  >
    <el-row>
      <el-col :sm="12" :xs="24">
        <el-form-item
          :label="$t('Plugins.excalidraw.Name')"
          prop="name"
          style="width: 100%"
        >
          <el-input
            v-model="form.name"
            :placeholder="
              $t('RuleMsg.PleaseInput') + $t('Plugins.excalidraw.Name')
            "
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :sm="12" :xs="24">
        <el-form-item :label="$t('Issue.RelatedIssue')" style="width: 100%">
          <el-select
            v-model="form.issue_ids"
            :loading="issueLoading"
            :placeholder="$t('Issue.SearchNameOrAssignee')"
            :remote-method="getIssue"
            clearable
            filterable
            multiple
            remote
            style="width: 100%"
            @focus="getIssue()"
          >
            <el-option-group
              v-for="group in issueList"
              :key="group.name"
              :label="group.name"
            >
              <template v-for="item in group.options">
                <el-option
                  :key="item.id"
                  :label="'#' + item.id + ' - ' + item.name"
                  :value="item.id"
                />
              </template>
            </el-option-group>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script>
import { getProjectIssueList } from '@/api_v3/projects'
import axios from 'axios'
import { mapGetters } from 'vuex'

export default {
  name: 'ExcalidrawForm',
  props: {
    form: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      issueLoading: false,
      issueList: [],
      rules: {
        name: [
          {
            required: true,
            trigger: 'blur',
            message: this.$t('RuleMsg.PleaseSelect') + this.$t('general.Name')
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId'])
  },
  mounted() {
    this.getIssue()
  },
  methods: {
    async getIssue(query) {
      const params = this.getSearchParams(query)
      const cancelToken = this.checkToken()
      await getProjectIssueList(this.selectedProjectId, params, {
        cancelToken
      }).then((res) => {
        this.issueList = this.getListLabels(res)
      })
      this.issueLoading = false
      this.cancelToken = null
    },
    getSearchParams(query) {
      const params = {
        selection: true,
        status_id: 'open'
      }
      if (query !== '' && query) {
        params['search'] = query
        this.issueQuery = query
        this.issueLoading = true
      } else {
        params['offset'] = 0
        params['limit'] = 5
        this.issueQuery = null
      }
      return params
    },
    getListLabels(res) {
      let queryList = res.data
      let key = 'Issue.Result'
      if (!this.issueQuery) {
        if (queryList && queryList.hasOwnProperty('items')) {
          queryList = res.data.items
        } else {
          queryList = []
        }
        key = 'Issue.LastResult'
      }
      return [{ name: this.$t(key), options: queryList }]
    },
    checkToken() {
      if (this.cancelToken) this.cancelToken.cancel()
      const CancelToken = axios.CancelToken.source()
      this.cancelToken = CancelToken
      return CancelToken.token
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-form-item__content {
  width: 80%;
}
</style>
