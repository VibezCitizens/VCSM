# Booking — Performance Report

**KRAVEN status:** COMPLETE  
**Last reviewed:** 2026-05-14

## Known Issues

| ID | Issue | Impact | Status |
|---|---|---|---|
| K-BOOK-01 | 5-operation serial chain in owner availability mutation | ~310ms latency on write path | DEFERRED (P2) |

## Recommendations

- Session-scoped actor `profile_id` cache would reduce serial chain to 4 ops
- Implement after DEFER-001 CARNAGE migration is complete
