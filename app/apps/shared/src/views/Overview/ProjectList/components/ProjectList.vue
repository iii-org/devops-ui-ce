<template>
  <el-select
    v-model="form.parent_id"
    :placeholder="$t('Project.SelectProject')"
    :filter-method="setFilter"
    filterable
    clearable
    style="width:100%"
    :disabled="disabledEngineerRole"
    @clear="form.is_inheritance_member=false"
    @change="$emit('change')"
  >
    <el-option-group
      v-for="group in categoryProjectList"
      :key="group.label"
      :label="group.label"
    >
      <el-option
        v-for="item in group.options"
        :key="item.id"
        :label="item.display"
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
      if ((this.selectedProjectId === -1 || !this.selectedProjectId) && !this.clearable) {
        this.showNoProjectWarning()
        return []
      }
      const filteredArray = this.projectOptions.filter((obj) => {
        const { is_lock, disabled, id } = obj
        return !is_lock && !disabled && id !== this.selectedProjectId
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
        item.options = item.options.filter((element) =>
          element.display.indexOf(keyword) > -1 ||
            element.name.indexOf(keyword) > -1
        )
        return item.options.length > 0
      })
    },
    showNoProjectWarning() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.NoProject'),
        type: 'warning'
      })
    }
  }
}
</script>
