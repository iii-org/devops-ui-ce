<template>
  <el-row v-loading="listLoading" :element-loading-text="$t('Loading')" class="app-container">
    <ProjectListSelector>
      <el-radio-group v-model="graphTheme" size="small">
        <el-radio-button label="light"><em class="ri-sun-line text-xl" /></el-radio-button>
        <el-radio-button label="dark"><em class="ri-moon-line text-xl" /></el-radio-button>
      </el-radio-group>
    </ProjectListSelector>
    <el-divider />
    <el-card :class="graphTheme === 'dark' ? 'dark' : ''">
      <div class="box-card">
        <div id="mypopup">
          <div id="title" class="mb-2 text-sm font-bold"><em class="ri-user-3-line mr-2 text-base" /><span id="user" /></div>
          <div><em class="ri-calendar-event-fill mr-2 text-base text-info" /><span id="date" /></div>
          <div><em class="ri-git-commit-fill mr-2 text-base text-info" /><span id="commit" /></div>
          <div><em id="msg-icon" class="ri-chat-quote-fill text-base text-info" /><div id="message" /></div>
        </div>
        <div class="card-body">
          <el-empty
            v-if="isNoData"
            :description="$t('general.NoData')"
          />
          <div
            v-show="!isNoData"
            id="graph-container"
            :style="{ backgroundColor: colorSwitch.background }"
          />
          <el-button
            v-if="!isNoData && defaultBranch"
            id="load-more"
            type="primary"
            icon="ri-git-branch-line"
            class="mt-2 mb-5"
            style="width: max-content; align-self: center;"
            round
            size="medium"
            @click="openGitLabGraph"
          >
            {{ $t('LoadMore') }}
          </el-button>
        </div>
      </div>
    </el-card>
  </el-row>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { createGitgraph, templateExtend } from '@gitgraph/js'
import { getGitGraphByRepo } from '@/api/git-graph'
import { BasicData } from '@/mixins'
import { ProjectListSelector } from '@shared/components'
import { getBranchesByProject } from '@/api/branches'
import { getLocalTime } from '@shared/utils/handleTime'
import colorVariables from '@/styles/theme/variables.scss'

export default {
  name: 'ProgressGitGraph', // ready to refactor
  components: {
    ProjectListSelector
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
    ...mapGetters(['selectedProject']),
    commitIds() {
      return this.nodeData.map(node => node.id)
    },
    gitlabGraphLink() {
      return this.selectedProject.git_url.replace('.git', `/-/network/${this.defaultBranch}?ref_type=heads`)
    },
    gitlabCommitsLink() {
      return this.selectedProject.git_url.replace('.git', `/commits/${this.defaultBranch}`)
    },
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
        if (svgs && svgs.length > 0) [...svgs].forEach(_svg => _svg.remove())
        const res = await getGitGraphByRepo(this.selectedRepositoryId)
        this.nodeData = res.data.map(item => {
          item.body = `${item.author.name} <${item.author.email}> ${getLocalTime(item.author.timestamp)}`
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
      getBranchesByProject(this.selectedRepositoryId)
        .then(({ data }) => {
          this.defaultBranch = data.default_branch
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
          colors: ['#479edc', '#CCC052', '#7A29CC', '#49CC29', '#CC007A', '#00CC8F'],
          commit: {
            message: {
              color: this.colorSwitch.message,
              font: 'normal 13px JetBrains Mono',
              id: 'message',
              displayAuthor: false
            },
            dot: { size: 5 },
            spacing: 30,
            font: 'normal 13px JetBrains Mono'
          },
          branch: {
            label: {
              font: 'normal 11px JetBrains Mono',
              paddingY: 0
            },
            spacing: 20,
            lineWidth: 3
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
            const commit = this.nodeData.find(node => node.hashAbbrev.substring(0, 7) === el.innerHTML.split(' ')[0])
            el.classList.add('gitgraph-hover')
            el.addEventListener('click', () => {
              this.openCommitLink(commit)
            })

            const mypopup = document.getElementById('mypopup')
            el.addEventListener('mouseover', () => {
              const iconPos = el.getBoundingClientRect()
              let tipX = iconPos.right - 260
              let tipY = containerEl[0].scrollTop + iconPos.top - 60
              mypopup.style.left = tipX + 'px'
              mypopup.style.top = tipY + 'px'
              mypopup.style.display = 'block'
              const tooltip_rect = mypopup.getBoundingClientRect()
              if ((tooltip_rect.x + tooltip_rect.width) >= window.innerWidth) {
                tipX -= (tooltip_rect.x + tooltip_rect.width) - window.innerWidth + 10
              }
              if ((tooltip_rect.y + tooltip_rect.height) >= window.innerHeight) {
                tipY -= (tooltip_rect.y + tooltip_rect.height) - window.innerHeight + 10
              }
              mypopup.style.top = tipY + 'px'
              mypopup.style.left = tipX + 'px'
              mypopup.querySelector('#user').innerHTML = commit.author.name
              mypopup.querySelector('#date').innerHTML = getLocalTime(commit.author.timestamp)
              mypopup.querySelector('#commit').innerHTML = commit.hash
              mypopup.querySelector('#message').innerHTML = commit.message.replace(/\n/g, '<br>')
            })
            el.addEventListener('mouseout', () => {
              mypopup.style.display = 'none'
            })
          }
        }
      }, 1500)
    },
    openGitLabGraph() {
      window.open(this.gitlabGraphLink, '_blank')
    },
    openCommitLink(commit) {
      if (commit) window.open(commit.web_url, '_blank')
      else window.open(this.gitlabCommitsLink, '_blank')
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
  overflow: auto;
  margin: 10px;
}
.card-body {
  display: flex;
  flex-direction: column;
}
#graph-container {
  flex: 1;
  padding-top: 10px;
  padding-bottom: 0 !important;
  overflow: auto !important;
  border-radius: 4px;
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
        border-radius: 4px
      }
    }
  }
}
::v-deep .el-radio-button__inner {
      padding: 3px 9px;
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
@import 'src/styles/theme/variables.scss';
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
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
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
  content: "";
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
