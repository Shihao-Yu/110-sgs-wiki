import type { Metadata } from "next";
import GameTable from "@/components/game/GameTable";
import SandboxClient from "./SandboxClient";

export const metadata: Metadata = {
  title: "沙盒",
  description: "浏览器内国战对局实验场",
};

export default function SandboxPage() {
  return (
    <div className="page-shell py-6 sm:py-10">
      <section className="mb-6">
        <span className="eyebrow">Sandbox</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          对局桌面
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Visual shell for the game table layout. The visual-only shell is
          below; click &ldquo;Start Game (Engine Mode)&rdquo; to run a full
          engine-driven session.
        </p>
      </section>

      {/* Engine-driven sandbox with game controller */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">
          Engine Mode
        </h2>
        <SandboxClient />
      </section>

      {/* Original visual-only shell for layout testing */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">
          Visual Shell
        </h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-500">
          Click a player portrait to toggle alive/dead state. Use the toolbar
          to change player count or advance turns.
        </p>
        <GameTable />
      </section>
    </div>
  );
}
