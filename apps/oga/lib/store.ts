// Gig identity is a stateless signed token (see token.ts) so create → pay →
// deliver works across Vercel lambdas with no shared state. A soft in-memory
// cache of delivered gigs powers the homepage "recent work" + Oga's level; it
// is best-effort and may reset on cold start (the onchain GigReceipts count is
// the real source of truth for the agent's level).

import { encodeGig, decodeGig, type GigSpec } from "./token";
import { GIG_MENU, type GigKind } from "./gigs";

export interface Gig extends GigSpec {
  id: string; // the token itself
  status: "pending" | "delivered";
  deliverable?: string;
  payer?: string;
  tx?: string;
}

export function createGig(spec: Omit<GigSpec, "ts">): Gig {
  const full: GigSpec = { ...spec, ts: Date.now() };
  const id = encodeGig(full);
  return { ...full, id, status: "pending" };
}

export function getGig(token: string): Gig | undefined {
  const spec = decodeGig(token);
  if (!spec) return undefined;
  const cached = delivered.get(token);
  return cached ?? { ...spec, id: token, status: "pending" };
}

// soft cache — homepage + level only
const delivered = new Map<string, Gig>();
let deliveredCount = 0;

export function deliverGig(
  token: string,
  fields: { deliverable: string; payer?: string; tx?: string },
): Gig | undefined {
  const spec = decodeGig(token);
  if (!spec) return undefined;
  if (delivered.has(token)) return delivered.get(token);
  const gig: Gig = { ...spec, id: token, status: "delivered", ...fields };
  delivered.set(token, gig);
  deliveredCount += 1;
  return gig;
}

export function recentDelivered(limit = 5): Gig[] {
  return [...delivered.values()]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);
}

/**
 * Oga's public level = onchain GigReceipts count. Falls back to the soft
 * in-memory count when the chain read isn't wired yet. Set via setOgaGigCount.
 */
let ogaGigCount = 0;
export function setOgaGigCount(n: number): void {
  ogaGigCount = n;
}
export function ogaLevel() {
  const gigs = Math.max(ogaGigCount, deliveredCount);
  const tier =
    gigs >= 1500 ? "Naija GOAT"
    : gigs >= 500 ? "Lagos Legend"
    : gigs >= 100 ? "Timeline Boss"
    : gigs >= 25 ? "Street Certified"
    : "Hustler";
  return { gigs, level: Math.floor(gigs / 10), tier };
}

export function gigLabel(kind: GigKind): string {
  return GIG_MENU[kind].label;
}
