"use client";

import { useEffect, useState } from "react";
import { RATING_TIERS, topTier, type GeneralRating, type RatingTier } from "@/lib/ratings";

interface RatingPanelProps {
  generalId: string;
  initialRating: GeneralRating | null;
}

const STORAGE_KEY = (id: string) => `vote:${id}`;

export default function RatingPanel({ generalId, initialRating }: RatingPanelProps) {
  const [rating, setRating] = useState<GeneralRating | null>(initialRating);
  const [myVote, setMyVote] = useState<RatingTier | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const v = window.localStorage.getItem(STORAGE_KEY(generalId));
    if (v && (RATING_TIERS as readonly string[]).includes(v)) {
      setMyVote(v as RatingTier);
    }
  }, [generalId]);

  const mode = topTier(rating);
  const total = rating?.total ?? 0;

  async function vote(to: RatingTier) {
    if (pending || to === myVote) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ratings/${encodeURIComponent(generalId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: myVote, to }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { counts: GeneralRating["counts"]; total: number };
      setRating({
        counts: body.counts,
        total: body.total,
        updatedAt: new Date().toISOString(),
      });
      setMyVote(to);
      window.localStorage.setItem(STORAGE_KEY(generalId), to);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title">评级</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {total === 0
            ? "暂无评级，来投一票"
            : `目前 ${total} 票最多投：${mode}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {RATING_TIERS.map((tier) => {
          const isMode = tier === mode;
          const isMine = tier === myVote;
          const base = "rounded-lg border px-3 py-2 text-xs font-semibold transition-all sm:px-2.5 sm:py-1";
          const selected = "border-brand/50 bg-brand/10 text-brand shadow-sm dark:border-brand/60 dark:bg-brand/20 dark:text-red-300";
          const unselected = "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600";
          const mine = isMine ? "ring-2 ring-brand/60" : "";
          return (
            <button
              key={tier}
              type="button"
              disabled={pending}
              onClick={() => vote(tier)}
              className={`${base} ${isMode ? selected : unselected} ${mine}`}
            >
              {tier}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">点击投票，可随时改</p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500">投票失败：{error}</p>
      )}
    </section>
  );
}
