import type { Metadata } from "next";
import GameTable from "@/components/game/GameTable";

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
          Visual shell for the game table layout. Click a player portrait to
          toggle alive/dead state. Use the toolbar to change player count or
          advance turns.
        </p>
      </section>

      <GameTable />
    </div>
  );
}
