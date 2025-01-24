<template>
  <el-row
    v-loading="listLoading"
    :element-loading-text="$t('Loading')"
    class="app-container"
  >
    <ProjectListSelector />
    <el-divider />
    <el-card :class="graphTheme === 'dark' ? 'dark' : ''">
      <div
        class="h-[calc(100vh-155px)] overflow-auto border-gray-200 border border-solid rounded"
      >
        <div
          class="sticky top-0 bg-gray-50 border border-t-0 border-x-0 border-solid border-gray-200"
        >
          <div class="p-2 text-sm flex justify-between items-center">
            <span><em class="ri-git-branch-fill text-base"></em> Git Graph</span>
            <el-radio-group v-model="graphTheme" size="small">
              <el-radio-button label="light"><em class="ri-sun-line text-sm"></em>
              </el-radio-button>
              <el-radio-button label="dark"><em class="ri-moon-line text-sm"></em>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="box-card">
          <div id="mypopup" class="break-words font-code">
            <div id="title" class="mb-2 text-sm font-bold">
              <em class="ri-user-3-line text-base"></em>
              <span id="user"></span>
            </div>
            <div>
              <em class="ri-calendar-event-fill text-base text-info"></em>
              <span id="date"></span>
            </div>
            <div>
              <em class="ri-git-commit-line text-base text-info"></em>
              <span id="commit"></span>
            </div>
            <div>
              <em
                id="msg-icon"
                class="ri-chat-quote-line text-base text-info"
              ></em>
              <div id="message"></div>
            </div>
          </div>
          <div class="card-body">
            <el-empty
              v-if="isNoData"
              :description="$t('general.NoData')"
              class="h-full"
            />
            <div
              v-show="!isNoData"
              id="graph-container"
              :style="{ backgroundColor: colorSwitch.background }"
              class="font-code"
            ></div>
            <div class="self-center">
              <el-button
                v-if="!isNoData && defaultBranch"
                class="mt-2 mb-5"
                icon="ri-git-branch-line"
                round
                size="small"
                type="primary"
                @click="openGitLabGraph"
              >
                {{ $t('LoadMore') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </el-row>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { createGitgraph, templateExtend } from '@gitgraph/js'
import { getGitGraph, getRepositoryBranches } from '@/api_v3/gitlab'
import BasicData from '@/mixins/BasicData'
import { getLocalTime } from '@shared/utils/handleTime'
import colorVariables from '@/styles/theme/variables.module.scss'

export default {
  name: 'ProgressGitGraph', // ready to refactor
  components: {
    ProjectListSelector: () => import('@shared/components/ProjectListSelector')
  },
  mixins: [BasicData],
  data() {
    return {
      listLoading: true,
      isNoData: false,
      allBranchGraph: {},
      defaultBranch: null,
      nodeData: [],
      graphTheme: 'light',
      timeout: null
    }
  },
  computed: {
    ...mapGetters(['selectedProject', 'sidebar']),
    colorSwitch() {
      if (this.graphTheme === 'light') {
        return {
          message: '##333238',
          background: '#fff'
        }
      } else {
        return {
          message: '#fff',
          background: colorVariables.sideBarTitleBg
        }
      }
    }
  },
  watch: {
    graphTheme() {
      this.createFromGit()
      this.$nextTick(() => {
        this.replaceGraph()
      })
      this.setGraphTheme(this.graphTheme)
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timeout)
  },
  methods: {
    ...mapActions('projects', ['getGraphTheme', 'setGraphTheme']),
    async fetchData() {
      if (this.selectedProjectId === -1) {
        this.showNoProjectWarning()
        return []
      }
      this.listLoading = true
      this.graphTheme = await this.getGraphTheme()
      try {
        const svgs = document.querySelector('#graph-container')
          ? document.querySelector('#graph-container').children
          : []
        if (svgs && svgs.length > 0) [...svgs].forEach((_svg) => _svg.remove())
        const res = await getGitGraph(this.selectedRepositoryId)
        this.nodeData = res.data.map((item) => {
          item.body = `${item.author.name} <${
            item.author.email
          }> ${getLocalTime(item.committer.timestamp)}`
          return item
        })
        this.isNoData = this.nodeData.length === 0
        this.getDefaultBranch()
        await this.createFromGit()
      } catch (err) {
        console.error(err)
      } finally {
        this.listLoading = false
        // remove duplicate graph if exist
        this.$nextTick(async () => {
          await this.replaceGraph()
        })
      }
    },
    getDefaultBranch() {
      getRepositoryBranches(this.selectedRepositoryId).then(({ data }) => {
        this.defaultBranch = data.main.name
      })
    },
    showNoProjectWarning() {
      this.$message({
        title: this.$t('general.Warning'),
        message: this.$t('Notify.NoProject'),
        type: 'warning'
      })
    },
    createFromGit() {
      const graphContainer = document.getElementById('graph-container')
      const gitgraph = createGitgraph(graphContainer, {
        template: templateExtend('metro', {
          colors: [
            '#479edc',
            '#CCC052',
            '#7A29CC',
            '#49CC29',
            '#CC007A',
            '#fd7e14',
            '#00CC8F',
            '#ab6100',
            '#1f75cb',
            '#dc3545',
            '#626168'
          ],
          commit: {
            message: {
              color: this.colorSwitch.message,
              font: 'normal 13px JetBrains Mono',
              id: 'message',
              displayAuthor: false
            },
            dot: { size: 4 },
            spacing: 30,
            font: 'normal 13px JetBrains Mono'
          },
          branch: {
            label: {
              font: 'normal 11px JetBrains Mono',
              paddingY: 0
            },
            spacing: 15,
            lineWidth: 2.2
          },
          tag: { font: 'normal 10px JetBrains Mono' }
        })
        // branchLabelOnEveryCommit: true
        // initCommitOffsetX: 100
        // responsive: true
      })
      gitgraph.import(this.nodeData)
      this.setCommitListener()
      this.listLoading = false
    },
    setCommitListener() {
      window.clearTimeout(this.timeout)
      this.timeout = window.setTimeout(() => {
        const pattern = /^[A-Za-z0-9]{7}$/
        const element = document.getElementsByTagName('text')
        const containerEl = document.getElementsByClassName('app-container')
        for (const el of element) {
          if (pattern.test(el.innerHTML.split(' ')[0]) && el.nextSibling) {
            const commit = this.nodeData.find(
              (node) =>
                node.hashAbbrev.substring(0, 7) === el.innerHTML.split(' ')[0]
            )
            el.classList.add('gitgraph-hover')
            el.addEventListener('click', () => {
              this.openCommitLink(commit)
            })
            el.addEventListener('touchstart', () => {
              this.openCommitLink(commit)
            })

            const mypopup = document.getElementById('mypopup')
            el.addEventListener('mouseover', () => {
              const iconPos = el.getBoundingClientRect()
              let tipX = iconPos.right - (this.sidebar.open ? 260 : 20)
              let tipY = containerEl[0].scrollTop + iconPos.top - 60
              mypopup.style.left = tipX + 'px'
              mypopup.style.top = tipY + 'px'
              mypopup.style.display = 'block'
              mypopup.style.pointerEvents = 'none' // prevent flickering
              const tooltip_rect = mypopup.getBoundingClientRect()
              if (tooltip_rect.x + tooltip_rect.width >= window.innerWidth) {
                tipX -=
                  tooltip_rect.x + tooltip_rect.width - window.innerWidth + 10
              }
              if (tooltip_rect.y + tooltip_rect.height >= window.innerHeight) {
                tipY -=
                  tooltip_rect.y + tooltip_rect.height - window.innerHeight + 10
              }
              mypopup.style.top = tipY + 'px'
              mypopup.style.left = tipX + 'px'
              mypopup.querySelector('#user').innerHTML = commit.author.name
              mypopup.querySelector('#date').innerHTML = getLocalTime(
                commit.author.timestamp
              )
              mypopup.querySelector('#commit').innerHTML = commit.hash
              mypopup.querySelector('#message').innerHTML =
                commit.message.replace(/\n/g, '<br>')
            })
            el.addEventListener('mouseout', () => {
              mypopup.style.display = 'none'
            })
          }
        }
      }, 1500)
    },
    openGitLabGraph() {
      window.open(
        `${this.selectedProject.git_url}/-/network/${this.defaultBranch}?ref_type=heads`,
        '_blank'
      )
    },
    openCommitLink(commit) {
      if (commit) window.open(commit.web_url, '_blank')
      else {
        window.open(
          `${this.selectedProject.git_url}/commits/${this.defaultBranch}`,
          '_blank'
        )
      }
    },
    replaceGraph() {
      const element = document.getElementById('graph-container')
      element.replaceChildren(element.lastElementChild)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/styles/theme/mixin.scss';

.box-card {
  margin: 10px;
  height: calc(100% - 70px);
}

.card-body {
  display: flex;
  flex-direction: column;
  height: 100%;
}

#graph-container {
  flex: 1;
  padding-top: 10px;
  padding-bottom: 0 !important;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #8b8b8b;

  ::v-deep {
    svg:not(:root) {
      min-width: -webkit-fill-available;
    }

    rect {
      height: 20px;
      transform: translate(0, -4px);
    }

    g rect + text {
      transform: translate(0, -6px);
    }

    path:first-child:has(~ text) {
      transform: scaleY(0.75) scaleX(0.95);
    }

    path + text {
      transform: translate(-4px, 0);
    }

    foreignObject {
      transform: translate(-10px, 10px);
      font-size: 11px;
      color: #757575;

      p {
        margin: 0;
        padding: 2px 0;
        border-radius: 4px;
      }
    }
  }
}

::v-deep .el-radio-button__inner {
  padding: 3px 9px;
}

::v-deep .el-card__body {
  padding: 3px !important;
}

.dark {
  ::v-deep {
    foreignObject {
      color: #c7c7c7 !important;
    }

    .el-card__body {
      background-color: $sideBarTitleBg !important;
    }
  }
}
</style>
<style lang="scss">
@import 'src/styles/theme/variables.module.scss';

.gitgraph-hover:hover {
  fill: $linkTextColor;
  cursor: pointer;
}

#mypopup {
  width: 374px;
  padding: 14px;
  font-size: 10pt;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  position: absolute;
  display: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  line-height: 1.5;

  #title {
    border-bottom: 1px solid #ebeef5;
  }

  #msg-icon {
    float: left;
    width: 24px;
  }

  #message {
    float: left;
    width: calc(100% - 24px);
  }
}

#mypopup::before {
  content: '';
  width: 12px;
  height: 12px;
  transform: rotate(45deg);
  background-color: white;
  position: absolute;
  left: -6px;
  top: 10px;
  border-bottom: 1px solid #ebeef5;
  border-left: 1px solid #ebeef5;
}
</style>
