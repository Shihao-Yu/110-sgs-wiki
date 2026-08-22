"use client";

import { assetUrl } from "@/lib/assets";

export type GalleryItem = {
  id: string;
  name: string;
  image: string;
  note?: string;
};

type PackGalleryProps = {
  title: string;
  items: GalleryItem[];
};

export default function PackGallery({ title, items }: PackGalleryProps) {
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
          <figure
            key={it.id}
            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80"
          >
            <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img
                alt={it.name}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                src={assetUrl(it.image)}
              />
            </div>
            <figcaption className="px-2.5 py-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {it.name}
              </p>
              {it.note && (
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {it.note}
                </p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
