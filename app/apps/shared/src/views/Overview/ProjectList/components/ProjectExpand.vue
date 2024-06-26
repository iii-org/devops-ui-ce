<template>
  <section v-if="children.length > 0" style="margin-left: 42px;">
    <h4 class="ml-5 my-1">{{ $t('general.ChildrenProject') }}</h4>
    <el-tree
      :data="children"
      :indent="34"
      :expand-on-click-node="false"
      node-key="id"
      icon-class="el-icon-arrow-right"
    >
      <div
        slot-scope="{ node, data }"
        class="flex justify-start items-center"
      >
        <span class="flex justify-start items-center">
          <!-- star -->
          <template>
            <div class="mr-3">
              <em
                v-if="data.starred"
                class="el-icon-star-on text-yellow-500 text-2xl cursor-pointer"
                @click.stop="$emit('setStar', data.id, false)"
              />
              <em
                v-else
                class="el-icon-star-off text-gray-400 text-xl cursor-pointer"
                style="padding: 0 2px;"
                @click.stop="$emit('setStar', data.id, true)"
              />
            </div>
          </template>
          <!-- web link -->
          <template>
            <div class="flex mr-3">
              <!-- gitlab button -->
              <el-popover
                v-if="data.git_url"
                :disabled="data.disabled || data.is_lock"
                :open-delay="300"
                :close-delay="50"
                class="mr-1"
                placement="top"
                width="400"
                trigger="hover"
              >
                <p
                  :id="`copy-${data.id}`"
                  class="text-center"
                >
                  <span class="text-title">{{ data.git_url }}</span>
                </p>
                <div class="flex justify-center">
                  <el-button
                    class="mr-2"
                    icon="el-icon-copy-document"
                    circle
                    size="mini"
                    @click.stop="copyUrl(`copy-${data.id}`)"
                  />
                  <a
                    :href="data.git_url"
                    target="_blank"
                  >
                    <el-button
                      circle
                      size="mini"
                    >
                      <em class="ri-external-link-line" />
                    </el-button>
                  </a>
                </div>
                <el-link
                  slot="reference"
                  :underline="false"
                  :disabled="data.disabled || data.is_lock"
                  style="font-size: 18px; padding: 0 2px;"
                >
                  <svg-icon icon-class="gitlab" />
                </el-link>
              </el-popover>
              <!-- harbor button -->
              <el-link
                v-if="data.harbor_url"
                :underline="false"
                :disabled="data.disabled || data.is_lock"
                :href="data.harbor_url"
                target="_blank"
                style="font-size: 18px; padding: 0 2px;"
              >
                <svg-icon icon-class="harbor" />
              </el-link>
            </div>
            <div class="mr-3">
              <el-link
                v-if="userRole !== 'QA'"
                :class="data.disabled || data.is_lock ? '' : 'link-text-color'"
                :underline="false"
                :disabled="data.disabled || data.is_lock"
                @click.stop="$emit('handleClick', data)"
              >
                <span :style="calcStyle(node, data)">{{ data.display }}</span>
              </el-link>
              <template v-else>
                <span :style="calcStyle(node, data)">{{ data.display }}</span>
              </template>
              <br>
            </div>
          </template>
        </span>
        <!-- project manager -->
        <span style="width: 10rem; display: inline-block;">
          <el-tag
            size="mini"
            class="el-tag--circle mr-3"
            effect="dark"
          >
            <em class="el-icon-user-solid" />
            <span>{{ data.owner_name }}</span>
          </el-tag>
        </span>
        <!-- issue status -->
        <template>
          <el-tooltip
            :disabled="!data.is_lock"
            :content="data.lock_reason"
            placement="bottom"
          >
            <el-tag
              v-if="data.is_lock"
              type="info"
              size="mini"
              class="mr-3"
            >
              {{ $t('errorDetail.locked') }}
            </el-tag>
            <el-tag
              v-else
              :type="data.disabled ? 'danger' : 'success'"
              size="mini"
              class="mr-3"
            >
              {{ data.disabled ? $t('general.Disable') : $t('general.Enable') }}
            </el-tag>
          </el-tooltip>
        </template>
        <!-- actions -->
        <template>
          <el-tooltip
            v-if="userRole !== 'QA' && data.is_lock !== true"
            :content="$t('general.Edit')"
            placement="bottom"
          >
            <em
              class="ri-edit-box-line success table-button"
              @click.stop="$emit('handleEdit', data)"
            />
          </el-tooltip>
          <el-tooltip
            v-if="data.is_lock !== true"
            :content="$t('general.Delete')"
            placement="bottom"
          >
            <span>
              <em
                :class="permission(data) ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click.stop="$emit('handleDelete', data)"
              />
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="data.is_lock === true"
            :content="$t('general.ForceDelete')"
            placement="bottom"
          >
            <span>
              <em
                :class="permission(data) ? 'disabled' : 'danger'"
                class="ri-delete-bin-2-line table-button"
                @click.stop="$emit('handleDelete', data, true)"
              />
            </span>
          </el-tooltip>
          <el-tooltip
            v-if="data.is_lock === true"
            :content="$t('general.Fix')"
            placement="bottom"
          >
            <em class="ri-refresh-line primary table-button" @click.stop="$emit('handleFix', data.id)" />
          </el-tooltip>
          <el-tooltip
            v-if="data.is_lock !== true"
            :content="!data.disabled ? $t('general.Disable') : $t('general.Enable')"
            placement="bottom"
          >
            <span>
              <em
                :class="disableProjectClass(data)"
                class="table-button"
                @click.stop="$emit('handleToggle', data)"
              />
            </span>
          </el-tooltip>
        </template>
      </div>
    </el-tree>
  </section>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'ProjectExpand',
  props: {
    children: {
      type: Array,
      default: () => {}
    }
  },
  computed: {
    ...mapGetters([
      'userId',
      'userRole'
    ])
  },
  methods: {
    ...mapActions('projects', ['setSelectedProject']),
    permission(row) {
      const { creator_id, owner_id } = row
      if (this.userRole === 'Administrator') return false
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
      if (row.disabled) {
        className = 'ri-play-circle-line success'
      } else {
        className = 'ri-pause-circle-line warning'
      }
      if (this.permission(row)) {
        className += ' disabled'
      }
      return className
    },
    copyUrl(id) {
      const message = this.$t('Notify.Copied')
      const target = document.getElementById(id)
      window.getSelection().selectAllChildren(target)
      document.execCommand('Copy')
      this.showSuccessMessage(message)
    },
    showSuccessMessage(message) {
      this.$message({
        title: this.$t('general.Success'),
        message,
        type: 'success'
      })
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
