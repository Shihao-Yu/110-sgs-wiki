"use client";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

interface ReplayControlsProps {
  /** Current step index (0-based). */
  currentStep: number;
  /** Total number of steps. */
  totalSteps: number;
  /** Whether auto-playback is running. */
  isPlaying: boolean;
  /** Current playback speed multiplier. */
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onSeek: (step: number) => void;
  onSpeedChange: (speed: number) => void;
}

export default function ReplayControls({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onSeek,
  onSpeedChange,
}: ReplayControlsProps) {
  const atStart = currentStep <= 0;
  const atEnd = currentStep >= totalSteps - 1;
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="min-w-[3.5rem] text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {currentStep + 1} / {totalSteps}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(totalSteps - 1, 0)}
          value={currentStep}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand dark:bg-slate-700"
          title={`Step ${currentStep + 1} of ${totalSteps}`}
        />
        <span className="min-w-[3rem] text-xs text-slate-500 dark:text-slate-400">
          {progress.toFixed(0)}%
        </span>
      </div>

      {/* Buttons row */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Step back */}
        <button
          type="button"
          onClick={onStepBack}
          disabled={atStart}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Step back"
        >
          <StepBackIcon />
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          disabled={atEnd && !isPlaying}
          className="inline-flex h-9 w-16 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Step forward */}
        <button
          type="button"
          onClick={onStepForward}
          disabled={atEnd}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Step forward"
        >
          <StepForwardIcon />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Speed selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Speed:
          </span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={[
                "inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md px-1.5 text-xs font-medium transition-colors",
                speed === s
                  ? "border border-brand/30 bg-brand/10 text-brand dark:border-brand/50 dark:bg-brand/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              ].join(" ")}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (avoids adding icon library dependency)           */
/* ------------------------------------------------------------------ */

function PlayIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 2.5v11l9-5.5L4 2.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

function StepBackIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="2" height="10" rx="0.5" />
      <path d="M13 3v10L5 8l8-5z" />
    </svg>
  );
}

function StepForwardIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="12" y="3" width="2" height="10" rx="0.5" />
      <path d="M3 3v10l8-5L3 3z" />
    </svg>
  );
}
