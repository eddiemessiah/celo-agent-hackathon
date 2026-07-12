"use client";

import { use, useEffect, useState } from "react";
import {
  fetchWithMiniPay,
  useMiniPay,
  ADD_CASH_LINK,
  RECEIPT_LINK,
} from "@hack/celo-pay/client";

interface GigInfo {
  id: string;
  label: string;
  input: string;
  naira: string;
  status: "pending" | "delivered";
  deliverable?: string;
  tx?: string;
  error?: string;
}

export default function GigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { address } = useMiniPay();
  const [gig, setGig] = useState<GigInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowBalance, setLowBalance] = useState(false);
  const [tx, setTx] = useState<string | undefined>();

  useEffect(() => {
    fetch(`/api/gig/${id}`).then(async (r) => {
      if (!r.ok) return setNotFound(true);
      setGig(await r.json());
    });
  }, [id]);

  async function pay() {
    if (busy) return;
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
      setGig((g) =>
        g ? { ...g, status: "delivered", deliverable: data.deliverable } : g,
      );
      setTx(res.status === "success" ? res.txHash ?? data.tx : data.tx);
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <main className="wrap">
        <h1>Oga</h1>
        <p className="notice">
          This gig don expire o. Go back to the chat and ask Oga again.
        </p>
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

  return (
    <main className="wrap">
      <h1>Oga</h1>
      <section className="panel">
        <span className="kind">{gig.label}</span>
        <p className="task">&ldquo;{gig.input}&rdquo;</p>
        {gig.status !== "delivered" && <span className="price">{gig.naira}</span>}
      </section>

      {gig.status === "delivered" ? (
        <section className="panel">
          <span className="kind">Delivered ✅</span>
          <div className="body">{gig.deliverable}</div>
          {tx && (
            <p className="receipt">
              Paid · <a href={RECEIPT_LINK(tx)}>see receipt</a>
            </p>
          )}
        </section>
      ) : (
        <button className="cta" onClick={pay} disabled={busy}>
          {busy ? "Oga dey work…" : `Pay ${gig.naira} · make Oga do am`}
        </button>
      )}

      {lowBalance && (
        <>
          <p className="notice">Balance never reach. Add small stablecoin.</p>
          <a className="cta ghost" href={ADD_CASH_LINK}>
            Deposit
          </a>
        </>
      )}
      {error && <p className="err">{error}</p>}
      <p className="notice">
        One tap · pays with your stablecoin · network fee inside same token
      </p>
    </main>
  );
}
