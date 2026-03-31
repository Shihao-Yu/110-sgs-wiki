# E-01: Project Setup & Data Layer

## Objective
Initialize monorepo, extract general/card data from assets and QSanguosha, build normalized JSON data layer

## Acceptance Criteria
- All packages build successfully
- generals.json contains 341 entries
- cards.json has full KW deck
- skills.json linked to generals

## Integration Checks
- `pnpm install && pnpm build`
- `pnpm test`

## Tasks
| ID | Title | Status | Complexity | Depends On |
|----|-------|--------|------------|------------|
| T-011 | Monorepo setup | draft | 4 | none |
| T-012 | Data schema definitions | draft | 3 | T-011 |
| T-013 | Asset pipeline and filename parser | draft | 5 | T-012 |
| T-014 | QSanguosha data extraction | draft | 6 | T-012 |
| T-015 | Data merge and validation | draft | 4 | T-013, T-014 |
| T-016 | Card deck data | draft | 3 | T-012 |
| T-017 | FAQ data structure | draft | 2 | T-012 |
