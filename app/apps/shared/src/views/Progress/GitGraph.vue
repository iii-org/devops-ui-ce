<template>
  <el-row v-loading="listLoading" :element-loading-text="$t('Loading')" class="app-container">
    <ProjectListSelector />
    <el-divider />
    <el-card class="box-card">
      <div class="cardBody">
        <el-empty
          v-if="isNoData"
          :description="$t('general.NoData')"
          :image-size="100"
        />
        <div v-show="!isNoData" id="graph-container" />
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
    </el-card>
  </el-row>
</template>

<script>
import { mapGetters } from 'vuex'
import { createGitgraph, templateExtend } from '@gitgraph/js'
import { getGitGraphByRepo } from '@/api/git-graph'
import { BasicData } from '@/mixins'
import { ProjectListSelector } from '@shared/components'
import { getBranchesByProject } from '@/api/branches'
import { getLocalTime } from '@shared/utils/handleTime'

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
      nodeData: []
    }
  },
  computed: {
    ...mapGetters(['selectedProject']),
    commitIds() {
      return this.nodeData.map(node => node.id)
    },
    gitlabGraphLink() {
      return this.selectedProject.git_url.replace('.git', `/-/network/${this.defaultBranch}?ref_type=heads`)
    }
  },
  methods: {
    async fetchData() {
      if (this.selectedProjectId === -1) {
        this.showNoProjectWarning()
        return []
      }
      this.listLoading = true
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
        this.createFromGit()
      } catch (err) {
        console.error(err)
      } finally {
        this.listLoading = false
        // remove duplicate graph if exist
        this.$nextTick(() => {
          const element = document.getElementById('graph-container')
          element.replaceChildren(element.firstElementChild)
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
              color: '#333238',
              font: 'normal 14px JetBrains Mono',
              id: 'message',
              displayAuthor: false
            },
            dot: { size: 5 },
            spacing: 30,
            font: 'normal 14px JetBrains Mono'
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
    },
    openGitLabGraph() {
      window.open(this.gitlabGraphLink, '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
.box-card {
  max-height: 80vh;
  overflow: auto;
}
.cardBody {
  display: flex;
  flex-direction: column;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #8b8b8b;
}
#graph-container {
  flex: 1;
  padding-bottom: 0 !important;
  overflow: auto !important;

}
::v-deep {
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
    p {
      margin: 0;
      padding: 2px 0;
      border-radius: 4px
    }
  }
  svg:not(:root) {
    width: 100%;
  }
}

</style>
