// Stateless gig links. On Vercel each request may hit a different lambda, so we
// can't keep gigs in memory across create → pay → deliver. Instead the whole
// gig spec is signed into the link (HMAC-SHA256) and verified on any instance.
// The signature is integrity only — the gig contents aren't secret.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { GigKind } from "./gigs";

const SECRET = process.env.GIG_SECRET ?? "oga-dev-secret-change-me";
const TTL_MS = 30 * 60 * 1000; // links expire in 30 min

export interface GigSpec {
  kind: GigKind;
  input: string;
  priceUsd: string;
  naira: string;
  ts: number;
  source:
    | { type: "telegram"; chatId: number; username?: string }
    | { type: "x"; tweetId: string; author: string }
    | { type: "web" };
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
function sign(payload: string): string {
  return b64url(createHmac("sha256", SECRET).update(payload).digest());
}

/** Encode a gig spec into a compact, URL-safe, signed token. */
export function encodeGig(spec: GigSpec): string {
  const payload = b64url(Buffer.from(JSON.stringify(spec), "utf8"));
  return `${payload}.${sign(payload)}`;
}

/** Verify + decode a gig token. Returns null if tampered or expired. */
export function decodeGig(token: string): GigSpec | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const spec = JSON.parse(unb64url(payload).toString("utf8")) as GigSpec;
    if (Date.now() - spec.ts > TTL_MS) return null;
    return spec;
  } catch {
    return null;
  }
}
