import { siteConfig } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="relative mt-16 pb-10 pt-12">
      {/* Decorative top rule */}
      <div className="page-shell">
        <div className="rule-classical" aria-hidden />
      </div>

      <div className="page-shell mt-6 flex flex-col items-center gap-3 text-center text-xs text-ink-mute dark:text-ivory-soft sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span aria-hidden className="font-seal text-vermillion text-base">
            印
          </span>
          <p className="font-display tracking-wide">{siteConfig.footer}</p>
        </div>
        <p className="tracking-wider">资料仅供参考　　以官方裁定为准</p>
      </div>
    </footer>
  );
}
