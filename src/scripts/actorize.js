// scripts/actorize.js
// Actor-only codemod for Supabase queries.
// Cautious, table-specific rewrites. Creates .bak backups.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'src');
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

// Per-table rewrite rules
const TABLE_RULES = [
  // posts
  {
    table: "posts",
    schema: "vc",
    replaceEq: [["user_id", "actor_id"]],
    dropInsertKeys: ["user_id"],
    ensureInsertKeys: ["actor_id"],
  },
  // post_comments
  {
    table: "post_comments",
    schema: "vc",
    replaceEq: [["user_id", "actor_id"]],
    dropInsertKeys: ["user_id"],
    ensureInsertKeys: ["actor_id"],
  },
  // post_reactions
  {
    table: "post_reactions",
    schema: "vc",
    replaceEq: [["user_id", "actor_id"]],
    dropInsertKeys: ["user_id"],
    ensureInsertKeys: ["actor_id"],
  },
  // comment_likes
  {
    table: "comment_likes",
    schema: "vc",
    replaceEq: [["user_id", "actor_id"]],
    dropInsertKeys: ["user_id"],
    ensureInsertKeys: ["actor_id"],
  },
  // inbox_entries
  {
    table: "inbox_entries",
    schema: "vc",
    replaceEq: [
      ["owner_user_id", "owner_actor_id"],
      ["partner_user_id", "partner_actor_id"],
    ],
    dropInsertKeys: ["owner_user_id", "owner_vport_id", "partner_user_id", "partner_vport_id", "partner_kind"],
    ensureInsertKeys: ["owner_actor_id"], // partner may be set by server logic
  },
  // messages
  {
    table: "messages",
    schema: "vc",
    replaceEq: [["sender_user_id", "sender_actor_id"]],
    dropInsertKeys: ["sender_user_id", "sender_vport_id"],
    ensureInsertKeys: ["sender_actor_id"],
  },
  // conversation_participants
  {
    table: "conversation_participants",
    schema: "vc",
    replaceEq: [["user_id", "actor_id"]],
    dropInsertKeys: ["user_id", "vport_id"],
    ensureInsertKeys: ["actor_id"],
  },
  // conversations
  {
    table: "conversations",
    schema: "vc",
    replaceEq: [
      ["created_by_user_id", "created_by_actor_id"],
      ["user_a_id", "actor_a_id"],
      ["user_b_id", "actor_b_id"],
    ],
    dropInsertKeys: ["created_by_user_id", "created_by_vport_id", "user_a_id", "user_b_id", "vport_id"],
    ensureInsertKeys: ["created_by_actor_id"],
  },
  // notifications
  {
    table: "notifications",
    schema: "vc",
    replaceEq: [["user_id", "recipient_actor_id"]],
    dropInsertKeys: ["user_id", "vport_id"],
    ensureInsertKeys: ["recipient_actor_id","actor_id"],
  },
  // friend_ranks
  {
    table: "friend_ranks",
    schema: "vc",
    replaceEq: [["owner_id", "owner_actor_id"], ["friend_id", "friend_actor_id"]],
    dropInsertKeys: ["owner_id", "friend_id"],
    ensureInsertKeys: ["owner_actor_id", "friend_actor_id"],
  },
  // social_follow_requests
  {
    table: "social_follow_requests",
    schema: "vc",
    replaceEq: [["requester_id", "requester_actor_id"], ["target_id", "target_actor_id"]],
    dropInsertKeys: ["requester_id", "target_id"],
    ensureInsertKeys: ["requester_actor_id", "target_actor_id"],
  },
  // user_blocks
  {
    table: "user_blocks",
    schema: "vc",
    replaceEq: [["blocker_id", "blocker_actor_id"], ["blocked_id", "blocked_actor_id"]],
    dropInsertKeys: ["blocker_id", "blocked_id"],
    ensureInsertKeys: ["blocker_actor_id", "blocked_actor_id"],
  },
];

const FILES = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (EXT.has(path.extname(p))) FILES.push(p);
  }
}

walk(ROOT);

let changed = 0;
let inspected = 0;

for (const file of FILES) {
  inspected++;
  let src = fs.readFileSync(file, 'utf8');
  let orig = src;

  for (const rule of TABLE_RULES) {
    // only touch files referencing this table name
    const tablePattern = new RegExp(
      String.raw`\.schema\(['"]${rule.schema}['"]\)\s*\.from\(['"]${rule.table}['"]\)`,
      'm'
    );
    if (!tablePattern.test(src)) continue;

    // 1) Replace .eq('old', X) -> .eq('new', X)
    for (const [oldK, newK] of rule.replaceEq) {
      const eqRe = new RegExp(String.raw`\.eq\(\s*['"]${oldK}['"]\s*,`, 'g');
      src = src.replace(eqRe, `.eq('${newK}',`);
    }

    // 2) Rewrite insert object keys: drop legacy keys, ensure actor keys exist (do not invent values)
    //   naive but effective for typical `.insert({ ... })`
    const insertRe = new RegExp(
      String.raw`(\.from\(['"]${rule.table}['"]\)\s*\.\s*insert\()\s*({[\s\S]*?})`,
      'gm'
    );
    src = src.replace(insertRe, (m, head, obj) => {
      let text = obj;

      for (const k of rule.dropInsertKeys || []) {
        // remove `k: something,` patterns (handles spaces/newlines)
        const kRe = new RegExp(String.raw`${k}\s*:\s*[^,}]+,\s*`, 'gm');
        text = text.replace(kRe, '');
        // remove trailing last-prop without comma
        const kTrail = new RegExp(String.raw`,\s*${k}\s*:\s*[^,}]+`, 'gm');
        text = text.replace(kTrail, '');
      }

      // ensure keys: if not present, leave it (we don't auto-add values),
      // developers already pass actorId in the calling scope.
      // We only warn by comment if missing.
      for (const need of rule.ensureInsertKeys || []) {
        const present = new RegExp(String.raw`${need}\s*:`, 'm').test(text);
        if (!present) {
          // add a hint comment once inside the object
          const at = text.indexOf('{') + 1;
          text =
            text.slice(0, at) +
            ` /* TODO:set ${need} */ ` +
            text.slice(at);
        }
      }

      return `${head}${text}`;
    });
  }

  if (src !== orig) {
    fs.writeFileSync(file + '.bak', orig, 'utf8');
    fs.writeFileSync(file, src, 'utf8');
    changed++;
    console.log('updated:', path.relative(process.cwd(), file));
  }
}

console.log(`\nInspected ${inspected} files. Updated ${changed} file(s). Backups written as *.bak`);
