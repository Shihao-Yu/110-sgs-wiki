import Link from "next/link";
import { navigationItems } from "@/lib/site";

interface NavigationProps {
  /** Called after a nav link is clicked (used to close mobile menu). */
  onNavigate?: () => void;
}

export default function Navigation({ onNavigate }: NavigationProps) {
  return (
    <nav aria-label="主导航" className="w-full lg:w-auto">
      <ul className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:justify-end">
        {navigationItems.map((item) => (
          <li key={item.href}>
            <Link
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 bg-white/85 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-brand/30 hover:text-brand lg:w-auto lg:px-3.5 lg:py-2 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:border-brand/40 dark:hover:text-red-200"
              href={item.href}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
