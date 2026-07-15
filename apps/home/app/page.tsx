import Link from "next/link";
import { LINKS } from "@/lib/links";

export default function Hub() {
  return (
    <main className="wrap">
      <nav className="topbar">
        <span className="logo">agents.ng</span>
        <a href={LINKS.github}>GitHub ↗</a>
      </nav>

      <header className="hero">
        <h1>
          Agents Nigerian youth can <em>feel</em>.
        </h1>
        <p className="sub">
          Three AI agents with real economic agency — living on the timeline, in
          the group chat, and on the campus. Pay-per-use in stablecoins on{" "}
          <strong>Celo + MiniPay</strong>. No signup. No subscription. First
          value in under 60 seconds.
        </p>
        <p className="pidgin">No grammar — just try am.</p>
      </header>

      <div className="chips">
        <span className="chip">x402 micropayments</span>
        <span className="chip">MiniPay · 16M+ wallets</span>
        <span className="chip">sub-cent fees on Celo</span>
        <span className="chip">receipts onchain</span>
      </div>

      <div className="cards">
        <Link className="card theme-padi" href="/padi">
          <span className="k">Study RPG · ₦20 a question</span>
          <h3>Padi 🪄</h3>
          <p>
            Your sharpest coursemate. JAMB, WAEC, campus courses — exam-grade
            answers, XP, streaks, and a Campus War your school can win.
          </p>
          <span className="go">Meet Padi →</span>
        </Link>

        <Link className="card theme-oga" href="/oga">
          <span className="k">Hustle Arcade · ₦50–₦200 a gig</span>
          <h3>Oga 🕶️</h3>
          <p>
            Tag am, pay am, e go do am. Roasts, bios, captions, CV headlines —
            delivered in public, every receipt a collectible card signed
            onchain.
          </p>
          <span className="go">Put Oga to work →</span>
        </Link>

        <Link className="card theme-ajoye" href="/ajoye">
          <span className="k">Group collections · escrow onchain</span>
          <h3>Ajoye 🤝</h3>
          <p>
            The treasurer that never chops the money. Dues, hostel bills,
            final-year dinner — collected, chased, and released by an agent.
          </p>
          <span className="go">See the concept →</span>
        </Link>
      </div>

      <footer className="footer">
        Built for the Celo Agentic Payments &amp; DeFAI Hackathon ·{" "}
        <a href={LINKS.github}>open source</a>
      </footer>
    </main>
  );
}
