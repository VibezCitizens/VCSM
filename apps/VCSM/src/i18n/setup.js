// VCSM i18n assembly — merges shared platform dictionaries with app-specific namespaces.
// Pass the result to <VcsmI18nProvider locale={locale} dictionary={dictionary}> in main.jsx.

import commonEn from '@platform/i18n/en/common.json'
import actionsEn from '@platform/i18n/en/actions.json'
import errorsEn from '@platform/i18n/en/errors.json'
import statusEn from '@platform/i18n/en/status.json'
import stateEn from '@platform/i18n/en/state.json'
import timeEn from '@platform/i18n/en/time.json'
import authEn from '@platform/i18n/en/auth.json'
import notificationsEn from '@platform/i18n/en/notifications.json'

import commonEs from '@platform/i18n/es/common.json'
import actionsEs from '@platform/i18n/es/actions.json'
import errorsEs from '@platform/i18n/es/errors.json'
import statusEs from '@platform/i18n/es/status.json'
import stateEs from '@platform/i18n/es/state.json'
import timeEs from '@platform/i18n/es/time.json'
import authEs from '@platform/i18n/es/auth.json'
import notificationsEs from '@platform/i18n/es/notifications.json'

import bookingEn from './en/booking.json'
import vportEn from './en/vport.json'
import feedEn from './en/feed.json'
import socialEn from './en/social.json'
import contentEn from './en/content.json'

import bookingEs from './es/booking.json'
import vportEs from './es/vport.json'
import feedEs from './es/feed.json'
import socialEs from './es/social.json'
import contentEs from './es/content.json'

export const vcsmDictionaryEn = {
  common: commonEn,
  actions: actionsEn,
  errors: errorsEn,
  status: statusEn,
  state: stateEn,
  time: timeEn,
  auth: authEn,
  notifications: notificationsEn,
  booking: bookingEn,
  vport: vportEn,
  feed: feedEn,
  social: socialEn,
  content: contentEn,
}

export const vcsmDictionaryEs = {
  common: commonEs,
  actions: actionsEs,
  errors: errorsEs,
  status: statusEs,
  state: stateEs,
  time: timeEs,
  auth: authEs,
  notifications: notificationsEs,
  booking: bookingEs,
  vport: vportEs,
  feed: feedEs,
  social: socialEs,
  content: contentEs,
}

export const dictionaries = {
  en: vcsmDictionaryEn,
  es: vcsmDictionaryEs,
}

// Legacy export — kept for any remaining direct imports during transition.
export const vcsmDictionary = vcsmDictionaryEn
