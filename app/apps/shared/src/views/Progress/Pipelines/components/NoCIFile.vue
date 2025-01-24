<template>
  <div class="text-center break-normal mt-3">
    <div class="text-title mb-3">
      {{ $t('Plugin.CustomEnvWarning') }}
    </div>
    <div class="text-danger font-bold mb-5 text-sm">
      {{ $t('Plugin.CustomRecommendWarning') }}
    </div>
    <div v-if="hasGenerateCIError" class="text-danger font-bold text-sm">
      {{ $t('Plugin.GenerateCIWarning') }}
    </div>
    <el-button
      :loading="isLoading"
      class="mt-2 mb-1"
      type="primary"
      @click="onGenerateCI"
    >
      {{ $t('Plugin.GenerateCIButton') }}
    </el-button>
    <div class="text-xs">
      {{ $t('Plugin.CustomRuleWarning') }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'NoCIFile',
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    hasGenerateCIError: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onGenerateCI() {
      this.$emit('onGenerateCI')
    }
  }
}
</script>
