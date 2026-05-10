// Pull canonical enums from the data package types where possible.
// Faction list comes from Faction type; SkillType from SkillType; FAQCategory from FAQCategory.
// We hard-code mirrors below but keep them minimal so drift is obvious in code review.
const FACTIONS = ["WEI", "SHU", "WU", "QUN", "JIN"] as const;
const GENDERS = ["male", "female"] as const;
const SKILL_TYPES = ["active", "passive", "lock", "limited", "awakening", "mission"] as const;
// v1 only exposes general/rule via the admin UI (skill/card categories require relations
// the v1 editor doesn't expose, so they'd produce orphans).
const FAQ_CATEGORIES_V1 = ["general", "rule"] as const;

export const MAX_TEXT_LEN = 5000;        // descriptions, answers, questions
export const MAX_SHORT_TEXT_LEN = 200;   // names, titles, single-line strings

export interface ValidationError { path: string; message: string }
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: ValidationError[] };

const isString = (v: unknown): v is string => typeof v === "string";
const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
const inRange = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const lenAtMost = (v: string, n: number) => v.length <= n;

// Image URL allowlist: site-relative path OR http(s):// absolute URL. Reject javascript:, data:, etc.
const IMAGE_URL_RE = /^(\/[^\s]*|https?:\/\/[^\s]+)$/;

export interface GeneralPatch {
  name: string; title: string;
  faction: typeof FACTIONS[number];
  subfaction?: typeof FACTIONS[number];
  hp: number; maxHp: number;
  gender: typeof GENDERS[number];
  skills: string[]; image: string;
  paired?: boolean; pairedNames?: string[];
  isEmperor?: boolean; designer?: string; pack: string;
  perfectMatchPartners?: string[];
}

export function validateGeneralPatch(input: unknown): ValidationResult<GeneralPatch> {
  const e: ValidationError[] = [];
  if (input == null || typeof input !== "object") {
    e.push({ path: "(root)", message: "请求体必须是对象" });
    return { ok: false, errors: e };
  }
  const v = input as Record<string, unknown>;
  if (!isNonEmptyString(v.name) || !lenAtMost(v.name, MAX_SHORT_TEXT_LEN)) e.push({ path: "name", message: "必填且 ≤200 字" });
  if (!isString(v.title) || !lenAtMost(v.title, MAX_SHORT_TEXT_LEN)) e.push({ path: "title", message: "≤200 字" });
  if (!FACTIONS.includes(v.faction as typeof FACTIONS[number])) e.push({ path: "faction", message: `必须是 ${FACTIONS.join("/")}` });
  if (v.subfaction !== undefined && !FACTIONS.includes(v.subfaction as typeof FACTIONS[number])) e.push({ path: "subfaction", message: "无效势力" });
  if (!inRange(v.hp, 1, 12)) e.push({ path: "hp", message: "HP 必须在 1-12" });
  if (!inRange(v.maxHp, 1, 12)) e.push({ path: "maxHp", message: "maxHp 必须在 1-12" });
  if (typeof v.hp === "number" && typeof v.maxHp === "number" && v.hp > v.maxHp) e.push({ path: "hp", message: "HP 不能大于 maxHp" });
  if (!GENDERS.includes(v.gender as typeof GENDERS[number])) e.push({ path: "gender", message: "性别必须是 male/female" });
  if (!isStringArray(v.skills)) e.push({ path: "skills", message: "技能 ID 列表必须是字符串数组" });
  if (!isString(v.image) || !IMAGE_URL_RE.test(v.image)) e.push({ path: "image", message: "image 必须是 / 开头或 http(s):// 开头的 URL" });
  if (v.pairedNames !== undefined && !isStringArray(v.pairedNames)) e.push({ path: "pairedNames", message: "必须是字符串数组" });
  if (v.perfectMatchPartners !== undefined && !isStringArray(v.perfectMatchPartners)) e.push({ path: "perfectMatchPartners", message: "必须是字符串数组" });
  if (!isString(v.pack)) e.push({ path: "pack", message: "pack 必填" });
  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as GeneralPatch };
}

export interface SkillPatch {
  name: string; description: string;
  type: typeof SKILL_TYPES[number];
  timing: string[]; tags?: string[];
}

export function validateSkillPatch(input: unknown): ValidationResult<SkillPatch> {
  const e: ValidationError[] = [];
  if (input == null || typeof input !== "object") {
    return { ok: false, errors: [{ path: "(root)", message: "请求体必须是对象" }] };
  }
  const v = input as Record<string, unknown>;
  if (!isNonEmptyString(v.name) || !lenAtMost(v.name, MAX_SHORT_TEXT_LEN)) e.push({ path: "name", message: "必填且 ≤200 字" });
  if (!isNonEmptyString(v.description) || !lenAtMost(v.description, MAX_TEXT_LEN)) e.push({ path: "description", message: `必填且 ≤${MAX_TEXT_LEN} 字` });
  if (!SKILL_TYPES.includes(v.type as typeof SKILL_TYPES[number])) e.push({ path: "type", message: `必须是 ${SKILL_TYPES.join("/")}` });
  if (!isStringArray(v.timing)) e.push({ path: "timing", message: "必须是字符串数组" });
  if (v.tags !== undefined && !isStringArray(v.tags)) e.push({ path: "tags", message: "必须是字符串数组" });
  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as SkillPatch };
}

export interface FaqInput {
  question: string; answer: string;
  category: typeof FAQ_CATEGORIES_V1[number];
  relatedGeneralIds: string[];
}

// ===== Session Recorder (Feature ②) =====

export const SESSION_PLAYER_NAME_MAX = 50;
export const SESSION_MIN_PLAYERS = 2;
export const SESSION_MAX_PLAYERS = 12;

export interface SessionPlayerInput {
  name: string;
  generals: [string | null, string | null];
}

export interface SessionInput {
  ifRevision: number;
  playerCount: number;
  players: SessionPlayerInput[];
}

const GENERAL_ID_RE = /^general_[a-zA-Z0-9_]+$/;

export function validateSessionInput(input: unknown): ValidationResult<SessionInput> {
  const e: ValidationError[] = [];
  if (input == null || typeof input !== "object") {
    return { ok: false, errors: [{ path: "(root)", message: "请求体必须是对象" }] };
  }
  const v = input as Record<string, unknown>;

  // ifRevision
  const ifRevision = v.ifRevision;
  if (typeof ifRevision !== "number" || !Number.isInteger(ifRevision) || ifRevision < 0) {
    e.push({ path: "ifRevision", message: "必须是非负整数" });
  }

  // playerCount
  const playerCount = v.playerCount;
  if (typeof playerCount !== "number" || !Number.isInteger(playerCount) || playerCount < SESSION_MIN_PLAYERS || playerCount > SESSION_MAX_PLAYERS) {
    e.push({ path: "playerCount", message: `玩家数必须在 ${SESSION_MIN_PLAYERS}-${SESSION_MAX_PLAYERS}` });
  }

  // players array
  const players = v.players;
  if (!Array.isArray(players)) {
    e.push({ path: "players", message: "必须是数组" });
    return { ok: false, errors: e };
  }
  if (typeof playerCount === "number" && players.length !== playerCount) {
    e.push({ path: "players", message: `players 长度必须等于 playerCount (${playerCount})` });
  }

  const seenGenerals = new Set<string>();
  players.forEach((p, i) => {
    if (p == null || typeof p !== "object") {
      e.push({ path: `players[${i}]`, message: "必须是对象" });
      return;
    }
    const pp = p as Record<string, unknown>;
    if (typeof pp.name !== "string" || pp.name.length > SESSION_PLAYER_NAME_MAX) {
      e.push({ path: `players[${i}].name`, message: `名字必须是 ≤${SESSION_PLAYER_NAME_MAX} 字字符串（可空）` });
    }
    if (!Array.isArray(pp.generals) || pp.generals.length !== 2) {
      e.push({ path: `players[${i}].generals`, message: "必须是 length-2 数组" });
      return;
    }
    pp.generals.forEach((g, gi) => {
      if (g === null) return;
      if (typeof g !== "string" || !GENERAL_ID_RE.test(g)) {
        e.push({ path: `players[${i}].generals[${gi}]`, message: "必须是 null 或 general_* id" });
        return;
      }
      if (seenGenerals.has(g)) {
        e.push({ path: `players[${i}].generals[${gi}]`, message: `武将 ${g} 已被其他玩家选中` });
      } else {
        seenGenerals.add(g);
      }
    });
  });

  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as SessionInput };
}

export function validateFaqInput(input: unknown): ValidationResult<FaqInput> {
  const e: ValidationError[] = [];
  if (input == null || typeof input !== "object") {
    return { ok: false, errors: [{ path: "(root)", message: "请求体必须是对象" }] };
  }
  const v = input as Record<string, unknown>;
  if (!isNonEmptyString(v.question) || !lenAtMost(v.question, MAX_TEXT_LEN)) e.push({ path: "question", message: `必填且 ≤${MAX_TEXT_LEN} 字` });
  if (!isNonEmptyString(v.answer) || !lenAtMost(v.answer, MAX_TEXT_LEN)) e.push({ path: "answer", message: `必填且 ≤${MAX_TEXT_LEN} 字` });
  if (!FAQ_CATEGORIES_V1.includes(v.category as typeof FAQ_CATEGORIES_V1[number])) e.push({ path: "category", message: `v1 仅支持 ${FAQ_CATEGORIES_V1.join("/")}` });
  if (!isStringArray(v.relatedGeneralIds)) e.push({ path: "relatedGeneralIds", message: "必须是字符串数组（可空）" });
  if (e.length > 0) return { ok: false, errors: e };
  return { ok: true, value: v as unknown as FaqInput };
}
