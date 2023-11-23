<template>
  <el-form-item
    :label="$t('Issue.Tag')"
    prop="tags"
  >
    <el-tooltip
      :value="dataLoaded && isFormCollapseOpen"
      :disabled="form.tags && form.tags.length > 0 "
      :enterable="false"
      :content="$t('Issue.TypeToAddTag')"
      placement="top"
    >
      <el-select
        ref="tags"
        v-model="form.tags"
        style="width: 100%"
        clearable
        filterable
        remote
        multiple
        value-key="tags"
        :placeholder="form.tags && form.tags.length > 0 ? $t('RuleMsg.PleaseSelect') : $t('Issue.NoTag')"
        :loading="isLoading"
        :remote-method="getSearchTags"
        @focus="getSearchTags()"
        @change="handleUpdateTags"
      >
        <template v-if="tagsList && tagsList.length > 0">
          <el-option-group
            v-for="group in tagsList"
            :key="group.name"
            :label="group.name"
          >
            <el-option
              v-for="item in group.options"
              :key="item.id"
              :value="item.id"
              :label="item.name"
            />
          </el-option-group>
        </template>
        <template v-else>
          <el-option
            v-for="item in []"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </template>
      </el-select>
    </el-tooltip>
  </el-form-item>
</template>

<script>
import axios from 'axios'
import { mapGetters } from 'vuex'
import { addProjectTags, getTagsByName, getTagsByProject } from '@/api/projects'
import { updateIssue } from '@/api/issue'

export default {
  name: 'Tags',
  props: {
    issueId: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    },
    form: {
      type: Object,
      default: () => ({})
    },
    dataLoaded: {
      type: Boolean,
      default: false
    },
    isFormCollapseOpen: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isLoading: false,
      tag_name: '',
      tagsList: [],
      isDuplicate: false,
      cancelToken: null,
      isProjectHasTags: false
    }
  },
  computed: {
    ...mapGetters(['selectedProjectId']),
    projectId() {
      return this.form.project_id && this.form.project_id !== 0
        ? this.form.project_id
        : this.selectedProjectId
    }
  },
  mounted() {
    this.checkProjectTags()
    this.getSearchTags()
  },
  methods: {
    async checkProjectTags() {
      const res = await getTagsByProject(this.projectId)
      this.isProjectHasTags = res.data.tags.length > 0
    },
    checkToken() {
      if (this.cancelToken) this.cancelToken.cancel()
      const CancelToken = axios.CancelToken.source()
      this.cancelToken = CancelToken
      return CancelToken.token
    },
    async getSearchTags(query) {
      this.isDuplicate = false
      this.tag_name = query || null
      const tags = await this.fetchTagsData(this.tag_name)
      this.getTagsList(this.tag_name, tags, query)
    },
    async fetchTagsData(tag_name) {
      if (this.isProjectHasTags) this.isLoading = true
      const cancelToken = this.checkToken()
      const params = { project_id: this.projectId, tag_name }
      const res = tag_name === null
        ? await getTagsByProject(this.projectId)
        : await getTagsByName(params, { cancelToken })
      const tags = res.data.tags
      this.isLoading = false
      this.cancelToken = null
      return tags
    },
    getTagsList(tag_name, tags, query) {
      const tagsList = []
      const tag_sorts = tag_name === null
        ? ['LastResult', 'All']
        : ['AddTag', 'Result']
      tag_sorts.forEach(sort => {
        const list = this.getTagsLabel(tags, sort, query)
        if (list.options.length > 0) tagsList.push(list)
      })
      if (this.isDuplicate) tagsList.shift()
      this.tagsList = tagsList
    },
    getTagsLabel(tags, tag_sort, query) {
      const label = {}
      const addTag = [{ id: `tag__${query}`, name: query }]
      const showTags = this.getShowTags(tag_sort, tags, addTag)
      if (tag_sort === 'Result') {
        this.isDuplicate = showTags.map((item) => item.name).includes(this.tag_name)
      }
      const name = `Issue.${tag_sort}`
      label.name = this.$t(name)
      label.options = showTags
      return label
    },
    getShowTags(tag_sort, tags, addTag) {
      let showTags = null
      const last_three = -3
      // four type: 'All', 'LastResult', 'AddTag', 'Result'
      switch (tag_sort) {
        case 'LastResult':
          showTags = tags.slice(last_three)
          break
        case 'AddTag':
          showTags = addTag
          break
        default:
          showTags = tags
      }
      return showTags
    },
    async handleUpdateTags() {
      this.$nextTick(() => { this.$refs.tags.blur() })
      const tags = this.form.tags
      const tagsLength = tags.length
      const addTags = []
      const originTags = []
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          if (typeof tag === 'string') addTags.push(tag)
          else if (typeof tag === 'number') originTags.push(tag)
        })
      }
      if (addTags.length > 0) {
        await this.handleAddProjectTags(addTags, originTags, tagsLength)
      } else {
        this.tagsArrayToString(originTags, tagsLength)
      }
    },
    async handleAddProjectTags(addTags, originTags, tagsLength) {
      addTags.map(async (tag) => {
        const tagValue = tag.split('__')[1]
        const formData = this.getAddTagsFormData(tagValue)
        await this.addProjectTags(formData, originTags, tagsLength)
      })
    },
    async addProjectTags(formData, originTags, tagsLength) {
      await addProjectTags(formData).then(async (res) => {
        const id = res.data.tags.id
        originTags.push(id)
        this.tagsArrayToString(originTags, tagsLength)
      })
    },
    tagsArrayToString(tags, tagsLength) {
      const tagsString = tags.length > 0 ? tags.join() : ''
      this.form.tags = tagsString === '' ? [] : tags
      if (tags.length === tagsLength) this.updateTags(tagsString)
    },
    getAddTagsFormData(tag) {
      const formData = new FormData()
      formData.append('name', tag)
      formData.append('project_id', this.projectId)
      return formData
    },
    async updateTags(tagsString) {
      this.$emit('update:loading', true)
      const sendForm = new FormData()
      sendForm.append('tags', tagsString)
      await updateIssue(this.issueId, sendForm).then(() => {
        this.$emit('update')
      })
      this.$emit('update:loading', false)
    }
  }
}
</script>
