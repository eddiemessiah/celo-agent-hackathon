"use client";

import { useState } from "react";
import {
  useMiniPay,
  fetchWithMiniPay,
  ADD_CASH_LINK,
  RECEIPT_LINK,
} from "@hack/celo-pay/client";

const CAMPUSES = ["JAMB", "WAEC", "UNILAG", "UI", "FUTA", "UNN", "ABU"];

interface Answer {
  subject: string;
  answer: string;
  paid: boolean;
  tx?: string;
  asks?: number;
}

export default function Home() {
  const { address, isLoading } = useMiniPay();
  const [question, setQuestion] = useState("");
  const [campus, setCampus] = useState("JAMB");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowBalance, setLowBalance] = useState(false);
  const [result, setResult] = useState<Answer | null>(null);
  const [asked, setAsked] = useState(0);

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
      const data = await res.response.json();
      if (!res.response.ok) {
        setError(data.error ?? "Something went wrong, try again");
        return;
      }
      setResult({
        ...data,
        tx: res.status === "success" ? res.txHash ?? data.tx : data.tx,
      });
      setAsked((n) => n + 1);
      setQuestion("");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!result) return;
    const text = `Padi just cleared this for me 🤓\n\n"${result.answer.slice(0, 180)}..."\n\nFirst question free 👉 ${location.origin}`;
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  const priceLabel =
    asked === 0 && address ? "Ask — first one dey free" : "Ask · ₦20";

  return (
    <main className="wrap">
      <header className="brand">
        <h1>Padi</h1>
        {asked > 0 && <span className="streak">🔥 {asked} this session</span>}
      </header>
      <p className="tagline">
        Your sharpest coursemate. JAMB, WAEC, POST-UTME, campus courses —
        exam-grade answers, ₦20 a question. No signup, no subscription.
      </p>

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
          {busy ? "Padi dey think…" : priceLabel}
        </button>
      </div>

      {lowBalance && (
        <>
          <p className="notice">
            Balance never reach. Add small stablecoin make we continue.
          </p>
          <a className="cta ghost" href={ADD_CASH_LINK} style={{ textAlign: "center", textDecoration: "none" }}>
            Deposit
          </a>
        </>
      )}
      {error && <p className="err">{error}</p>}

      {result && (
        <section className="answer">
          <span className="subject">{result.subject}</span>
          <div className="body">{result.answer}</div>
          <div className="meta">
            <span>{result.paid ? "Paid · ₦20" : "Free question 🎁"}</span>
            {result.tx && <a href={RECEIPT_LINK(result.tx)}>Receipt</a>}
          </div>
          <button className="cta ghost" onClick={share}>
            Share am 📤
          </button>
        </section>
      )}

      {!isLoading && !address && (
        <p className="notice">
          Open this inside <strong>MiniPay</strong> to pay per question —
          first one still free here.
        </p>
      )}
    </main>
  );
}
