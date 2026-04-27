import Link from "next/link";
import { navigationItems } from "@/lib/site";

interface NavigationProps {
  /** Called after a nav link is clicked (used to close mobile menu). */
  onNavigate?: () => void;
}

export default function Navigation({ onNavigate }: NavigationProps) {
  return (
    <nav aria-label="主导航" className="w-full lg:w-auto">
      <ul className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
        {navigationItems.map((item, idx) => (
          <li key={item.href} className="flex items-center">
            {idx > 0 && (
              <span
                aria-hidden
                className="hidden h-3 w-px bg-vermillion/25 lg:mx-1 lg:block"
              />
            )}
            <Link
              className="font-display inline-flex w-full items-center justify-center px-3 py-2 text-sm font-normal tracking-[0.18em] text-ink-soft transition-colors hover:text-vermillion dark:text-ivory-soft dark:hover:text-vermillion lg:w-auto lg:text-base"
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
