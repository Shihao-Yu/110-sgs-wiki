"use client";

import { useState } from "react";
import { assetUrl } from "@/lib/assets";
import CardLightbox, { type CardDetail } from "@/components/cards/CardLightbox";

/** 画廊条目就是一张可点开的牌，形状与弹层一致。 */
export type GalleryItem = CardDetail;

type PackGalleryProps = {
  title: string;
  items: GalleryItem[];
};

export default function PackGallery({ title, items }: PackGalleryProps) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="section-title mb-5">
        {title}
        <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
          {items.length}
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((it) => (
          <button
            className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-vermillion/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40 dark:border-slate-800/80 dark:bg-slate-950/80"
            key={it.id}
            onClick={() => setSelected(it)}
            type="button"
          >
            <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img
                alt={it.name}
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                loading="lazy"
                src={assetUrl(it.image)}
              />
            </div>
            <span className="block px-2.5 py-2">
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                {it.name}
              </span>
              {it.note && (
                <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                  {it.note}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      <CardLightbox card={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
