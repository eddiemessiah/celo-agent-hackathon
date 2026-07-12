"use client";

import { useEffect, useState } from "react";
import {
  type GameConfig,
  type GameState,
  type Unlock,
  rankFor,
  nextRank,
  missionProgress,
} from "./engine";

/* ---------------------------------------------------------------- XP header */

export function XpHeader({
  cfg,
  state,
  flame = "🔥",
}: {
  cfg: GameConfig;
  state: GameState;
  flame?: string;
}) {
  const rank = rankFor(cfg.ranks, state.xp);
  const next = nextRank(cfg.ranks, state.xp);
  const pct = next
    ? Math.min(100, Math.round(((state.xp - rank.xp) / (next.xp - rank.xp)) * 100))
    : 100;
  return (
    <div className="gk-xp">
      <div className="gk-xp-row">
        <span className="gk-rank">{rank.name}</span>
        {state.streak > 1 && (
          <span className="gk-flame" title={`${state.streak}-day streak`}>
            {flame} {state.streak}
          </span>
        )}
        <span className="gk-xp-num">{state.xp} XP</span>
      </div>
      <div className="gk-bar">
        <div className="gk-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {next && (
        <div className="gk-next">
          {next.xp - state.xp} XP to {next.name}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- Toasts */

export function UnlockToasts({
  queue,
  onDone,
}: {
  queue: Unlock[];
  onDone: () => void;
}) {
  const [current, setCurrent] = useState<Unlock | null>(null);
  const [rest, setRest] = useState<Unlock[]>([]);

  useEffect(() => {
    if (queue.length > 0) {
      setCurrent(queue[0]);
      setRest(queue.slice(1));
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => {
      setCurrent(rest[0] ?? null);
      setRest((r) => r.slice(1));
    }, 3200);
    return () => clearTimeout(t);
  }, [current, rest]);

  if (!current) return null;
  const icon =
    current.kind === "badge" ? current.icon
    : current.kind === "rank" ? "🎓"
    : current.kind === "mission" ? "✅"
    : "🔥";
  return (
    <div className={`gk-toast gk-toast-${current.kind}`} key={current.label}>
      <span className="gk-toast-icon">{icon}</span>
      <div>
        <b>
          {current.kind === "rank" ? `Rank up: ${current.label}` : current.label}
          {current.kind === "mission" && ` · +${current.xp} XP`}
        </b>
        <div className="gk-toast-copy">{current.copy}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Missions */

export function MissionList({
  cfg,
  state,
}: {
  cfg: GameConfig;
  state: GameState;
}) {
  const rows = missionProgress(cfg, state);
  return (
    <div className="gk-missions">
      {rows.map((m) => (
        <div key={m.id} className={`gk-mission ${m.done ? "done" : ""}`}>
          <div className="gk-mission-top">
            <span>{m.done ? "✅" : "🎯"} {m.label}</span>
            <b>+{m.xp} XP</b>
          </div>
          <div className="gk-bar gk-bar-sm">
            <div
              className="gk-bar-fill"
              style={{ width: `${(m.progress / m.target) * 100}%` }}
            />
          </div>
          <div className="gk-mission-meta">
            {m.progress}/{m.target} · {m.cadence}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Badge tray */

export function BadgeTray({
  cfg,
  state,
  open,
  onClose,
}: {
  cfg: GameConfig;
  state: GameState;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="gk-overlay" onClick={onClose}>
      <div className="gk-tray" onClick={(e) => e.stopPropagation()}>
        <div className="gk-tray-head">
          <b>Badges · {state.badges.length}/{cfg.badges.length}</b>
          <button className="gk-x" onClick={onClose}>✕</button>
        </div>
        <div className="gk-tray-grid">
          {cfg.badges.map((b) => {
            const got = state.badges.includes(b.id);
            return (
              <div key={b.id} className={`gk-badge ${got ? "got" : "locked"}`}>
                <span className="gk-badge-icon">{got ? b.icon : "🔒"}</span>
                <b>{b.label}</b>
                <small>{got ? b.copy : "Locked"}</small>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Leaderboards */

export function LeaderBars({
  rows,
  unit,
}: {
  rows: { label: string; value: number; you?: boolean }[];
  unit: string;
}) {
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrow(true), 60);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="gk-board">
      {rows.map((r, i) => (
        <div key={r.label} className={`gk-board-row ${r.you ? "you" : ""}`}>
          <span className="gk-board-pos">{i + 1}</span>
          <span className="gk-board-label">{r.label}</span>
          <div className="gk-board-track">
            <div
              className="gk-board-fill"
              style={{ width: grow ? `${(r.value / max) * 100}%` : "0%" }}
            />
          </div>
          <span className="gk-board-val">
            {r.value} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- How to play */

export function HowToPlay({
  id,
  panels,
}: {
  id: string;
  panels: { icon: string; title: string; body: string }[];
}) {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    try {
      if (!localStorage.getItem(`gk-htp:${id}`)) setShow(true);
    } catch {
      // storage blocked — skip the tutorial
    }
  }, [id]);
  if (!show) return null;
  function close() {
    try {
      localStorage.setItem(`gk-htp:${id}`, "1");
    } catch {
      // fine
    }
    setShow(false);
  }
  const p = panels[i];
  const last = i === panels.length - 1;
  return (
    <div className="gk-overlay">
      <div className="gk-htp">
        <div className="gk-htp-icon">{p.icon}</div>
        <b>{p.title}</b>
        <p>{p.body}</p>
        <div className="gk-htp-dots">
          {panels.map((_, d) => (
            <span key={d} className={d === i ? "on" : ""} />
          ))}
        </div>
        <button
          className="gk-htp-btn"
          onClick={() => (last ? close() : setI(i + 1))}
        >
          {last ? "Make we go! 🚀" : "Next"}
        </button>
        <button className="gk-htp-skip" onClick={close}>
          Skip
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- Rank-up burst FX  */

export function Burst({ trigger }: { trigger: number }) {
  // 12 CSS particles; re-mounts on each trigger bump. Pure CSS, no rAF.
  if (!trigger) return null;
  return (
    <div className="gk-burst" key={trigger} aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} style={{ ["--i" as string]: i }} />
      ))}
    </div>
  );
}
