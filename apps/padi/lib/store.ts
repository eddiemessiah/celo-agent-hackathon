// Free-question + streak tracking. In-memory for the hackathon MVP — survives
// a warm serverless instance, resets on cold start (worst case: someone gets
// an extra free question, which is fine). Swap for Vercel KV/Supabase post-demo.

const freeUsed = new Set<string>();
const askCounts = new Map<string, number>();

export function hasFreeQuestion(wallet: string): boolean {
  return !freeUsed.has(wallet.toLowerCase());
}

export function consumeFreeQuestion(wallet: string): void {
  freeUsed.add(wallet.toLowerCase());
}

export function recordAsk(wallet: string): number {
  const key = wallet.toLowerCase();
  const next = (askCounts.get(key) ?? 0) + 1;
  askCounts.set(key, next);
  return next;
}
