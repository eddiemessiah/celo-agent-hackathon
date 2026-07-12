// Free-question + streak tracking. In-memory for the hackathon MVP — survives
// a warm serverless instance, resets on cold start (worst case: someone gets
// an extra free question, which is fine). Swap for Vercel KV/Supabase post-demo.

const freeUsed = new Set<string>();
const askCounts = new Map<string, number>();
const campusCounts = new Map<string, number>();
const campusWallets = new Map<string, Map<string, number>>();

export function hasFreeQuestion(wallet: string): boolean {
  return !freeUsed.has(wallet.toLowerCase());
}

export function consumeFreeQuestion(wallet: string): void {
  freeUsed.add(wallet.toLowerCase());
}

export function recordAsk(wallet: string, campus = "general"): number {
  const key = wallet.toLowerCase();
  const next = (askCounts.get(key) ?? 0) + 1;
  askCounts.set(key, next);
  campusCounts.set(campus, (campusCounts.get(campus) ?? 0) + 1);
  const perWallet = campusWallets.get(campus) ?? new Map<string, number>();
  perWallet.set(key, (perWallet.get(key) ?? 0) + 1);
  campusWallets.set(campus, perWallet);
  return next;
}

/** Campus war standings + whether a wallet is top-10 on its campus. */
export function campusBoard(wallet?: string, campus?: string) {
  const rows = [...campusCounts.entries()]
    .map(([label, value]) => ({ label: label.toUpperCase(), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  let youTop10 = false;
  if (wallet && campus) {
    const perWallet = campusWallets.get(campus);
    if (perWallet) {
      const ranked = [...perWallet.entries()].sort((a, b) => b[1] - a[1]);
      youTop10 = ranked
        .slice(0, 10)
        .some(([w]) => w === wallet.toLowerCase());
    }
  }
  return { rows, youTop10 };
}
