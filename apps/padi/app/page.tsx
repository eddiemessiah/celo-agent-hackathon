"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useMiniPay,
  fetchWithMiniPay,
  ADD_CASH_LINK,
  RECEIPT_LINK,
} from "@hack/celo-pay/client";
import {
  loadState,
  recordEvent,
  watDayKey,
  rankFor,
  type GameState,
  type Unlock,
} from "@hack/game-kit";
import {
  XpHeader,
  UnlockToasts,
  MissionList,
  BadgeTray,
  LeaderBars,
  HowToPlay,
  Burst,
} from "@hack/game-kit/ui";
import { padiGame, askCounters, subjectNode, SUBJECTS } from "@/lib/game";

const CAMPUSES = ["JAMB", "WAEC", "UNILAG", "UI", "FUTA", "UNN", "ABU"];

interface Answer {
  subject: string;
  answer: string;
  paid: boolean;
  tx?: string;
  asks?: number;
}

// Constellation node positions on the chalkboard (viewBox 0 0 300 120).
const NODES: Record<(typeof SUBJECTS)[number], [number, number]> = {
  Physics: [40, 34],
  Chemistry: [110, 22],
  Biology: [185, 34],
  Maths: [255, 26],
  English: [80, 92],
  Literature: [215, 92],
};

export default function Home() {
  const { address, isLoading } = useMiniPay();
  const [question, setQuestion] = useState("");
  const [campus, setCampus] = useState("JAMB");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowBalance, setLowBalance] = useState(false);
  const [result, setResult] = useState<Answer | null>(null);
  const [chalkKey, setChalkKey] = useState(0);

  const [gstate, setGstate] = useState<GameState | null>(null);
  const [queue, setQueue] = useState<Unlock[]>([]);
  const [burst, setBurst] = useState(0);
  const [showBadges, setShowBadges] = useState(false);
  const [board, setBoard] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    setGstate(loadState(padiGame, address ?? null));
  }, [address]);

  const refreshBoard = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (address) q.set("wallet", address);
      q.set("campus", campus.toLowerCase());
      const r = await fetch(`/api/leaderboard?${q}`);
      const data = await r.json();
      setBoard(data.rows ?? []);
      return data.youTop10 as boolean;
    } catch {
      return false;
    }
  }, [address, campus]);

  useEffect(() => {
    refreshBoard();
  }, [refreshBoard]);

  function applyEvent(type: string, meta: Record<string, unknown>) {
    const pre = loadState(padiGame, address ?? null);
    const before = rankFor(padiGame.ranks, pre.xp).name;
    const { state, unlocks } = recordEvent(padiGame, address ?? null, {
      type,
      meta,
    });
    setGstate(state);
    if (unlocks.length) setQueue((q) => [...q, ...unlocks]);
    if (rankFor(padiGame.ranks, state.xp).name !== before) {
      setBurst((b) => b + 1);
    }
  }

  async function ask() {
    if (!question.trim() || busy) return;
    setBusy(true);
    setError(null);
    setLowBalance(false);
    try {
      const res = await fetchWithMiniPay("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(address ? { "X-Wallet": address } : {}),
        },
        body: JSON.stringify({ question, campus: campus.toLowerCase() }),
      });
      if (res.status === "low_balance") {
        setLowBalance(true);
        return;
      }
      if (res.status === "error") {
        setError(res.message);
        return;
      }
      const data = (await res.response.json()) as Answer;
      if (!res.response.ok) {
        setError((data as { error?: string }).error ?? "Try again");
        return;
      }
      // Juice plays over the already-settled payment — never blocks it.
      setResult({
        ...data,
        tx: res.status === "success" ? res.txHash ?? data.tx : data.tx,
      });
      setChalkKey((k) => k + 1);
      setQuestion("");

      const node = subjectNode(data.subject);
      const watHour = new Date(Date.now() + 3600_000).getUTCHours();
      const pre = loadState(padiGame, address ?? null);
      applyEvent(data.paid ? "paid_question" : "free_question", {
        watHour,
        counters: askCounters({ pre, subject: node, watHour }),
      });

      const youTop10 = await refreshBoard();
      if (youTop10) applyEvent("campus_rank", { counters: ["campus_top10"] });
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!result) return;
    const text = `Padi just cleared this for me 🤓\n\n"${result.answer.slice(0, 160)}..."\n\nFirst question free 👉 ${location.origin}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      applyEvent("share", {});
    } catch {
      // user cancelled share sheet — no XP, no error
    }
  }

  const firstFree =
    gstate && !gstate.counters["free_question"] && address ? true : false;
  const priceLabel = firstFree ? "Ask — first one dey free 🎁" : "Ask · ₦20";

  // "You dey strong for X, weak for Y" hook.
  const hook = (() => {
    if (!gstate) return null;
    const counts = SUBJECTS.map((s) => ({
      s,
      n: gstate.counters[`subj:${s}`] ?? 0,
    }));
    const touched = counts.filter((c) => c.n > 0);
    if (touched.length < 2) return null;
    const strong = touched.reduce((a, b) => (b.n > a.n ? b : a));
    const weak = counts.reduce((a, b) => (b.n < a.n ? b : a));
    if (strong.s === weak.s) return null;
    return `You dey strong for ${strong.s}, weak for ${weak.s} — face am.`;
  })();

  return (
    <main className="wrap">
      <header className="brand">
        <h1>Padi</h1>
        <button className="tray-btn" onClick={() => setShowBadges(true)}>
          🎖️ {gstate?.badges.length ?? 0}
        </button>
      </header>

      {gstate && <XpHeader cfg={padiGame} state={gstate} flame="🔥" />}

      {/* subject constellation — mastery lights up as you ask */}
      {gstate && (
        <svg className="constellation" viewBox="0 0 300 120" aria-hidden>
          {SUBJECTS.map((s) => {
            const [x, y] = NODES[s];
            const n = gstate.counters[`subj:${s}`] ?? 0;
            const lit = n > 0;
            return (
              <g key={s} opacity={lit ? 1 : 0.32}>
                <circle
                  cx={x}
                  cy={y}
                  r={lit ? 6 + Math.min(6, n / 3) : 4}
                  className={lit ? "node lit" : "node"}
                />
                <text x={x} y={y + 20} className="node-label">
                  {s.slice(0, 4)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {hook && <p className="hook">{hook}</p>}

      <div className="askbox">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Explain simple harmonic motion the way JAMB likes to ask it"
          maxLength={600}
        />
        <div className="campusrow">
          {CAMPUSES.map((c) => (
            <button
              key={c}
              className={`chip ${campus === c ? "on" : ""}`}
              onClick={() => setCampus(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <button className="cta" onClick={ask} disabled={busy || !question.trim()}>
          {busy ? "Padi dey write…" : priceLabel}
        </button>
      </div>

      {lowBalance && (
        <>
          <p className="notice">
            Balance never reach. Add small stablecoin make we continue.
          </p>
          <a className="cta ghost" href={ADD_CASH_LINK}>
            Deposit
          </a>
        </>
      )}
      {error && <p className="err">{error}</p>}

      {result && (
        <section className="answer">
          <span className="subject">{result.subject}</span>
          <div className="body chalk-in" key={chalkKey}>
            {result.answer}
          </div>
          <div className="meta">
            <span>{result.paid ? "Paid · ₦20" : "Free question 🎁"}</span>
            {result.tx && <a href={RECEIPT_LINK(result.tx)}>Receipt</a>}
          </div>
          <button className="cta ghost" onClick={share}>
            Share am 📤
          </button>
        </section>
      )}

      {gstate && (
        <>
          <h2 className="section-h">Today&apos;s missions</h2>
          <MissionList cfg={padiGame} state={gstate} />
        </>
      )}

      {board.length > 0 && (
        <>
          <h2 className="section-h">Campus War ⚔️</h2>
          <LeaderBars
            rows={board.map((r) => ({
              ...r,
              you: r.label === campus.toUpperCase(),
            }))}
            unit="Qs"
          />
        </>
      )}

      {!isLoading && !address && (
        <p className="notice">
          Open inside <strong>MiniPay</strong> to pay per question — first one
          still free here.
        </p>
      )}

      {gstate && (
        <BadgeTray
          cfg={padiGame}
          state={gstate}
          open={showBadges}
          onClose={() => setShowBadges(false)}
        />
      )}
      <UnlockToasts queue={queue} onDone={() => setQueue([])} />
      <Burst trigger={burst} />
      <HowToPlay
        id="padi"
        panels={[
          {
            icon: "🪄",
            title: "I be Padi",
            body: "The spirit for your chalkboard. Ask me any exam question — JAMB, WAEC, your school course — I go break am down sharp.",
          },
          {
            icon: "🎁",
            title: "First one dey free",
            body: "Taste am first. After that na ₦20 a question, paid straight from MiniPay. No signup, no subscription.",
          },
          {
            icon: "🎓",
            title: "Level up as you learn",
            body: "Every question na XP. Climb Fresher → Prof, keep your streak alive, and carry your campus go top of the Campus War.",
          },
        ]}
      />
    </main>
  );
}
