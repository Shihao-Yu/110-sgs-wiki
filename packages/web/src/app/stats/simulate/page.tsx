"use client";

import type { Faction } from "@sgs/data";
import { useCallback, useRef, useState } from "react";
import SimulationConfig, {
  type SimulationParams,
} from "./components/SimulationConfig";
import SimulationResults, {
  type FactionWinRate,
  type SimulationResultData,
  type TopGeneral,
} from "./components/SimulationResults";

/* ================================================================== */
/*  Simplified Sanguosha Kingdom‑War game loop                        */
/*  ----------------------------------------------------------------  */
/*  Each simulated game:                                               */
/*  1. Assigns N players to random factions + generals                 */
/*  2. Runs turn‑by‑turn combat until one faction is eliminated        */
/*  3. The last surviving faction wins                                  */
/*  ================================================================  */

/* ---- General pool ---- */

type SimGeneral = {
  name: string;
  faction: Faction;
  hp: number;
  atk: number;
  def: number;
};

const GENERAL_POOL: SimGeneral[] = [
  { name: "司马懿", faction: "WEI", hp: 3, atk: 6, def: 7 },
  { name: "曹操",   faction: "WEI", hp: 4, atk: 7, def: 5 },
  { name: "张辽",   faction: "WEI", hp: 4, atk: 7, def: 5 },
  { name: "郭嘉",   faction: "WEI", hp: 3, atk: 5, def: 4 },
  { name: "荀彧",   faction: "WEI", hp: 3, atk: 4, def: 6 },
  { name: "诸葛亮", faction: "SHU", hp: 3, atk: 5, def: 5 },
  { name: "刘备",   faction: "SHU", hp: 4, atk: 5, def: 7 },
  { name: "关羽",   faction: "SHU", hp: 4, atk: 8, def: 5 },
  { name: "赵云",   faction: "SHU", hp: 4, atk: 6, def: 8 },
  { name: "庞统",   faction: "SHU", hp: 3, atk: 6, def: 3 },
  { name: "孙权",   faction: "WU",  hp: 4, atk: 5, def: 8 },
  { name: "周瑜",   faction: "WU",  hp: 3, atk: 7, def: 4 },
  { name: "陆逊",   faction: "WU",  hp: 3, atk: 6, def: 5 },
  { name: "甘宁",   faction: "WU",  hp: 4, atk: 7, def: 4 },
  { name: "吕蒙",   faction: "WU",  hp: 4, atk: 5, def: 6 },
  { name: "张角",   faction: "QUN", hp: 3, atk: 7, def: 4 },
  { name: "贾诩",   faction: "QUN", hp: 3, atk: 6, def: 5 },
  { name: "华佗",   faction: "QUN", hp: 3, atk: 3, def: 8 },
  { name: "司马昭", faction: "JIN", hp: 3, atk: 6, def: 6 },
  { name: "司马师", faction: "JIN", hp: 3, atk: 5, def: 6 },
];

const FACTIONS: Faction[] = ["WEI", "SHU", "WU", "QUN", "JIN"];
const FACTION_CN: Record<Faction, string> = {
  WEI: "魏",
  SHU: "蜀",
  WU: "吴",
  QUN: "群",
  JIN: "晋",
};

/* ---- RNG helper ---- */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---- Single game simulation ---- */

type PlayerState = {
  general: SimGeneral;
  currentHp: number;
  alive: boolean;
};

function simulateOneGame(playerCount: number): {
  winnerFaction: Faction;
  turns: number;
  /** Map of general name -> survived (true/false) */
  generalResults: Map<string, boolean>;
} {
  // Pick random generals for each player
  const shuffled = shuffle(GENERAL_POOL);
  const players: PlayerState[] = shuffled.slice(0, playerCount).map((g) => ({
    general: g,
    currentHp: g.hp,
    alive: true,
  }));

  let turns = 0;
  const maxTurns = 50; // safety cap

  while (turns < maxTurns) {
    turns++;

    for (let i = 0; i < players.length; i++) {
      const attacker = players[i];
      if (!attacker.alive) continue;

      // Find living enemies (different faction)
      const enemies = players.filter(
        (p) => p.alive && p.general.faction !== attacker.general.faction,
      );

      if (enemies.length === 0) {
        // This faction won
        const generalResults = new Map<string, boolean>();
        for (const p of players) {
          generalResults.set(p.general.name, p.alive);
        }
        return {
          winnerFaction: attacker.general.faction,
          turns,
          generalResults,
        };
      }

      // Attack a random enemy
      const target = enemies[randInt(0, enemies.length - 1)];
      const dmg = Math.max(1, attacker.general.atk - target.general.def + randInt(-2, 3));
      target.currentHp -= dmg;

      if (target.currentHp <= 0) {
        target.alive = false;
      }
    }

    // Check if only one faction remains
    const aliveFactions = new Set(
      players.filter((p) => p.alive).map((p) => p.general.faction),
    );
    if (aliveFactions.size <= 1) {
      const winner = aliveFactions.size === 1
        ? [...aliveFactions][0]
        : players[0].general.faction; // fallback
      const generalResults = new Map<string, boolean>();
      for (const p of players) {
        generalResults.set(p.general.name, p.alive);
      }
      return { winnerFaction: winner, turns, generalResults };
    }
  }

  // Timed out — faction with most survivors wins
  const factionAlive = new Map<Faction, number>();
  for (const p of players) {
    if (p.alive) {
      factionAlive.set(p.general.faction, (factionAlive.get(p.general.faction) ?? 0) + 1);
    }
  }
  let bestFaction: Faction = "WEI";
  let bestCount = 0;
  for (const [f, c] of factionAlive) {
    if (c > bestCount) {
      bestFaction = f;
      bestCount = c;
    }
  }
  const generalResults = new Map<string, boolean>();
  for (const p of players) {
    generalResults.set(p.general.name, p.alive);
  }
  return { winnerFaction: bestFaction, turns: maxTurns, generalResults };
}

/* ---- Batch simulation with progress ---- */

async function runSimulation(
  gameCount: number,
  playerCount: number,
  onProgress: (completed: number) => void,
): Promise<SimulationResultData> {
  const start = performance.now();

  const factionWins = new Map<Faction, number>();
  const factionAppearances = new Map<Faction, number>();
  const generalWins = new Map<string, number>();
  const generalAppearances = new Map<string, number>();
  const generalFaction = new Map<string, Faction>();
  let totalTurns = 0;

  // Initialize faction tracking
  for (const f of FACTIONS) {
    factionWins.set(f, 0);
    factionAppearances.set(f, 0);
  }

  // Run in batches to keep UI responsive
  const batchSize = Math.max(1, Math.min(50, Math.floor(gameCount / 20)));
  let completed = 0;

  for (let i = 0; i < gameCount; i += batchSize) {
    const end = Math.min(i + batchSize, gameCount);
    for (let j = i; j < end; j++) {
      const result = simulateOneGame(playerCount);
      totalTurns += result.turns;

      // Track faction appearances and wins
      const seenFactions = new Set<Faction>();
      for (const [name] of result.generalResults) {
        const gen = GENERAL_POOL.find((g) => g.name === name);
        if (!gen) continue;
        if (!generalFaction.has(name)) generalFaction.set(name, gen.faction);
        generalAppearances.set(name, (generalAppearances.get(name) ?? 0) + 1);
        seenFactions.add(gen.faction);
        if (gen.faction === result.winnerFaction) {
          generalWins.set(name, (generalWins.get(name) ?? 0) + 1);
        }
      }
      for (const f of seenFactions) {
        factionAppearances.set(f, (factionAppearances.get(f) ?? 0) + 1);
      }
      factionWins.set(
        result.winnerFaction,
        (factionWins.get(result.winnerFaction) ?? 0) + 1,
      );
    }

    completed = end;
    onProgress(completed);

    // Yield to the browser for UI updates
    if (end < gameCount) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const elapsedMs = Math.round(performance.now() - start);

  // Build faction win rate data
  const factionWinRates: FactionWinRate[] = FACTIONS.map((f) => {
    const wins = factionWins.get(f) ?? 0;
    const total = factionAppearances.get(f) ?? 0;
    return {
      faction: f,
      label: FACTION_CN[f],
      wins,
      total,
      rate: total > 0 ? (wins / total) * 100 : 0,
    };
  }).sort((a, b) => b.rate - a.rate);

  // Build top generals
  const topGenerals: TopGeneral[] = [...generalAppearances.entries()]
    .map(([name, games]) => {
      const wins = generalWins.get(name) ?? 0;
      return {
        name,
        faction: generalFaction.get(name) ?? ("WEI" as Faction),
        wins,
        games,
        winRate: games > 0 ? (wins / games) * 100 : 0,
      };
    })
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 10);

  return {
    factionWinRates,
    topGenerals,
    avgTurns: gameCount > 0 ? totalTurns / gameCount : 0,
    totalGames: gameCount,
    elapsedMs,
  };
}

/* ================================================================== */
/*  Page component                                                     */
/* ================================================================== */

export default function SimulatePage() {
  const [params, setParams] = useState<SimulationParams>({
    games: 100,
    players: 6,
  });
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimulationResultData | null>(null);
  const abortRef = useRef(false);

  const handleRun = useCallback(async () => {
    abortRef.current = false;
    setRunning(true);
    setProgress(0);
    setResults(null);

    try {
      const data = await runSimulation(
        params.games,
        params.players,
        (completed) => {
          if (!abortRef.current) {
            setProgress(completed);
          }
        },
      );

      if (!abortRef.current) {
        setResults(data);
      }
    } finally {
      setRunning(false);
    }
  }, [params]);

  const progressPct =
    params.games > 0 ? Math.round((progress / params.games) * 100) : 0;

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">Simulation</span>
        <h1 className="section-title mt-3">模拟引擎</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          蒙特卡洛模拟：选择场次与人数，在浏览器中运行简化对局循环，查看势力胜率、武将表现与平均回合数。
        </p>
      </header>

      {/* Config form */}
      <SimulationConfig
        onChange={setParams}
        onRun={handleRun}
        params={params}
        running={running}
      />

      {/* Progress bar */}
      {running && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>模拟进度</span>
            <span className="tabular-nums">
              {progress.toLocaleString()} / {params.games.toLocaleString()} ({progressPct}%)
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-brand transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results && !running && (
        <div className="mt-6">
          <SimulationResults data={results} />
        </div>
      )}

      {/* Empty state */}
      {!results && !running && (
        <div className="panel mt-6 flex flex-col items-center justify-center px-6 py-16 text-center">
          <svg
            className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            viewBox="0 0 24 24"
          >
            <path
              d="M22 18V2H6v16h16zm-2-2H8V4h12v12zM4 6H2v16h16v-2H4V6zm10 5l-4 4h3v2h2v-2h3l-4-4z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            配置参数后点击「开始模拟」运行蒙特卡洛模拟
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            所有计算在浏览器本地完成，无需服务端
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        简化模拟引擎，仅供界面演示。正式版本将接入完整国战规则引擎。
      </p>
    </div>
  );
}
