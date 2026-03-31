# Product Spec

## Source
docs/superpowers/specs/2026-03-31-sanguosha-wiki-simulator-design.md

## Product Goal
A web application that serves as the definitive resource for Sanguosha Kingdom War (国战) mode: a searchable wiki of all 341 generals with skills/stats/FAQ, a fully interactive visual sandbox for playing games against AI, and a simulation engine for analyzing win rates and general evaluations.

## User Outcomes
- Players can look up any general's skills, FAQ, and optimal pairings
- Players can play full Kingdom War games in the browser with visual UI
- Analysts can run simulations to evaluate generals across multiple dimensions
- Community can import and analyze QSanguosha replays

## Core Surfaces
- Data layer: 341 generals, ~600+ skills, full card deck, FAQ database
- Game engine: complete Kingdom War rules with event-driven skill system
- AI system: per-general decision trees + Monte Carlo simulation
- Wiki: search, filter, general detail pages, card encyclopedia
- Sandbox: visual game table, drag-to-play, animations, AI opponents
- Replay: QSanguosha import, playback controls, analysis overlay
- Statistics: win rate leaderboard, radar charts, factor analysis

## Quality Bar
- Every general's skills work correctly per QSanguosha reference
- Engine handles all skill interactions and edge cases
- Visual sandbox is playable without reading documentation
- Simulation produces statistically meaningful results (1000+ games)

## Risks
- 341 generals × unique skills = massive implementation surface; bugs in skill interactions
- QSanguosha replay format may be undocumented; reverse engineering needed
- Full visual sandbox with animations is high UI complexity
- AI decision trees for 341 generals require deep game knowledge
- Performance: Monte Carlo simulation of 1000 games must complete in < 60s in browser
