// Reserved for events exclusively owned by the bottom-bar module.
//
// noti:refresh is NOT owned here — it is a platform-wide event dispatched
// from notifications, social/friend, and settings features in addition to
// BottomNavBar. Centralizing it here would create inverted cross-feature
// dependencies (notifications importing from shell/bottom-bar).
// The canonical constant for noti:refresh lives in bootstrap.hydrate.controller.js.
