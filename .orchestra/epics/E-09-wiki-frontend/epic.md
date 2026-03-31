# E-09: Wiki Frontend

## Objective
Next.js wiki: general list, detail pages, card encyclopedia, search, FAQ

## Acceptance Criteria
- General list with filters works
- Detail pages show skills + radar chart
- Search returns relevant results
- FAQ is browsable

## Integration Checks
- `pnpm --filter web build`
- `pnpm --filter web test`

## Tasks
| ID | Title | Status | Complexity | Depends On |
|----|-------|--------|------------|------------|
| T-091 | Next.js project setup | draft | 4 | T-011 |
| T-092 | General list page | draft | 5 | T-091, T-015 |
| T-093 | General detail page | draft | 6 | T-092 |
| T-094 | Card encyclopedia | draft | 4 | T-091, T-016 |
| T-095 | Global search | draft | 4 | T-092, T-094 |
| T-096 | FAQ system | draft | 3 | T-091, T-017 |
