import type { Metadata } from "next";
import Link from "next/link";
import { LINKS, launching } from "@/lib/links";

export const metadata: Metadata = {
  title: "Padi — your sharpest coursemate, ₦20 a question",
  description:
    "Pay-per-question AI study buddy for JAMB, WAEC, POST-UTME and campus courses. First one dey free. Pays from MiniPay in your stablecoin.",
};

export default function PadiLanding() {
  const live = !launching(LINKS.padi);
  return (
    <main className="wrap theme-padi">
      <nav className="topbar">
        <Link className="logo" href="/">← agents.ng</Link>
        <a href={LINKS.github}>GitHub ↗</a>
      </nav>

      <header className="hero">
        <h1>
          Your sharpest coursemate. <em>₦20 a question.</em>
        </h1>
        <p className="sub">
          ChatGPT Plus costs ₦30,000 a month. Padi answers JAMB, WAEC, POST-UTME
          and campus questions one at a time, priced like a photocopy of past
          questions — paid straight from MiniPay, no signup, no subscription.
        </p>
        <p className="pidgin">First one dey free. Come see.</p>
      </header>

      <div className="cta-row">
        <a className="btn" href={live ? LINKS.padi : "#how"}>
          {live ? "Ask Padi now 🎁" : "Launching today — how e work ↓"}
        </a>
        <a className="btn ghost" href={LINKS.github}>
          Read the code
        </a>
      </div>

      <section className="section" id="how">
        <h2>How e work</h2>
        <div className="steps">
          <div className="step">
            <span className="n">1</span>
            <div>
              <b>Tap a shared link — you land in the chalkboard.</b>
              <span>
                No account, no wallet setup talk. Your MiniPay is already your
                identity. First question answers free, instantly.
              </span>
            </div>
          </div>
          <div className="step">
            <span className="n">2</span>
            <div>
              <b>₦20 a question after that — one tap.</b>
              <span>
                Padi charges your preferred stablecoin and the network fee comes
                out of the same token. Every answer is one x402 payment settled
                on Celo — sub-cent fees make ₦20 pricing possible.
              </span>
            </div>
          </div>
          <div className="step">
            <span className="n">3</span>
            <div>
              <b>Level up as you learn.</b>
              <span>
                Every question earns XP: Fresher → Sharp Student → Class Rep →
                Aristo → Scholar → Prof. Keep your streak, finish daily
                missions, light up your subject constellation — and push your
                campus to the top of the Campus War.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Why students go love am</h2>
        <p>
          Pay-as-you-go beats subscriptions when your budget is weekly, not
          monthly. Answers arrive exam-styled (&ldquo;JAMB likes to ask this
          as…&rdquo;), every answer becomes a shareable card for your status,
          and the leaderboard makes studying a school-vs-school sport. UNILAG vs
          UI vs FUTA — who dey carry first?
        </p>
      </section>

      <div className="chips">
        <span className="chip">x402 · one question = one payment</span>
        <span className="chip">CIP-64 · fee in your own stablecoin</span>
        <span className="chip">ScholarBoard · usage verifiable onchain</span>
      </div>

      <footer className="footer">
        Padi is part of the <Link href="/">agents.ng</Link> trio ·{" "}
        <a href={LINKS.github}>open source</a>
      </footer>
    </main>
  );
}
