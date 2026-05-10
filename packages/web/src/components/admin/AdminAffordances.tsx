"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "./AdminContext";
import { adminFetch, type AdminFetchError } from "@/lib/admin-fetch";
import { toast } from "./Toaster";

export default function AdminAffordances() {
  const router = useRouter();
  const { authed, loading, refresh } = useAdmin();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  if (loading || !authed) return null;

  async function handleSync() {
    setSyncing(true);
    try {
      await adminFetch<{ message: string }>("/api/admin/sync-search", { method: "POST" });
      toast("已触发部署，搜索约 60-90s 后对齐", "success");
    } catch (e) {
      const err = e as AdminFetchError;
      if (err?.status === 429) {
        toast(`同步过于频繁，请稍后再试`, "error");
      } else {
        toast("同步失败，请稍后重试", "error");
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refresh();
    router.refresh();
  }

  return (
    <div className="relative text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-2.5 py-1 text-emerald-700 dark:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        管理员模式
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-44 rounded-md border border-vermillion/30 bg-paper-mist/95 p-1 shadow-md dark:border-vermillion/40 dark:bg-paper-deep/90"
        >
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="block w-full rounded px-2 py-1 text-left hover:bg-vermillion/10 disabled:opacity-50"
          >
            {syncing ? "同步中…" : "同步搜索 (重新部署)"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded px-2 py-1 text-left hover:bg-vermillion/10"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
