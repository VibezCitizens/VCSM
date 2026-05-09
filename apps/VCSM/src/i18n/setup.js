// VCSM i18n assembly — merges shared platform dictionaries with app-specific namespaces.
// Pass the result to <VcsmI18nProvider locale={locale} dictionary={dictionary}> in main.jsx.

import commonEn from '@i18n/en/common.json'
import actionsEn from '@i18n/en/actions.json'
import errorsEn from '@i18n/en/errors.json'
import statusEn from '@i18n/en/status.json'
import stateEn from '@i18n/en/state.json'
import timeEn from '@i18n/en/time.json'
import authEn from '@i18n/en/auth.json'
import notificationsEn from '@i18n/en/notifications.json'

import commonEs from '@i18n/es/common.json'
import actionsEs from '@i18n/es/actions.json'
import errorsEs from '@i18n/es/errors.json'
import statusEs from '@i18n/es/status.json'
import stateEs from '@i18n/es/state.json'
import timeEs from '@i18n/es/time.json'
import authEs from '@i18n/es/auth.json'
import notificationsEs from '@i18n/es/notifications.json'

import appNotificationsEn from './en/notifications.json'
import profileEn from './en/profile.json'
import bookingEn from './en/booking.json'
import vportEn from './en/vport.json'
import feedEn from './en/feed.json'
import socialEn from './en/social.json'
import contentEn from './en/content.json'
import navEn from './en/nav.json'
import appAuthEn from './en/auth.json'
import settingsEn from './en/settings.json'
import uploadEn from './en/upload.json'
import exploreEn from './en/explore.json'
import voxEn from './en/vox.json'

import appNotificationsEs from './es/notifications.json'
import profileEs from './es/profile.json'
import bookingEs from './es/booking.json'
import vportEs from './es/vport.json'
import feedEs from './es/feed.json'
import socialEs from './es/social.json'
import contentEs from './es/content.json'
import navEs from './es/nav.json'
import appAuthEs from './es/auth.json'
import settingsEs from './es/settings.json'
import uploadEs from './es/upload.json'
import exploreEs from './es/explore.json'
import voxEs from './es/vox.json'

export const vcsmDictionaryEn = {
  common: commonEn,
  actions: actionsEn,
  errors: errorsEn,
  status: statusEn,
  state: stateEn,
  time: timeEn,
  // engine auth keys + VCSM-specific auth copy merged — app keys take precedence
  auth: { ...authEn, ...appAuthEn },
  notifications: { ...notificationsEn, ...appNotificationsEn },
  profile: profileEn,
  booking: bookingEn,
  vport: vportEn,
  feed: feedEn,
  social: socialEn,
  content: contentEn,
  nav: navEn,
  settings: settingsEn,
  upload: uploadEn,
  explore: exploreEn,
  vox: voxEn,
}

export const vcsmDictionaryEs = {
  common: commonEs,
  actions: actionsEs,
  errors: errorsEs,
  status: statusEs,
  state: stateEs,
  time: timeEs,
  auth: { ...authEs, ...appAuthEs },
  notifications: { ...notificationsEs, ...appNotificationsEs },
  profile: profileEs,
  booking: bookingEs,
  vport: vportEs,
  feed: feedEs,
  social: socialEs,
  content: contentEs,
  nav: navEs,
  settings: settingsEs,
  upload: uploadEs,
  explore: exploreEs,
  vox: voxEs,
}

export const dictionaries = {
  en: vcsmDictionaryEn,
  es: vcsmDictionaryEs,
}

// Legacy export — kept for any remaining direct imports during transition.
export const vcsmDictionary = vcsmDictionaryEn
