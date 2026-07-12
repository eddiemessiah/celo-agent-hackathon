# Oga — tag am, pay am, e go do am

X-native micro-gig agent. Roasts, bio rewrites, meme captions, CV headlines —
requested in public, paid per gig via x402, delivered in public, attested
onchain (`GigReceipts`). **One gig = one x402 payment.**

## Flow
1. Intake: Telegram message to the bot, or an X mention picked up by
   `scripts/x-listener.mjs`.
2. Oga classifies + prices the task and replies with a pay link (`/gig/<id>`,
   expires in 30 min).
3. The link opens in MiniPay: one tap → EIP-3009 typed-data signature →
   facilitator settles → the deliverable renders and is pushed back to the
   chat/thread.
4. Each delivered gig is attested to `GigReceipts` with the attribution-tag
   suffix — Oga's verifiable onchain CV (the ERC-8004 story).

## Run
```bash
npm run dev:oga                        # port 3002
# Telegram webhook:
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<origin>/api/telegram"
# X worker (optional, needs paid API tier for mentions):
npm run x-listener --workspace apps/oga
```

Run as a **single long-lived instance** (VM/Railway or dev+ngrok) — the gig
store is in-memory for the hackathon.

## Env
`ANTHROPIC_API_KEY` · `PAYTO_ADDRESS` (unset = free demo mode) ·
`TELEGRAM_BOT_TOKEN` + `PUBLIC_ORIGIN` · `NEXT_PUBLIC_TELEGRAM_BOT` ·
`GIGRECEIPTS_ADDRESS` + `ATTESTOR_PRIVATE_KEY` · `NEXT_PUBLIC_ATTRIBUTION_TAG` ·
X worker: `X_BEARER_TOKEN`, `X_USER_ID`, `INTAKE_SECRET` (replies are logged
for manual posting unless user-context auth is added).
