import { create } from "zustand";

/* ------------------------------------------------------------------ */
/*  Lightweight UI types — no dependency on @sgs/engine at this stage  */
/* ------------------------------------------------------------------ */

export type Faction = "WEI" | "SHU" | "WU" | "QUN" | "JIN";

export interface EquipmentSlots {
  weapon: string | null;
  armor: string | null;
  defensiveHorse: string | null;
  offensiveHorse: string | null;
  treasure: string | null;
}

export interface PlayerSlotData {
  id: string;
  name: string;
  seat: number;
  /** Display name of the main general, or null if hidden. */
  mainGeneral: string | null;
  /** Display name of the deputy general, or null if hidden. */
  deputyGeneral: string | null;
  hp: number;
  maxHp: number;
  handCardCount: number;
  equipment: EquipmentSlots;
  faction: Faction | null;
  alive: boolean;
}

export type PhaseType =
  | "prepare"
  | "judgment"
  | "draw"
  | "play"
  | "discard"
  | "end";

export interface GameTableState {
  players: PlayerSlotData[];
  drawPileCount: number;
  discardPileCount: number;
  currentPlayerIndex: number;
  currentPhase: PhaseType;
  turnCount: number;
  gameOver: boolean;
}

export interface GameTableActions {
  /** Replace entire table state (used by future engine bridge). */
  setGameState: (state: Partial<GameTableState>) => void;
  /** Cycle to the next player's turn. */
  nextTurn: () => void;
  /** Toggle a player's alive state (for sandbox testing). */
  togglePlayerAlive: (playerId: string) => void;
  /** Change player count (4-8). Resets with fresh placeholder data. */
  setPlayerCount: (count: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Placeholder data generator                                         */
/* ------------------------------------------------------------------ */

const FACTIONS: Faction[] = ["WEI", "SHU", "WU", "QUN", "JIN"];

const SAMPLE_GENERALS: Record<Faction, string[]> = {
  WEI: ["曹操", "司马懿", "张辽", "许褚", "郭嘉", "甄姬", "夏侯惇", "夏侯渊"],
  SHU: ["刘备", "关羽", "张飞", "诸葛亮", "赵云", "马超", "黄忠", "魏延"],
  WU: ["孙权", "周瑜", "陆逊", "甘宁", "吕蒙", "孙尚香", "黄盖", "大乔"],
  QUN: ["吕布", "貂蝉", "董卓", "袁绍", "华佗", "张角", "公孙瓒", "颜良文丑"],
  JIN: ["司马师", "司马昭", "贾充", "钟会", "邓艾", "王元姬", "张春华", "乐綝"],
};

function makePlaceholderEquipment(): EquipmentSlots {
  return {
    weapon: null,
    armor: null,
    defensiveHorse: null,
    offensiveHorse: null,
    treasure: null,
  };
}

function generatePlayers(count: number): PlayerSlotData[] {
  return Array.from({ length: count }, (_, i): PlayerSlotData => {
    const faction: Faction = FACTIONS[i % FACTIONS.length] ?? "WEI";
    const generals = SAMPLE_GENERALS[faction];
    const mainIdx = i % generals.length;
    const deputyIdx = (i + 1) % generals.length;
    const mainName = generals[mainIdx] ?? "未知";
    const deputyName = generals[deputyIdx] ?? "未知";
    // Some players start with hidden generals for visual testing
    const revealed = i !== 2;

    return {
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      seat: i,
      mainGeneral: revealed ? mainName : null,
      deputyGeneral: revealed ? deputyName : null,
      hp: 3 + (i % 2),
      maxHp: 4 + (i % 2),
      handCardCount: 2 + (i % 4),
      equipment: {
        ...makePlaceholderEquipment(),
        ...(i === 0 ? { weapon: "青龙偃月刀" } : {}),
        ...(i === 1 ? { armor: "八卦阵", defensiveHorse: "+1马" } : {}),
        ...(i === 4 ? { weapon: "诸葛连弩", treasure: "木牛流马" } : {}),
      },
      faction: revealed ? faction : null,
      alive: true,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useGameStore = create<GameTableState & GameTableActions>(
  (set) => ({
    players: generatePlayers(8),
    drawPileCount: 98,
    discardPileCount: 12,
    currentPlayerIndex: 0,
    currentPhase: "play",
    turnCount: 1,
    gameOver: false,

    setGameState: (partial) => set((s) => ({ ...s, ...partial })),

    nextTurn: () =>
      set((s) => {
        const alivePlayers = s.players.filter((p) => p.alive);
        if (alivePlayers.length === 0) return s;
        const currentSeat = s.players[s.currentPlayerIndex]?.seat ?? 0;
        // Find the next alive player by seat order
        const sorted = [...alivePlayers].sort((a, b) => a.seat - b.seat);
        const next =
          sorted.find((p) => p.seat > currentSeat) ?? sorted[0] ?? alivePlayers[0];
        if (!next) return s;
        const nextIndex = s.players.findIndex((p) => p.id === next.id);
        return {
          currentPlayerIndex: nextIndex >= 0 ? nextIndex : 0,
          currentPhase: "play" as PhaseType,
          turnCount: s.turnCount + 1,
        };
      }),

    togglePlayerAlive: (playerId) =>
      set((s) => ({
        players: s.players.map((p) =>
          p.id === playerId ? { ...p, alive: !p.alive } : p,
        ),
      })),

    setPlayerCount: (count) => {
      const clamped = Math.max(4, Math.min(8, count));
      set({
        players: generatePlayers(clamped),
        currentPlayerIndex: 0,
        currentPhase: "play",
        turnCount: 1,
        gameOver: false,
        drawPileCount: 160 - clamped * 8,
        discardPileCount: 0,
      });
    },
  }),
);
