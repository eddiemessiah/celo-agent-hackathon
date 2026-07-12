import { GIG_MENU } from "@/lib/gigs";
import { recentDelivered } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  const recent = recentDelivered(5);
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "OgaAgentBot";
  const xHandle = process.env.NEXT_PUBLIC_X_HANDLE ?? "OgaAgent";

  return (
    <main className="wrap">
      <h1>Oga</h1>
      <p className="tagline">
        Tag am, pay am, e go do am. The micro-gig agent wey dey live for your
        timeline — roasts, bios, captions, CV headlines. Paid per gig, delivered
        in public, receipts onchain.
      </p>

      <div className="menu">
        {Object.values(GIG_MENU).map((g) => (
          <div className="item" key={g.label}>
            <b>{g.naira}</b>
            {g.label}
          </div>
        ))}
      </div>

      <a className="cta" href={`https://t.me/${bot}`}>
        Put Oga to work · Telegram
      </a>
      <p className="notice">
        Or mention <a href={`https://x.com/${xHandle}`}>@{xHandle}</a> on X:
        &ldquo;roast my profile&rdquo; and follow the pay link.
      </p>

      {recent.length > 0 && (
        <section className="panel">
          <span className="kind">Recent work</span>
          {recent.map((g) => (
            <div className="body" key={g.id} style={{ fontSize: 13 }}>
              <b>{GIG_MENU[g.kind].label}:</b> {g.deliverable?.slice(0, 140)}…
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
