// src/data/data.js
import * as auth from './user/auth';
import * as profiles from './user/profiles';
import blocks from './user/blocks/blocks';
import * as vport from './vport/vprofile/vport.js'; // VPORT profile CRUD (createVport, listMyVports, etc.)
import * as voidData from './void/void';

import * as comments from './user/post/comments';       // user/profile comments
import * as reactions from './user/post/reactions';     // user/profile reactions (👍/👎)
import * as roses from './user/post/roses';             // user/profile roses

// ✅ NEW: user/profile comment-like API (❤️ on comments)
import * as commentLikes from './user/post/commentLikes';

import search from './user/search/search';

// VPORT-scoped post modules
import vpostReactions from './vport/vpost/reactions';   // default export
import vpostComments  from './vport/vpost/comments';    // default export
import vpostRoses     from './vport/vpost/roses';       // default export

// ✅ NEW: vport-scoped comment-like API (❤️ on comments acting as vport)
import vpostCommentLikes from './vport/vpost/commentLikes'; // default export

function freezeDeep(obj) {
  Object.freeze(obj);
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) freezeDeep(v);
  }
  return obj;
}

export const db = freezeDeep({
  auth: { ...auth },
  profiles: { ...profiles },
  blocks,                 // adapter object with list/block APIs
  vport: {
    ...vport,             // vport profile CRUD (create/list/get/update)
    post: {
      reactions: vpostReactions,     // db.vport.post.reactions.setForPost/clearForPost/...
      comments : vpostComments,      // db.vport.post.comments.create/listTopLevel/...
      roses    : vpostRoses,         // db.vport.post.roses.give/count
      // ✅ NEW: like/unlike a COMMENT while acting as a VPORT
      commentLikes: vpostCommentLikes // { likeComment({commentId,vportId}), unlikeComment({commentId,vportId}), isCommentLiked({commentId}) }
    },
  },
  void: { ...voidData },

  // User/profile-scoped post APIs
  comments     : { ...comments },
  reactions    : { ...reactions },
  roses        : { ...roses },

  // ✅ NEW: like/unlike a COMMENT while acting as USER
  commentLikes : { ...commentLikes }, // { likeComment({commentId}), unlikeComment({commentId}), isCommentLiked({commentId}) }

  search,
});

export default db;
