// VCSM i18n assembly — merges shared platform dictionaries with app-specific namespaces.
// Pass the result to <I18nProvider dictionary={dictionary}> in main.jsx.

import common from '@platform/i18n/en/common.json'
import actions from '@platform/i18n/en/actions.json'
import errors from '@platform/i18n/en/errors.json'
import status from '@platform/i18n/en/status.json'
import state from '@platform/i18n/en/state.json'
import time from '@platform/i18n/en/time.json'
import auth from '@platform/i18n/en/auth.json'
import notifications from '@platform/i18n/en/notifications.json'

import booking from './en/booking.json'
import vport from './en/vport.json'
import feed from './en/feed.json'
import social from './en/social.json'
import content from './en/content.json'

export const vcsmDictionary = {
  common,
  actions,
  errors,
  status,
  state,
  time,
  auth,
  notifications,
  booking,
  vport,
  feed,
  social,
  content,
}
