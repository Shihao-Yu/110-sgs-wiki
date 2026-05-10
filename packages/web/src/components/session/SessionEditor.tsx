"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const POLL_INTERVAL_MS = 5000;

function emptyPlayers(n: number, prev: SessionPlayerData[] = []): SessionPlayerData[] {
  return Array.from({ length: n }, (_, i) => prev[i] ?? { name: "", generals: [null, null] });
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

function contentKey(s: Session | { playerCount: number; players: SessionPlayerData[] }): string {
  return JSON.stringify({ playerCount: s.playerCount, players: s.players });
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
  // Local working copy (what the user sees and edits)
  const [session, setSession] = useState<Session | null>(initialSession);
  // Last known server-side state (for dirty comparison + ifRevision)
  const [serverSession, setServerSession] = useState<Session | null>(initialSession);
  // Latest revision the server has, even if newer than serverSession (for "服务器有更新" hint)
  const [latestRemoteRevision, setLatestRemoteRevision] = useState<number>(initialSession?.revision ?? 0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const readError = initialError;

  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);
  const serverSessionRef = useRef(serverSession);
  useEffect(() => { serverSessionRef.current = serverSession; }, [serverSession]);

  const isDirty = useMemo(() => {
    if (!session || !serverSession) return false;
    return contentKey(session) !== contentKey(serverSession);
  }, [session, serverSession]);

  const serverHasNewer = latestRemoteRevision > (serverSession?.revision ?? 0);

  const applyServerSession = useCallback((s: Session) => {
    setSession(s);
    setServerSession(s);
    setLatestRemoteRevision(s.revision);
  }, []);

  const save = useCallback(async () => {
    const cur = sessionRef.current;
    const baseRev = serverSessionRef.current?.revision ?? 0;
    if (!cur) return;
    setSaving(true);
    setSaveError(null);
    try {
      const r = await fetch("/api/session", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ifRevision: baseRev,
          playerCount: cur.playerCount,
          players: cur.players,
        }),
        cache: "no-store",
      });
      if (r.status === 409) {
        const j = (await r.json()) as { current: Session };
        // Server has a newer version — replace local with server's; user must re-apply edits
        applyServerSession(j.current);
        toast("他人已先一步保存，已加载最新版本，请重新应用你的修改", "info");
        return;
      }
      if (!r.ok) {
        setSaveError("保存失败");
        toast("保存失败，请重试", "error");
        return;
      }
      const j = (await r.json()) as { value: Session };
      applyServerSession(j.value);
      toast("已保存", "success");
    } catch {
      setSaveError("网络错误");
      toast("网络错误，请重试", "error");
    } finally {
      setSaving(false);
    }
  }, [applyServerSession]);

  // Poll for changes from other clients
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/session", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as Session;
        const localServer = serverSessionRef.current;
        const localCur = sessionRef.current;
        setLatestRemoteRevision(j.revision);
        if (!localServer || !localCur) {
          applyServerSession(j);
          return;
        }
        if (j.revision <= localServer.revision) return;
        // Server has newer state. If local has unsaved edits, DON'T clobber —
        // just let the "服务器有更新" indicator surface so the user decides.
        const dirty = contentKey(localCur) !== contentKey(localServer);
        if (!dirty) {
          applyServerSession(j);
        }
      } catch {
        // network blip
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
  }

  function changePlayerCount(n: number) {
    setSession((s) => {
      if (!s) return s;
      const players = emptyPlayers(n, s.players).slice(0, n);
      return { ...s, playerCount: n, players };
    });
  }

  function resetGenerals() {
    setSession((s) => {
      if (!s) return s;
      const players = s.players.map((p) => ({ name: p.name, generals: [null, null] as [null, null] }));
      return { ...s, players };
    });
  }

  function discardChanges() {
    if (!serverSession) return;
    setSession(serverSession);
  }

  function pullLatest() {
    // Force-fetch current server state
    void (async () => {
      try {
        const r = await fetch("/api/session", { cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as Session;
          applyServerSession(j);
          toast("已加载最新版本", "success");
        }
      } catch {
        toast("加载失败", "error");
      }
    })();
  }

  const counts: number[] = [];
  for (let n = SESSION_MIN_PLAYERS; n <= SESSION_MAX_PLAYERS; n++) counts.push(n);

  const statusLabel = (() => {
    if (saving) return "保存中…";
    if (saveError) return saveError;
    if (isDirty) return "有未保存的修改";
    if (serverSession) return `已保存 · ${formatTime(serverSession.updatedAt)}`;
    return "尚未保存";
  })();

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
          onConfirm={resetGenerals}
        />
        {isDirty && (
          <button type="button" className="btn-secondary" onClick={discardChanges} disabled={saving}>
            放弃修改
          </button>
        )}
        <span className="ml-auto flex items-center gap-3 text-xs">
          {serverHasNewer && (
            <button
              type="button"
              onClick={pullLatest}
              className="rounded border border-amber-500/40 bg-amber-50/60 px-2 py-0.5 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
            >
              服务器有更新 · 点击拉取
            </button>
          )}
          <span className={isDirty ? "text-vermillion" : "text-ink-mute dark:text-ivory-soft"}>{statusLabel}</span>
          <button
            type="button"
            className="btn-primary"
            onClick={save}
            disabled={!isDirty || saving}
            aria-label="保存当前牌局"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </span>
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
