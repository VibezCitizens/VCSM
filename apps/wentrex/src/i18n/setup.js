// Wentrex i18n assembly — merges shared platform dictionaries with app-specific namespaces.
// Pass the result to <I18nProvider dictionary={dictionary}> in main.jsx.

import common from '@i18n/en/common.json'
import actions from '@i18n/en/actions.json'
import errors from '@i18n/en/errors.json'
import status from '@i18n/en/status.json'
import state from '@i18n/en/state.json'
import time from '@i18n/en/time.json'
import auth from '@i18n/en/auth.json'
import notifications from '@i18n/en/notifications.json'

import courses from './en/courses.json'
import enrollments from './en/enrollments.json'
import students from './en/students.json'
import realm from './en/realm.json'
import gradebook from './en/gradebook.json'

export const wentrexDictionary = {
  common,
  actions,
  errors,
  status,
  state,
  time,
  auth,
  notifications,
  courses,
  enrollments,
  students,
  realm,
  gradebook,
}
