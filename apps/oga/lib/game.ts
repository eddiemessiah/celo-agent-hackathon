// Oga game economy — "Hustle Arcade on the timeline".
// Client XP scales with spend; the combo meter multiplies XP (never price).

import type { GameConfig, GameEvent } from "@hack/game-kit";
import type { GigKind } from "./gigs";

export const BASE_XP: Record<GigKind, number> = {
  caption: 10,
  roast: 10,
  bio: 20,
  cv_headline: 40,
};

export const NAIRA: Record<GigKind, number> = {
  caption: 50,
  roast: 50,
  bio: 100,
  cv_headline: 200,
};

export const COMBO_WINDOW_MS = 10 * 60 * 1000;

/**
 * Advance the running combo. Gigs within 10 min of each other stack:
 * 1st = x1, 2nd = x2 … 5th+ = x5 (cap). Resets when the window lapses.
 * Persisted per wallet so it survives the pay→deliver navigation.
 */
export function bumpCombo(wallet: string | null, now = Date.now()): number {
  const key = `oga-combo:${(wallet ?? "guest").toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    const prev = raw ? (JSON.parse(raw) as { at: number; n: number }) : null;
    const n = prev && now - prev.at <= COMBO_WINDOW_MS ? Math.min(5, prev.n + 1) : 1;
    localStorage.setItem(key, JSON.stringify({ at: now, n }));
    return n;
  } catch {
    return 1;
  }
}

export const ogaGame: GameConfig = {
  storageKey: "oga-game",
  streakEvents: ["gig"],
  streakBonusXp: 0, // Oga has no streak bonus; combo drives volume instead

  xpFor: (e: GameEvent) => {
    if (e.type !== "gig") return 0;
    const kind = e.meta?.kind as GigKind | undefined;
    const combo = (e.meta?.combo as number | undefined) ?? 1;
    return kind ? BASE_XP[kind] * combo : 0;
  },

  ranks: [
    { name: "Customer", xp: 0, copy: "Welcome. Wetin Oga fit do for you?" },
    { name: "Regular", xp: 50, copy: "You don show face pass once. Regular status." },
    { name: "VIP", xp: 150, copy: "VIP! You dey enter front of queue now." },
    { name: "Oga's Guy", xp: 400, copy: "You be Oga's Guy now. We tight. 🤝" },
    { name: "Big Boss", xp: 1000, copy: "Big Boss don land. Anything you want." },
    { name: "Chairman", xp: 2500, copy: "CHAIRMAN. Oga go stand up for you. 🎩" },
  ],

  missions: [
    {
      id: "first_blood",
      label: "First Blood",
      copy: "You open the market today. 💪",
      xp: 15,
      cadence: "daily",
      target: 1,
      counter: "gig",
    },
    {
      id: "full_combo",
      label: "Full Combo",
      copy: "Combo unlocked. You sabi enjoy yourself.",
      xp: 30,
      cadence: "daily",
      target: 1,
      counter: "combo3",
    },
    {
      id: "sample_menu",
      label: "Sample the Menu",
      copy: "You don taste everything for menu.",
      xp: 60,
      cadence: "weekly",
      target: 1,
      counter: "menu_week",
    },
    {
      id: "bring_padi",
      label: "Bring Your Padi",
      copy: "Refer your guy, we both win.",
      xp: 50,
      cadence: "weekly",
      target: 1,
      counter: "referral",
    },
  ],

  badges: [
    {
      id: "day_one",
      label: "Day One",
      icon: "🌅",
      copy: "You dey here early. Day One.",
      check: (s) => (s.counters["gig"] ?? 0) >= 1,
    },
    {
      id: "roasted",
      label: "Roasted",
      icon: "🔥",
      copy: "You fit take heat. 🔥",
      check: (s) => (s.counters["kind:roast"] ?? 0) >= 1,
    },
    {
      id: "glow_up",
      label: "Glow Up",
      icon: "✨",
      copy: "New bio, new you.",
      check: (s) => (s.counters["kind:bio"] ?? 0) >= 1,
    },
    {
      id: "job_ready",
      label: "Job Ready",
      icon: "💼",
      copy: "Recruiter go stop scroll.",
      check: (s) => (s.counters["kind:cv_headline"] ?? 0) >= 1,
    },
    {
      id: "full_menu",
      label: "Full Menu",
      icon: "🍽️",
      copy: "You don chop everything. 🍽️",
      check: (s) =>
        ["roast", "bio", "cv_headline", "caption"].every(
          (k) => (s.counters[`kind:${k}`] ?? 0) >= 1,
        ),
    },
    {
      id: "combo_king",
      label: "Combo King",
      icon: "👑",
      copy: "Five straight?! Combo King. 👑",
      check: (s) => (s.counters["combo5"] ?? 0) >= 1,
    },
    {
      id: "regular",
      label: "Regular",
      icon: "🎟️",
      copy: "Ten gigs deep. Certified regular.",
      check: (s) => (s.counters["gig"] ?? 0) >= 10,
    },
    {
      id: "big_spender",
      label: "Big Spender",
      icon: "💰",
      copy: "You dey spend am. Boss moves.",
      check: (s) => (s.counters["naira"] ?? 0) >= 1000,
    },
    {
      id: "certified",
      label: "Certified",
      icon: "🏅",
      copy: "50 gigs. You be Oga's real one.",
      check: (s) => (s.counters["gig"] ?? 0) >= 50,
    },
    {
      id: "screenshotted",
      label: "Screenshotted",
      icon: "📸",
      copy: "Your card dey timeline now. Famous. 📸",
      check: (s) => (s.counters["share"] ?? 0) >= 1,
    },
  ],
};
