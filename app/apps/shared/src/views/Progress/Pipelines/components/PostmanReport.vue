<template>
  <div ref="table_postman">
    <table class="test-report">
      <caption>
        <div class="caption">
          <div></div>
          <el-button
            slot="link"
            :disabled="!hasPostmanData"
            icon="ri-article-line"
            type="text"
            @click="openPostman"
          >
            {{ $t('TestReport.DetailReport') }}
          </el-button>
        </div>
      </caption>
      <tbody>
        <tr>
          <th id="">{{ $t('DevSecOps.Tools') }}</th>
          <th id="">{{ $t('Version.Version') }}</th>
          <th id="">{{ $t('Plugins.postman.TestPass') }}</th>
          <th id="">{{ $t('Plugins.postman.TestFail') }}</th>
        </tr>
        <tr>
          <td :data-label="$t('DevSecOps.Tools')">Postman</td>
          <td :data-label="$t('Version.Version')">
            {{ postman[0]?.version_info ? postman[0]?.version_info : '-' }}
          </td>
          <template v-if="hasPostmanData">
            <td :data-label="$t('Plugins.postman.TestPass')">
              <span v-if="hasEachItemData('success')">{{
                postman[0].success
              }}</span>
              <span v-else>-</span>
            </td>
            <td :data-label="$t('Postman.TestFail')">
              <span v-if="hasEachItemData('failure')">{{
                postman[0].failure
              }}</span>
              <span v-else>-</span>
            </td>
          </template>
          <template v-else>
            <td class="nodata" colspan="2">{{ $t('general.NoData') }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Postman',
  props: {
    postman: {
      type: Array,
      default: () => []
    },
    listLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    hasPostmanData() {
      return !!(
        this.postman &&
        this.postman[0] &&
        (this.hasEachItemData('success') || this.hasEachItemData('failure'))
      )
    },
    hasEachItemData() {
      return (key) => !!this.postman[0].hasOwnProperty(key)
    }
  },
  methods: {
    openPostman() {
      const { id } = this.postman[0]
      const routeUrl = this.$router.resolve({
        name: 'PostmanTestCase',
        params: { id }
      })
      window.open(routeUrl.href, '_blank')
    }
  }
}
</script>
