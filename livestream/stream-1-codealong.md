# Stream 1 — "Put an AI agent to work on Celo — live" (codealong)

**When:** Jul 15–16 window · 90 min · X Live + YouTube Live simultaneously
**Audience goal:** hackathon builders who still need to register + Nigerian youth who will *feel* Padi
**On-screen at all times:** lower-third with `x402.celo.org` + the Dune leaderboard tab

## Run of show

| Min | Segment | Beat |
|-----|---------|------|
| 0–5 | Cold open | "By the end of this stream, an AI agent will earn real money onchain — and you'll ask it questions from your phone." Show the $5K tracks in 60 seconds. |
| 5–15 | **Register live** | `npx skills add https://celobuilders.xyz` → register → the `celo_...` attribution tag lands on-screen. Say it loud: **register before your first transaction — untagged txs are invisible to the leaderboard.** |
| 15–40 | **Build a paid endpoint from scratch** | Blank Next.js route → return 402 with payment requirements → sign EIP-3009 in MiniPay (typed data, gasless!) → facilitator `/verify` + `/settle`. Keep the file under ~80 lines; type it live. |
| 40–50 | **First money** | Pay the endpoint from a phone in MiniPay. Show the settlement tx on Celoscan, then the count ticking on the Dune leaderboard. This is the money shot — rehearse it. |
| 50–70 | **Unveil Padi** | The grown-up version of what we just built. Student journey: shared link → free first question → ₦20 question → receipt. Explain the doctrine: no signup, first value free, naira-street pricing. |
| 70–85 | **Onboarding party** | Drop the Padi link in chat + a QR on screen. Viewers ask real questions from their phones. Narrate the leaderboard as counts land. Each viewer question = one genuine, counted x402 payment. |
| 85–90 | CTA | Deadline Jul 20 09:00 GMT. Register today. Join the hackathon Telegram. Tease Stream 2: "Oga takes over the timeline." |

## Live-risk fallbacks (pre-record all of these as 30–60s clips)
1. Registration flow (skills CLI output)
2. MiniPay payment close-up (screen-recorded phone)
3. Celoscan settlement tx + Dune leaderboard tick
4. A full Padi ask cycle

If wifi/RPC/facilitator misbehaves: play the clip, keep talking, retry live after.

## Prep checklist (day before)
- [ ] Registration done, tag in env, contracts deployed, Padi on Vercel + custom short link
- [ ] Two test phones with MiniPay funded (small USDC + USDT so both settle paths show)
- [ ] OBS scenes: editor / phone-mirror / browser (Celoscan+Dune) / camera; QR slide
- [ ] Dry-run the whole 402→settle path on the production URL
- [ ] Backup hotspot; fallback clips loaded in OBS
