import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { signSessionCookie, verifySessionCookie, passwordMatches } from "./auth.js";

const SECRET = "0".repeat(64);

describe("signSessionCookie / verifySessionCookie", () => {
  const ORIGINAL_GEN = process.env.SESSION_GENERATION;
  beforeEach(() => { process.env.SESSION_GENERATION = "1"; });
  afterEach(() => { process.env.SESSION_GENERATION = ORIGINAL_GEN; });

  it("round-trips", () => {
    const t = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    expect(verifySessionCookie(t, SECRET).ok).toBe(true);
  });
  it("rejects tampered payload", () => {
    const t = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    const [p, s] = t.split(".");
    expect(verifySessionCookie(`${p}X.${s}`, SECRET).ok).toBe(false);
  });
  it("rejects bad signature", () => {
    const t = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    const [p] = t.split(".");
    expect(verifySessionCookie(`${p}.${"f".repeat(64)}`, SECRET).ok).toBe(false);
  });
  it("rejects expired", () => {
    const t = signSessionCookie({ ttlSeconds: -10 }, SECRET);
    expect(verifySessionCookie(t, SECRET).ok).toBe(false);
  });
  it("rejects on SESSION_GENERATION mismatch", () => {
    const t = signSessionCookie({ ttlSeconds: 60 }, SECRET);
    process.env.SESSION_GENERATION = "2";
    expect(verifySessionCookie(t, SECRET).ok).toBe(false);
  });
  it("rejects malformed (missing dot)", () => {
    expect(verifySessionCookie("no-dot-here", SECRET).ok).toBe(false);
  });
  it("rejects empty string", () => {
    expect(verifySessionCookie("", SECRET).ok).toBe(false);
  });
});

describe("passwordMatches", () => {
  it("true on exact match", () => {
    expect(passwordMatches("hunter2", "hunter2")).toBe(true);
  });
  it("false on mismatch (same length)", () => {
    expect(passwordMatches("hunter2", "hunter3")).toBe(false);
  });
  it("false on length mismatch", () => {
    expect(passwordMatches("hunter", "hunter2")).toBe(false);
  });
  it("false when expected is undefined", () => {
    expect(passwordMatches("anything", undefined)).toBe(false);
  });
  it("false when expected is empty", () => {
    expect(passwordMatches("", "")).toBe(false);
  });
  it("handles unicode", () => {
    expect(passwordMatches("一二三四", "一二三四")).toBe(true);
    expect(passwordMatches("一二三四", "一二三五")).toBe(false);
  });
});
