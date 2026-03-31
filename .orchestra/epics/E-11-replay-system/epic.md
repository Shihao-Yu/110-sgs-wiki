# E-11: Replay System

## Objective
QSanguosha .qsgs replay parser, viewer, timeline, analysis overlay

## Acceptance Criteria
- Can import a .qsgs file
- Playback controls work
- Timeline shows key events

## Integration Checks
- `pnpm --filter web test -- --grep replay`

## Tasks
| ID | Title | Status | Complexity | Depends On |
|----|-------|--------|------------|------------|
| T-111 | QSanguosha replay parser | draft | 6 | T-021 |
| T-112 | Replay viewer | draft | 5 | T-111, T-101 |
| T-113 | Timeline visualization | draft | 4 | T-112 |
| T-114 | Replay analysis overlay | draft | 4 | T-112, T-081 |
