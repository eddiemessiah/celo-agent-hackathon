"use client";

import { use, useEffect, useState } from "react";
import {
  fetchWithMiniPay,
  useMiniPay,
  ADD_CASH_LINK,
  RECEIPT_LINK,
} from "@hack/celo-pay/client";
import { loadState, recordEvent, rankFor, type Unlock } from "@hack/game-kit";
import { UnlockToasts, Burst } from "@hack/game-kit/ui";
import { ogaGame, bumpCombo, NAIRA } from "@/lib/game";
import type { GigKind } from "@/lib/gigs";

interface GigInfo {
  id: string;
  label: string;
  input: string;
  naira: string;
  kind: GigKind;
  status: "pending" | "delivered";
  deliverable?: string;
}

export default function GigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address } = useMiniPay();
  const [gig, setGig] = useState<GigInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowBalance, setLowBalance] = useState(false);
  const [tx, setTx] = useState<string | undefined>();
  const [combo, setCombo] = useState(0);
  const [queue, setQueue] = useState<Unlock[]>([]);
  const [burst, setBurst] = useState(0);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    fetch(`/api/gig/${id}`).then(async (r) => {
      if (!r.ok) return setNotFound(true);
      setGig(await r.json());
    });
  }, [id]);

  async function pay() {
    if (busy || !gig) return;
    setBusy(true);
    setError(null);
    setLowBalance(false);
    try {
      const res = await fetchWithMiniPay(`/api/gig/${id}`, {
        method: "POST",
        headers: address ? { "X-Wallet": address } : {},
      });
      if (res.status === "low_balance") return setLowBalance(true);
      if (res.status === "error") return setError(res.message);
      const data = await res.response.json();
      if (!res.response.ok) return setError(data.error ?? "Try again");

      // Payment already settled — everything below is pure juice.
      const n = bumpCombo(address ?? null);
      setCombo(n);
      setGig((g) => (g ? { ...g, status: "delivered", deliverable: data.deliverable } : g));
      setTx(res.status === "success" ? res.txHash ?? data.tx : data.tx);
      setTimeout(() => setFlip(true), 60);

      const pre = loadState(ogaGame, address ?? null);
      const before = rankFor(ogaGame.ranks, pre.xp).name;
      // did this order introduce the 4th distinct gig type this week?
      const kindsThisWeek = new Set(
        Object.keys(pre.weekCounters).filter((k) => k.startsWith("kind:")),
      );
      kindsThisWeek.add(`kind:${gig.kind}`);
      const counters = [`kind:${gig.kind}`];
      if (n >= 3) counters.push("combo3");
      if (n >= 5) counters.push("combo5");
      if (kindsThisWeek.size >= 4) counters.push("menu_week");

      const { state, unlocks } = recordEvent(ogaGame, address ?? null, {
        type: "gig",
        meta: { kind: gig.kind, combo: n, counters, add: { naira: NAIRA[gig.kind] } },
      });
      if (unlocks.length) setQueue((q) => [...q, ...unlocks]);
      if (rankFor(ogaGame.ranks, state.xp).name !== before) setBurst((b) => b + 1);
    } finally {
      setBusy(false);
    }
  }

  function share() {
    const text = `Oga just delivered this for me 🕶️🔥\n\n"${gig?.deliverable?.slice(0, 150)}..."\n\nPut Oga to work 👉 ${location.origin}`;
    (navigator.share ? navigator.share({ text }) : navigator.clipboard.writeText(text))
      ?.then?.(() => recordEvent(ogaGame, address ?? null, { type: "share" }))
      .catch(() => {});
  }

  if (notFound) {
    return (
      <main className="wrap">
        <h1>Oga</h1>
        <p className="notice">This gig don expire o. Go back and ask Oga again.</p>
      </main>
    );
  }
  if (!gig) {
    return (
      <main className="wrap">
        <h1>Oga</h1>
        <p className="notice">Loading…</p>
      </main>
    );
  }

  const delivered = gig.status === "delivered";

  return (
    <main className="wrap">
      <h1>Oga</h1>

      {combo >= 2 && (
        <div className="combo-banner">COMBO ×{combo}! Oga dey enjoy this energy 🔥</div>
      )}

      {/* holographic gig receipt card */}
      <div className={`holo ${gig.kind} ${flip ? "flipped" : ""} ${delivered ? "done" : ""}`}>
        <div className="holo-inner">
          <div className="holo-front">
            <span className="holo-kind">{gig.label}</span>
            <p className="holo-task">&ldquo;{gig.input}&rdquo;</p>
            {!delivered && <span className="holo-price">{gig.naira}</span>}
            {!delivered && busy && <div className="cooking">Oga dey cook… 🍳</div>}
          </div>
          {delivered && (
            <div className="holo-back">
              <span className="holo-kind">{gig.label}</span>
              <p className="holo-deliverable">{gig.deliverable}</p>
              <div className="onchain-stamp">SIGNED ONCHAIN ✅</div>
            </div>
          )}
        </div>
      </div>

      {!delivered ? (
        <button className="cta" onClick={pay} disabled={busy}>
          {busy ? "Oga dey work…" : `Pay ${gig.naira} · make Oga do am`}
        </button>
      ) : (
        <>
          {tx && (
            <p className="receipt">
              Paid · <a href={RECEIPT_LINK(tx)}>see receipt</a>
            </p>
          )}
          <button className="cta ghost" onClick={share}>
            Share your card 📸
          </button>
          <a className="cta" href="/">
            Order another (keep the combo 🔥)
          </a>
        </>
      )}

      {lowBalance && (
        <>
          <p className="notice">Balance never reach. Add small stablecoin.</p>
          <a className="cta ghost" href={ADD_CASH_LINK}>Deposit</a>
        </>
      )}
      {error && <p className="err">{error}</p>}
      <p className="notice">One tap · pays with your stablecoin · network fee inside same token</p>

      <UnlockToasts queue={queue} onDone={() => setQueue([])} />
      <Burst trigger={burst} />
    </main>
  );
}
