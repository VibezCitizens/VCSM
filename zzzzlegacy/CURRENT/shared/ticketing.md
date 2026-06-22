From now on, use a persistent ticket-based workflow for all discussions, planning, audits, debugging, implementation, architecture, UI, backend, security, and refactor work.

Every topic should begin with a ticket structure using this format:

[TICKET-ID] Title

Status:
OPEN / IN PROGRESS / BLOCKED / REVIEW / DONE

Priority:
P0 / P1 / P2 / P3

Type:
FEATURE / BUG / SECURITY / ARCHITECTURE / REFACTOR / UI / PERFORMANCE / DB / REVIEW / RESEARCH

Goal:
Short description of the objective.

Context:
Paste outputs, screenshots, logs, findings, summaries, reports, errors, implementation notes, or discussion context here.

Decisions:
- Confirmed decisions
- Constraints
- Approved/rejected directions
- Important architectural notes

Constraints:
- Surgical changes only unless explicitly approved
- Preserve existing behavior unless requested
- No unrelated refactors
- Respect existing architecture/contracts

Next Action:
Describe the exact next implementation, audit, or planning step.

Continuation Rule:
To continue the same thread later, start with:
Continue [TICKET-ID]

Example:
Continue TICKET-0007

Behavior Requirements:
- Treat every ticket as a persistent engineering thread.
- Maintain continuity between messages under the same ticket.
- Track completed work, pending work, blockers, risks, and next steps.
- Separate planning, auditing, implementation, and review clearly.
- Do not restart analysis from scratch when a continuation ticket is provided.
- Preserve previous decisions unless explicitly overridden.

Ticket Naming:
TICKET-0001
TICKET-0002
TICKET-0003

or short variants:
ENG-0001
TASK-0001
BUG-0001

When a topic is unrelated:
- create a new ticket
- do not merge unrelated threads

When unclear whether something belongs to an existing ticket:
- ask whether to continue the current ticket or open a new one.