# HACKATHON_IDEAS — Celo Agentic Payments & DeFAI Hackathon

**Three youth-first AI agent concepts for the Nigerian market on MiniPay.**
Author role: Principal AI Architect / onchain builder on Celo.
Target tracks: **Track 2 — Most x402 Payments** (both builds), with Track 3/4 registrations as bonuses.

---

## Design doctrine (applies to all three concepts)

Every concept below is engineered around one belief: **the first job of an agentic product in
Nigeria is access — let a student or young hustler *feel* an agent working for them within 60
seconds of first contact.** That forces four rules:

1. **No signup, ever.** MiniPay is already installed (16M+ users inside Opera Mini). The wallet
   address *is* the identity. Zero-click connect (`window.ethereum.isMiniPay`), no seed-phrase
   talk, no email.
2. **Meet them where they already are.** X timelines, WhatsApp statuses, Telegram groups, campus
   group chats — the agent's front door is a shared link or a mention, not an app store.
3. **First value before first payment.** Taste the agent free, then pay per use in naira-street
   prices (₦20–₦200 ≈ $0.01–$0.13). Celo's sub-cent gas is what makes a ₦20 sale profitable.
4. **Every unit of value = one x402 transaction.** HTTP 402 pay-per-request via the
   [Celo x402 facilitator](https://x402.celo.org), so genuine usage directly climbs the Track 2
   leaderboard (raw count of settled payments).

**Shared integration spine** (all three concepts):

| Requirement | How it's used |
|---|---|
| **x402 facilitator** | Every paid action gated by an HTTP 402 challenge; settlement on Celo mainnet in USDC/USDT/USDm; `payTo` wallet + endpoint registered on the x402 dashboard so txs count |
| **Attribution tags (ERC-8021)** | `toDataSuffix(['celo_<assigned>'])` from `@celo/attribution-tags` appended to **every** transaction from day one — untagged txs are invisible to the leaderboard |
| **CIP-64 fee abstraction** | User pays in their preferred stablecoin (highest balance) and the network fee is charged **in that same token** via `feeCurrency` (USDC/USDT use adapter addresses) — nobody ever needs CELO |
| **Sub-cent transactions** | Makes ₦20 micro-pricing viable; contract writes (attestations, leaderboards) cost fractions of a cent |
| **ERC-8004** | Each agent registered onchain with an identity → registry link in the submission tweet; verifiable agent work history |
| **MiniPay UX rules** | 360×640 design, "network fee" / "Deposit" copy, `link.minipay.xyz/add_cash` deeplink on low balance, receipt deeplink on success, no raw 0x addresses |

---

## Concept 1 — **Padi** · the pay-per-question AI study buddy
*"Your sharpest coursemate, ₦20 a question."* — campus flagship, **Submission A**

### Core problem
ChatGPT Plus costs ~₦30,000/month — more than many students' monthly food budget. Yet exam prep
(JAMB/UTME, WAEC, POST-UTME, and semester courses) is the single most valuable thing an AI can do
for a Nigerian student. The gap isn't demand or awareness — it's **packaging**: there is no
pay-as-you-go AI priced like a photocopy of past questions. Students already pay ₦50–₦200 cash for
photocopied "PQ" (past questions) outside every faculty gate. Padi digitizes that exact spending
habit.

### Onboarding journey (first contact → first value → first payment)
1. **First contact:** a coursemate shares a Padi answer card (branded image with the question,
   a teaser of the answer, and a link) on X or WhatsApp status. Tap → opens in the MiniPay browser.
2. **First value (0 payment):** the landing page *is* the product — a question box. First question
   answers free, streamed in, instantly. No connect button, no account. The student has now felt
   an agent work for them.
3. **First payment:** question #2 shows `₦20 · Pay with MiniPay`. One tap → CIP-64 charge in
   their preferred stablecoin (fee in the same token) → answer streams. If balance is low, the
   `add_cash` Deposit deeplink opens; after payment, the MiniPay receipt deeplink celebrates.
4. **The loop:** every answer renders as a shareable answer card. Sharing is incentivized
   socially (look smart on your status) — each share is a new first-contact.

### Agent orchestration logic
- **Gatekeeper:** Next.js route handler wraps `/api/ask` with x402 middleware — request without
  payment → HTTP 402 + payment requirements; client settles via the Celo facilitator; the
  settled payment header unlocks execution. **One question = one counted x402 payment.**
- **Tutor brain:** Claude with subject-tuned system prompts carrying Nigerian curriculum context
  (JAMB/WAEC syllabus framing, past-question style, "explain like a final-year coursemate" tone).
  Subject is inferred, not asked.
- **Free-tier logic:** first question per wallet address free (server-tracked); sponsored free
  questions can be dropped during livestreams as growth levers.
- **Answer-card renderer:** post-answer, an OG-image route renders the branded shareable card.
- **Streaks & campus identity:** wallet-keyed streaks; optional campus tag ("UNILAG", "UI",
  "FUTA") feeds the onchain leaderboard for inter-campus competition.

### Smart contract architecture
- **`ScholarBoard.sol`** — minimal onchain leaderboard: the Padi server (owner) batches
  `recordAsk(wallet, campusId, count)` writes; public read = top askers per campus. Purpose:
  a *verifiable* usage trail for judges + campus bragging rights that drive the competitive loop.
- **Treasury `payTo` wallet** — receives all x402 settlements; registered on the x402 dashboard;
  every settlement carries the attribution-tag suffix.
- Deliberately thin: the paid loop is pure x402; contracts add verifiability and game, not
  friction.

### Why it can win Track 2
Question-asking is naturally high-frequency (a study session = 5–15 questions), priced where
students actually spend, distributed through campus group chats the builder can personally reach,
and every single question is one settled x402 payment. Genuine users, genuine utility, high count.

---

## Concept 2 — **Oga** · the X-native micro-gig agent
*"Tag am, pay am, e go do am."* — viral showcase, **Submission B**

### Core problem
Nigerian X youth culture runs on banter, hustle and content — but there is no way to *put an agent
to work inside the timeline itself*. Agentic AI feels abstract to this audience until the moment
an agent publicly does a paid job for someone they follow. Oga makes the agentic experience
**public, social and instant**: the timeline is the storefront, the queue, and the receipt.

### Onboarding journey
1. **First contact:** someone sees Oga publicly deliver a gig — e.g. a savage-but-loving profile
   roast — under a mutual's post. The entire value proposition is demonstrated in the wild.
2. **First value:** reply or quote-tweet `@OgaAgent roast my profile` / `rewrite my bio` /
   `caption this meme` / `sharpen my CV headline`. Oga replies within seconds with a one-line
   teaser + a MiniPay payment link (₦50–₦200 by task type).
3. **First payment:** tap the link → MiniPay browser → one-tap x402 settlement (CIP-64, preferred
   stablecoin) → within a minute the full deliverable lands as a public reply, plus a receipt
   link. **Every fulfilled gig is both a product delivery and an advertisement.**
4. **The loop:** public deliverables recruit the audience of every thread they appear in.

### Agent orchestration logic
- **Listener:** worker polls X mentions (X API); classifier maps the message to a task template
  (`roast | bio | caption | cv_headline | custom`) and prices it.
- **Paywall minting:** for each task, the server mints a single-use x402 payment request bound to
  the task id, and replies with the pay link. Unpaid tasks expire quietly after 30 minutes.
- **Fulfillment:** on settlement, the LLM executes the task template (persona: witty Lagos
  "oga" — sharp, warm, street-smart, never cruel; hard content-policy filter on both input and
  output) and posts the deliverable as a reply + updates the status page.
- **Fallback intake** (if X API tier blocks polling): Oga runs identically as a Telegram bot, and
  a public hashtag + manual repost flow covers the X surface during livestreams.
- **Anti-sybil honesty:** tasks are public, human-authored and human-paid — exactly what judges
  ask for when they screen for fake volume.

### Smart contract architecture
- **`GigReceipts.sol`** — per-gig attestation: `attest(taskHash, deliverableHash, payer)` written
  by the agent after fulfillment. Gives Oga a tamper-proof public work history — the onchain CV
  of an agent — which plugs directly into the ERC-8004 agent-identity story.
- **Treasury `payTo` wallet** — same pattern as Padi: registered on the x402 dashboard, every
  settlement attribution-tagged.

### Why it can win Track 2
Each gig is one x402 payment; the delivery mechanism *is* the marketing; and it's the perfect
livestream artifact — viewers put the agent to work in real time and watch payments land on the
Dune leaderboard on-screen.

---

## Concept 3 — **Ajoye** · the group-contribution collector agent
*"The treasurer that never chops the money."* — community workhorse, documented concept / stretch build

### Core problem
Campus and community life runs on collections: departmental dues, hostel bills, final-year dinner,
birthday funds, aso-ebi. Today one stressed volunteer chases 30 people across a WhatsApp group,
keeps records in their head, and absorbs all the suspicion when numbers don't add up ("who chop
the money?"). The problem isn't payments — it's **orchestration, chasing, and trust**, which is
exactly what an agent plus an escrow contract solves.

### Onboarding journey
1. **First contact:** the organizer messages the Ajoye Telegram bot:
   `collect ₦500 from 25 people for final-year dinner, deadline Friday`.
2. **First value (free):** the bot instantly returns a shareable collection link + a live tally
   card the organizer drops in the group chat. Organizing feels solved before anyone pays.
3. **First payment:** each member taps the link → MiniPay → one-tap contribution (an x402
   settlement into the collection's escrow). The bot posts live updates — `18/25 paid ✅` — and
   nudges defaulters politely so the organizer never has to.
4. **The trust moment:** at target/deadline, escrow releases to the organizer onchain — or
   auto-refunds everyone if the target fails. The group *watches* the money be honest.

### Agent orchestration logic
- **Conversation → structure:** LLM parses free-text intents ("collect 500 naira from my hostel
  guys for light bill") into `{amount, headcount, purpose, deadline}` with a confirm step.
- **Collection lifecycle:** bot (grammY on Telegram; WhatsApp later) creates the collection,
  mints per-member x402 payment requests (**each member's contribution = one counted tx**),
  tracks settlements via the facilitator, posts tally updates, schedules escalating-politeness
  nudges, and triggers release/refund at deadline.
- **Social copy engine:** nudges are generated in the group's register (pidgin-aware, humorous,
  never shaming) — the personality is the retention feature.

### Smart contract architecture
- **`CircleEscrow.sol`** — factory + per-collection escrow: `contribute()` (stablecoin, via the
  x402-settled transfer), `release()` when target met, `refundAll()` on expiry; events feed the
  bot's live tally. Transparent replacement for "trust the treasurer."
- All escrow txs attribution-tagged; sub-cent gas means even a ₦200 contribution is economical.

### Why it matters even unbuilt
It demonstrates range for the judges — the same x402 + CIP-64 + agent spine covers commerce
(Padi), culture (Oga), and community finance (Ajoye). If runway allows post-Stream-1, the
CircleEscrow build starts; otherwise this spec ships in the submission as the roadmap.

---

## Build decision

| | Concept | Track | Status |
|---|---|---|---|
| **Submission A** | Padi | Track 2 (x402 count) | Build now |
| **Submission B** | Oga | Track 2 (x402 count) | Build now |
| Roadmap | Ajoye | Track 2 | Spec'd; stretch build |

Both submissions also register for **Track 3 (askbots.ai)** and **Track 4 (Aigora feedback)**.
Registration with the Celo Builders skill happens **before the first transaction** — the
leaderboard only counts attribution-tagged txs.
