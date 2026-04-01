"use client";

import { useCallback, useState } from "react";
import { ReplayParser, type ReplayData } from "@/lib/replay";
import ReplayViewer from "./components/ReplayViewer";

/* ------------------------------------------------------------------ */
/*  Bundled sample replay (imported at build time)                     */
/* ------------------------------------------------------------------ */

import sampleReplayJson from "../../../../../replays/sample-4player.json";

export default function ReplayPage() {
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const loadReplay = useCallback((text: string) => {
    try {
      const parser = new ReplayParser();
      const data = parser.parse(text);
      setReplay(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse replay file");
      setReplay(null);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          loadReplay(reader.result);
        }
      };
      reader.onerror = () => setError("Failed to read file");
      reader.readAsText(file);
    },
    [loadReplay],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          loadReplay(reader.result);
        }
      };
      reader.onerror = () => setError("Failed to read file");
      reader.readAsText(file);
    },
    [loadReplay],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleLoadSample = useCallback(() => {
    try {
      const parser = new ReplayParser();
      const data = parser.parse(JSON.stringify(sampleReplayJson));
      setReplay(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse sample replay");
    }
  }, []);

  const handleReset = useCallback(() => {
    setReplay(null);
    setError(null);
  }, []);

  return (
    <div className="page-shell py-6 sm:py-10">
      {/* Header */}
      <section className="mb-6">
        <span className="eyebrow">Replay</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          录像回放
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Import a QSanguosha replay file (.json) to step through the game
          turn by turn. Use the controls to play, pause, and navigate the
          action timeline.
        </p>
      </section>

      {replay ? (
        <>
          {/* Back / reset button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span aria-hidden="true">&larr;</span>
              Load another replay
            </button>
          </div>

          <ReplayViewer replay={replay} />
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Drop zone / file picker */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={[
              "flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-10 transition-colors",
              isDragging
                ? "border-brand bg-brand/5 dark:bg-brand/10"
                : "border-slate-300 bg-white/60 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-600",
            ].join(" ")}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400 dark:text-slate-500"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Drag and drop a replay file here
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                or click below to browse
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white">
              Choose file
              <input
                type="file"
                accept=".json,.qsgs"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>

            {error && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Sample replay card */}
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Sample Replay
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Try the viewer with a bundled 4-player sample game (7 turns).
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded bg-wei/10 px-1.5 text-xs font-semibold text-wei">
                  WEI
                </span>
                <span>Player1 (Cao Cao + Dian Wei)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded bg-shu/10 px-1.5 text-xs font-semibold text-shu">
                  SHU
                </span>
                <span>Player2 (Liu Bei + Guan Yu)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded bg-wu/10 px-1.5 text-xs font-semibold text-wu">
                  WU
                </span>
                <span>Player3 (Sun Quan + Zhou Yu)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded bg-qun/10 px-1.5 text-xs font-semibold text-qun">
                  QUN
                </span>
                <span>Player4 (Hua Tuo + Diao Chan)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="mt-auto inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Load sample replay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
