import { createHmac, timingSafeEqual } from "node:crypto";

interface SessionPayload {
  exp: number;
  gen: number;
}

export function signSessionCookie(opts: { ttlSeconds: number }, secret: string): string {
  const gen = parseInt(process.env.SESSION_GENERATION ?? "1", 10);
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + opts.ttlSeconds,
    gen,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
}

export type VerifyResult =
  | { ok: true; payload: SessionPayload }
  | { ok: false; reason: "malformed" | "bad-signature" | "expired" | "wrong-generation" };

export function verifySessionCookie(token: string, secret: string): VerifyResult {
  if (typeof token !== "string" || token.length === 0 || !token.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const payloadB64: string = parts[0]!;
  const sig: string = parts[1]!;
  if (!payloadB64 || !sig) return { ok: false, reason: "malformed" };

  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("hex");
  let sigBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    sigBuf = Buffer.from(sig, "hex");
    expectedBuf = Buffer.from(expectedSig, "hex");
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (sigBuf.length !== expectedBuf.length) return { ok: false, reason: "bad-signature" };
  if (!timingSafeEqual(sigBuf, expectedBuf)) return { ok: false, reason: "bad-signature" };

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }
  const currentGen = parseInt(process.env.SESSION_GENERATION ?? "1", 10);
  if (payload.gen !== currentGen) {
    return { ok: false, reason: "wrong-generation" };
  }

  return { ok: true, payload };
}

export function passwordMatches(input: string, expected: string | undefined): boolean {
  if (typeof expected !== "string" || expected.length === 0) return false;
  if (typeof input !== "string" || input.length === 0) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
