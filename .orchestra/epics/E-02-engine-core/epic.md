# E-02: Game Engine Core

## Objective
Implement complete Kingdom War rules engine: turn phases, card mechanics, resolution stack, damage chain, dual generals, factions, victory conditions

## Acceptance Criteria
- Engine can run a complete game to victory
- All 6 phases execute correctly
- Dual general HP calculation correct
- Faction victory conditions work

## Integration Checks
- `pnpm --filter engine test`
- `pnpm --filter engine build`

## Tasks
| ID | Title | Status | Complexity | Depends On |
|----|-------|--------|------------|------------|
| T-021 | Game state model | draft | 4 | T-012 |
| T-022 | Phase system | draft | 5 | T-021 |
| T-023 | Card mechanics | draft | 5 | T-021, T-016 |
| T-024 | Deck manager | draft | 3 | T-023 |
| T-025 | Resolution stack | draft | 6 | T-022 |
| T-026 | Damage chain | draft | 5 | T-025 |
| T-027 | Target selection and distance | draft | 4 | T-021 |
| T-028 | Kingdom War dual-general rules | draft | 6 | T-021, T-026 |
| T-029 | Faction system and victory | draft | 5 | T-028 |
| T-0210 | 珠联璧合 and Emperor system | draft | 5 | T-029 |
