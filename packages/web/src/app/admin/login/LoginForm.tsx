"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j.error === "too-many-attempts") {
          setError(`登录尝试过多，请 ${j.retryInSeconds ?? "稍后"} 秒后再试`);
        } else if (j.error === "invalid-password") {
          setError("密码错误");
        } else {
          setError("登录失败，请重试");
        }
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell pb-12 pt-16">
      <form
        onSubmit={onSubmit}
        className="panel ornate-corner mx-auto max-w-sm space-y-4 p-8"
      >
        <header>
          <span className="eyebrow">管理员</span>
          <h1 className="section-title mt-3">管理员登录</h1>
        </header>
        <label className="block">
          <span className="mb-1.5 block text-xs text-ink-mute dark:text-ivory-soft">密码</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            className="input-base"
            placeholder="共享管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
          />
        </label>
        {error && (
          <p id="login-error" role="alert" className="text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="btn-primary w-full"
        >
          {submitting ? "登录中…" : "登录"}
        </button>
      </form>
    </div>
  );
}
