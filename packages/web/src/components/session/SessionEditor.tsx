"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SessionPlayer from "./SessionPlayer";
import InlineConfirm from "@/components/admin/InlineConfirm";
import { toast } from "@/components/admin/Toaster";
import { SESSION_MAX_PLAYERS, SESSION_MIN_PLAYERS } from "@/lib/validators";

interface SessionPlayerData {
  name: string;
  generals: [string | null, string | null];
}

interface Session {
  revision: number;
  playerCount: number;
  players: SessionPlayerData[];
  updatedAt: string;
}

interface GeneralOption {
  id: string;
  name: string;
  faction: string;
  hp: number;
  image: string;
}

type SaveState = "idle" | "saving" | "saved" | "conflict" | "error";

const POLL_INTERVAL_MS = 5000;
const SAVE_DEBOUNCE_MS = 500;

function emptyPlayers(n: number, prev: SessionPlayerData[] = []): SessionPlayerData[] {
  return Array.from({ length: n }, (_, i) => prev[i] ?? { name: "", generals: [null, null] });
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

function sameContent(a: Session, b: Session): boolean {
  return JSON.stringify({ playerCount: a.playerCount, players: a.players })
       === JSON.stringify({ playerCount: b.playerCount, players: b.players });
}

export default function SessionEditor({
  initialSession,
  initialError,
  allGenerals,
}: {
  initialSession: Session | null;
  initialError: string | null;
  allGenerals: GeneralOption[];
}) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const readError = initialError;
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialSession?.updatedAt ?? null);

  // Refs for stable access inside async closures
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);
  const saveStateRef = useRef(saveState);
  useEffect(() => { saveStateRef.current = saveState; }, [saveState]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastConflictToastAtRef = useRef(0);

  // Apply server data WITHOUT triggering an auto-save (used by polling and PUT response)
  const applyServerSession = useCallback((s: Session) => {
    setSession(s);
    setLastSavedAt(s.updatedAt);
  }, []);

  const persist = useCallback(async () => {
    const cur = sessionRef.current;
    if (!cur) return;
    setSaveState("saving");
    try {
      const r = await fetch("/api/session", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ifRevision: cur.revision,
          playerCount: cur.playerCount,
          players: cur.players,
        }),
        cache: "no-store",
      });
      if (r.status === 409) {
        const j = (await r.json()) as { current: Session };
        applyServerSession(j.current);
        setSaveState("conflict");
        // Throttle conflict toast — once per 8 seconds max
        const now = Date.now();
        if (now - lastConflictToastAtRef.current > 8000) {
          lastConflictToastAtRef.current = now;
          toast("另一人刚刚改过此牌局，已加载最新版本", "info");
        }
        return;
      }
      if (!r.ok) {
        setSaveState("error");
        toast("保存失败，3 秒后重试", "error");
        setTimeout(() => persist(), 3000);
        return;
      }
      const j = (await r.json()) as { value: Session };
      applyServerSession(j.value);
      setSaveState("saved");
    } catch {
      setSaveState("error");
      toast("网络错误，3 秒后重试", "error");
      setTimeout(() => persist(), 3000);
    }
  }, [applyServerSession]);

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persist(), SAVE_DEBOUNCE_MS);
  }

  // Poll for updates from other clients (does NOT trigger auto-save)
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      // Don't clobber an in-flight save or a debounced pending save
      if (saveStateRef.current === "saving") return;
      if (saveTimerRef.current !== null) return;
      try {
        const r = await fetch("/api/session", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as Session;
        const local = sessionRef.current;
        if (!local) {
          applyServerSession(j);
          return;
        }
        if (j.revision > local.revision && !sameContent(j, local)) {
          applyServerSession(j);
        } else if (j.revision > local.revision) {
          // Same content, just bump revision so next save uses latest
          setSession((prev) => (prev ? { ...prev, revision: j.revision, updatedAt: j.updatedAt } : prev));
          setLastSavedAt(j.updatedAt);
        }
      } catch {
        // network blip, ignore
      }
    }
    const id = setInterval(poll, POLL_INTERVAL_MS);
    const onVis = () => { if (document.visibilityState === "visible") poll(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [applyServerSession]);

  if (readError && !session) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-sm text-red-600 dark:text-red-300">{readError}</p>
        <button type="button" onClick={() => location.reload()} className="btn-primary mt-3">
          刷新重试
        </button>
      </div>
    );
  }
  if (!session) {
    return <div className="panel p-6 text-center text-sm text-ink-mute dark:text-ivory-soft">载入中…</div>;
  }

  const allTaken = session.players.flatMap((p) => p.generals.filter((g): g is string => g != null));

  function updatePlayerName(i: number, name: string) {
    setSession((s) => {
      if (!s) return s;
      const players = s.players.map((p, idx) => (idx === i ? { ...p, name } : p));
      return { ...s, players };
    });
    scheduleSave();
  }

  function updatePlayerGeneral(i: number, slot: 0 | 1, gid: string | null) {
    setSession((s) => {
      if (!s) return s;
      const players = s.players.map((p, idx) => {
        if (idx !== i) return p;
        const next: [string | null, string | null] = [p.generals[0], p.generals[1]];
        next[slot] = gid;
        return { ...p, generals: next };
      });
      return { ...s, players };
    });
    scheduleSave();
  }

  function changePlayerCount(n: number) {
    setSession((s) => {
      if (!s) return s;
      const players = emptyPlayers(n, s.players).slice(0, n);
      return { ...s, playerCount: n, players };
    });
    scheduleSave();
  }

  function reset() {
    setSession((s) => {
      if (!s) return s;
      const players = s.players.map((p) => ({ name: p.name, generals: [null, null] as [null, null] }));
      return { ...s, players };
    });
    scheduleSave();
  }

  const saveLabel = (() => {
    switch (saveState) {
      case "saving": return "保存中…";
      case "saved": return `已保存 · ${formatTime(lastSavedAt ?? "")}`;
      case "conflict": return `已合并最新 · ${formatTime(lastSavedAt ?? "")}`;
      case "error": return "保存失败，重试中";
      default: return lastSavedAt ? `上次更新 · ${formatTime(lastSavedAt)}` : "尚未保存";
    }
  })();

  const counts: number[] = [];
  for (let n = SESSION_MIN_PLAYERS; n <= SESSION_MAX_PLAYERS; n++) counts.push(n);

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-mute dark:text-ivory-soft">玩家数</span>
          <select
            className="input-base !w-auto"
            value={session.playerCount}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              if (next < session.playerCount) {
                if (!confirm(`缩减为 ${next} 人，将清掉玩家 ${next + 1} 到 ${session.playerCount}。继续？`)) {
                  return;
                }
              }
              changePlayerCount(next);
            }}
          >
            {counts.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <InlineConfirm
          ariaLabel="清空所有武将"
          destructive
          message="清空所有玩家的武将（保留名字）?"
          trigger={<span className="btn-danger">清空武将</span>}
          onConfirm={reset}
        />
        <span className="ml-auto text-xs text-ink-mute dark:text-ivory-soft">{saveLabel}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {session.players.map((p, i) => {
          const otherTaken = allTaken.filter((g) => !p.generals.includes(g));
          return (
            <SessionPlayer
              key={i}
              index={i}
              name={p.name}
              generals={p.generals}
              allGenerals={allGenerals}
              excludedIds={otherTaken}
              onNameChange={(name) => updatePlayerName(i, name)}
              onGeneralChange={(slot, gid) => updatePlayerGeneral(i, slot, gid)}
            />
          );
        })}
      </div>
    </div>
  );
}
