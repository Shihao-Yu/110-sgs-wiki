import { describe, expect, it, beforeEach, vi } from "vitest";

const cookieStore = new Map<string, string>();
const revalidated: string[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => {
      const v = cookieStore.get(n);
      return v ? { value: v } : undefined;
    },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => { revalidated.push(p); },
}));

const mem = new Map<string, string>();
vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(k: string) { const v = mem.get(k); return v ? JSON.parse(v) : null; }
    async set(k: string, v: unknown) { mem.set(k, JSON.stringify(v)); }
    async del(k: string) { mem.delete(k); }
    async mget(...keys: string[]) {
      return keys.map((k) => { const v = mem.get(k); return v ? JSON.parse(v) : null; });
    }
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() { return {}; }
    static fixedWindow() { return {}; }
    async limit() { return { success: true, reset: Date.now() + 60_000 }; }
  },
}));

const SECRET = "0".repeat(64);
beforeEach(() => {
  cookieStore.clear();
  mem.clear();
  revalidated.length = 0;
  process.env.SESSION_SECRET = SECRET;
  process.env.SESSION_GENERATION = "1";
  process.env.ADMIN_PASSWORD = "test-pass-very-long-enough";
  process.env.UPSTASH_REDIS_REST_URL = "https://example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  process.env.VERCEL_DEPLOY_HOOK_URL = "https://example.com/hook";
});

import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { PATCH as generalsPatch } from "@/app/api/admin/generals/[id]/route";
import { POST as faqsPost } from "@/app/api/admin/faqs/route";
import { POST as syncPost } from "@/app/api/admin/sync-search/route";
import { ADMIN_COOKIE_NAME } from "@/lib/auth-gate";
import { signSessionCookie } from "@/lib/auth";
import { __resetForTests as resetStore } from "@/lib/entity-store";

beforeEach(() => resetStore());

function authedReq(method: string, body?: unknown): Request {
  cookieStore.set(ADMIN_COOKIE_NAME, signSessionCookie({ ttlSeconds: 60 }, SECRET));
  const h = new Headers({
    "host": "example.com",
    "origin": "https://example.com",
    "content-type": "application/json",
  });
  return new Request("https://example.com/api/admin/x", {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("auth login flow", () => {
  it("rejects wrong password", async () => {
    const req = new Request("https://example.com/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: "WRONG" }),
    });
    const res = await loginPost(req);
    expect(res.status).toBe(401);
  });
  it("accepts correct password and sets cookie", async () => {
    const req = new Request("https://example.com/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: "test-pass-very-long-enough" }),
    });
    const res = await loginPost(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/admin_session=/);
  });
});

describe("/api/auth/me", () => {
  it("authed: false without cookie", async () => {
    const res = await meGet();
    expect(await res.json()).toEqual({ authed: false });
  });
});

describe("/api/admin/generals/[id]", () => {
  it("401 without auth", async () => {
    const req = new Request("https://example.com/api/admin/generals/g1", { method: "PATCH", body: "{}" });
    const res = await generalsPatch(req, { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(401);
  });
  it("422 on invalid body when authed", async () => {
    const res = await generalsPatch(
      authedReq("PATCH", { name: "" }),
      { params: Promise.resolve({ id: "g1" }) },
    );
    expect(res.status).toBe(422);
  });
  it("200 + revalidates on valid edit", async () => {
    mem.set(
      "general:g1",
      JSON.stringify({
        id: "g1", name: "old", title: "T", faction: "WEI", hp: 4, maxHp: 4,
        gender: "male", skills: [], image: "/x.png", pack: "p",
      }),
    );
    mem.set("generals:index", JSON.stringify(["g1"]));
    const res = await generalsPatch(
      authedReq("PATCH", {
        name: "new", title: "T", faction: "WEI", hp: 4, maxHp: 4,
        gender: "male", skills: [], image: "/x.png", pack: "p",
      }),
      { params: Promise.resolve({ id: "g1" }) },
    );
    expect(res.status).toBe(200);
    expect(revalidated).toContain("/generals/g1");
    expect(revalidated).toContain("/generals");
  });
});

describe("/api/admin/faqs POST", () => {
  it("creates a new FAQ", async () => {
    const res = await faqsPost(authedReq("POST", {
      question: "Q?", answer: "A.", category: "general", relatedGeneralIds: [],
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.value.id).toMatch(/^faq_/);
  });
});

describe("/api/admin/sync-search", () => {
  it("triggers deploy hook and returns 202", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const res = await syncPost(authedReq("POST"));
    expect(res.status).toBe(202);
    expect(fetchSpy).toHaveBeenCalledWith("https://example.com/hook", { method: "POST" });
    fetchSpy.mockRestore();
  });
  it("502 on deploy hook failure", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    const res = await syncPost(authedReq("POST"));
    expect(res.status).toBe(502);
    fetchSpy.mockRestore();
  });
  it("500 when deploy hook URL not configured", async () => {
    delete process.env.VERCEL_DEPLOY_HOOK_URL;
    const res = await syncPost(authedReq("POST"));
    expect(res.status).toBe(500);
  });
});
