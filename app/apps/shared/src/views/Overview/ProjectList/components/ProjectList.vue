<template>
  <el-select
    v-model="form.parent_id"
    :disabled="disabledEngineerRole"
    :filter-method="setFilter"
    :placeholder="$t('Project.SelectProject')"
    clearable
    filterable
    style="width: 100%"
    @change="$emit('change')"
    @clear="form.is_inheritance_member = false"
  >
    <el-option-group
      v-for="group in categoryProjectList"
      :key="group.label"
      :label="group.label"
    >
      <el-option
        v-for="item in group.options"
        :key="item.id"
        :label="item.display_name"
        :value="item.id"
      />
    </el-option-group>
  </el-select>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ProjectList',
  props: {
    isCreate: {
      type: Boolean,
      default: false
    },
    form: {
      type: Object,
      default: () => ({})
    },
    disabledEngineerRole: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      categoryProjectList: []
    }
  },
  computed: {
    ...mapGetters(['projectOptions', 'selectedProjectId'])
  },
  mounted() {
    this.getCategoryProjectList()
  },
  methods: {
    getCategoryProjectList() {
      if (
        (this.selectedProjectId === -1 || !this.selectedProjectId) &&
        !this.clearable
      ) {
        return []
      }
      const filteredArray = this.projectOptions.filter((obj) => {
        const { is_lock, disabled, id } = obj
        return (
          !is_lock &&
          !disabled &&
          (this.isCreate || id !== this.selectedProjectId)
        )
      })
      const starred = filteredArray.filter((item) => item.starred)
      const projects = filteredArray.filter((item) => !item.starred)
      this.categoryProjectList = [
        {
          label: this.$t('Project.Starred'),
          options: starred
        },
        { options: projects }
      ]
    },
    setFilter(value) {
      this.getCategoryProjectList()
      const keyword = value.toLowerCase()
      this.categoryProjectList = this.categoryProjectList.filter((item) => {
        item.options = item.options.filter(
          (element) =>
            element.display_name.indexOf(keyword) > -1 ||
            element.identifier.indexOf(keyword) > -1
        )
        return item.options.length > 0
      })
    }
  }
}
</script>
