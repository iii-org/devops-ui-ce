<template>
  <span>
    <span v-if="device === 'desktop'">
      <el-tooltip :content="$t('Issue.AddToCalendar')" placement="top">
        <el-dropdown trigger="hover">
          <el-button circle size="small">
            <em class="el-icon-date"></em>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item>
              <div @click="addToCalendar('google')">
                <svg-icon class="text-md" icon-class="google" />
                <span>Google</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div @click="addToCalendar('microsoft')">
                <svg-icon class="text-md" icon-class="microsoft" />
                <span>Outlook.com</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div @click="addToCalendar('office365')">
                <svg-icon class="text-md" icon-class="office365" />
                <span>Microsoft 365</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item>
              <div @click="addToCalendar('ics')">
                <svg-icon class="text-md" icon-class="ical" />
                <span>ICalendar</span>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-tooltip>
    </span>
    <div v-else>
      <div @click="addToCalendar('google')">
        <svg-icon class="text-lg mx-2" icon-class="google" />
        <span>Google</span>
      </div>
      <el-divider />
      <div>
        <div @click="addToCalendar('microsoft')">
          <svg-icon class="text-lg mx-2" icon-class="microsoft" />
          <span>Outlook.com</span>
        </div>
      </div>
      <el-divider />
      <div>
        <div @click="addToCalendar('office365')">
          <svg-icon class="text-lg mx-2" icon-class="office365" />
          <span>Microsoft 365</span>
        </div>
      </div>
      <el-divider />
      <div>
        <div @click="addToCalendar('ics')">
          <svg-icon class="text-lg mx-2" icon-class="ical" />
          <span>ICalendar</span>
        </div>
      </div>
    </div>
  </span>
</template>

<script>
import { calendarUrl } from '@shared/utils/addToCalendar'
import { getLocalTime } from '@shared/utils/handleTime'
import { ics } from '@shared/utils/ics'
import { mapGetters } from 'vuex'

export default {
  name: 'AddToCalendar',
  props: {
    issueId: {
      type: [String, Number],
      default: null
    },
    form: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    ...mapGetters(['tracker', 'device'])
  },
  methods: {
    addToCalendar(type) {
      if (type) {
        const { subject, start_date, due_date, tracker_id } = this.form
        if (subject) {
          const trackerName = this.$t(
            `Issue.${this.tracker.find((item) => item.id === tracker_id).name}`
          )
          const title = `${trackerName} #${this.issueId}: ${subject}`
          const link = `${window.location.origin}/#/project/issues/${this.issueId}`
          const description = title.link(link)
          const data = {
            type: type,
            title: subject,
            details: description,
            start: start_date,
            end: due_date
          }
          if (type === 'ics') {
            ics({
              id: this.issueId,
              subject: subject,
              description,
              begin: getLocalTime(start_date),
              stop: getLocalTime(due_date),
              location: ''
            })
            return
          }
          window.open(calendarUrl(data))
        }
      }
    }
  }
}
</script>
