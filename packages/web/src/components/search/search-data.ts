/**
 * Static search index built from the data layer at import time.
 *
 * Every page that needs search (GlobalSearch dropdown + /search results page)
 * imports this module.  Because the JSON files are resolved at build time by
 * Next.js, the index is embedded into the client bundle — no runtime fetch.
 */

import generalsData from "../../../../data/src/generals.json";
import tokensData from "../../../../data/src/tokens.json";
import cardsData from "../../../../data/src/cards.json";
import packCardsData from "../../../../data/src/pack-cards.json";
import faqData from "../../../../data/src/faq.json";
import {
  getGeneralPackVersion,
  GENERAL_PACK_VERSION_LABEL,
} from "../../../../data/src/types/general";

/* ------------------------------------------------------------------ */
/*  Shared result type                                                 */
/* ------------------------------------------------------------------ */

export type SearchResultType = "general" | "token" | "card" | "faq";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  /** Primary display text (name or question). */
  title: string;
  /** Secondary display text (title / description / answer snippet). */
  subtitle: string;
  /** Navigation target. */
  href: string;
}

/* ------------------------------------------------------------------ */
/*  Raw JSON type casts                                                */
/* ------------------------------------------------------------------ */

type RawGeneral = {
  id: string;
  name: string;
  title: string;
  faction: string;
  parentGeneralId?: string;
};

type RawToken = {
  id: string;
  name: string;
  category: string;
  ownerGeneralId?: string;
};

type RawPackCard = {
  id: string;
  name: string;
  suit: string;
  number: number;
};

type RawCard = {
  id: string;
  name: string;
  type: string;
  description: string;
};

type RawFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedGeneralIds?: string[];
};

/* ------------------------------------------------------------------ */
/*  Build flat search entries                                          */
/* ------------------------------------------------------------------ */

const generals = generalsData as RawGeneral[];
const tokens = tokensData as RawToken[];
const packCards = packCardsData as RawPackCard[];
const cards = cardsData as RawCard[];
const faqs = faqData as RawFaq[];

const generalNameMap = new Map<string, string>(
  generals.map((g) => [g.id, g.name]),
);

function buildSearchEntries(): SearchResult[] {
  const entries: SearchResult[] = [];

  // Generals — searchable by name + title.
  // 十常侍子卡没有独立详情页，链接指向父卡。
  // 两版共存后同名武将很多（曹丕、貂蝉、诸葛亮……），副标题带版本前缀
  // 区分，例如「国战 · 魏文帝」/「群狼环鼎 · 荡然由心」。
  for (const g of generals) {
    const versionLabel = GENERAL_PACK_VERSION_LABEL[getGeneralPackVersion(g.id)];
    entries.push({
      id: g.id,
      type: "general",
      title: g.name,
      subtitle: `${versionLabel} · ${g.title}`,
      href: `/generals/${g.parentGeneralId ?? g.id}`,
    });
  }

  // Tokens — searchable by name; subtitle shows the owning general when known.
  for (const t of tokens) {
    const owner = t.ownerGeneralId ? generalNameMap.get(t.ownerGeneralId) : undefined;
    entries.push({
      id: t.id,
      type: "token",
      title: t.name,
      subtitle: owner ?? (t.category === "module" ? "大攻车" : "标记牌"),
      href: t.ownerGeneralId ? `/generals/${t.ownerGeneralId}` : "/cards",
    });
  }

  // 群狼环鼎新增牌 —— 按名字可搜，副标题给花色点数
  const SUIT_SIGN: Record<string, string> = {
    spade: "♠", heart: "♥", club: "♣", diamond: "♦",
  };
  for (const c of packCards) {
    entries.push({
      id: c.id,
      type: "card",
      title: c.name,
      subtitle: `群狼环鼎 ${SUIT_SIGN[c.suit] ?? ""}${c.number}`,
      href: "/cards",
    });
  }

  // Cards — deduplicate by name
  const seenCardNames = new Set<string>();
  for (const c of cards) {
    if (seenCardNames.has(c.name)) continue;
    seenCardNames.add(c.name);
    entries.push({
      id: c.id,
      type: "card",
      title: c.name,
      subtitle: c.description.slice(0, 60),
      href: "/cards",
    });
  }

  // FAQ — searchable by question
  for (const f of faqs) {
    entries.push({
      id: f.id,
      type: "faq",
      title: f.question,
      subtitle: f.answer.slice(0, 60),
      href: "/faq",
    });
  }

  return entries;
}

export const searchEntries: SearchResult[] = buildSearchEntries();

/* ------------------------------------------------------------------ */
/*  Simple fuzzy-ish matching                                          */
/* ------------------------------------------------------------------ */

/**
 * Returns true when every character of `query` appears in `text` in order
 * (case-insensitive).  This gives a lightweight fuzzy match that handles
 * partial input well for CJK and Latin text.
 */
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  // Fast path: substring match
  if (t.includes(q)) return true;
  // Character-order match
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

/**
 * Score a result against the query.  Higher is better; 0 means no match.
 * - Exact substring in title  => 100
 * - Starts-with in title      => 80
 * - Substring in subtitle     => 40
 * - Fuzzy match in title      => 20
 * - No match                  =>  0
 */
function scoreResult(query: string, r: SearchResult): number {
  const q = query.toLowerCase();
  const title = r.title.toLowerCase();
  const sub = r.subtitle.toLowerCase();

  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (sub.includes(q)) return 40;
  if (fuzzyMatch(query, r.title)) return 20;
  if (fuzzyMatch(query, r.subtitle)) return 10;
  return 0;
}

/**
 * Search across all entries with scoring and optional limit.
 */
export function search(
  query: string,
  limit: number = 30,
): SearchResult[] {
  const q = query.trim();
  if (q.length === 0) return [];

  const scored = searchEntries
    .map((r) => ({ result: r, score: scoreResult(q, r) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.result);
}
