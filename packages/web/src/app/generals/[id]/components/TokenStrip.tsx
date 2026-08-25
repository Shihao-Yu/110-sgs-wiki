"use client";

import type { Token } from "@sgs/data";
import { assetUrl } from "@/lib/assets";

type TokenStripProps = {
  tokens: Token[];
};

export default function TokenStrip({ tokens }: TokenStripProps) {
  if (tokens.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {tokens.map((t) => (
        <figure
          key={t.id as unknown as string}
          className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80"
        >
          <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900">
            <img
              alt={t.name}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              src={assetUrl(t.image)}
            />
          </div>
          <figcaption className="px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
            {t.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
