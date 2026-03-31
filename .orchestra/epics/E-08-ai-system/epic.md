# E-08: AI Decision Trees & Simulation

## Objective
Generic strategy framework, per-general AI, Monte Carlo simulation, win rate calculation, multi-dimensional evaluation

## Acceptance Criteria
- AI can play a complete game
- Monte Carlo runs 1000 games < 60s
- Win rate output is statistically valid

## Integration Checks
- `pnpm --filter ai test`
- `pnpm --filter ai build`

## Tasks
| ID | Title | Status | Complexity | Depends On |
|----|-------|--------|------------|------------|
| T-081 | Generic AI strategy framework | draft | 5 | T-022, T-023, T-026 |
| T-082 | Per-general AI profiles (30 core) | draft | 7 | T-081, T-031 |
| T-083 | Monte Carlo simulation engine | draft | 5 | T-081 |
| T-084 | Win rate calculator + scoring | draft | 4 | T-083 |
| T-085 | Factor analysis | draft | 4 | T-084 |
