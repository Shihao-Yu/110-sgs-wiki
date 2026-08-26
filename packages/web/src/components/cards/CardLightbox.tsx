"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/lib/assets";

/**
 * 一张可在弹层里查看的牌。标记牌与游戏牌共用这个形状，因为两者在页面上
 * 长得一样、点开后要看的东西也一样：一张不被裁切的完整卡面。
 */
export type CardDetail = {
  id: string;
  name: string;
  image: string;
  /** 标记牌大多有背面；游戏牌没有。有背面时弹层给出正/背切换。 */
  backImage?: string;
  /** 网格缩略图下方的小字，如「♠K」或拥有者姓名。 */
  note?: string;
  /** 弹层里的键值行。href 存在时该行渲染成链接。 */
  meta?: { label: string; value: string; href?: string }[];
};

type CardLightboxProps = {
  card: CardDetail | null;
  onClose: () => void;
};

export default function CardLightbox({ card, onClose }: CardLightboxProps) {
  const [showBack, setShowBack] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 换一张牌就回到正面，否则会带着上一张的翻面状态打开。
  useEffect(() => {
    setShowBack(false);
  }, [card?.id]);

  useEffect(() => {
    if (!card) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [card, onClose]);

  if (!card) return null;

  const src = showBack && card.backImage ? card.backImage : card.image;

  return (
    <div
      aria-label={card.name}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-md bg-paper-mist shadow-xl focus:outline-none sm:rounded-md dark:bg-paper-deep"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-2 border-b border-vermillion/20 px-4 py-2">
          <div className="min-w-0">
            <span className="font-display text-sm text-ink dark:text-ivory">{card.name}</span>
            {card.note && (
              <span className="ml-2 text-xs text-ink-mute dark:text-ivory-soft">{card.note}</span>
            )}
          </div>
          <button
            aria-label="关闭"
            className="shrink-0 text-ink-mute hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion/40"
            onClick={onClose}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* object-contain：网格缩略图为了排版整齐用了 object-cover，会把卡面
              底部的牌型框裁掉；弹层的意义正在于看到完整的一张牌。 */}
          <img
            alt={card.name}
            className="mx-auto max-h-[60vh] w-auto rounded-sm object-contain shadow-md"
            src={assetUrl(src)}
          />

          {card.backImage && (
            <div className="mt-3 flex justify-center gap-2">
              {([false, true] as const).map((back) => (
                <button
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    showBack === back
                      ? "border-vermillion/50 bg-vermillion/10 text-vermillion"
                      : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300"
                  }`}
                  key={String(back)}
                  onClick={() => setShowBack(back)}
                  type="button"
                >
                  {back ? "背面" : "正面"}
                </button>
              ))}
            </div>
          )}

          {card.meta && card.meta.length > 0 && (
            <dl className="mt-4 space-y-1.5 border-t border-vermillion/15 pt-3 text-xs">
              {card.meta.map((m) => (
                <div className="flex gap-3" key={m.label}>
                  <dt className="w-16 shrink-0 text-ink-mute dark:text-ivory-soft">{m.label}</dt>
                  <dd className="text-ink dark:text-ivory">
                    {m.href ? (
                      <Link className="text-vermillion hover:underline" href={m.href} onClick={onClose}>
                        {m.value}
                      </Link>
                    ) : (
                      m.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
