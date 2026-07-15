import type { Metadata } from "next";
import Link from "next/link";
import { LINKS } from "@/lib/links";

export const metadata: Metadata = {
  title: "Ajoye — the treasurer that never chops the money",
  description:
    "Group contribution collector for campus and community circles. An agent collects, chases, and releases funds from transparent onchain escrow.",
};

export default function AjoyeLanding() {
  return (
    <main className="wrap theme-ajoye">
      <nav className="topbar">
        <Link className="logo" href="/">← agents.ng</Link>
        <a href={LINKS.github}>GitHub ↗</a>
      </nav>

      <header className="hero">
        <h1>
          The treasurer that <em>never chops the money.</em>
        </h1>
        <p className="sub">
          Departmental dues, hostel light bill, final-year dinner, aso-ebi —
          organizing group money means one stressed person chasing thirty
          people and absorbing all the suspicion. Ajoye is an agent that
          collects, chases politely, and pays out from escrow the whole group
          can verify.
        </p>
        <p className="pidgin">&ldquo;Who chop the money?&rdquo; — nobody. Ever again.</p>
      </header>

      <div className="cta-row">
        <a className="btn" href="#how">
          Concept — building next 🔜
        </a>
        <a className="btn ghost" href={LINKS.github}>
          Read the spec
        </a>
      </div>

      <section className="section" id="how">
        <h2>How e go work</h2>
        <div className="steps">
          <div className="step">
            <span className="n">1</span>
            <div>
              <b>Tell the bot wetin you dey collect.</b>
              <span>
                &ldquo;Collect ₦500 from 25 people for final-year dinner,
                deadline Friday.&rdquo; Ajoye returns a shareable link and a
                live tally card for the group chat.
              </span>
            </div>
          </div>
          <div className="step">
            <span className="n">2</span>
            <div>
              <b>Members pay in one tap. Ajoye does the chasing.</b>
              <span>
                Each contribution settles into the CircleEscrow contract.
                &ldquo;18/25 paid ✅&rdquo; updates land in the group; defaulters
                get nudged with humor, not shame.
              </span>
            </div>
          </div>
          <div className="step">
            <span className="n">3</span>
            <div>
              <b>Target met → release. Target missed → automatic refunds.</b>
              <span>
                The money moves by contract rules the whole group can read —
                not by trust in one person&rsquo;s restraint.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Status</h2>
        <p>
          Ajoye is the third concept of this hackathon build — fully specified,
          CircleEscrow contract written and compiled, agent build queued after
          Padi and Oga. Read the full spec in the{" "}
          <a href={`${LINKS.github}/blob/main/HACKATHON_IDEAS.md`}>ideas doc</a>.
        </p>
      </section>

      <div className="chips">
        <span className="chip">CircleEscrow · release or refund onchain</span>
        <span className="chip">Telegram-native</span>
        <span className="chip">stablecoin escrow · naira display</span>
      </div>

      <footer className="footer">
        Ajoye is part of the <Link href="/">agents.ng</Link> trio ·{" "}
        <a href={LINKS.github}>open source</a>
      </footer>
    </main>
  );
}
