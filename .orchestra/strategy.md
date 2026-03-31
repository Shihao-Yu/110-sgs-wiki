# Strategy

## Goal
Build a complete Sanguosha Kingdom War (三国杀国战) Wiki + Simulator: searchable wiki for all 341 generals, fully visual interactive sandbox with complete game rules, AI-driven Monte Carlo simulation for win rate analysis, and QSanguosha replay import.

## Success Criteria
- All 341 generals have working skill implementations in the engine
- Full Kingdom War rules (dual generals, factions, 珠联璧合, emperor system)
- Visual sandbox with drag-to-play, animations, AI opponents
- Win rate statistics and multi-dimensional general evaluation
- QSanguosha replay import and playback
- Searchable wiki with FAQ system

## Constraints
- TypeScript full-stack monorepo (pnpm workspaces)
- Engine must be isomorphic (Node + browser)
- QSanguosha is the primary reference for game rules and skill logic
- Asset source: C:\Users\SY\Downloads\打印\打印 (341 card images)
- Next.js App Router + Tailwind CSS for frontend

## Role Model
planner: expands the brief/spec and preserves product intent
generator: implements one task against an explicit sprint contract
evaluator: verifies and scores the task against the review rubric

## Main Branch
main_branch: main

## Execution Backend
executor: codex
# codex  — run implementation tasks with `codex exec`
# claude — run implementation tasks with `claude -p`

evaluator: claude
# inline — run REVIEW analysis inside /orchestrate itself (backward-compatible default)
# codex  — dispatch REVIEW evaluation with `codex exec`
# claude — dispatch REVIEW evaluation with `claude -p`

## Autonomy
level: supervised

## Parallelism
max_concurrent: 3
conflict_policy: serialize

## Coverage Matrix
| Goal | Epic | Status |
|------|------|--------|
| Project foundation & data | E-01 | draft |
| Game engine core rules | E-02 | draft |
| WEI general skills (88) | E-03 | draft |
| SHU general skills (85) | E-04 | draft |
| WU general skills (79) | E-05 | draft |
| QUN general skills (87) | E-06 | draft |
| Special generals & integration | E-07 | draft |
| AI system & simulation | E-08 | draft |
| Wiki frontend | E-09 | draft |
| Sandbox frontend | E-10 | draft |
| Replay system | E-11 | draft |
| Statistics dashboard | E-12 | draft |
