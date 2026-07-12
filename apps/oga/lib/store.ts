// Gig store. In-memory MVP: run Oga as a single long-lived instance
// (`next start` on a VM/Railway, or dev+ngrok for the livestream). Swap for
// KV/Supabase when scaling out. Tasks expire unpaid after 30 minutes.

import { randomUUID } from "node:crypto";
import type { GigKind } from "./gigs";

export interface Gig {
  id: string;
  kind: GigKind;
  input: string;
  priceUsd: string;
  naira: string;
  status: "pending" | "delivered";
  createdAt: number;
  deliverable?: string;
  payer?: string;
  tx?: string;
  source:
    | { type: "telegram"; chatId: number; username?: string }
    | { type: "x"; tweetId: string; author: string }
    | { type: "web" };
}

const gigs = new Map<string, Gig>();
const EXPIRY_MS = 30 * 60 * 1000;

export function createGig(
  gig: Omit<Gig, "id" | "status" | "createdAt">,
): Gig {
  const full: Gig = {
    ...gig,
    id: randomUUID().slice(0, 8),
    status: "pending",
    createdAt: Date.now(),
  };
  gigs.set(full.id, full);
  return full;
}

export function getGig(id: string): Gig | undefined {
  const gig = gigs.get(id);
  if (!gig) return undefined;
  if (gig.status === "pending" && Date.now() - gig.createdAt > EXPIRY_MS) {
    gigs.delete(id);
    return undefined;
  }
  return gig;
}

export function deliverGig(
  id: string,
  fields: { deliverable: string; payer?: string; tx?: string },
): Gig | undefined {
  const gig = gigs.get(id);
  if (!gig) return undefined;
  Object.assign(gig, fields, { status: "delivered" as const });
  return gig;
}

export function recentDelivered(limit = 10): Gig[] {
  return [...gigs.values()]
    .filter((g) => g.status === "delivered")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
