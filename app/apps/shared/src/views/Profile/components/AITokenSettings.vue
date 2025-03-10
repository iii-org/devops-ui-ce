<template>
  <div class="m-5">
    <div class="flex justify-between">
      <div>
        <h4 class="text-lg font-bold">
          {{ $t('AISettings.AITokenSettings') }}
        </h4>
        <el-button
          v-if="backToOverview"
          class="pt-0"
          icon="ri-arrow-left-line"
          size="small"
          type="text"
          @click="goToOverview"
        >
          {{ $t('AISettings.BackToProjectSettings') }}
        </el-button>
      </div>
      <el-button
        class="mb-5"
        icon="el-icon-plus"
        type="primary"
        @click="handleAddToken"
      >
        {{ $t('AISettings.NewAIToken') }}
      </el-button>
    </div>
    <el-form
      v-if="formData.data.length"
      ref="form"
      :model="formData"
      label-position="top"
      size="medium"
    >
      <el-row
        v-for="(item, index) in formData.data"
        :key="index"
        :class="{
          'border-form': index !== 0,
          'bg-blue-50/50': !item.id
        }"
        :gutter="10"
        class="px-2 rounded"
      >
        <el-col :lg="6" :md="6" :sm="24">
          <el-form-item
            :label="$t('AISettings.TokenIdentifier')"
            :prop="`data.${index}.name`"
            :rules="[
              {
                required: true,
                message: $t('AISettings.Required'),
                trigger: 'blur'
              },
              { validator: validateIdentifier, trigger: 'blur' }
            ]"
          >
            <el-input
              v-model="item.name"
              :placeholder="$t('AISettings.TokenIdentifier')"
              class="w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="6" :md="6" :sm="24">
          <el-form-item
            :label="$t('AISettings.AIProvider')"
            :prop="`data.${index}.provider`"
            :rules="[
              {
                required: !item.id,
                message: $t('AISettings.Required'),
                trigger: 'blur'
              }
            ]"
          >
            <el-select
              v-model="item.provider"
              :disabled="!!item.id"
              :placeholder="$t('AISettings.AIProvider')"
              class="w-full"
            >
              <template #prefix>
                <em
                  :class="`ri-${item.provider}-fill text-gray-800 text-[21px]`"
                ></em>
              </template>
              <el-option
                v-for="provider in providersData"
                :key="provider"
                :label="formatProviderName(provider)"
                :value="provider"
              >
                <em :class="`ri-${provider}-fill mr-1`"></em>
                {{ formatProviderName(provider) }}
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :lg="9" :md="6" :sm="24">
          <el-form-item
            :label="$t('AISettings.Token')"
            :prop="`data.${index}.token`"
            :rules="[
              {
                required: !item.id,
                message: $t('AISettings.Required'),
                trigger: 'blur'
              }
            ]"
          >
            <el-input
              v-model="item.token"
              :disabled="!!item.id"
              :placeholder="$t('AISettings.Token')"
              class="w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :lg="3" :md="6" :sm="24">
          <el-form-item class="actions">
            <template #label>
              <div style="color: transparent">Actions</div>
            </template>
            <div class="flex">
              <el-tooltip
                :content="$t('general.Save')"
                effect="dark"
                placement="top"
              >
                <el-button
                  class="p-0 px-2"
                  plain
                  type="primary"
                  @click="handleSave(item)"
                >
                  <em class="ri-save-fill text-lg"></em>
                </el-button>
              </el-tooltip>
              <el-tooltip
                :content="item.id ? $t('general.Delete') : $t('general.Cancel')"
                effect="dark"
                placement="top"
              >
                <el-button
                  class="p-[3px] px-2"
                  plain
                  type="danger"
                  @click="handleDeleteToken(index, item)"
                >
                  <em
                    :class="
                      item.id ? 'ri-delete-bin-2-fill' : 'ri-close-circle-fill'
                    "
                    class="text-lg"
                  ></em>
                </el-button>
              </el-tooltip>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-empty v-else />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  createAiToken,
  deleteAiToken,
  getListUserTokens,
  updateAiToken
} from '@/api_v3/aiToken'

export default {
  name: 'AITokenSettings',
  props: {
    backToOverview: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedProvider: '',
      enabled: false,
      formData: { data: [] },
      providersData: ['anthropic', 'openai']
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'userId'])
  },
  mounted() {
    this.fetchUserTokens()
  },
  methods: {
    async fetchUserTokens() {
      await getListUserTokens().then((res) => {
        this.formData.data = res.data.map((item) => ({
          ...item,
          token:
            '******************************************************************'
        }))
      })
    },
    handleAddToken() {
      this.formData.data.push({
        name: '',
        provider: '',
        token: ''
      })
    },
    async handleSave(item) {
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          if (!item.id) {
            await createAiToken({
              ...item,
              project_id: this.selectedProject.id
            }).then(() => {
              this.fetchUserTokens()
            })
          } else {
            await updateAiToken(item.id, {
              name: item.name
            }).then(() => {
              this.fetchUserTokens()
            })
          }
        }
      })
    },
    async handleDeleteToken(index, item) {
      if (item.id) {
        await deleteAiToken(item.id).then(() => {
          this.fetchUserTokens()
        })
      } else {
        this.formData.data.splice(index, 1)
      }
    },
    formatProviderName(name) {
      return name.charAt(0).toUpperCase() + name.slice(1)
    },
    getProviderIcon(name) {
      return name === 'anthropic' ? 'ri-anthropic-fill' : 'ri-openai-fill'
    },
    validateIdentifier(rule, value, callback) {
      const exists = this.formData.data.find(
        (item, idx) =>
          item.name === value && idx !== Number(rule.field.split('.')[1])
      )
      if (exists) {
        callback(new Error(this.$t('AISettings.TokenIdentifierExistsWarning')))
      } else {
        callback()
      }
    },
    goToOverview() {
      this.$router.push({
        name: 'Overview',
        params: { settings: true, tab: 'aiTokenSettings' }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.border-form {
  border-top: 1px solid #ebeef5;
}

@media screen and (max-width: 992px) {
  .actions {
    ::v-deep label {
      display: none !important;
    }
  }
}
</style>
