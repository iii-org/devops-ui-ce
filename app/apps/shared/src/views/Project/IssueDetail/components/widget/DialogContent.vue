<template>
  <el-row>
    <el-row
      v-if="note.notes && !filterJson(note.notes)"
      :span="24"
      :justify="right|justifyRight"
      type="flex"
      align="bottom"
    >
      <el-col
        v-if="right"
        class="time"
      >
        <TimeTooltip :time="note.created_on" />
      </el-col>
      <el-col
        :class="{right:right}"
        class="dialog"
      >
        <div
          :class="{'text-right':right}"
          class="author"
        >
          {{ note.user.name }}
        </div>
        <div class="content">
          <Viewer
            ref="viewer"
            :initial-value="note.notes"
            class="text"
          />
        </div>
      </el-col>
      <el-col
        v-if="!right"
        class="time"
      >
        <TimeTooltip :time="note.created_on" />
      </el-col>
    </el-row>
    <template v-if="note.hasOwnProperty('details')">
      <el-row
        v-for="(detail,index) in filterData"
        :key="index"
        class="el-alert el-alert--info is-light detail"
      >
        <em class="el-alert__icon el-icon-info" />
        <i18n
          path="Issue.detail.message.set_to"
          tag="el-row"
          class="el-alert__content"
        >
          <i18n
            slot="creator"
            path="Issue.detail.message.creator"
            tag="el-col"
          >
            <span
              slot="user"
              class="title"
            >
              {{ note.user.name }}:
            </span>
            <span
              slot="action"
              class="title"
            >
              <span>
                {{ $t(filterTag(detail)) }}
              </span>
              <strong>
                {{
                  ($te('Issue.detail.' + detail.name)) ?
                    $t('Issue.detail.' + detail.name) :
                    $t('Issue.detail.' + detail.property)
                }}
              </strong>
            </span>
            <span slot="time">
              <TimeTooltip :time="note.created_on" />
            </span>
            <el-button
              slot="detail"
              size="mini"
              icon="el-icon-view"
              @click="toggleVisible(detail)"
            >
              {{ $t('Issue.detail.message.detail') }}
            </el-button>
          </i18n>
          <el-col
            v-if="detail.detailVisible"
            slot="message"
          >
            <el-row>
              <el-col
                v-if="detail.old_value"
                :span="12"
                class="value"
              >
                <p class="title">
                  <strong>
                    <em class="el-icon-caret-right" />
                    {{ $t('Issue.detail.message.Before') }}
                  </strong>
                </p>
                <el-link
                  v-if="detail.name==='parent_id'&&detail.old_value.id"
                  class="link"
                  @click="showParentIssue(detail.old_value.id)"
                >
                  {{ detail.old_value.name }}
                </el-link>
                <p
                  v-else-if="detail.old_value.id===null"
                  class="text-wrapper"
                >
                  <em>
                    <s>
                      <Viewer :initial-value="filterValueName(detail.old_value)" />
                    </s>
                  </em>
                </p>
                <p
                  v-else
                  class="text-wrapper"
                >
                  <Viewer :initial-value="filterValueName(detail.old_value)" />
                </p>
              </el-col>
              <el-col
                v-if="detail.new_value"
                :span="12"
                class="value"
              >
                <p
                  v-if="detail.old_value"
                  class="title"
                >
                  <strong>
                    <em class="el-icon-caret-right" />
                    {{ $t('Issue.detail.message.After') }}
                  </strong>
                </p>
                <p v-else>
                  <strong>
                    <em class="el-icon-caret-right" />
                    {{ $t('Issue.detail.message.Add') }}
                  </strong>
                </p>
                <el-link
                  v-if="detail.name==='parent_id'&&detail.new_value.id"
                  class="link"
                  @click="showParentIssue(detail.new_value.id)"
                >
                  {{ detail.new_value.name }}
                </el-link>
                <p
                  v-else-if="detail.new_value.id===null"
                  class="text-wrapper"
                >
                  <em>
                    <s>
                      <Viewer :initial-value="filterValueName(detail.new_value)" />
                    </s>
                  </em>
                </p>
                <p
                  v-else
                  class="text-wrapper"
                >
                  <Viewer :initial-value="filterValueName(detail.new_value)" />
                </p>
              </el-col>
            </el-row>
          </el-col>
        </i18n>
      </el-row>
    </template>
  </el-row>
</template>

<script>
import i18n from '@/lang'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import { Viewer } from '@toast-ui/vue-editor'
import TimeTooltip from './TimeTooltip'

export default {
  name: 'DialogContent',
  i18n,
  components: { Viewer, TimeTooltip },
  filters: {
    justifyRight(value) {
      return value ? 'end' : 'start'
    }
  },
  props: {
    note: {
      type: Object,
      default: () => ({})
    },
    right: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    filterData() {
      let data = this.note
      if (data.details.length === 0 && this.filterJson(data.notes)) {
        data = JSON.parse(data.notes).details
      } else {
        data = data.details
      }
      return data
    },
    filterTag() {
      return function(detail) {
        let type = 'general.Add'
        if (detail.old_value) {
          if (detail.name === 'tag') {
            if (detail.old_value.name) type = 'general.Delete'
          } else {
            if (detail.old_value && detail.new_value) type = 'general.Edit'
            else if (detail.old_value) type = 'general.Delete'
          }
        }
        return type
      }
    }
  },
  watch: {
    note: {
      deep: true,
      handler(value) {
        if (this.filterJson(this.note.notes)) return
        this.$nextTick(() => {
          if (value.notes) {
            this.$refs['viewer'].invoke('setMarkdown', value.notes)
          }
        })
      }
    }
  },
  mounted() {
    this.addLinkTarget()
  },
  methods: {
    addLinkTarget() {
      const links = document.querySelectorAll('.toastui-editor-contents a')
      for (let i = 0; i < links.length; i++) { links[i].target = '_blank' }
    },
    filterValueName(value) {
      const valueName = this.getValueName(value)
      return (this.$te('Issue.' + valueName)) ? this.$t('Issue.' + valueName) : valueName
    },
    getValueName(value) {
      if (value && typeof value === 'object') {
        return value.hasOwnProperty('name') ? value.name : this.getValueName(value[Object.keys(value)[0]])
      }
      return value
    },
    showParentIssue(id) {
      this.$emit('show-parent-issue', id)
    },
    toggleVisible(detail) {
      detail.detailVisible = !detail.detailVisible
      this.$forceUpdate()
    },
    filterJson(note) {
      try {
        if (typeof JSON.parse(note) === 'object') {
          return true
        }
      } catch (e) {
        return false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/variables.scss';

.detail {
  font-size: 0.875em;
  margin: 5px 0;

  .el-alert__content {
    width: 90%;
  }

  .title {
    font-size: 1em;
  }
  .value {
    .title {
      font-size: 1em;
    }
    .link {
      margin: 0 1.5em;
    }
    .text-wrapper {
      margin: 1.5em;
      white-space: pre-line;
      font-size: 0.875em;
    }
  }
}

.dialog {
  width: fit-content;
  display: inline;
  margin: 0 10px;
  max-width: 75%;

  .author {
    margin-top: 10px;
    font-size: 0.875em;
  }

  .content {
    border: 1px solid #eeeeee;
    background: #eeeeee;
    border-radius: 10px;
    padding: 0 5px;
    min-height: 2em;
    overflow: auto;

    ::v-deep .text {
      p {
        margin: 5px;
        overflow-wrap: break-word;
      }
    }
  }
}

.time {
  display: inline;
  bottom: 0;
  width: fit-content;
  margin-top: 23px;
}

.right {
  float: right;

  .content {
    background: #d9f2e5;
  }
}
</style>
