import { didFallback } from "@/lib/fallback-flag";

export default function FallbackBanner() {
  if (!didFallback()) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-400/40 bg-amber-50/80 px-4 py-2 text-center text-xs text-amber-900 dark:border-amber-300/30 dark:bg-amber-900/30 dark:text-amber-100"
    >
      内容暂时回退到上次部署版本（数据存储暂不可用，正在重试）
    </div>
  );
}
