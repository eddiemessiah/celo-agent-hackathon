# Padi & Oga — agents Nigerian youth can *feel*

Two agentic payment apps built on **Celo + MiniPay** for the
[Agentic Payments & DeFAI Hackathon](https://x402.celo.org/) (Jul 7–20, 2026).
Both target **Track 2 — Most x402 Payments**: every unit of value is one
pay-per-request stablecoin transaction settled through the Celo x402 facilitator.

| App | One-liner | Surface |
|-----|-----------|---------|
| [**Padi**](apps/padi/) | Your sharpest coursemate, ₦20 a question — pay-per-question AI study buddy for JAMB/WAEC/campus courses | MiniPay browser (shared links on X/WhatsApp) |
| [**Oga**](apps/oga/) | Tag am, pay am, e go do am — X-native micro-gig agent (roasts, bios, captions, CV headlines) | X timeline + Telegram fallback |

Third concept (spec'd, stretch build): [**Ajoye**](HACKATHON_IDEAS.md#concept-3--ajoye--the-group-contribution-collector-agent),
the group-contribution collector with onchain escrow.

Full ideation with problem/onboarding/orchestration/contract detail: [HACKATHON_IDEAS.md](HACKATHON_IDEAS.md)

## Design doctrine

**Access first.** A student or young hustler must *feel* an agent work for them within 60 seconds
of first contact: no signup (the wallet is the identity), first value free, naira-street pricing
(₦20–₦200), living where they already are (X, WhatsApp, Telegram, MiniPay).

## Architecture

```
packages/celo-pay/   shared payment layer: MiniPay zero-click connect, CIP-64 fee
                     abstraction (fee paid in the user's own stablecoin), x402
                     client/server helpers, ERC-8021 attribution tagging
contracts/           ScholarBoard.sol (campus asker leaderboard),
                     GigReceipts.sol (onchain work history for the Oga agent),
                     CircleEscrow.sol (Ajoye, stretch)
apps/padi/           Next.js 15 — x402-gated /api/ask + MiniPay-first UI (360×640)
apps/oga/            Next.js 15 — mention intake → paywall → LLM fulfillment → public reply
livestream/          run-of-show, demo scripts, promo copy for the two live streams
docs/                registration & submission checklist
```

## Hackathon integration spine

- **x402:** requests hit an HTTP 402 challenge; payment settles on Celo mainnet (`eip155:42220`)
  in USDC/USDT via the facilitator at `https://x402.celo.org` (EIP-3009
  `transferWithAuthorization` — gasless for the payer). `payTo` wallets + endpoints registered on
  the dashboard so every settlement counts for Track 2.
- **Attribution tags (ERC-8021):** `toDataSuffix(['celo_<assigned>'])` from
  `@celo/attribution-tags` appended to every transaction **we** send (contract writes, direct
  MiniPay payments). x402 settlements are submitted by the facilitator and are counted via the
  registered `payTo` address.
- **CIP-64:** direct in-app payments charge the user's preferred stablecoin with the network fee
  in that same token (USDC/USDT use fee adapter addresses).
- **ERC-8004:** both agents registered onchain; registry links in the submission.

## Develop

```bash
npm install
npm run dev:padi   # port 3001
npm run dev:oga    # port 3002
```

On-device: `npx ngrok http 3001` + MiniPay Developer Mode (Settings → About → tap version 7×).
Design target 360×640.

## Environment

| Var | Used by | Purpose |
|-----|---------|---------|
| `NEXT_PUBLIC_ATTRIBUTION_TAG` | all | assigned `celo_...` tag from hackathon registration |
| `PAYTO_ADDRESS` | padi, oga | x402 settlement treasury (registered on dashboard) |
| `ANTHROPIC_API_KEY` | padi, oga | LLM fulfillment |
| `ATTESTOR_PRIVATE_KEY` | padi, oga | server wallet for tagged contract writes |
| `X_BEARER_TOKEN` / `X_API_*` | oga | mention polling + replies |
| `TELEGRAM_BOT_TOKEN` | oga | fallback intake surface |

**Register before the first transaction** — the leaderboard only counts tagged/registered
activity: `npx skills add https://celobuilders.xyz` → register → get your `celo_...` tag.
