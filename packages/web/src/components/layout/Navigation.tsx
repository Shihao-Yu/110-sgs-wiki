import Link from "next/link";
import { navigationItems } from "@/lib/site";

export default function Navigation() {
  return (
    <nav aria-label="Primary" className="w-full lg:w-auto">
      <ul className="flex flex-wrap gap-2 lg:justify-end">
        {navigationItems.map((item) => (
          <li key={item.href}>
            <Link
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/85 px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-brand/30 hover:text-brand dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:border-brand/40 dark:hover:text-red-200"
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
