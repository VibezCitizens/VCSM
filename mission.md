UPDATED CHECKPOINT — WHAT’S DONE vs WHAT’S PENDING
🟢 WHAT YOU TACKLED / STABILIZED

These are real wins, not “half-done”.

✅ 1️⃣ Actor-Based Enrollment & Identity (LOCKED)

Status: DONE

Actor creation on signup works

actor_id ↔ user_id ownership is consistent

Identity context is stable across reloads

“self” resolution works (/profile/self)

Void handling intact

👉 This is non-negotiable groundwork and it’s finished.

✅ 2️⃣ Upload System (ACTOR-PURE)

Status: DONE

Posts are authored by actor_id

Media uploads scoped by actor_id

Realm enforcement delegated to DB trigger

user_id retained only for ownership/RLS

Hashtags now persist correctly (tags[])

👉 Upload is no longer a liability.

✅ 3️⃣ Chat (END-TO-END, ACTOR-AWARE)

Status: DONE / DO NOT TOUCH

Actor-based conversations

Actor-based messages

Identity resolution works in UI

This is your adoption anchor

👉 Chat is production-usable for a small cohort today.

✅ 4️⃣ Friends / Following System

Status: ACTIVE

Friend list works

Permissions enforced

No blocking issues reported

Ready for light real-world use

👉 This quietly supports trust.

✅ 5️⃣ Central Feed (SSOT Locked)

Status: DONE

listActorPosts.controller established as SSOT

Feed loads actor-scoped posts correctly

Same controller reused for profile (by design)

👉 This prevents duplication bugs later.

🟡 WHAT IS PARTIALLY DONE (AND WHY IT’S OK)

These are not broken, just incomplete contracts.

⚠️ 6️⃣ Profile View (READ PATH)

Status: PARTIAL — CORE ISSUE IDENTIFIED

What works:

Actor → profile resolution

Profile header renders

Identity is correct

Friends tab works

What’s missing:

canViewContent contract not finalized

Posts not injected into profile view yet

Photos tab blocked because of missing permission flag

Important insight you already nailed:

This is not RLS, not UI — it’s a mapping + contract issue

👉 This is a single choke point, not a system failure.

⚠️ 7️⃣ Profile Posts / Photos

Status: PENDING (MAPPING ONLY)

Reality check:

Posts exist in DB

Uploads are correct

Feed shows them

Profile does not consume them yet

Why:

useProfileView not yet wired to listActorPosts

canViewContent defaults to undefined → UI blocks

👉 This is a wiring task, not a feature build.

🔴 WHAT IS STILL BROKEN / NOT DONE

These are the real blockers for nurse adoption.

❌ 8️⃣ Settings (MINIMUM)

Status: NOT DONE

Missing:

Change display name

Change profile photo

Logout

Impact:

No sense of control

Low trust for real users

👉 This is small but psychologically critical.

❌ 9️⃣ Notifications (ACTOR ALIGNMENT)

Status: PARTIAL

Notifications fire

Counts update

But:

some references still profile-based

routing not fully actor-safe

👉 This is cleanup, not a rewrite.

🧠 UPDATED PRIORITY ORDER (REALISTIC, POST-TODAY)
🥇 PRIORITY 1 — Finish Profile READ CONTRACT

(1–2 focused sessions)

Do only this:

useProfileView returns:

profile

posts (via listActorPosts)

canViewContent (explicit boolean)

No editing yet.
No tabs refactor.
Just make profile viewable and stable.

🥈 PRIORITY 2 — Minimal Settings Screen

(1 session)

One screen:

Avatar upload

Display name input

Save

Logout

That’s it.

🥉 PRIORITY 3 — Notification Actor Cleanup

(1 session max)

Ensure notifications reference actor_id

Ensure click routing lands correctly

No preferences.
No redesign.

🟢 PRIORITY 4 — Nurse Identity Signal (LIGHT)

(Optional, high impact)

Add one free-text field:

role / profession

Display:

Alex Rivera · RN


This alone makes it feel “for nurses”.

❌ STILL DO NOT TOUCH

Same as before — and this matters more now:

❌ Chat refactor

❌ Encryption upgrades

❌ Explore redesign

❌ New schemas

❌ Performance tuning

❌ New social mechanics