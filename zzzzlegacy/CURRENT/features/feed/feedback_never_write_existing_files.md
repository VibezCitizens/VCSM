---
name: feedback-never-write-existing-files
description: Never use Write tool on existing files — always Edit. Write overwrites the entire file.
metadata:
  type: feedback
---

Never use the Write tool on an existing file. Write overwrites the entire file content with only what is passed — it does not append or merge. Always use Edit for existing files.

**Why:** Used Write to update a 3000+ line document header and destroyed the entire file in two separate mistakes in the same session.

**How to apply:** Before calling Write, ask — does this file already exist? If yes, use Edit instead. Write is only for creating new files that do not yet exist.
