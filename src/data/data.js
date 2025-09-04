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

// ---- Resolve possible export shapes (named, namespaced, default) ----
const NS_COMMENTS   = postsDAL.comments           ?? postsDAL.default?.comments           ?? {};
const NS_REACTIONS  = postsDAL.reactions          ?? postsDAL.default?.reactions          ?? {};
const NS_ROSES      = postsDAL.roses              ?? postsDAL.default?.roses              ?? {};

// Prefer named exports when present; fallback to namespace; then default root.
const comments_listTopLevel = postsDAL.listTopLevel ?? NS_COMMENTS.listTopLevel ?? postsDAL.default?.listTopLevel;
const comments_listReplies  = postsDAL.listReplies  ?? NS_COMMENTS.listReplies  ?? postsDAL.default?.listReplies;
const comments_create       = postsDAL.create       ?? NS_COMMENTS.create       ?? postsDAL.default?.create;
const comments_update       = postsDAL.update       ?? NS_COMMENTS.update       ?? postsDAL.default?.update;
const comments_remove       = postsDAL.remove       ?? NS_COMMENTS.remove       ?? postsDAL.default?.remove;
// AFTER
const comments_likes_get    = postsDAL.getLikes     ?? NS_COMMENTS.getLikes     ?? postsDAL.default?.getLikes;
const comments_likes_set    = postsDAL.setLike      ?? NS_COMMENTS.setLike      ?? postsDAL.default?.setLike;

const reactions_listForPost = postsDAL.listForPost  ?? NS_REACTIONS.listForPost ?? postsDAL.default?.listForPost;
const reactions_setForPost  = postsDAL.setForPost   ?? NS_REACTIONS.setForPost  ?? postsDAL.default?.setForPost;
const reactions_clearForPost= postsDAL.clearForPost ?? NS_REACTIONS.clearForPost?? postsDAL.default?.clearForPost;

const roses_count           = postsDAL.count        ?? NS_ROSES.count           ?? postsDAL.default?.count;
const roses_give            = postsDAL.give         ?? NS_ROSES.give            ?? postsDAL.default?.give;

if (import.meta?.env?.DEV) {
  const missing = [];
  if (!comments_listTopLevel) missing.push('comments.listTopLevel');
  if (!reactions_listForPost) missing.push('reactions.listForPost');
  if (!reactions_setForPost)  missing.push('reactions.setForPost');
  if (!roses_count)           missing.push('roses.count');
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
    getAuthUser: auth.getAuthUser,
    signInWithPassword: auth.signInWithPassword,
    signOut: auth.signOut,
  },

  /* ---------------------------- Profiles ---------------------------- */
  profiles: {
    // granular namespaces
    users: profiles.users,
    vports: profiles.vports,
    followers: profiles.followers,
    vportSubscribers: profiles.vportSubscribers,

    // convenience helpers already in your module
    exists: profiles.exists,
    getAuthor: profiles.getAuthor,

    // tiny shim used by PrivacyToggle; delegates to users.update
    async setPrivacy({ userId, isPrivate }) {
      return profiles.users.update(userId, { private: !!isPrivate });
    },
  },

  /* ------------------------------ Blocks ---------------------------- */
  // ✅ NEW: expose block/unblock APIs for PrivacyTab
  blocks: {
    list: blocks.listBlockedByMe,
    blockByUserId: blocks.blockByUserId,
    blockByUsername: blocks.blockByUsername,
    unblock: blocks.unblock,
    isBlocked: blocks.isBlocked, // optional helper for feed/search filters
  },

  /* ------------------------------ Posts ----------------------------- */
  posts: {
    createUserPost: postsDAL.createUserPost ?? postsDAL.default?.createUserPost,
    createVportPost: postsDAL.createVportPost ?? postsDAL.default?.createVportPost,
    softDeleteUserPost: postsDAL.softDeleteUserPost ?? postsDAL.default?.softDeleteUserPost,
    hardDeleteVportPost: postsDAL.hardDeleteVportPost ?? postsDAL.default?.hardDeleteVportPost,
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
    createUserStory: stories.createUserStory,
    createVportStory: stories.createVportStory,
    listUserStories: stories.listUserStories,
    listVportStories: stories.listVportStories,
    softDeleteUserStory: stories.softDeleteUserStory,
    softDeleteVportStory: stories.softDeleteVportStory,
    logUserStoryView: stories.logUserStoryView,
    logVportStoryView: stories.logVportStoryView,
    getUserStoryUniqueViewers: stories.getUserStoryUniqueViewers,
    getVportStoryUniqueViewers: stories.getVportStoryUniqueViewers,
    reactToUserStory: stories.reactToUserStory,
    reactToVportStory: stories.reactToVportStory,

    // expose reaction list APIs used by Viewby / VportViewby
    listUserStoryReactions: stories.listUserStoryReactions,
    listVportStoryReactions: stories.listVportStoryReactions,

    // unified shims
    async setStoryReaction({ storyId, emoji, isVport = false, ...rest }) {
      return isVport
        ? stories.reactToVportStory({ storyId, emoji, ...rest })
        : stories.reactToUserStory({ storyId, emoji, ...rest });
    },
    async logStoryView({ storyId, isVport = false, userId }) {
      return isVport
        ? stories.logVportStoryView({ storyId, userId })
        : stories.logUserStoryView({ storyId, userId });
    },
  },

  /* ------------------------------- VDROP ---------------------------- */
  vdrops: {
    createUserVdrop: vdrops.createUserVdrop,
    createVportVdrop: vdrops.createVportVdrop,
  },

  /* ------------------------------- Feed ----------------------------- */
  feed: {
    fetchPage: feed.fetchPage,
    getViewerIsAdult: feed.getViewerIsAdult,
  },

  /* --------------------------- Notifications ------------------------ */
  notifications: {
    listForUser: notifications.listForUser,
    markAsRead: notifications.markAsRead,
    remove: notifications.remove,
    notifyStoryReaction: notifications.notifyStoryReaction,
  },

  /* -------------------------------- Chat ---------------------------- */
  chat: {
    getOrCreateDirect: chatDAL.getOrCreateDirect,
    listConversations: chatDAL.listConversations,
    listMessages: chatDAL.listMessages,
    sendMessage: chatDAL.sendMessage,
    setMuted: chatDAL.setMuted,
    setArchived: chatDAL.setArchived,
    clearHistoryBefore: chatDAL.clearHistoryBefore,

    getOrCreateVport: chatDAL.getOrCreateVport,
    listVportConversations: chatDAL.listVportConversations,
    listVportMessages: chatDAL.listVportMessages,
    sendVportMessage: chatDAL.sendVportMessage,
  },

  /* -------------------------------- Search -------------------------- */
  search: {
    users:  search.searchUsers,
    posts:  search.searchPosts,
    videos: search.searchVideos,
    groups: search.searchGroups,
    all:    search.searchAll,

    // aliases
    searchUsers:  search.searchUsers,
    searchPosts:  search.searchPosts,
    searchVideos: search.searchVideos,
    searchGroups: search.searchGroups,
  },
};

export default db;

// Also export raw modules for occasional direct use.
export {
  auth,
  postsDAL as posts,
  stories,
  vdrops,
  profiles,
  blocks,   // ✅ NEW
  feed,
  notifications,
  chatDAL as chat,
  search,
};
