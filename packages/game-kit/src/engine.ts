// Shared game engine for Padi + Oga.
//
// Doctrine: gamify the paid action, never gate the utility. XP/badges/missions
// are cosmetic juice layered on real x402 payments — so state can live client-
// side (localStorage, keyed by wallet) without trust issues. The onchain
// record stays the source of truth for anything that matters.
//
// Day/week boundaries use WAT (UTC+1, no DST) — "reset midnight WAT".

export interface Rank {
  name: string;
  xp: number;
  copy: string;
}

export interface GameEvent {
  type: string;
  meta?: Record<string, unknown>;
  at?: number;
}

export interface GameState {
  xp: number;
  badges: string[];
  streak: number;
  lastDay: string | null;
  counters: Record<string, number>;
  dayCounters: Record<string, number>;
  weekCounters: Record<string, number>;
  dayKey: string;
  weekKey: string;
  missionsDone: Record<string, string>; // missionId → period key
}

export interface BadgeDef {
  id: string;
  label: string;
  icon: string;
  copy: string;
  check: (s: GameState, e: GameEvent) => boolean;
}

export interface MissionDef {
  id: string;
  label: string;
  copy: string;
  xp: number;
  cadence: "daily" | "weekly";
  target: number;
  /** counter key whose per-period value tracks progress */
  counter: string;
}

export interface GameConfig {
  storageKey: string;
  ranks: Rank[];
  badges: BadgeDef[];
  missions: MissionDef[];
  /** base XP for an event (before mission bonuses) */
  xpFor: (e: GameEvent, s: GameState) => number;
  /** event types that maintain the daily streak */
  streakEvents: string[];
  streakBonusXp: number;
}

export type Unlock =
  | { kind: "rank"; label: string; copy: string }
  | { kind: "badge"; label: string; copy: string; icon: string }
  | { kind: "mission"; label: string; copy: string; xp: number }
  | { kind: "streak"; label: string; copy: string };

const WAT_MS = 60 * 60 * 1000; // UTC+1

export function watDayKey(at = Date.now()): string {
  return new Date(at + WAT_MS).toISOString().slice(0, 10);
}

export function watWeekKey(at = Date.now()): string {
  const d = new Date(at + WAT_MS);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return "w" + d.toISOString().slice(0, 10);
}

function emptyState(at = Date.now()): GameState {
  return {
    xp: 0,
    badges: [],
    streak: 0,
    lastDay: null,
    counters: {},
    dayCounters: {},
    weekCounters: {},
    dayKey: watDayKey(at),
    weekKey: watWeekKey(at),
    missionsDone: {},
  };
}

function storageId(cfg: GameConfig, wallet: string | null): string {
  return `${cfg.storageKey}:${(wallet ?? "guest").toLowerCase()}`;
}

export function loadState(cfg: GameConfig, wallet: string | null): GameState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(storageId(cfg, wallet));
    const s: GameState = raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
    return rollover(s);
  } catch {
    return emptyState();
  }
}

function save(cfg: GameConfig, wallet: string | null, s: GameState): void {
  try {
    localStorage.setItem(storageId(cfg, wallet), JSON.stringify(s));
  } catch {
    // storage full/blocked — game state is cosmetic, carry on
  }
}

function rollover(s: GameState, at = Date.now()): GameState {
  const day = watDayKey(at);
  const week = watWeekKey(at);
  if (day !== s.dayKey) {
    s.dayKey = day;
    s.dayCounters = {};
  }
  if (week !== s.weekKey) {
    s.weekKey = week;
    s.weekCounters = {};
  }
  return s;
}

export function rankFor(ranks: Rank[], xp: number): Rank {
  let cur = ranks[0];
  for (const r of ranks) if (xp >= r.xp) cur = r;
  return cur;
}

export function nextRank(ranks: Rank[], xp: number): Rank | null {
  for (const r of ranks) if (xp < r.xp) return r;
  return null;
}

function bump(map: Record<string, number>, key: string, by = 1): void {
  map[key] = (map[key] ?? 0) + by;
}

/**
 * Apply an event: base XP → streak → missions → badges → rank. Returns the new
 * state plus every unlock to toast, in the order they should show.
 */
export function recordEvent(
  cfg: GameConfig,
  wallet: string | null,
  e: GameEvent,
): { state: GameState; unlocks: Unlock[]; gainedXp: number } {
  const at = e.at ?? Date.now();
  const s = rollover(loadState(cfg, wallet), at);
  const unlocks: Unlock[] = [];
  const rankBefore = rankFor(cfg.ranks, s.xp);
  let gained = cfg.xpFor(e, s);

  // lifetime + period counters (event type, plus any meta counters)
  bump(s.counters, e.type);
  bump(s.dayCounters, e.type);
  bump(s.weekCounters, e.type);
  for (const extra of (e.meta?.counters as string[] | undefined) ?? []) {
    bump(s.counters, extra);
    bump(s.dayCounters, extra);
    bump(s.weekCounters, extra);
  }
  // additive counters (e.g. naira spent) — increment by a value, not by 1
  for (const [key, by] of Object.entries(
    (e.meta?.add as Record<string, number> | undefined) ?? {},
  )) {
    bump(s.counters, key, by);
    bump(s.dayCounters, key, by);
    bump(s.weekCounters, key, by);
  }

  // streak — maintained when a core action lands on a new WAT day
  if (cfg.streakEvents.includes(e.type)) {
    const today = watDayKey(at);
    if (s.lastDay !== today) {
      const yesterday = watDayKey(at - 24 * 60 * 60 * 1000);
      if (s.lastDay === yesterday) {
        s.streak += 1;
        gained += cfg.streakBonusXp;
        unlocks.push({
          kind: "streak",
          label: `${s.streak}-day streak`,
          copy: "Consistency na cheat code.",
        });
      } else {
        s.streak = 1;
      }
      s.lastDay = today;
    }
  }

  // missions — complete when the period counter crosses target
  for (const m of cfg.missions) {
    const period = m.cadence === "daily" ? s.dayKey : s.weekKey;
    if (s.missionsDone[m.id] === period) continue;
    const bucket = m.cadence === "daily" ? s.dayCounters : s.weekCounters;
    if ((bucket[m.counter] ?? 0) >= m.target) {
      s.missionsDone[m.id] = period;
      gained += m.xp;
      unlocks.push({ kind: "mission", label: m.label, copy: m.copy, xp: m.xp });
    }
  }

  s.xp += gained;

  // badges
  for (const b of cfg.badges) {
    if (s.badges.includes(b.id)) continue;
    if (b.check(s, e)) {
      s.badges.push(b.id);
      unlocks.push({ kind: "badge", label: b.label, copy: b.copy, icon: b.icon });
    }
  }

  // rank-up (after all XP applied)
  const rankAfter = rankFor(cfg.ranks, s.xp);
  if (rankAfter.name !== rankBefore.name) {
    unlocks.push({ kind: "rank", label: rankAfter.name, copy: rankAfter.copy });
  }

  save(cfg, wallet, s);
  return { state: s, unlocks, gainedXp: gained };
}

/** Mission progress rows for the UI. */
export function missionProgress(cfg: GameConfig, s: GameState) {
  return cfg.missions.map((m) => {
    const period = m.cadence === "daily" ? s.dayKey : s.weekKey;
    const bucket = m.cadence === "daily" ? s.dayCounters : s.weekCounters;
    return {
      ...m,
      progress: Math.min(bucket[m.counter] ?? 0, m.target),
      done: s.missionsDone[m.id] === period,
    };
  });
}
