/**
 * Object is named by each folder name, used as html tag like ex: location="<Object>"
 * Keys are from api, and values are from element tag type
 */

export const accountManage = {
  enable: 'success',
  disable: 'danger',
  default: 'success'
}

export const projectListPM = {
  in_progress: 'success',
  not_started: 'info',
  overdue: 'danger',
  default: ''
}

export const pipelines = {
  Failed: 'danger',
  Finished: 'success',
  Aborted: 'warning',
  Waiting: 'slow',
  Building: 'success',
  default: 'info'
}

export const projectVersions = {
  open: 'success',
  closed: 'danger',
  default: 'slow'
}

export const sideex = {
  Finished: 'success',
  Scanning: 'slow',
  Aborted: 'info',
  Failed: 'danger',
  default: 'slow'
}

export const testCasePostman = {
  Fail: 'danger',
  Pass: 'success'
}

export const webInspect = {
  Complete: 'success',
  Running: 'slow',
  NotRunning: 'warning',
  Interrupted: 'danger',
  default: 'slow'
}

export const checkMarx = {
  New: 'info',
  PreScan: 'slow',
  Queued: 'slow',
  Done: 'slow',
  ChxQueued: 'slow',
  Scanning: 'slow',
  PostScan: 'slow',
  Finished: 'success',
  Canceled: 'warning',
  Deleted: 'danger',
  Failed: 'danger',
  Timeout: 'danger',
  default: 'slow'
}

export const sbom = {
  Success: 'success',
  Running: 'slow',
  Fail: 'danger'
}

export const zap = {
  Finished: 'success',
  Scanning: 'slow',
  Aborted: 'info',
  Failed: 'danger',
  default: 'slow'
}

export const cmas = {
  SUCCESS: 'success',
  RUNNING: 'slow',
  NOT_FOUND: 'danger'
}

export const systemRegistry = {
  Active: 'success',
  Removing: 'warning'
}

export const systemSecrets = {
  Active: 'success',
  Removing: 'warning'
}

export const docker = {
  Success: 'success',
  Complete: 'slow',
  Scanning: 'warning',
  Queued: 'info',
  'Not Scanned': 'slow',
  Critical: 'danger',
  High: 'warning',
  Medium: 'slow',
  Low: 'primary',
  Negligible: 'success',
  Unknown: 'info',
  Running: 'warning',
  Error: 'danger',
  Pending: 'slow',
  Stopped: 'slow',
  Scheduled: 'warning'
}
