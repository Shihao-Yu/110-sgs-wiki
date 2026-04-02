"use client";

export type SimulationParams = {
  games: number;
  players: number;
};

const GAME_OPTIONS = [10, 100, 1000] as const;
const PLAYER_OPTIONS = [4, 6, 8] as const;

type SimulationConfigProps = {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
  onRun: () => void;
  running: boolean;
};

export default function SimulationConfig({
  params,
  onChange,
  onRun,
  running,
}: SimulationConfigProps) {
  return (
    <div className="panel p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        模拟参数
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Game count selector */}
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
            模拟场次
          </label>
          <div className="flex gap-2">
            {GAME_OPTIONS.map((n) => (
              <button
                key={n}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                  params.games === n
                    ? "border-brand bg-brand/10 text-brand shadow-sm shadow-brand/15 dark:border-brand/70 dark:bg-brand/15 dark:text-red-300"
                    : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                }`}
                disabled={running}
                onClick={() => onChange({ ...params, games: n })}
                type="button"
              >
                {n.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Player count selector */}
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
            玩家人数
          </label>
          <div className="flex gap-2">
            {PLAYER_OPTIONS.map((n) => (
              <button
                key={n}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                  params.players === n
                    ? "border-brand bg-brand/10 text-brand shadow-sm shadow-brand/15 dark:border-brand/70 dark:bg-brand/15 dark:text-red-300"
                    : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                }`}
                disabled={running}
                onClick={() => onChange({ ...params, players: n })}
                type="button"
              >
                {n}人
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Run button */}
      <button
        className="mt-5 w-full rounded-xl border border-brand bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-brand/40"
        disabled={running}
        onClick={onRun}
        type="button"
      >
        {running ? "模拟运行中..." : "开始模拟"}
      </button>
    </div>
  );
}
