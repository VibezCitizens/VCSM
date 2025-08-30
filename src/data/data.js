// src/data/data.js
import * as auth from './auth';
import * as postsDAL from './posts';      // posts/comments/reactions/roses DAL
import * as stories from './stories';
import * as vdrops from './vdrops';
import * as profiles from './profiles';
import * as feed from './feed';
import * as notifications from './notifications';
import * as chatDAL from './chat';        // chat DAL
import * as search from './search';       // ← NEW: search DAL

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
    getUser: profiles.getUser,
    getVport: profiles.getVport,
    exists: profiles.exists,
    getAuthor: profiles.getAuthor,
  },

  /* ------------------------------ Posts ----------------------------- */
  // Only post CRUD; comments/reactions/roses live in their own namespaces below.
  posts: {
    createUserPost: postsDAL.createUserPost,
    createVportPost: postsDAL.createVportPost,
    softDeleteUserPost: postsDAL.softDeleteUserPost,
    hardDeleteVportPost: postsDAL.hardDeleteVportPost,
  },

  /* ----------------------------- Comments --------------------------- */
  comments: {
    listTopLevel: postsDAL.comments.listTopLevel,
    listReplies: postsDAL.comments.listReplies,
    create: postsDAL.comments.create,
    update: postsDAL.comments.update,
    remove: postsDAL.comments.remove,
    likes: {
      get: postsDAL.comments.likes.get,
      set: postsDAL.comments.likes.set,
    },
  },

  /* ---------------------------- Reactions --------------------------- */
  reactions: {
    listForPost: postsDAL.reactions.listForPost,
    setForPost: postsDAL.reactions.setForPost,
  },

  /* ------------------------------ Roses ----------------------------- */
  roses: {
    count: postsDAL.roses.count,
    give: postsDAL.roses.give,
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
    listUserStoryReactions: stories.listUserStoryReactions,
    listVportStoryReactions: stories.listVportStoryReactions,
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
    // user DMs
    getOrCreateDirect: chatDAL.getOrCreateDirect,
    listConversations: chatDAL.listConversations,
    listMessages: chatDAL.listMessages,
    sendMessage: chatDAL.sendMessage,
    setMuted: chatDAL.setMuted,
    setArchived: chatDAL.setArchived,
    clearHistoryBefore: chatDAL.clearHistoryBefore,
    // vport DMs
    getOrCreateVport: chatDAL.getOrCreateVport,
    listVportConversations: chatDAL.listVportConversations,
    listVportMessages: chatDAL.listVportMessages,
    sendVportMessage: chatDAL.sendVportMessage,
  },

  /* -------------------------------- Search -------------------------- */
  search: {
    // canonical
    users:  search.searchUsers,
    posts:  search.searchPosts,
    videos: search.searchVideos,
    groups: search.searchGroups,
    all:    search.searchAll,
    // aliases (if any older code calls these)
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
  feed,
  notifications,
  chatDAL as chat,
  search, // ← export raw search module
};
