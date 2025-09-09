// src/data/data.js
import * as auth from './auth';
import * as postsDAL from './posts';      // posts/comments/reactions/roses DAL
import * as stories from './stories';
import * as vdrops from './vdrops';
import * as profiles from './profiles';
import * as feed from './feed';
import * as notifications from './notifications';
import * as chatDAL from './chat';
import * as search from './search';
import * as blocks from './blocks';       // ✅ NEW: user blocks

// -------- Normalize module shapes (no .default probing) --------
const PROFILES = profiles;
const FEED = feed;
const NOTI = notifications;
const CHAT = chatDAL;
const SEARCH = search;
const BLOCKS = blocks;
const STORIES = stories;
const VDW = vdrops;
const AUTH = auth;

// ---- Resolve possible export shapes (named, namespaced, default-like) ----
const NS_COMMENTS   = postsDAL.comments           ?? {};
const NS_REACTIONS  = postsDAL.reactions          ?? {};
const NS_ROSES      = postsDAL.roses              ?? {};

// Prefer named exports when present; fallback to namespace.
const comments_listTopLevel = postsDAL.listTopLevel ?? NS_COMMENTS.listTopLevel;
const comments_listReplies  = postsDAL.listReplies  ?? NS_COMMENTS.listReplies;
const comments_create       = postsDAL.create       ?? NS_COMMENTS.create;
const comments_update       = postsDAL.update       ?? NS_COMMENTS.update;
const comments_remove       = postsDAL.remove       ?? NS_COMMENTS.remove;
const comments_likes_get    = postsDAL.getLikes     ?? NS_COMMENTS.getLikes;
const comments_likes_set    = postsDAL.setLike      ?? NS_COMMENTS.setLike;

const reactions_listForPost  = postsDAL.listForPost   ?? NS_REACTIONS.listForPost;
const reactions_setForPost   = postsDAL.setForPost    ?? NS_REACTIONS.setForPost;
const reactions_clearForPost = postsDAL.clearForPost  ?? NS_REACTIONS.clearForPost;

const roses_count = postsDAL.count ?? NS_ROSES.count;
const roses_give  = postsDAL.give  ?? NS_ROSES.give;

if (import.meta?.env?.DEV) {
  const missing = [];
  if (!comments_listTopLevel) missing.push('comments.listTopLevel');
  if (!reactions_listForPost) missing.push('reactions.listForPost');
  if (!reactions_setForPost)  missing.push('reactions.setForPost');
  if (!roses_count)           missing.push('roses.count');
  if (!CHAT?.sendMessage)     missing.push('chat.sendMessage');          // ✨ helpful dev warning
  if (!NOTI?.listForUser)     missing.push('notifications.listForUser'); // ✨ helpful dev warning
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn('[data] Missing DAL bindings:', missing.join(', '));
  }
}

/**
 * Single entry-point for all data access.
 * UI should import ONLY from here:  import { db } from '@/data/data'
 */
export const db = {
  /* ------------------------------ Auth ------------------------------ */
  auth: {
    getAuthUser: AUTH.getAuthUser,
    signInWithPassword: AUTH.signInWithPassword,
    signOut: AUTH.signOut,
  },

  /* ---------------------------- Profiles ---------------------------- */
  profiles: {
    // granular namespaces
    users: PROFILES.users,
    vports: PROFILES.vports,
    followers: PROFILES.followers,
    vportSubscribers: PROFILES.vportSubscribers,

    // convenience helpers already in your module
    exists: PROFILES.exists,
    getAuthor: PROFILES.getAuthor,

    // tiny shim used by PrivacyToggle; delegates to users.update
    async setPrivacy({ userId, isPrivate }) {
      return PROFILES.users.update(userId, { private: !!isPrivate });
    },
  },

  /* ------------------------------ Blocks ---------------------------- */
  // ✅ NEW: expose block/unblock APIs for PrivacyTab
  blocks: {
    list: BLOCKS.listBlockedByMe,
    blockByUserId: BLOCKS.blockByUserId,
    blockByUsername: BLOCKS.blockByUsername,
    unblock: BLOCKS.unblock,
    isBlocked: BLOCKS.isBlocked, // optional helper for feed/search filters
  },

  /* ------------------------------ Posts ----------------------------- */
  posts: {
    createUserPost: postsDAL.createUserPost,
    createVportPost: postsDAL.createVportPost,
    softDeleteUserPost: postsDAL.softDeleteUserPost,
    hardDeleteVportPost: postsDAL.hardDeleteVportPost,
  },

  /* ----------------------------- Comments --------------------------- */
  comments: {
    listTopLevel: comments_listTopLevel,
    listReplies:  comments_listReplies,
    create:       comments_create,
    update:       comments_update,
    remove:       comments_remove,
    likes: {
      get: comments_likes_get,
      set: comments_likes_set,
    },
  },

  /* ---------------------------- Reactions --------------------------- */
  reactions: {
    listForPost:  reactions_listForPost,
    setForPost:   reactions_setForPost,
    clearForPost: reactions_clearForPost,
  },

  /* ------------------------------ Roses ----------------------------- */
  roses: {
    count: roses_count,
    give:  roses_give,
  },

  /* ------------------------------ Stories --------------------------- */
  stories: {
    createUserStory: STORIES.createUserStory,
    createVportStory: STORIES.createVportStory,
    listUserStories: STORIES.listUserStories,
    listVportStories: STORIES.listVportStories,
    softDeleteUserStory: STORIES.softDeleteUserStory,
    softDeleteVportStory: STORIES.softDeleteVportStory,
    logUserStoryView: STORIES.logUserStoryView,
    logVportStoryView: STORIES.logVportStoryView,
    getUserStoryUniqueViewers: STORIES.getUserStoryUniqueViewers,
    getVportStoryUniqueViewers: STORIES.getVportStoryUniqueViewers,
    reactToUserStory: STORIES.reactToUserStory,
    reactToVportStory: STORIES.reactToVportStory,

    // expose reaction list APIs used by Viewby / VportViewby
    listUserStoryReactions: STORIES.listUserStoryReactions,
    listVportStoryReactions: STORIES.listVportStoryReactions,

    // unified shims
    async setStoryReaction({ storyId, emoji, isVport = false, ...rest }) {
      return isVport
        ? STORIES.reactToVportStory({ storyId, emoji, ...rest })
        : STORIES.reactToUserStory({ storyId, emoji, ...rest });
    },
    async logStoryView({ storyId, isVport = false, userId }) {
      return isVport
        ? STORIES.logVportStoryView({ storyId, userId })
        : STORIES.logUserStoryView({ storyId, userId });
    },
  },

  /* ------------------------------- VDROP ---------------------------- */
  vdrops: {
    createUserVdrop: VDW.createUserVdrop,
    createVportVdrop: VDW.createVportVdrop,
  },

  /* ------------------------------- Feed ----------------------------- */
  feed: {
    fetchPage: FEED.fetchPage,
    getViewerIsAdult: FEED.getViewerIsAdult,
  },

  /* --------------------------- Notifications ------------------------ */
  notifications: {
    // reads/mutations
    listForUser: NOTI.listForUser,
    markAsRead: NOTI.markAsRead,
    markAllSeen: NOTI.markAllSeen,   // <-- add
    markAllRead: NOTI.markAllRead,   // <-- add (used by BottomNavBar)
    remove: NOTI.remove,

    // creators
    notifyStoryReaction: NOTI.notifyStoryReaction,
    notifyPostReaction:  NOTI.notifyPostReaction,
    notifyPostLike:      NOTI.notifyPostLike,
    notifyPostDislike:   NOTI.notifyPostDislike,
    notifyFollow:        NOTI.notifyFollow,
    notifyPostReported:  NOTI.notifyPostReported,
  },

  /* -------------------------------- Chat ---------------------------- */
  chat: {
    getOrCreateDirect: CHAT.getOrCreateDirect,
    listConversations: CHAT.listConversations,
    listMessages: CHAT.listMessages,
    sendMessage: CHAT.sendMessage,
    setMuted: CHAT.setMuted,
    setArchived: CHAT.setArchived,
    clearHistoryBefore: CHAT.clearHistoryBefore,

    getOrCreateVport: CHAT.getOrCreateVport,
    listVportConversations: CHAT.listVportConversations,
    listVportMessages: CHAT.listVportMessages,
    sendVportMessage: CHAT.sendVportMessage,
    markConversationRead: CHAT.markConversationRead,
    markAllConversationsRead: CHAT.markAllConversationsRead,
  },

  /* -------------------------------- Search -------------------------- */
  search: {
    users:   SEARCH.searchUsers,
    vports:  SEARCH.searchVports,
    posts:   SEARCH.searchPosts,
    videos:  SEARCH.searchVideos,
    groups:  SEARCH.searchGroups,
    all:     SEARCH.searchAll,

    // aliases
    searchUsers:   SEARCH.searchUsers,
    searchVports:  SEARCH.searchVports,
    searchPosts:   SEARCH.searchPosts,
    searchVideos:  SEARCH.searchVideos,
    searchGroups:  SEARCH.searchGroups,
  },
};

export default db;

// Also export raw modules for occasional direct use.
export {
  auth as auth,                // keep original star import available
  postsDAL as posts,
  stories as storiesRaw,
  vdrops as vdropsRaw,
  profiles as profilesRaw,
  blocks as blocksRaw,         // ✅ NEW
  feed as feedRaw,
  notifications as notificationsRaw,
  chatDAL as chatRaw,
  search as searchRaw,
};
