import { describe, expect, it, beforeEach, vi, afterAll } from "vitest";

const mem = new Map<string, string>();
let throwOnGet = false;

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(key: string) {
      if (throwOnGet) throw new Error("simulated upstash failure");
      const v = mem.get(key);
      return v ? JSON.parse(v) : null;
    }
    async set(key: string, value: unknown) {
      mem.set(key, JSON.stringify(value));
    }
  },
}));

const ENV_BAK = { ...process.env };
beforeEach(() => {
  mem.clear();
  throwOnGet = false;
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
});
afterAll(() => { Object.assign(process.env, ENV_BAK); });

import { getSession, putSession, defaultSession, __resetForTests } from "./session-store.js";

beforeEach(() => __resetForTests());

describe("getSession", () => {
  it("returns default when Redis empty", async () => {
    const s = await getSession();
    expect(s.revision).toBe(0);
    expect(s.playerCount).toBe(5);
    expect(s.players).toHaveLength(5);
  });
  it("throws when Redis env missing", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __resetForTests();
    await expect(getSession()).rejects.toThrow("Redis not configured");
  });
  it("throws on Redis read error", async () => {
    throwOnGet = true;
    await expect(getSession()).rejects.toThrow();
  });
});

describe("putSession (CAS)", () => {
  it("first write succeeds with ifRevision=0", async () => {
    const r = await putSession(0, {
      playerCount: 3,
      players: [
        { name: "A", generals: [null, null] },
        { name: "B", generals: [null, null] },
        { name: "C", generals: [null, null] },
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.revision).toBe(1);
      expect(r.value.playerCount).toBe(3);
    }
  });

  it("subsequent writes increment revision", async () => {
    const r1 = await putSession(0, { playerCount: 2, players: [{ name: "", generals: [null, null] }, { name: "", generals: [null, null] }] });
    expect(r1.ok && r1.value.revision === 1).toBe(true);
    const r2 = await putSession(1, { playerCount: 2, players: [{ name: "X", generals: [null, null] }, { name: "Y", generals: [null, null] }] });
    expect(r2.ok && r2.value.revision === 2).toBe(true);
  });

  it("conflict returns 409 with current state", async () => {
    await putSession(0, { playerCount: 2, players: [{ name: "A", generals: [null, null] }, { name: "B", generals: [null, null] }] });
    const r = await putSession(0, { playerCount: 2, players: [{ name: "X", generals: [null, null] }, { name: "Y", generals: [null, null] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("conflict");
      expect(r.current.revision).toBe(1);
      expect(r.current.players[0].name).toBe("A");
    }
  });
});

describe("defaultSession", () => {
  it("provides 5 empty players", () => {
    const d = defaultSession();
    expect(d.playerCount).toBe(5);
    expect(d.players).toHaveLength(5);
    expect(d.players.every((p) => p.generals.length === 2 && p.generals.every((g) => g === null))).toBe(true);
  });
});
