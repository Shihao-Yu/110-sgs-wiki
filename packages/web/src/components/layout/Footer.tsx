import { siteConfig } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/65 py-6 dark:border-slate-800/80 dark:bg-slate-950/65">
      <div className="page-shell flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>{siteConfig.footer}</p>
        <p>资料仅供参考，以官方裁定为准。</p>
      </div>
    </footer>
  );
}
