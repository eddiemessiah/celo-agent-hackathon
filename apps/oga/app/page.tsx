"use client";

import { useEffect, useState } from "react";
import { useMiniPay } from "@hack/celo-pay/client";
import { loadState, type GameState } from "@hack/game-kit";
import { XpHeader, MissionList, BadgeTray, HowToPlay } from "@hack/game-kit/ui";
import { ogaGame, NAIRA } from "@/lib/game";
import type { GigKind } from "@/lib/gigs";

const MENU: { kind: GigKind; label: string; blurb: string; rarity: string }[] = [
  { kind: "roast", label: "Profile Roast", blurb: "Savage-but-loving read of your handle", rarity: "common" },
  { kind: "caption", label: "Meme Caption", blurb: "3 captions wey go make dem laugh", rarity: "common" },
  { kind: "bio", label: "Bio Rewrite", blurb: "3 bios — pro, playful, bold", rarity: "rare" },
  { kind: "cv_headline", label: "CV Headline", blurb: "Headline wey recruiter go stop scroll", rarity: "epic" },
];

interface OgaStatus {
  oga: { gigs: number; level: number; tier: string };
  recent: { label: string; deliverable: string }[];
}

export default function Home() {
  const { address } = useMiniPay();
  const [gstate, setGstate] = useState<GameState | null>(null);
  const [showBadges, setShowBadges] = useState(false);
  const [status, setStatus] = useState<OgaStatus | null>(null);
  const [active, setActive] = useState<GigKind | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setGstate(loadState(ogaGame, address ?? null)), [address]);
  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  async function order() {
    if (!active || !input.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: active, input }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Try again");
        return;
      }
      window.location.href = `/gig/${data.id}`;
    } finally {
      setBusy(false);
    }
  }

  const oga = status?.oga;

  return (
    <main className="wrap">
      <header className="oga-top">
        <h1>Oga</h1>
        <button className="tray-btn" onClick={() => setShowBadges(true)}>
          🎴 {gstate?.badges.length ?? 0}
        </button>
      </header>

      {/* the differentiator: the agent's own onchain level */}
      {oga && (
        <div className="oga-level">
          <div className="oga-face" aria-hidden>🕶️</div>
          <div>
            <b>Oga · Lvl {oga.level}</b>
            <div className="oga-tier">{oga.tier}</div>
          </div>
          <div className="oga-gigs">
            {oga.gigs}
            <small>gigs onchain</small>
          </div>
        </div>
      )}

      <p className="tagline">
        Tag am, pay am, e go do am. Pick a gig, pay small change in MiniPay, Oga
        deliver sharp sharp — and your receipt na collectible card.
      </p>

      {gstate && <XpHeader cfg={ogaGame} state={gstate} flame="⚡" />}

      <div className="arcade">
        {MENU.map((m) => (
          <button
            key={m.kind}
            className={`cab ${m.rarity} ${active === m.kind ? "on" : ""}`}
            onClick={() => setActive(active === m.kind ? null : m.kind)}
          >
            <span className="cab-price">₦{NAIRA[m.kind]}</span>
            <b>{m.label}</b>
            <small>{m.blurb}</small>
          </button>
        ))}
      </div>

      {active && (
        <div className="compose">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              active === "roast" ? "Your @handle + who you be (e.g. tech bro wey dey tweet 5am runs)"
              : active === "bio" ? "What you want your bio to say + your vibe"
              : active === "caption" ? "Describe the meme/photo"
              : "Your role + what you dey aim for"
            }
            maxLength={400}
          />
          <button className="cta" onClick={order} disabled={busy || !input.trim()}>
            {busy ? "Sending to Oga…" : `Order · ₦${NAIRA[active]}`}
          </button>
        </div>
      )}
      {error && <p className="err">{error}</p>}

      {gstate && (
        <>
          <h2 className="section-h">Bounties</h2>
          <MissionList cfg={ogaGame} state={gstate} />
        </>
      )}

      {status && status.recent.length > 0 && (
        <>
          <h2 className="section-h">Fresh off the timeline</h2>
          <div className="recent">
            {status.recent.map((g, i) => (
              <div className="recent-card" key={i}>
                <span className="recent-kind">{g.label}</span>
                <p>{g.deliverable}…</p>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="notice">
        Oga also lives on Telegram — <a href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "OgaAgentBot"}`}>@{process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "OgaAgentBot"}</a>
      </p>

      {gstate && (
        <BadgeTray cfg={ogaGame} state={gstate} open={showBadges} onClose={() => setShowBadges(false)} />
      )}
      <HowToPlay
        id="oga"
        panels={[
          { icon: "🕶️", title: "Oga dey here", body: "The hustle agent wey dey work for your timeline. Pick a gig, describe wetin you want." },
          { icon: "⚡", title: "Pay, collect, combo", body: "Pay small change in MiniPay. Order back-to-back within 10 min to stack a COMBO and multiply your XP." },
          { icon: "🎴", title: "Every receipt na card", body: "Your delivery lands as a holographic card, signed onchain. Screenshot am, share am, level up." },
        ]}
      />
    </main>
  );
}
