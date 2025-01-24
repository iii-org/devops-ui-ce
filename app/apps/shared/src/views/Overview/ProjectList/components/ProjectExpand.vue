<template>
  <section v-if="children.length > 0" style="margin-left: 42px">
    <h4 class="ml-5 my-1">{{ $t('general.ChildrenProject') }}</h4>
    <el-tree
      :expand-on-click-node="false"
      :indent="34"
      :load="getChildren"
      :props="props"
      icon-class="el-icon-arrow-right"
      lazy
      node-key="id"
      @node-expand="adjustRowHeight"
      @node-collapse="adjustRowHeight"
    >
      <div slot-scope="{ node, data }" class="flex justify-start items-center">
        <span class="flex justify-start items-center">
          <!-- star -->
          <template>
            <div class="mr-3">
              <em
                v-if="data.is_starred"
                class="el-icon-star-on text-yellow-500 text-2xl cursor-pointer"
                @click.stop="$emit('setStar', data.id, false)"
              ></em>
              <em
                v-else
                class="el-icon-star-off text-gray-400 text-xl cursor-pointer"
                style="padding: 0 2px"
                @click.stop="$emit('setStar', data.id, true)"
              ></em>
            </div>
          </template>
          <!-- web link -->
          <template>
            <div class="flex mr-3">
              <!-- gitlab button -->
              <el-popover
                v-if="data.git_url"
                :close-delay="50"
                :disabled="data.is_disabled || data.is_locked"
                :open-delay="300"
                class="mr-1"
                placement="top"
                trigger="hover"
                width="400"
              >
                <p class="text-center">
                  <span class="text-title">
                    {{ data.git_url }}
                  </span>
                </p>
                <div class="flex justify-center">
                  <el-button
                    circle
                    class="mr-2"
                    icon="el-icon-copy-document"
                    size="mini"
                    @click.stop="copyUrl(data.git_url)"
                  />
                  <a :href="data.git_url" target="_blank">
                    <el-button circle size="mini">
                      <em class="ri-external-link-line"></em>
                    </el-button>
                  </a>
                </div>
                <el-link
                  slot="reference"
                  :disabled="data.is_disabled || data.is_locked"
                  :underline="false"
                  style="font-size: 18px; padding: 0 2px"
                >
                  <svg-icon icon-class="gitlab" />
                </el-link>
              </el-popover>
              <!-- harbor button -->
              <el-link
                v-if="data.harbor_url"
                :disabled="data.is_disabled || data.is_locked"
                :href="data.harbor_url"
                :underline="false"
                style="font-size: 18px; padding: 0 2px"
                target="_blank"
              >
                <svg-icon icon-class="harbor" />
              </el-link>
            </div>
            <div class="mr-3">
              <el-link
                v-if="userRole !== 'QA'"
                :class="
                  data.is_disabled || data.is_locked ? '' : 'link-text-color'
                "
                :disabled="data.is_disabled || data.is_locked"
                :underline="false"
                @click.stop="$emit('handleClick', data)"
              >
                <span :style="calcStyle(node, data)">{{
                  data.display_name
                }}</span>
              </el-link>
              <template v-else>
                <span :style="calcStyle(node, data)">{{
                  data.display_name
                }}</span>
              </template>
              <br />
            </div>
          </template>
        </span>
        <!-- project manager -->
        <span style="width: 10rem; display: inline-block">
          <el-tag class="el-tag--circle mr-3" effect="dark" size="mini">
            <em class="el-icon-user-solid"></em>
            <span>{{ data.owner_name }}</span>
          </el-tag>
        </span>
        <!-- issue status -->
        <template>
          <el-tooltip
            :content="data.lock_reason"
            :disabled="!data.is_locked"
            placement="bottom"
          >
            <el-tag v-if="data.is_locked" class="mr-3" size="mini" type="info">
              {{ $t('errorDetail.locked') }}
            </el-tag>
            <el-tag
              v-else
              :type="data.is_disabled ? 'danger' : 'success'"
              class="mr-3"
              size="mini"
            >
              {{
                data.is_disabled ? $t('general.Disable') : $t('general.Enable')
              }}
            </el-tag>
          </el-tooltip>
        </template>
        <!-- actions -->
        <template>
          <el-tooltip
            v-if="userRole !== 'QA'"
            :content="$t('general.Edit')"
            placement="bottom"
          >
            <span>
              <em
                :class="
                  data.is_locked || data.is_disabled ? 'disabled' : 'success'
                "
                class="ri-edit-box-line table-button"
                @click.stop="$emit('handleEdit', data)"
              ></em>
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="!data.is_locked"
            :content="$t('general.Delete')"
            placement="bottom"
          >
            <span>
              <em
                :class="permission(data) ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click.stop="$emit('handleDelete', data)"
              ></em>
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="data.is_locked"
            :content="$t('general.ForceDelete')"
            placement="bottom"
          >
            <span>
              <em
                :class="permission(data) ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click.stop="$emit('handleDelete', data, true)"
              ></em>
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="data.is_locked === true"
            :content="$t('general.Fix')"
            placement="bottom"
          >
            <em
              class="ri-refresh-line primary table-button"
              @click.stop="$emit('handleFix', data.id)"
            ></em>
          </el-tooltip>
          <el-tooltip
            v-if="!data.is_locked"
            :content="
              !data.is_disabled ? $t('general.Disable') : $t('general.Enable')
            "
            placement="bottom"
          >
            <span>
              <em
                :class="disableProjectClass(data)"
                class="table-button"
                @click.stop="$emit('handleToggle', data)"
              ></em>
            </span>
          </el-tooltip>
        </template>
      </div>
    </el-tree>
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { getProjectChildren } from '@/api_v3/projects'

export default {
  name: 'ProjectExpand',
  props: {
    children: {
      type: Array,
      default: () => {}
    },
    params: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      props: {
        isLeaf: this.isLeaf
      }
    }
  },
  computed: {
    ...mapGetters(['userId', 'userRole'])
  },
  methods: {
    ...mapActions('projects', ['setSelectedProject']),
    isLeaf(data) {
      return !data.has_children
    },
    async getChildren(node, resolve) {
      if (node.level === 0) {
        return resolve(this.children)
      }
      // if (node.level > 1) return resolve([])
      const res = await getProjectChildren(node.data.id, {
        enabled: this.params.enable
      })
      resolve(res.data)

      // adjust row height after data loaded
      this.adjustRowHeight()
    },
    permission(row) {
      const { creator_id, owner_id } = row
      if (
        this.userRole === 'sysadmin' ||
        this.userRole === 'Organization Owner'
      ) {
        return false
      }
      if (this.userRole === 'QA') {
        if (creator_id !== this.userId) return true
      } else {
        if (owner_id !== this.userId) return true
      }
    },
    calcStyle(node) {
      const nodeWidth = 2.125 * (node.level - 1) + 'rem'
      const style = {
        display: 'inline-block',
        width: `calc(20rem - ${nodeWidth})`,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'middle'
      }
      return style
    },
    disableProjectClass(row) {
      let className = ''
      if (row.is_disabled) {
        className = 'ri-play-circle-line success'
      } else {
        className = 'ri-pause-circle-line warning'
      }
      if (this.permission(row)) {
        className += ' disabled'
      }
      return className
    },
    copyUrl(text) {
      this.$copyText(text).then(() => {
        const message = this.$t('Notify.Copied')
        this.showSuccessMessage(message)
      })
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
    },
    adjustRowHeight() {
      /**
       * Manually adjust the height of the expanded cell in the fixed right section
       * to match the height of the expanded cell in the main section
       * https://github.com/ElemeFE/element/issues/14646
       */
      setTimeout(() => {
        // Get all expanded cells for the main and fixed right sections
        const expandEl = document.querySelectorAll(
          '.el-table__body-wrapper .el-table__expanded-cell'
        )
        const expandFixedEl = document.querySelectorAll(
          '.el-table__fixed-right .el-table__expanded-cell'
        )

        // Apply height to fixed right section
        expandEl.forEach((el, index) => {
          const fixedEl = expandFixedEl[index]
          if (fixedEl) {
            fixedEl.style.height = `${el.getBoundingClientRect().height}px`
          }
        })
      }, 300)
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  list-style: none;
}

::v-deep .el-tree-node {
  margin-bottom: 3px;
}
</style>
