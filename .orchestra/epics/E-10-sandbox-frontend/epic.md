# E-10: Sandbox Frontend

## Objective
Full visual sandbox: game table, drag-to-play, animations, AI opponents, game modes

## Acceptance Criteria
- Can start and play a game in browser
- Drag-to-play works
- AI opponents respond correctly
- Auto-replay saves

## Integration Checks
- `pnpm --filter web build`
- `pnpm --filter web test:e2e`

## Tasks
| ID | Title | Status | Complexity | Depends On |
|----|-------|--------|------------|------------|
| T-101 | Game table layout | draft | 6 | T-091, T-021 |
| T-102 | Hand card UI | draft | 6 | T-101 |
| T-103 | Skill activation + target selection | draft | 6 | T-102 |
| T-104 | Card animation system | draft | 5 | T-102 |
| T-105 | Game flow controller | draft | 7 | T-103, T-022, T-025 |
| T-106 | AI player integration | draft | 5 | T-105, T-081 |
| T-107 | Game modes + auto-replay | draft | 4 | T-105 |
