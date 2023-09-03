import './assets/tailwind.css'
import Breadcrumb from './components/Breadcrumb'
import Hamburger from './components/Hamburger'
import LangSelect from './components/LangSelect'
import ProjectListSelector from './components/ProjectListSelector'
import Avatar from './components/Avatar'
import NoData from './components/NoData'
import ElSelectAll from './components/ElSelectAll'
import ElTableColumnTime from './components/ElTableColumnTime'
import ElTableColumnTag from './components/ElTableColumnTag'
import SvgIcon from './components/SvgIcon'
import Page404 from './components/404'
import ElTableResponsive from './components/ElTableResponsive'

// Layout
import Layout from './layout'
import ParentBlank from './layout/components/parentBlank'

// utils
import { calendarUrl } from './utils/addToCalendar'
import {
  getToken,
  getTokenExpiration,
  setToken,
  removeToken
} from './utils/auth'
import { btoa, atob } from './utils/base64'
import * as elementTagType from './utils/elementTagType'
import { excelTranslate } from './utils/excelTableTranslate'
import {
  getStatusTagType,
  getPriorityTagType,
  getCategoryTagType
} from './utils/getElementType'
import {
  getLocalTime,
  getRelativeTime,
  getFormatTime,
  isTimeValid,
  getDurationTime
} from './utils/handleTime'
import {
  isAllowedTypes,
  isEmptyOrTXT,
  isJSON,
  fileSizeToMB,
  containSpecialChar
} from './utils/extension'
import { CSV, EXCEL } from './utils/downloadCsvOrExcel'
import { PDF } from './utils/downloadPdf'
import getPageTitle from './utils/getPageTitle'
import { generateTitle } from './utils/i18n'
import { ics } from './utils/ics'
import { scrollTo } from './utils/scrollTo'
import { validUsername, isExternal } from './utils/validate'
import request from './utils/request'

// views
import Dashboard from './views/Overview/Dashboard/roles/admin'
import MyWorkMobile from './views/Mobile/MyWork'
import MyWork from './views/MyWork'
import QuickAddIssue from './views/MyWork/components/QuickAddIssue'
import Milestone from './views/Plan/Milestone'
import IssueBoards from './views/Project/IssueBoards'
import IssueList from './views/Project/IssueList'
import List from './views/Project/List'
import Kanban from './views/Project/IssueBoards/components/Kanban'
import Activities from './views/Activities'
import Progress from './views/Progress'
import SystemSettings from './views/SystemSettings'
import SystemVersion from './views/SystemVersion'
import SonarQube from './views/Scan/SonarQube'
import DevBranch from './views/Progress/DevBranch'
import ProjectIssueDetail from './views/Project/IssueDetail'
import { IssueMatrix, IssueNotesEditor } from './views/Project/IssueDetail/components'
import SettingRelationIssue from './views/Project/IssueList/components/SettingRelationIssue'
import ProjectOverview from './views/Plan/Overview'
import { WorkloadCard } from './views/Plan/Overview/components'
import { ProjectListPM, ProjectListQA, ProjectListRD } from './views/Overview/ProjectList'

export {
  Breadcrumb,
  Hamburger,
  LangSelect,
  ProjectListSelector,
  Avatar,
  NoData,
  ElSelectAll,
  ElTableColumnTime,
  ElTableColumnTag,
  SvgIcon,
  Page404,
  ElTableResponsive,

  // Layout
  Layout,
  ParentBlank,

  // utils
  calendarUrl,
  getToken,
  getTokenExpiration,
  setToken,
  removeToken,
  btoa,
  atob,
  elementTagType,
  excelTranslate,
  getStatusTagType,
  getPriorityTagType,
  getCategoryTagType,
  getLocalTime,
  getRelativeTime,
  getFormatTime,
  isTimeValid,
  getDurationTime,
  isAllowedTypes,
  isEmptyOrTXT,
  isJSON,
  fileSizeToMB,
  containSpecialChar,
  getPageTitle,
  generateTitle,
  ics,
  scrollTo,
  validUsername,
  isExternal,
  request,

  // views
  Dashboard,
  MyWorkMobile,
  MyWork,
  QuickAddIssue,
  Milestone,
  SonarQube,
  DevBranch,
  List,
  ProjectIssueDetail,
  IssueNotesEditor,
  IssueMatrix,
  SettingRelationIssue,
  IssueBoards,
  IssueList,
  Kanban,
  Activities,
  Progress,
  SystemSettings,
  SystemVersion,
  ProjectOverview,
  WorkloadCard,
  ProjectListPM,
  ProjectListQA,
  ProjectListRD
}

export default {
  CSV,
  EXCEL,
  PDF
}
