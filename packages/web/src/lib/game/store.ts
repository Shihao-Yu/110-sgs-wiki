import { create } from "zustand";
import type { GameCard, Suit, CardCategory } from "@/components/game/CardComponent";

/* ------------------------------------------------------------------ */
/*  Re-export card types for convenience                               */
/* ------------------------------------------------------------------ */

export type { GameCard, Suit, CardCategory };

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

/* ------------------------------------------------------------------ */
/*  Skill types                                                        */
/* ------------------------------------------------------------------ */

export interface SkillData {
  id: string;
  name: string;
  /** Brief description shown on hover. */
  description: string;
  /** Whether the skill can be activated right now. */
  enabled: boolean;
  /** Whether this is a lord-only or wake-type skill, etc. */
  tag?: "lord" | "wake" | "lock" | "limit";
}

/* ------------------------------------------------------------------ */
/*  Interaction state types                                            */
/* ------------------------------------------------------------------ */

/** Tracks an in-progress card/skill action that may need targets. */
export interface CurrentAction {
  /** What initiated the action: a card play or a skill activation. */
  type: "card" | "skill";
  /** Id of the card being played, or the skill being activated. */
  sourceId: string;
  /** Display name (for UI feedback). */
  sourceName: string;
}

/** Active target-selection overlay state. */
export interface TargetSelection {
  /** Player ids that are valid targets. */
  validTargetIds: string[];
  /** Player ids the user has picked so far. */
  selectedTargetIds: string[];
  /** Min targets required to confirm. */
  minTargets: number;
  /** Max targets allowed. */
  maxTargets: number;
  /** Prompt shown in the overlay, e.g. "选择一名角色" */
  prompt: string;
}

/** Response-prompt state (e.g. "是否使用闪?"). */
export interface ResponsePrompt {
  /** Message shown to the player. */
  message: string;
  /** Card name that would be played if they say yes. */
  cardName: string;
  /** Internal id for the engine to match the response. */
  promptId: string;
}

/* ------------------------------------------------------------------ */
/*  Store state & actions                                              */
/* ------------------------------------------------------------------ */

export interface GameTableState {
  players: PlayerSlotData[];
  drawPileCount: number;
  discardPileCount: number;
  currentPlayerIndex: number;
  currentPhase: PhaseType;
  turnCount: number;
  gameOver: boolean;

  /** Human player's hand cards. */
  hand: GameCard[];
  /** Currently selected card ids in hand. */
  selectedCardIds: string[];

  /** Skills of the current (human) player's general(s). */
  skills: SkillData[];
  /** The action the player is currently performing (null = idle). */
  currentAction: CurrentAction | null;
  /** Active target-selection overlay (null = hidden). */
  targetSelection: TargetSelection | null;
  /** Active response prompt dialog (null = hidden). */
  responsePrompt: ResponsePrompt | null;
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

  /** Toggle a card's selected state in the hand. */
  toggleCardSelected: (cardId: string) => void;
  /** Play (remove) a single card from hand by id (e.g. via drag-and-drop). */
  playCard: (cardId: string) => void;
  /** Play all currently selected cards. */
  playSelectedCards: () => void;
  /** Discard all currently selected cards. */
  discardSelectedCards: () => void;

  /* -- Skill / action / target / response actions -------------------- */

  /** Activate a skill, entering the current-action state. */
  activateSkill: (skillId: string) => void;
  /** Cancel the current action (skill or card) and clear targets. */
  cancelAction: () => void;

  /** Begin target selection (called after a card/skill needs a target). */
  beginTargetSelection: (opts: Omit<TargetSelection, "selectedTargetIds">) => void;
  /** Toggle a target player during target selection. */
  toggleTarget: (playerId: string) => void;
  /** Confirm target selection and clear the overlay. */
  confirmTargets: () => void;
  /** Cancel target selection and revert to idle. */
  cancelTargetSelection: () => void;

  /** Show a response prompt (e.g. "是否使用闪?"). */
  showResponsePrompt: (prompt: ResponsePrompt) => void;
  /** Player answered yes to the response prompt. */
  respondYes: () => void;
  /** Player answered no to the response prompt. */
  respondNo: () => void;
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

/* ------------------------------------------------------------------ */
/*  Sample hand cards for sandbox testing                              */
/* ------------------------------------------------------------------ */

const SUITS: Suit[] = ["spade", "heart", "club", "diamond"];

const SAMPLE_CARDS: { name: string; category: CardCategory }[] = [
  { name: "杀", category: "basic" },
  { name: "闪", category: "basic" },
  { name: "桃", category: "basic" },
  { name: "过河拆桥", category: "trick" },
  { name: "顺手牵羊", category: "trick" },
  { name: "无中生有", category: "trick" },
  { name: "南蛮入侵", category: "trick" },
  { name: "万箭齐发", category: "trick" },
  { name: "青龙偃月刀", category: "equipment" },
  { name: "八卦阵", category: "equipment" },
  { name: "的卢", category: "equipment" },
  { name: "赤兔", category: "equipment" },
];

let cardIdCounter = 0;

function generateSampleHand(count: number): GameCard[] {
  return Array.from({ length: count }, (_, i) => {
    const template = SAMPLE_CARDS[i % SAMPLE_CARDS.length]!;
    const suit = SUITS[i % SUITS.length]!;
    const number = (i % 13) + 1;
    return {
      id: `card-${++cardIdCounter}`,
      name: template.name,
      suit,
      number,
      category: template.category,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Placeholder equipment / player generators                          */
/* ------------------------------------------------------------------ */

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
/*  Sample skills for sandbox testing                                  */
/* ------------------------------------------------------------------ */

const SAMPLE_SKILLS: SkillData[] = [
  {
    id: "skill-jianxiong",
    name: "奸雄",
    description: "当你受到伤害后，你可以获得造成伤害的牌。",
    enabled: true,
    tag: undefined,
  },
  {
    id: "skill-hujia",
    name: "护驾",
    description: "主公技，当你需要使用或打出【闪】时，你可以令其他魏势力角色代替你使用或打出一张【闪】。",
    enabled: true,
    tag: "lord",
  },
  {
    id: "skill-guicai",
    name: "鬼才",
    description: "在一名角色的判定牌生效前，你可以打出一张手牌代替之。",
    enabled: false,
  },
  {
    id: "skill-fankui",
    name: "反馈",
    description: "当你受到伤害后，你可以获得伤害来源的一张牌。",
    enabled: true,
  },
  {
    id: "skill-luoshen",
    name: "洛神",
    description: "准备阶段，你可以进行判定：若为黑色，你获得此判定牌，且可以继续判定。",
    enabled: false,
    tag: "lock",
  },
];

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useGameStore = create<GameTableState & GameTableActions>(
  (set, get) => ({
    players: generatePlayers(8),
    drawPileCount: 98,
    discardPileCount: 12,
    currentPlayerIndex: 0,
    currentPhase: "play",
    turnCount: 1,
    gameOver: false,
    hand: generateSampleHand(6),
    selectedCardIds: [],
    skills: SAMPLE_SKILLS,
    currentAction: null,
    targetSelection: null,
    responsePrompt: null,

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
          // Draw 2 new cards at start of turn (sandbox simulation)
          hand: [...s.hand, ...generateSampleHand(2)],
          selectedCardIds: [],
          // Reset interaction state on turn change
          currentAction: null,
          targetSelection: null,
          responsePrompt: null,
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
        hand: generateSampleHand(6),
        selectedCardIds: [],
        skills: SAMPLE_SKILLS,
        currentAction: null,
        targetSelection: null,
        responsePrompt: null,
      });
    },

    /* -- Hand card actions ------------------------------------------- */

    toggleCardSelected: (cardId) =>
      set((s) => ({
        selectedCardIds: s.selectedCardIds.includes(cardId)
          ? s.selectedCardIds.filter((id) => id !== cardId)
          : [...s.selectedCardIds, cardId],
      })),

    playCard: (cardId) =>
      set((s) => ({
        hand: s.hand.filter((c) => c.id !== cardId),
        selectedCardIds: s.selectedCardIds.filter((id) => id !== cardId),
        discardPileCount: s.discardPileCount + 1,
      })),

    playSelectedCards: () =>
      set((s) => {
        const ids = new Set(s.selectedCardIds);
        return {
          hand: s.hand.filter((c) => !ids.has(c.id)),
          selectedCardIds: [],
          discardPileCount: s.discardPileCount + ids.size,
        };
      }),

    discardSelectedCards: () =>
      set((s) => {
        const ids = new Set(s.selectedCardIds);
        return {
          hand: s.hand.filter((c) => !ids.has(c.id)),
          selectedCardIds: [],
          discardPileCount: s.discardPileCount + ids.size,
        };
      }),

    /* -- Skill activation ------------------------------------------- */

    activateSkill: (skillId) => {
      const state = get();
      const skill = state.skills.find((s) => s.id === skillId);
      if (!skill || !skill.enabled) return;

      set({
        currentAction: {
          type: "skill",
          sourceId: skillId,
          sourceName: skill.name,
        },
      });

      // For sandbox demo: auto-open target selection for the activated skill
      const otherAlive = state.players.filter(
        (p) => p.alive && p.id !== state.players[state.currentPlayerIndex]?.id,
      );
      if (otherAlive.length > 0) {
        set({
          targetSelection: {
            validTargetIds: otherAlive.map((p) => p.id),
            selectedTargetIds: [],
            minTargets: 1,
            maxTargets: 1,
            prompt: `【${skill.name}】— 选择一名目标角色`,
          },
        });
      }
    },

    cancelAction: () =>
      set({
        currentAction: null,
        targetSelection: null,
      }),

    /* -- Target selection ------------------------------------------- */

    beginTargetSelection: (opts) =>
      set({
        targetSelection: {
          ...opts,
          selectedTargetIds: [],
        },
      }),

    toggleTarget: (playerId) =>
      set((s) => {
        if (!s.targetSelection) return s;
        const { selectedTargetIds, validTargetIds, maxTargets } = s.targetSelection;
        if (!validTargetIds.includes(playerId)) return s;

        const already = selectedTargetIds.includes(playerId);
        let next: string[];
        if (already) {
          next = selectedTargetIds.filter((id) => id !== playerId);
        } else if (selectedTargetIds.length < maxTargets) {
          next = [...selectedTargetIds, playerId];
        } else {
          // At max — replace the oldest selection
          next = [...selectedTargetIds.slice(1), playerId];
        }
        return {
          targetSelection: { ...s.targetSelection, selectedTargetIds: next },
        };
      }),

    confirmTargets: () => {
      const state = get();
      if (!state.targetSelection) return;
      const { selectedTargetIds, minTargets } = state.targetSelection;
      if (selectedTargetIds.length < minTargets) return;

      // In sandbox mode: just clear the action after confirmation
      set({
        currentAction: null,
        targetSelection: null,
      });
    },

    cancelTargetSelection: () =>
      set({
        currentAction: null,
        targetSelection: null,
      }),

    /* -- Response prompt -------------------------------------------- */

    showResponsePrompt: (prompt) => set({ responsePrompt: prompt }),

    respondYes: () => {
      const state = get();
      if (!state.responsePrompt) return;
      // In sandbox mode: remove the matching card from hand if present
      const cardName = state.responsePrompt.cardName;
      const card = state.hand.find((c) => c.name === cardName);
      set({
        responsePrompt: null,
        ...(card
          ? {
              hand: state.hand.filter((c) => c.id !== card.id),
              discardPileCount: state.discardPileCount + 1,
            }
          : {}),
      });
    },

    respondNo: () => set({ responsePrompt: null }),
  }),
);
