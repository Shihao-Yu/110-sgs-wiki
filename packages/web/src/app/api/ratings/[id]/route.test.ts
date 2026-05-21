import { describe, expect, it, beforeEach, vi } from "vitest";

const mem = new Map<string, string>();
const revalidated: string[] = [];

vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => { revalidated.push(p); },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(k: string) { const v = mem.get(k); return v ? JSON.parse(v) : null; }
    async set(k: string, v: unknown) { mem.set(k, JSON.stringify(v)); }
    async del(k: string) { mem.delete(k); }
    async mget(...keys: string[]) {
      return keys.map((k) => { const v = mem.get(k); return v ? JSON.parse(v) : null; });
    }
    async lpush(key: string, value: unknown) {
      const existing = mem.get(key);
      const list: string[] = existing ? JSON.parse(existing) : [];
      list.unshift(String(value));
      mem.set(key, JSON.stringify(list));
      return list.length;
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

beforeEach(() => {
  mem.clear();
  revalidated.length = 0;
  process.env.UPSTASH_REDIS_REST_URL = "https://example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
});

async function seedGeneral(id: string) {
  mem.set(`general:${id}`, JSON.stringify({
    id, name: "Test", title: "", faction: "WEI", hp: 4, maxHp: 4,
    gender: "male", skills: [], image: "", pack: "p",
  }));
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ratings/g1", {
    method: "POST",
    headers: { "x-forwarded-for": "127.0.0.1", "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("POST /api/ratings/[id]", () => {
  it("400 on missing/invalid `to`", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    const res = await POST(makeRequest({ to: "not-a-tier" }), { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(400);
  });

  it("404 when general does not exist", async () => {
    const { POST } = await import("./route.js");
    const res = await POST(makeRequest({ to: "夯" }), { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("200 + updates aggregate + appends log on first vote", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    const res = await POST(makeRequest({ to: "顶级" }), { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.counts["顶级"]).toBe(1);
    expect(body.total).toBe(1);
    expect(body.topTier).toBe("顶级");
    const today = new Date().toISOString().slice(0, 10);
    const log = mem.get(`ratings:log:${today}`);
    expect(log).toBeTruthy();
  });

  it("revalidates /generals and /generals/<id>", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    await POST(makeRequest({ to: "夯" }), { params: Promise.resolve({ id: "g1" }) });
    expect(revalidated).toContain("/generals");
    expect(revalidated).toContain("/generals/g1");
  });

  it("400 on invalid `from`", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    const res = await POST(makeRequest({ from: "bogus", to: "夯" }), { params: Promise.resolve({ id: "g1" }) });
    expect(res.status).toBe(400);
  });

  it("decrements old tier when `from` provided", async () => {
    await seedGeneral("g1");
    const { POST } = await import("./route.js");
    await POST(makeRequest({ to: "npc" }), { params: Promise.resolve({ id: "g1" }) });
    const res = await POST(makeRequest({ from: "npc", to: "夯" }), { params: Promise.resolve({ id: "g1" }) });
    const body = await res.json();
    expect(body.counts["npc"]).toBe(0);
    expect(body.counts["夯"]).toBe(1);
    expect(body.total).toBe(1);
  });
});
