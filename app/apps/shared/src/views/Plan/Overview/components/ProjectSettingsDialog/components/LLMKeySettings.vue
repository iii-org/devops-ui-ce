<template>
  <div v-loading="isLoading">
    <div v-if="!isOwner" class="notification-danger">
      {{ $t('AISettings.NotOwnerWarning') }}
    </div>
    <div
      v-if="isOwner && Object.keys(userTokenList).length === 0"
      class="notification-warning"
    >
      <p>{{ $t('AISettings.NoTokenFoundWarning') }}</p>
      <el-button type="primary" @click="goToProfile">{{ $t('AISettings.CreateAIToken') }}
      </el-button>
    </div>
    <template v-else>
      <div class="flex justify-end items-center">
        <label class="mr-2">{{ $t('AISettings.EnableAI') }}</label>
        <el-switch
          v-model="enabled"
          :disabled="!isOwner"
          @change="handleEnable"
        />
      </div>
      <el-form
        v-if="enabled"
        ref="form"
        :disabled="!isOwner"
        :model="formData"
        label-position="top"
      >
        <!-- Provider Selector -->
        <el-form-item :label="$t('AISettings.AIProvider')">
          <el-select
            v-model="selectedProvider"
            :placeholder="$t('AISettings.AIProvider')"
            class="full-width"
          >
            <template #prefix>
              <em
                :class="`ri-${selectedProvider}-fill text-gray-800 text-[21px]`"
              ></em>
            </template>
            <el-option
              v-for="provider in providersData"
              :key="provider.name"
              :label="formatProviderName(provider.name)"
              :value="provider.name"
            >
              <em :class="`ri-${provider.name}-fill mr-1`"></em>
              {{ formatProviderName(provider.name) }}
            </el-option>
          </el-select>
        </el-form-item>
        <!-- Model Selection -->
        <el-form-item :label="$t('AISettings.AIModel')">
          <el-select
            v-model="formData.selectedModel"
            :placeholder="$t('AISettings.AIModel')"
            class="full-width"
          >
            <el-option
              v-for="model in currentProvider.models || []"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
        </el-form-item>
        <!-- Token Selection -->
        <el-form-item v-if="isOwner" :label="$t('AISettings.Token')">
          <el-select
            v-model="formData.token_id"
            :disabled="!userTokenList[selectedProvider]"
            :placeholder="$t('AISettings.Token')"
            class="full-width"
          >
            <el-option
              v-for="token in userTokenList[selectedProvider] || []"
              :key="token.id"
              :label="token.name"
              :value="token.id"
            />
          </el-select>
        </el-form-item>
        <div
          v-if="!userTokenList[selectedProvider] && isOwner"
          class="notification-danger"
        >
          {{
            $t('AISettings.NoProviderTokenWarning', {
              provider: formatProviderName(selectedProvider)
            })
          }}
          <el-button size="mini" type="text">
            {{ $t('AISettings.CreateAIToken') }}
          </el-button>
        </div>
        <el-form-item v-if="userTokenList[selectedProvider]">
          <el-button type="primary" @click="handleBindToken">
            {{ $t('general.Save') }}
          </el-button>
          <el-button
            v-if="
              enabled &&
                projectToken.token_id &&
                formData.token_id === projectToken.token_id
            "
            type="danger"
            @click="handleUnbind"
          >
            {{ $t('AISettings.Unbind') }}
          </el-button>
        </el-form-item>
      </el-form>
      <div v-else class="notification-warning">
        <p>{{ $t('AISettings.AIDisabled') }}</p>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  createProjectToken,
  deleteProjectToken,
  enableProjectToken,
  getListUserTokens,
  getProjectTokens
} from '@/api_v3/aiToken'

export default {
  name: 'LLMKeySettings',
  data() {
    return {
      selectedProvider: '',
      enabled: false,
      userTokenList: {},
      projectToken: {},
      isLoading: false,
      formData: {
        selectedModel: '',
        token_id: ''
      },
      providersData: [
        {
          name: 'anthropic',
          default: 'claude-3-5-sonnet-latest',
          models: [
            'claude-3-5-sonnet-latest',
            'claude-3-5-haiku-latest',
            'claude-3-opus-latest'
          ]
        },
        {
          name: 'openai',
          default: 'gpt-4o',
          models: [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-3.5-turbo',
            'o1'
          ]
        }
      ]
    }
  },

  computed: {
    ...mapGetters(['selectedProject', 'userId']),
    currentProvider() {
      return this.providersData.find((p) => p.name === this.selectedProvider)
    },
    isOwner() {
      return this.selectedProject.owner.id === this.userId
    }
  },
  watch: {
    selectedProvider: {
      handler(newProvider) {
        if (newProvider) {
          const provider = this.providersData.find(
            (p) => p.name === newProvider
          )
          if (provider) {
            this.formData.selectedModel =
              this.projectToken.model || provider.default
            this.formData.token_id =
              this.userTokenList[newProvider] &&
              this.userTokenList[newProvider][0]
                ? this.userTokenList[newProvider][0].id
                : ''
          }
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.fetchTokens()
  },
  methods: {
    async fetchTokens() {
      this.isLoading = true
      Promise.all([
        getListUserTokens(),
        getProjectTokens(this.selectedProject.id)
      ])
        .then(([userTokens, projectToken]) => {
          if (userTokens.data.length) {
            this.userTokenList = userTokens.data.reduce((acc, token) => {
              if (!acc[token.provider]) {
                acc[token.provider] = []
              }
              acc[token.provider].push(token)
              return acc
            }, {})
            this.providersData = this.providersData.filter((provider) =>
              Object.keys(this.userTokenList).includes(provider.name)
            )
          }
          if (projectToken.data.token_id) {
            this.enabled = true
            this.selectedProvider = this.providersData.find((p) =>
              p.models.includes(projectToken.data.model)
            ).name
            this.projectToken = projectToken.data
          }
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    async handleEnable() {
      if (this.enabled) {
        this.selectedProvider = this.providersData[0].name
      }
      setTimeout(async () => {
        if (!this.projectToken.token_id) {
          await this.handleBindToken(true)
        } else {
          this.isLoading = true
          await enableProjectToken(this.projectToken.token_id, {
            project_id: this.selectedProject.id,
            enabled: this.enabled
          }).catch(() => {
            this.enabled = !this.enabled
          })
          this.isLoading = false
        }
      }, 100)
    },
    async handleBindToken(fromEnable = false) {
      this.isLoading = true
      await createProjectToken(
        this.formData.token_id,
        this.selectedProject.id,
        {
          model: this.formData.selectedModel,
          enabled: this.enabled
        }
      )
        .then((res) => {
          this.projectToken = res.data
        })
        .catch(() => {
          if (fromEnable) {
            this.enabled = !this.enabled
          }
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    async handleUnbind() {
      this.isLoading = true
      await deleteProjectToken(
        this.projectToken.token_id,
        this.selectedProject.id
      ).then(() => {
        this.enabled = false
        this.selectedProvider = ''
        this.projectToken = {}
      })
      this.isLoading = false
    },
    formatProviderName(name) {
      return name.charAt(0).toUpperCase() + name.slice(1)
    },
    goToProfile() {
      this.$router.push({ name: 'Profile', params: { tab: 'aiSettings' }})
    }
  }
}
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
