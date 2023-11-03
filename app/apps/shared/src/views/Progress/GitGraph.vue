<template>
  <el-row v-loading="listLoading" :element-loading-text="$t('Loading')" class="app-container">
    <ProjectListSelector>
      <el-radio-group v-model="graphTheme" size="small">
        <el-radio-button label="light"><em class="ri-sun-line text-xl" /></el-radio-button>
        <el-radio-button label="dark"><em class="ri-moon-line text-xl" /></el-radio-button>
      </el-radio-group>
    </ProjectListSelector>
    <el-divider />
    <el-card>
      <div class="box-card">
        <div class="card-body">
          <el-empty
            v-if="isNoData"
            :description="$t('general.NoData')"
          />
          <div
            v-show="!isNoData"
            id="graph-container"
            :style="{ backgroundColor: colorSwitch.background }"
            :class="graphTheme === 'dark' ? 'dark' : ''"
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
        for (const el of element) {
          if (pattern.test(el.innerHTML.split(' ')[0]) && el.nextSibling) {
            el.classList.add('gitgraph-hover')
            el.addEventListener('click', () => {
              this.openCommitLink(el.innerHTML.split(' ')[0])
            })
          }
        }
      }, 1500)
    },
    openGitLabGraph() {
      window.open(this.gitlabGraphLink, '_blank')
    },
    openCommitLink(commitId) {
      const commit = this.nodeData.find(node => node.hashAbbrev.substring(0, 7) === commitId)
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
  }
}
</style>
<style lang="scss">
@import 'src/styles/theme/variables.scss';
.gitgraph-hover:hover {
  fill: $linkTextColor;
  cursor: pointer;
}
</style>
