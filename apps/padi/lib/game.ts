// Padi game economy — "Study RPG on a chalkboard".
// Every mechanic maps to a real action; paid questions are the core XP loop.

import { watDayKey, type GameConfig } from "@hack/game-kit";

export const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Maths",
  "English",
  "Literature",
] as const;

/** Map the tutor's free-text subject guess onto a constellation node. */
export function subjectNode(subject: string): (typeof SUBJECTS)[number] | null {
  const s = subject.toLowerCase();
  if (s.startsWith("phys")) return "Physics";
  if (s.startsWith("chem")) return "Chemistry";
  if (s.startsWith("bio")) return "Biology";
  if (s.startsWith("math") || s.includes("algebra") || s.includes("calc"))
    return "Maths";
  if (s.startsWith("engl") || s.includes("grammar")) return "English";
  if (s.startsWith("lit")) return "Literature";
  return null;
}

export const padiGame: GameConfig = {
  storageKey: "padi-game",
  streakEvents: ["free_question", "paid_question"],
  streakBonusXp: 5, // "Streak day maintained +5 on first ask of a new day"

  xpFor: (e, s) => {
    switch (e.type) {
      case "free_question":
        return s.counters["free_question"] ? 0 : 5; // once, ever
      case "paid_question":
        return 10; // the core loop
      case "share":
        return s.dayCounters["share"] ? 0 : 3; // capped once/day (anti-farm)
      default:
        return 0;
    }
  },

  ranks: [
    { name: "Fresher", xp: 0, copy: "Welcome to class. Padi dey your side." },
    { name: "Sharp Student", xp: 50, copy: "You dey serious o. Sharp Student unlocked." },
    { name: "Class Rep", xp: 200, copy: "Na you dey lead now. Class Rep! 📋" },
    { name: "Aristo", xp: 500, copy: "Big brain energy. You don turn Aristo." },
    { name: "Scholar", xp: 1200, copy: "Scholar level. Your papa go proud." },
    { name: "Prof", xp: 3000, copy: "PROF. Dem suppose dey pay YOU now. 🎓" },
  ],

  missions: [
    // daily — reset midnight WAT
    {
      id: "morning_sharp",
      label: "Morning Sharp",
      copy: "Early bird catch the A. 🌅",
      xp: 15,
      cadence: "daily",
      target: 1,
      counter: "ask_before_8",
    },
    {
      id: "clear_three",
      label: "Clear Three",
      copy: "Three down. You dey hot.",
      xp: 20,
      cadence: "daily",
      target: 3,
      counter: "ask",
    },
    {
      id: "branch_out",
      label: "Branch Out",
      copy: "No dull for one corner — spread am.",
      xp: 10,
      cadence: "daily",
      target: 2, // touched a 2nd distinct subject today
      counter: "subjects_today",
    },
    // weekly
    {
      id: "subject_master",
      label: "Subject Master",
      copy: "You don sabi this topic well well.",
      xp: 50,
      cadence: "weekly",
      target: 1, // fires when any one subject hits 10 asks this week
      counter: "subject_10_week",
    },
    {
      id: "streak_keeper",
      label: "Streak Keeper",
      copy: "Consistency na cheat code.",
      xp: 40,
      cadence: "weekly",
      target: 1, // fires the day the streak reaches 5
      counter: "streak_hit_5",
    },
  ],

  badges: [
    {
      id: "first_light",
      label: "First Light",
      icon: "✨",
      copy: "You don start. No turning back.",
      check: (s) => (s.counters["ask"] ?? 0) >= 1,
    },
    {
      id: "paid_up",
      label: "Paid Up",
      icon: "💸",
      copy: "You back Padi with your own money. Respect.",
      check: (s) => (s.counters["paid_question"] ?? 0) >= 1,
    },
    {
      id: "hot_streak",
      label: "Hot Streak",
      icon: "🔥",
      copy: "One week straight. Fire. 🔥",
      check: (s) => s.streak >= 7,
    },
    {
      id: "on_fire",
      label: "On Fire",
      icon: "🌋",
      copy: "One month?! You be different breed.",
      check: (s) => s.streak >= 30,
    },
    {
      id: "subject_head",
      label: "Subject Head",
      icon: "🧠",
      copy: "This subject na your mate now.",
      check: (s) =>
        Object.entries(s.counters).some(
          ([k, v]) => k.startsWith("subj:") && v >= 25,
        ),
    },
    {
      id: "night_reader",
      label: "Night Reader",
      icon: "🕯️",
      copy: "Burning the midnight candle. I see you.",
      check: (_s, e) =>
        (e.type === "paid_question" || e.type === "free_question") &&
        (e.meta?.watHour as number) >= 23,
    },
    {
      id: "early_bird",
      label: "Early Bird",
      icon: "🐦",
      copy: "Morning warrior. 🐦",
      check: (s) => (s.counters["morning_day"] ?? 0) >= 5,
    },
    {
      id: "campus_champ",
      label: "Campus Champ",
      icon: "🏆",
      copy: "Top 10 for your school. Legend.",
      check: (s) => (s.counters["campus_top10"] ?? 0) >= 1,
    },
    {
      id: "sharer",
      label: "Sharer",
      icon: "📤",
      copy: "Spreading the sense. 📤",
      check: (s) => (s.counters["share"] ?? 0) >= 10,
    },
    {
      id: "century",
      label: "Century",
      icon: "💯",
      copy: "100 questions. Certified serious student.",
      check: (s) => (s.counters["ask"] ?? 0) >= 100,
    },
  ],
};

/**
 * Meta-counters the page passes with an ask event, computed against the
 * pre-event state (engine bumps them before evaluating missions/badges).
 */
export function askCounters(opts: {
  pre: import("@hack/game-kit").GameState;
  subject: string | null;
  watHour: number;
}): string[] {
  const { pre, subject, watHour } = opts;
  const counters = ["ask"];
  if (watHour < 8) {
    counters.push("ask_before_8");
    if (!pre.dayCounters["ask_before_8"]) counters.push("morning_day");
  }
  if (subject) {
    const key = `subj:${subject}`;
    counters.push(key);
    if (!pre.dayCounters[key]) counters.push("subjects_today");
    if ((pre.weekCounters[key] ?? 0) === 9) counters.push("subject_10_week");
  }
  // fires only on the ask that advances the streak from 4 → 5
  const today = watDayKey();
  const yesterday = watDayKey(Date.now() - 24 * 60 * 60 * 1000);
  if (pre.streak === 4 && pre.lastDay === yesterday && pre.lastDay !== today) {
    counters.push("streak_hit_5");
  }
  return counters;
}
