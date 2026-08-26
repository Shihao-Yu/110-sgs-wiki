"use client";

import type { Token } from "@sgs/data";
import { useState } from "react";
import { assetUrl } from "@/lib/assets";
import CardLightbox, { type CardDetail } from "@/components/cards/CardLightbox";

type TokenStripProps = {
  tokens: Token[];
};

const CATEGORY_LABEL: Record<string, string> = {
  skill: "标记牌",
  module: "模块牌",
  misc: "其他",
};

function toDetail(t: Token): CardDetail {
  const category = t.category as unknown as string;
  const module = (t as { module?: string }).module;
  const meta: CardDetail["meta"] = [
    { label: "类别", value: CATEGORY_LABEL[category] ?? category },
  ];
  if (module) meta.push({ label: "所属模块", value: module });
  return {
    id: t.id as unknown as string,
    name: t.name,
    image: t.image,
    backImage: (t as { backImage?: string }).backImage,
    meta,
  };
}

export default function TokenStrip({ tokens }: TokenStripProps) {
  const [selected, setSelected] = useState<CardDetail | null>(null);

  if (tokens.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {tokens.map((t) => (
          <button
            className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-vermillion/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40 dark:border-slate-800/80 dark:bg-slate-950/80"
            key={t.id as unknown as string}
            onClick={() => setSelected(toDetail(t))}
            type="button"
          >
            <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img
                alt={t.name}
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                loading="lazy"
                src={assetUrl(t.image)}
              />
            </div>
            <span className="block px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
              {t.name}
            </span>
          </button>
        ))}
      </div>
      <CardLightbox card={selected} onClose={() => setSelected(null)} />
    </>
  );
}
