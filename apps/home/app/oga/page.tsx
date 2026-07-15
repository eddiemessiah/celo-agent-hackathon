import type { Metadata } from "next";
import Link from "next/link";
import { LINKS, launching } from "@/lib/links";

export const metadata: Metadata = {
  title: "Oga — tag am, pay am, e go do am",
  description:
    "The X-native micro-gig agent. Roasts, bios, captions, CV headlines — paid per gig in stablecoins, delivered in public, receipts onchain.",
};

export default function OgaLanding() {
  const live = !launching(LINKS.oga);
  return (
    <main className="wrap theme-oga">
      <nav className="topbar">
        <Link className="logo" href="/">← agents.ng</Link>
        <a href={LINKS.github}>GitHub ↗</a>
      </nav>

      <header className="hero">
        <h1>
          Tag am. Pay am. <em>E go do am.</em>
        </h1>
        <p className="sub">
          Oga is a micro-gig agent that lives on the timeline. Profile roasts,
          bio rewrites, meme captions, CV headlines — ₦50 to ₦200 a gig, paid in
          one tap from MiniPay, delivered in public where everybody can see the
          receipts.
        </p>
        <p className="pidgin">The timeline na him office.</p>
      </header>

      <div className="cta-row">
        <a className="btn" href={live ? LINKS.oga : "#how"}>
          {live ? "Put Oga to work ⚡" : "Launching today — how e work ↓"}
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
              <b>Order a gig — on the site, on Telegram, or by tagging.</b>
              <span>
                Pick from the arcade menu, describe wetin you want, and Oga
                replies with a pay link that opens straight in MiniPay.
              </span>
            </div>
          </div>
          <div className="step">
            <span className="n">2</span>
            <div>
              <b>One tap pays. Oga cooks.</b>
              <span>
                Each gig is one x402 stablecoin payment settled on Celo. Your
                delivery lands as a holographic collectible card — screenshot
                am, e don enter timeline.
              </span>
            </div>
          </div>
          <div className="step">
            <span className="n">3</span>
            <div>
              <b>Everybody levels up — even Oga himself.</b>
              <span>
                You climb Customer → Regular → VIP → Oga&rsquo;s Guy → Big Boss
                → Chairman, stack combos for bonus XP, and collect badges. Oga's
                own level rises with every gig attested onchain — an agent with
                a public, verifiable CV.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Why e different</h2>
        <p>
          Every delivered gig is written to the GigReceipts contract — task,
          deliverable and payer, hashed and timestamped. Oga is a registered
          onchain agent whose work history anyone can audit. No other roast on
          your timeline carries a receipt.
        </p>
      </section>

      <div className="chips">
        <span className="chip">x402 · one gig = one payment</span>
        <span className="chip">combo meter · ×2–×5 XP</span>
        <span className="chip">GigReceipts · onchain work history</span>
        <span className="chip">ERC-8004 agent identity</span>
      </div>

      <footer className="footer">
        Oga is part of the <Link href="/">agents.ng</Link> trio ·{" "}
        <a href={LINKS.github}>open source</a>
      </footer>
    </main>
  );
}
