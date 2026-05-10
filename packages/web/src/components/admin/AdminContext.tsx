"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AdminCtx {
  authed: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AdminCtx>({ authed: false, loading: true, refresh: async () => {} });

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useMemo(
    () => async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = (await r.json()) as { authed?: boolean };
        setAuthed(Boolean(j.authed));
      } catch {
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ authed, loading, refresh }}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  return useContext(Ctx);
}
