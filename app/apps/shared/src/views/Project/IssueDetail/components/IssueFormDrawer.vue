<template>
  <el-form
    ref="form"
    :disabled="isButtonDisabled"
    :model="form"
    :rules="issueFormRules"
    label-position="top"
  >
    <el-form-item v-if="formType === 'done_ratio'" :prop="formType">
      <el-slider v-model="form.done_ratio" @change="updateSelect(formType)" />
    </el-form-item>
    <el-form-item
      v-else-if="formType === 'start_date' || formType === 'due_date'"
      :prop="formType"
    >
      <DateSelector :value.sync="form[formType]" @update="updateValue" />
    </el-form-item>
    <el-form-item v-else :prop="formType">
      <el-radio-group
        v-model="form[formType]"
        class="radio-group"
        size="small"
        @change="updateSelect(formType)"
      >
        <el-col class="settings">
          <el-radio
            v-for="option in options[formType].value"
            :key="option.name"
            :disabled="
              formType === 'fixed_version_id'
                ? option.status !== 'open'
                : option.disabled
            "
            :label="option.id"
            :value="option.id"
            border
          >
            {{ getSelectionLabel(option) }} {{ option.message }}
          </el-radio>
        </el-col>
      </el-radio-group>
      <div
        v-if="options[formType].value.length === 0"
        class="text-center text-sm font-medium text-gray-400"
      >
        {{ $t('general.NoData') }}
      </div>
    </el-form-item>
    <el-button
      v-if="formType === 'start_date' || formType === 'due_date'"
      class="action align-middle rounded-md w-full"
      type="primary"
      @click="updateSelect(formType)"
    >
      {{ $t('general.Save') }}
    </el-button>
  </el-form>
</template>

<script>
export default {
  name: 'IssueFormDrawer',
  components: {
    DateSelector: () => import('@/components/Issue/DateSelector')
  },
  props: {
    form: {
      type: Object,
      default: () => ({})
    },
    isButtonDisabled: {
      type: Boolean,
      default: false
    },
    issueFormRules: {
      type: Object,
      default: () => ({})
    },
    options: {
      type: Object,
      default: () => ({})
    },
    formType: {
      type: String,
      default: ''
    }
  },
  computed: {
    parentElement() {
      return this.$parent.$parent.$parent
    }
  },
  methods: {
    getSelectionLabel(item) {
      const visibleStatus = ['closed', 'locked']
      let result = this.$te('Issue.' + item.name)
        ? this.$t('Issue.' + item.name)
        : item.name
      if (
        item.hasOwnProperty('status') &&
        visibleStatus.includes(item.status)
      ) {
        result +=
          ' (' +
          (this.$te('Issue.' + item.status)
            ? this.$t('Issue.' + item.status)
            : item.status) +
          ')'
      }
      return result
    },
    async updateSelect(type, forceClose = false) {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        await this.parentElement.updateIssue(type, forceClose)
        this.isLoading = false
      })
    },
    updateValue(value) {
      this.form[this.formType] = value
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

.radio-group {
  display: grid;

  .settings::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
  }

  .settings {
    max-width: 768px;
    margin: 0 auto;
    display: grid;
    gap: 6px;
    overflow-x: auto;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    ::v-deep .el-radio.is-bordered {
      margin-left: 0;
      margin-right: 0;
      // width: 140px;
    }

    ::v-deep .el-radio__label {
      padding-left: 2px;
    }
  }
}

@include mobile {
  .settings {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include tablet-1 {
  .settings {
    grid-template-columns: repeat(3, 1fr);
  }
}

@include tablet-2 {
  .settings {
    grid-template-columns: repeat(4, 1fr);
  }
}

@include tablet-3 {
  .settings {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
