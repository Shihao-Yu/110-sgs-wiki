import { describe, expect, it, beforeEach, vi } from "vitest";

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const v = cookieStore.get(name);
      return v ? { value: v } : undefined;
    },
  }),
}));

import { requireAdmin, ADMIN_COOKIE_NAME } from "./auth-gate.js";
import { signSessionCookie } from "./auth.js";

const SECRET = "0".repeat(64);

beforeEach(() => {
  cookieStore.clear();
  process.env.SESSION_SECRET = SECRET;
  process.env.SESSION_GENERATION = "1";
});

function reqOf(opts: { host?: string; origin?: string; bodyLen?: number } = {}): Request {
  const h = new Headers();
  if (opts.host) h.set("host", opts.host);
  if (opts.origin) h.set("origin", opts.origin);
  if (opts.bodyLen) h.set("content-length", String(opts.bodyLen));
  return new Request("https://example.com/api/admin/x", { method: "POST", headers: h });
}

describe("requireAdmin", () => {
  it("500 if SESSION_SECRET missing", async () => {
    delete process.env.SESSION_SECRET;
    const r = await requireAdmin(reqOf());
    expect(r?.status).toBe(500);
  });
  it("401 if no cookie", async () => {
    const r = await requireAdmin(reqOf());
    expect(r?.status).toBe(401);
  });
  it("401 with bad cookie", async () => {
    cookieStore.set(ADMIN_COOKIE_NAME, "bad.cookie");
    const r = await requireAdmin(reqOf());
    expect(r?.status).toBe(401);
  });
  it("passes with good cookie + same-origin", async () => {
    cookieStore.set(ADMIN_COOKIE_NAME, signSessionCookie({ ttlSeconds: 60 }, SECRET));
    const r = await requireAdmin(reqOf({ host: "example.com", origin: "https://example.com" }));
    expect(r).toBeNull();
  });
  it("403 on origin mismatch", async () => {
    cookieStore.set(ADMIN_COOKIE_NAME, signSessionCookie({ ttlSeconds: 60 }, SECRET));
    const r = await requireAdmin(reqOf({ host: "example.com", origin: "https://evil.com" }));
    expect(r?.status).toBe(403);
  });
  it("413 on oversized body", async () => {
    cookieStore.set(ADMIN_COOKIE_NAME, signSessionCookie({ ttlSeconds: 60 }, SECRET));
    const r = await requireAdmin(reqOf({ host: "example.com", bodyLen: 999_999 }));
    expect(r?.status).toBe(413);
  });
});
