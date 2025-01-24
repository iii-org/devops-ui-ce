import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export function ics(event) {
  const { id, subject, description, begin, stop, location } = event

  const formatDateTime = (dateStr, last) => {
    let date = dayjs(dateStr)
    if (last) date = date.hour(24)
    date = date.format('YYYYMMDDTHHmmss')
    return date
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `UID:${event.uid || new Date().toISOString()}`,
    'DESCRIPTION:' +
      (description.match(`href=['"](?<url>.*?)['"]`).groups.url || description),
    `DTSTAMP:${formatDateTime(new Date())}`,
    `DTSTART:${formatDateTime(begin)}`,
    `DTEND:${formatDateTime(stop, true)}`,
    'LOCATION:' + location,
    'SUMMARY;LANGUAGE=en-us:' + subject,
    'LOCATION:' + location,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `Issue-${id || subject}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
