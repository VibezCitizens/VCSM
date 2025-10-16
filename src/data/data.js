// src/data/data.js
import * as auth from './user/auth';
import * as profiles from './user/profiles';
import blocks from './user/blocks/blocks';
import * as vport from './vport/vprofile/vport.js'; // VPORT profile CRUD (createVport, listMyVports, etc.)
import * as voidData from './void/void';

import * as comments from './user/post/comments';    // user/profile comments
import * as reactions from './user/post/reactions';  // user/profile reactions (👍/👎)
import * as roses from './user/post/roses';          // user/profile roses
import search from './user/search/search';

// VPORT-scoped post modules
import vpostReactions from './vport/vpost/reactions'; // default export
import vpostComments  from './vport/vpost/comments';  // default export
import vpostRoses     from './vport/vpost/roses';     // default export

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
      reactions: vpostReactions, // db.vport.post.reactions.setForPost/clearForPost/getMyReactionForPost/listForPost
      comments : vpostComments,  // db.vport.post.comments.create/listTopLevel/remove/update
      roses    : vpostRoses,     // db.vport.post.roses.give/count (give-only; cannot receive)
    },
  },
  void: { ...voidData },

  // User/profile-scoped post APIs
  comments : { ...comments },
  reactions: { ...reactions },
  roses    : { ...roses },

  search,
});

export default db;
