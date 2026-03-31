# Sanguosha Kingdom War Wiki + Simulator — Design Spec

## Overview

A TypeScript full-stack web application for the board game 三国杀 (Sanguosha), focused on the 国战 (Kingdom War) mode. The system provides a searchable wiki of all 341 generals, a fully interactive visual sandbox with complete game rules, AI-driven simulation for win rate analysis, and replay import from QSanguosha.

**Project path**: `/mnt/c/Users/SY/Workspace/110-sgs-wiki`
**Asset source**: `C:\Users\SY\Downloads\打印\打印` (341 general card images + card backs + tokens)

## Architecture

TypeScript monorepo with 4 core packages:

```
110-sgs-wiki/
├── packages/
│   ├── data/          # Normalized JSON data layer
│   ├── engine/        # Kingdom War rules engine (pure logic, no UI)
│   ├── ai/            # Decision tree AI + Monte Carlo simulation
│   └── web/           # Next.js frontend (wiki + sandbox + stats)
├── assets/            # Card images copied from source
│   ├── generals/      # 341 general card PNGs
│   ├── cards/         # Playing card images
│   ├── tokens/        # Token/marker images
│   └── misc/          # Emperor cards, backs, etc.
├── replays/           # QSanguosha replay parser
├── scripts/           # Data extraction + asset processing
├── package.json       # Workspace root
└── tsconfig.json
```

All packages share types via a workspace. Engine runs in both Node.js and browser (no platform-specific dependencies).

## Package: data

### Data Sources

1. **Card image filenames** — structured as `国战UI.{FACTION}{NUMBER}.{title}.{name}.png`
   - Parse: faction (WEI/SHU/WU/QUN/JIN), ID, title (称号), name
   - Handle dual-faction (e.g., `QUN&SHU072`) and paired generals (e.g., `颜良&文丑`)
   - Handle special prefixes: `G.` (special category), `EM` (emperor/君主)
2. **QSanguosha source data** — skill definitions, HP values, gender, skill descriptions, trigger timing
3. **Manual supplement** — FAQ entries, errata, ruling clarifications

### Output Schema

**generals.json**:
```typescript
interface General {
  id: string;              // "QUN001"
  name: string;            // "华佗"
  title: string;           // "长夜启明"
  faction: Faction;        // "QUN"
  subfaction?: Faction;    // for dual-faction generals
  hp: number;              // max HP
  gender: "male" | "female";
  skills: string[];        // skill IDs
  image: string;           // asset path
  paired?: boolean;        // 双将 (颜良&文丑 etc.)
  pairedNames?: string[];  // ["颜良", "文丑"]
  isEmperor?: boolean;     // 君主
  designer?: string;
  pack: string;            // expansion pack name
}
```

**skills.json**:
```typescript
interface Skill {
  id: string;
  name: string;            // "急救"
  description: string;     // full text
  type: SkillType;         // "active" | "passive" | "lock" | "limited" | "awakening" | "mission"
  timing: string[];        // trigger timing tags
  generalIds: string[];    // which generals have this skill
  faq: FAQ[];              // rulings and clarifications
}
```

**cards.json**:
```typescript
interface Card {
  id: string;
  name: string;            // "杀"
  type: "basic" | "trick" | "equipment";
  subtype?: string;        // "weapon" | "armor" | "horse" | "treasure" for equipment
  suit: "spade" | "heart" | "club" | "diamond";
  number: number;          // 1-13
  description: string;
  count: number;           // how many in the deck
}
```

**factions.json**: Faction metadata (name, color, lore, general count).

**faq.json**: Global FAQ entries + per-general/per-skill FAQ.

## Package: engine

A complete Kingdom War (国战) rules engine, referencing QSanguosha's implementation.

### Core Systems

**Game State**:
- Player state: HP, max HP, generals (main + deputy), hand cards, equipment, judgment area, revealed/hidden status, faction, alive/dead
- Table state: discard pile, draw pile, current player, current phase, turn count
- Global state: active effects, delayed tricks, ongoing modifiers

**Turn Structure**:
1. 准备阶段 (Prepare Phase)
2. 判定阶段 (Judgment Phase) — resolve delayed tricks
3. 摸牌阶段 (Draw Phase) — draw 2 cards
4. 出牌阶段 (Play Phase) — play cards, activate skills, unlimited actions
5. 弃牌阶段 (Discard Phase) — discard to hand limit
6. 结束阶段 (End Phase)

**Resolution Stack**: LIFO stack for resolving card effects, skill triggers, and responses. Handles nested triggers (e.g., damage triggers a skill that triggers another skill).

**Damage Chain**: Source → DamageEvent → triggers (e.g., 刚烈/反馈) → HP change → death check → rewards/penalties.

### Kingdom War Specific Rules

- **Dual generals**: Main general + deputy general, combined HP = ceil(HP1/2) + ceil(HP2/2)
- **Hidden/Revealed**: Generals start hidden, reveal on first skill use or voluntary reveal
- **Faction mechanics**: Same-faction players cooperate, cross-faction players are enemies
- **珠联璧合 (Perfect Match)**: Specific general pairs gain bonuses when both are revealed
- **Emperor system**: Emperor generals (刘备/孙权/曹操/张角) have special faction leader rules
- **Victory conditions**: Faction-based — last faction standing wins
- **十常侍 (Ten Eunuchs)**: Special QUN general with unique mechanics

### Skill Plugin System

Event-driven architecture. Each skill is an independent TypeScript module:

```typescript
interface SkillPlugin {
  id: string;
  name: string;
  type: SkillType;
  triggers: GameEvent[];       // which events this skill responds to
  canActivate: (ctx: GameContext, player: Player) => boolean;
  activate: (ctx: GameContext, player: Player) => void | Promise<void>;
  ai?: SkillAI;               // AI hints for this skill
}
```

All 341 generals' skills must be implemented. Skills are organized by general ID in `packages/engine/src/skills/`.

### Card System

**Basic cards**: 杀 (Attack), 闪 (Dodge), 桃 (Peach), 酒 (Wine)
**Trick cards**: 
- Instant: 无中生有, 过河拆桥, 顺手牵羊, 决斗, 借刀杀人, 火攻, 铁索连环, 知己知彼, 以逸待劳, 远交近攻, 调虎离山, 敕令, etc.
- Delayed: 乐不思蜀, 兵粮寸断, 闪电
**Equipment**: 
- Weapons: 诸葛连弩, 青釭剑, 丈八蛇矛, 贯石斧, 方天画戟, 麒麟弓, 古锭刀, 朱雀羽扇, 银月枪, 雌雄双股剑, etc.
- Armor: 八卦阵, 仁王盾, 藤甲, 白银狮子, 太平要术, etc.
- Horses: +1 horse, -1 horse
- Treasures: 木牛流马, 玉玺

Full Kingdom War deck composition as per official rules.

## Package: ai

### Decision Tree Framework

Each general has a specialized decision tree that encodes optimal play strategy:

```typescript
interface GeneralAI {
  generalId: string;
  evaluatePlay: (ctx: GameContext, player: Player, options: Action[]) => Action;
  evaluateResponse: (ctx: GameContext, player: Player, event: GameEvent) => Response;
  evaluateDiscard: (ctx: GameContext, player: Player, count: number) => Card[];
  evaluateTarget: (ctx: GameContext, player: Player, candidates: Player[]) => Player;
}
```

**Generic strategy framework** (base AI all generals inherit):
- **Card draw (过牌)**: Evaluate card advantage opportunities
- **Board control (控场)**: Target selection, threat assessment
- **Burst damage (爆发)**: Identify kill opportunities
- **Defense (防御)**: HP management, dodge/peach conservation

**Per-general specialization**: Override base strategies with skill-specific logic. Reference QSanguosha AI scripts for initial implementations.

### Monte Carlo Simulation

- Run N games with specified compositions (single general, dual general, full team)
- Configurable: number of players, faction distribution, specific generals
- Output: win rate, average survival turns, average damage dealt/received
- Multi-dimensional scoring per general: draw/control/burst/defense ratings (0-10 scale)

### Factor Analysis

- Isolate variable impact on win rate (e.g., what happens when general X is paired with Y vs Z)
- Cross-tabulation: faction win rate, seat position impact, first-player advantage
- Output to structured JSON for frontend visualization

## Package: web (Next.js)

### Wiki Section

**General list page**:
- Grid/list view toggle with card images
- Filters: faction, HP, skill type, gender, expansion pack
- Sort: by name, by ID, by simulated win rate
- Instant search (fuzzy match on name, skill name, keywords)

**General detail page**:
- Full card image display
- Skill descriptions with expandable FAQ/rulings
- Multi-dimensional radar chart (draw/control/burst/defense)
- Win rate statistics (overall, by partner, by opponent)
- Recommended pairings (珠联璧合 + AI-determined best partners)
- Related generals (similar playstyle, same faction)

**Card encyclopedia**:
- All basic/trick/equipment cards with effects
- Card distribution in deck (suit/number breakdown)

**Global search**: Unified search across generals, skills, cards, FAQ entries.

**FAQ system**: 
- Global rules FAQ
- Per-general FAQ
- Searchable and categorized

### Sandbox (Full Visual)

**Table layout**:
- Circular player arrangement (4-8 players)
- Each player slot: general portrait (hidden/revealed), HP bar, equipment slots, judgment area, hand card count
- Center: draw pile, discard pile, current turn indicator

**Player interaction** (for human-controlled player):
- Hand cards displayed at bottom, drag to play
- Click to select targets (highlighted valid targets)
- Skill buttons with availability indicators
- Response prompts (e.g., "Play 闪 to dodge?" with timer)

**Visual feedback**:
- Card play animations (card flies from hand to target)
- Damage numbers, HP change animations
- Skill activation effects
- Turn phase indicator
- Game log (scrolling text log of all actions)

**Game modes**:
- Human vs AI (pick your generals, AI controls others)
- Full AI observation (set compositions, watch AI play)
- Custom setup (choose all generals, starting conditions)
- Each game automatically saved as replay

### Replay Viewer

**QSanguosha replay import**:
- Parse `.qsgs` replay file format
- Map QSanguosha general/card IDs to our data layer

**Playback controls**:
- Play/pause, step forward/backward
- Speed control (0.5x - 4x)
- Jump to specific turn/phase
- Timeline with key event markers (kills, skill activations)

**Analysis overlay**:
- Per-player stats during replay
- Decision annotations (what the player did vs what AI would suggest)

### Statistics Dashboard

- Win rate leaderboard (sortable by mode/faction/rank)
- Radar chart comparisons (select 2-4 generals to compare)
- Factor analysis visualizations (bar charts, heatmaps)
- Simulation runner (configure and launch simulations from UI)

## Data Pipeline

1. **Extract**: Script parses filenames from `C:\Users\SY\Downloads\打印\打印\国战武将卡背\`
2. **Enrich**: Cross-reference with QSanguosha data for skills, HP, gender
3. **Normalize**: Output to `packages/data/src/` as typed JSON
4. **Copy assets**: Optimize images (WebP conversion, thumbnails) → `assets/`
5. **Validate**: Ensure all generals have skills, all skills have descriptions, no orphan references

## Technology Choices

- **Runtime**: Node.js 20+ / Browser (engine is isomorphic)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State management**: Zustand (game state in sandbox)
- **Charts**: Recharts or D3 (radar charts, heatmaps)
- **Animation**: Framer Motion (card animations)
- **Monorepo**: pnpm workspaces
- **Testing**: Vitest (engine unit tests), Playwright (E2E)

## Scope Notes

- All 341 generals must have skill implementations in the engine
- QSanguosha source code is the primary reference for game rules and skill logic
- Decision trees start with QSanguosha AI logic, refined over time
- Performance target: Monte Carlo simulation should run 1000 games in < 60 seconds in browser
- The application runs entirely client-side after initial load (no server required for gameplay)
