import type { Metadata } from "next";
import type { Suit } from "./components/CardEntry";
import { getNavigationItemBySlug } from "@/lib/site";
import cardsData from "../../../../data/src/cards.json";
import tokensData from "../../../../data/src/tokens.json";
import packCardsData from "../../../../data/src/pack-cards.json";
import generalsData from "../../../../data/src/generals.json";
import CardListClient from "./components/CardListClient";
import PackGallery, { type GalleryItem } from "@/components/cards/PackGallery";
import { suitRank } from "@/lib/card-display";

const section = getNavigationItemBySlug("cards");

export const metadata: Metadata = {
  title: section?.label ?? "\u5361\u724C",
  description:
    "\u4E09\u56FD\u6740\u56FD\u6218\u5361\u724C\u767E\u79D1 \u2014 \u57FA\u672C\u724C\u3001\u9526\u56CA\u724C\u3001\u88C5\u5907\u724C\u5168\u89C8\uFF0C\u6309\u7C7B\u578B\u7B5B\u9009\u3002",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CardType = "basic" | "trick" | "equipment";
type CardSubtype =
  | "weapon"
  | "armor"
  | "defensiveHorse"
  | "offensiveHorse"
  | "treasure"
  | "instantTrick"
  | "delayedTrick";

interface RawCard {
  id: string;
  name: string;
  type: CardType;
  subtype?: CardSubtype;
  suit: Suit;
  number: number;
  description: string;
  range?: number;
}

/* ------------------------------------------------------------------ */
/*  Deduplicate cards by name and aggregate suit/number variants       */
/* ------------------------------------------------------------------ */

export interface CardSummary {
  name: string;
  type: CardType;
  subtype?: CardSubtype;
  description: string;
  range?: number;
  /** All individual copies (suit + number). */
  copies: { suit: Suit; number: number }[];
}

function buildCardSummaries(): CardSummary[] {
  const map = new Map<string, CardSummary>();

  for (const raw of cardsData as RawCard[]) {
    const existing = map.get(raw.name);
    if (existing) {
      existing.copies.push({ suit: raw.suit, number: raw.number });
    } else {
      map.set(raw.name, {
        name: raw.name,
        type: raw.type,
        subtype: raw.subtype,
        description: raw.description,
        range: raw.range,
        copies: [{ suit: raw.suit, number: raw.number }],
      });
    }
  }

  return Array.from(map.values());
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CardsPage() {
  const cards = buildCardSummaries();
  const totalCopies = (cardsData as RawCard[]).length;

  type RawToken = {
    id: string; name: string; image: string; backImage?: string;
    category: string; ownerGeneralId?: string;
  };
  const tokens = tokensData as RawToken[];
  const generalNames = new Map(
    (generalsData as { id: string; name: string }[]).map((g) => [g.id, g.name]),
  );

  type RawPackCard = {
    id: string; name: string; suit: string; number: number; image: string;
    ownerGeneralId?: string;
  };
  const packCards: GalleryItem[] = (packCardsData as RawPackCard[]).map((c) => {
    const owner = c.ownerGeneralId ? generalNames.get(c.ownerGeneralId) : undefined;
    return {
      id: c.id,
      name: c.name,
      image: c.image,
      note: `${suitRank(c.suit, c.number)}${owner ? ` · ${owner}` : ""}`,
      meta: [
        { label: "花色点数", value: suitRank(c.suit, c.number) },
        ...(owner && c.ownerGeneralId
          ? [{ label: "专属武将", value: owner, href: `/generals/${c.ownerGeneralId}` }]
          : [{ label: "归属", value: "通用牌" }]),
      ],
    };
  });

  const tokenItems: GalleryItem[] = tokens
    .filter((t) => t.category === "skill")
    .map((t) => {
      const owner = t.ownerGeneralId ? generalNames.get(t.ownerGeneralId) : undefined;
      return {
        id: t.id,
        name: t.name,
        image: t.image,
        backImage: t.backImage,
        note: owner,
        meta:
          owner && t.ownerGeneralId
            ? [{ label: "所属武将", value: owner, href: `/generals/${t.ownerGeneralId}` }]
            : [{ label: "归属", value: "无" }],
      };
    });

  const moduleItems: GalleryItem[] = tokens
    .filter((t) => t.category === "module")
    .map((t) => {
      const owner = t.ownerGeneralId ? generalNames.get(t.ownerGeneralId) : undefined;
      return {
        id: t.id,
        name: t.name,
        image: t.image,
        backImage: t.backImage,
        note: owner,
        meta: [
          { label: "所属模块", value: "大攻车" },
          ...(owner && t.ownerGeneralId
            ? [{ label: "所属武将", value: owner, href: `/generals/${t.ownerGeneralId}` }]
            : []),
        ],
      };
    });

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">卡牌</span>
        <h1 className="section-title mt-3">
          {"\u5361\u724C\u767E\u79D1"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {"\u6D4F\u89C8\u5168\u90E8"} {cards.length}{" "}
          {"\u79CD\u5361\u724C\uFF08\u5171"} {totalCopies}{" "}
          {"\u5F20\uFF09\uFF0C\u6309\u7C7B\u578B\u7B5B\u9009\u67E5\u770B\u57FA\u672C\u724C\u3001\u9526\u56CA\u724C\u548C\u88C5\u5907\u724C\u3002"}
        </p>
      </header>

      <CardListClient cards={cards} totalCopies={totalCopies} />

      <PackGallery title="群狼环鼎新增牌" items={packCards} />
      <PackGallery title="标记牌" items={tokenItems} />
      <PackGallery title="大攻车" items={moduleItems} />
    </div>
  );
}
