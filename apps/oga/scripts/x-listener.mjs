// X intake worker: polls mentions, creates gigs via the app's internal API,
// replies with the pay link. Needs X API v2 (user context OAuth 1.0a or
// OAuth2 user token with tweet.write). Run alongside `next start`:
//
//   set X_BEARER_TOKEN=...        (mentions lookup)
//   set X_USER_ID=...             (the @OgaAgent account id)
//   set X_OAUTH_*=...             (posting replies — see below)
//   set PUBLIC_ORIGIN=https://oga.example.com
//   npm run x-listener
//
// Free-tier X API cannot poll mentions; fallback during livestreams is the
// Telegram bot + a pinned hashtag the host reposts manually.

const BEARER = process.env.X_BEARER_TOKEN;
const USER_ID = process.env.X_USER_ID;
const ORIGIN = process.env.PUBLIC_ORIGIN ?? "http://localhost:3002";
const POLL_MS = Number(process.env.X_POLL_MS ?? 60_000);

if (!BEARER || !USER_ID) {
  console.error("Set X_BEARER_TOKEN and X_USER_ID (or use the Telegram intake).");
  process.exit(1);
}

let sinceId;

async function poll() {
  const url = new URL(`https://api.x.com/2/users/${USER_ID}/mentions`);
  url.searchParams.set("tweet.fields", "author_id,text");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username");
  if (sinceId) url.searchParams.set("since_id", sinceId);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BEARER}` },
  });
  if (!res.ok) {
    console.error(`mentions poll → ${res.status}`);
    return;
  }
  const body = await res.json();
  const tweets = body.data ?? [];
  const users = new Map(
    (body.includes?.users ?? []).map((u) => [u.id, u.username]),
  );
  if (tweets.length > 0) sinceId = tweets[0].id;

  for (const tweet of tweets.reverse()) {
    const author = users.get(tweet.author_id) ?? "friend";
    const intake = await fetch(`${ORIGIN}/api/x-intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Intake-Secret": process.env.INTAKE_SECRET ?? "",
      },
      body: JSON.stringify({ tweetId: tweet.id, author, text: tweet.text }),
    });
    if (!intake.ok) continue;
    const { gigId, naira, label } = await intake.json();
    await replyTo(
      tweet.id,
      `${label} — ${naira} 🫡 Pay make I work: ${ORIGIN}/gig/${gigId} (opens in MiniPay, link expires in 30 min)`,
    );
    console.log(`gig ${gigId} for @${author}`);
  }
}

async function replyTo(tweetId, text) {
  // Posting requires user-context auth; with only a bearer token we log the
  // reply so the host can post it manually during the stream.
  console.log(`REPLY → ${tweetId}: ${text}`);
}

console.log(`Oga X listener up — polling every ${POLL_MS / 1000}s`);
setInterval(() => poll().catch(console.error), POLL_MS);
poll().catch(console.error);
