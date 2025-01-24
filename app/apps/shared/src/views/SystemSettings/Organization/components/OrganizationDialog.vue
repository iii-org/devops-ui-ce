<template>
  <el-dialog
    :before-close="handleClose"
    :title="dialogTitle"
    :top="edit ? '3vh' : '20vh'"
    :visible.sync="dialogVisible"
    :width="edit || isMobile ? '90%' : '40%'"
    append-to-body
    destroy-on-close
  >
    <el-form ref="form" :model="form" :rules="rules">
      <el-row :gutter="20">
        <el-col :md="edit ? 12 : 24" :sm="24">
          <el-form-item
            :label="$t('Organization.Identifier')"
            prop="identifier"
          >
            <el-input
              v-model="form.identifier"
              :disabled="edit"
              :placeholder="$t('Organization.Identifier')"
            />
          </el-form-item>
          <el-form-item :label="$t('Organization.Name')" prop="name">
            <el-input
              v-model="form.name"
              :placeholder="$t('Organization.Name')"
            />
          </el-form-item>
          <!--          <el-form-item-->
          <!--            v-if="edit"-->
          <!--            :label="$t('Organization.Owner')"-->
          <!--            prop="owner"-->
          <!--          >-->
          <!--            <el-select-->
          <!--              v-model="form.owner"-->
          <!--              :loading="userLoading"-->
          <!--              :placeholder="$t('Organization.Owner')"-->
          <!--              :remote-method="searchUser"-->
          <!--              class="w-full"-->
          <!--              filterable-->
          <!--              remote-->
          <!--              reserve-keyword-->
          <!--            >-->
          <!--              <el-option-->
          <!--                v-for="item in userList"-->
          <!--                :key="item.id"-->
          <!--                :label="item.full_name"-->
          <!--                :value="item.id"-->
          <!--              >-->
          <!--                <div>-->
          <!--                  <span>{{ item.full_name }}</span>-->
          <!--                  <span style="float: right; color: #8492a6; font-size: 13px">{{-->
          <!--                    item.username-->
          <!--                  }}</span>-->
          <!--                </div>-->
          <!--              </el-option>-->
          <!--            </el-select>-->
          <!--          </el-form-item>-->
        </el-col>
        <el-col :md="edit ? 12 : 24" :sm="24" class="h-full">
          <el-form-item
            :label="$t('Organization.Description')"
            class="h-full"
            prop="description"
          >
            <el-input
              v-model="form.description"
              :class="{ edit: edit }"
              :placeholder="$t('Organization.Description')"
              type="textarea"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-collapse v-if="edit" accordion @change="handleOrgMember">
      <el-collapse-item name="1">
        <template slot="title">
          <span class="font-bold">{{ $t('Organization.Member') }}</span>
        </template>
        <div class="user-table" shadow="never">
          <UserList ref="userList" />
        </div>
      </el-collapse-item>
    </el-collapse>
    <template slot="footer">
      <el-button @click="handleClose">
        {{ $t('general.Cancel') }}
      </el-button>
      <el-button :loading="isLoading" type="primary" @click="handleSubmit">
        {{ $t('general.Save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { getUserList } from '@/api_v3/user'
import { createOrganization, updateOrganization } from '@/api_v3/organizations'
import { mapGetters } from 'vuex'

const defaultForm = () => {
  return {
    name: '',
    // owner: '',
    identifier: '',
    description: ''
  }
}
export default {
  name: 'OrganizationDialog',
  components: {
    UserList: () => import('@/views/SystemSettings/AccountManage')
  },
  props: {
    organizationList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      isLoading: false,
      dialogVisible: false,
      userLoading: false,
      form: defaultForm(),
      edit: false,
      userList: [],
      params: {
        page: 1,
        limit: 5,
        search: ''
      }
    }
  },
  computed: {
    ...mapGetters(['device']),
    isMobile() {
      return this.device === 'mobile'
    },
    dialogTitle() {
      return this.edit
        ? this.$t('Organization.Edit')
        : this.$t('Organization.Add')
    },
    orgIdentifiers() {
      return this.organizationList.map((org) => org.identifier)
    },
    rules() {
      return {
        name: [
          {
            required: true,
            message: this.$t('Organization.PleaseInputOrganizationName'),
            trigger: 'blur'
          }
        ],
        identifier: [
          {
            required: true,
            message: this.$t('Organization.PleaseInputIdentifier'),
            trigger: 'blur'
          },
          {
            pattern: /^(?!\-)(?!.*\-$)(?!\d+$)[A-Za-z0-9-]{2,30}$/,
            message: this.$t('Organization.IdentifierRule'),
            trigger: 'blur'
          },
          {
            validator: this.validateIdentifier,
            trigger: 'blur'
          }
        ]
      }
    }
  },
  watch: {
    dialogVisible(val) {
      if (val) {
        this.fetchUserList()
      }
    },
    'form.identifier'(val, oldVal) {
      if (this.form.name === oldVal) {
        this.form.name = val
      }
    }
  },
  methods: {
    async fetchUserList() {
      this.userLoading = true
      await getUserList(this.params).then((res) => {
        this.userList = res.data.items
      })
      this.userLoading = false
    },
    async searchUser(query) {
      this.loading = true
      this.params.search = query
      await this.fetchUserList()
      this.loading = false
    },
    async validateIdentifier(rule, value, callback) {
      if (this.edit) {
        callback()
        return
      }
      const isExist = this.orgIdentifiers.includes(value)
      if (isExist) {
        callback(new Error(`${value} already exists`))
      } else {
        callback()
      }
    },
    handleOrgMember() {
      this.$refs.userList.$refs.searchFilter.filterValue.organization_id =
        this.form.id
      this.$refs.userList.$refs.searchFilter.isDisableOrg = true
      this.$refs.userList.params.limit = 5
      this.$refs.userList.userDialogOptions.isDisableOrg = true
    },
    handleClose() {
      this.dialogVisible = false
      this.$refs.form.resetFields()
      this.$refs.form.clearValidate()
      this.form = defaultForm()
      this.edit = false
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          this.isLoading = true
          const API = this.edit
            ? updateOrganization(this.form.id, this.form)
            : createOrganization(this.form)
          await API.then(() => {
            this.$emit('loadData')
            this.isLoading = false
            this.handleClose()
          }).catch(() => {
            this.isLoading = false
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.user-table {
  box-shadow: rgba(0, 0, 0, 0.08) 0px 2px 6px 0px inset;
  padding: 12px;
  border-radius: 10px;
}

.edit {
  ::v-deep .el-textarea__inner {
    min-height: 142px !important;
  }
}
</style>
