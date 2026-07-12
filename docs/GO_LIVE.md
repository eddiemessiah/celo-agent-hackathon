# Go-live — deploy Padi & Oga to Vercel

Two Next.js apps in one npm-workspaces monorepo → **two Vercel projects**, same repo,
different Root Directory. `packages/celo-pay` + `packages/game-kit` are workspace deps and get
built automatically via `transpilePackages`.

## Fastest path to a demo you can try today

You can demo **without any wallet or payment** first: leave `PAYTO_ADDRESS` unset and every app runs
in **free demo mode** (Padi answers every question free; Oga delivers every gig free). You only need
`ANTHROPIC_API_KEY` (+ `GIG_SECRET` for Oga). Add payments once you've registered (below).

> ⚠️ Known limitation (see [CELOPEDIA_REVIEW.md](CELOPEDIA_REVIEW.md) §B1): the x402 pay flow signs
> EIP-712 typed data, which the **MiniPay in-app browser does not support**. It works in a normal
> mobile/desktop browser with an injected wallet (MetaMask etc.). For a MiniPay demo, use free mode
> until we ship the session-wallet fix.

## Vercel setup (per app)

For **each** app (`apps/padi`, then `apps/oga`):

1. Vercel → **Add New Project** → import the GitHub repo.
2. **Root Directory** → `apps/padi` (resp. `apps/oga`). Framework auto-detects Next.js.
3. Leave build/install commands default — Vercel detects npm workspaces and installs from repo root.
4. Add env vars (below) → **Deploy**.

### Padi env
| Var | Needed | Value |
|-----|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ | your Anthropic key (answers) |
| `PADI_MODEL` | optional | default `claude-haiku-4-5-20251001` |
| `PADI_PRICE_USD` | optional | default `0.013` (≈ ₦20) |
| `PAYTO_ADDRESS` | for real x402 | your registered treasury `0x…` (unset = free demo) |
| `NEXT_PUBLIC_ATTRIBUTION_TAG` | for leaderboard credit | your `celo_…` tag |
| `SCHOLARBOARD_ADDRESS` + `ATTESTOR_PRIVATE_KEY` | for onchain attestation | after contract deploy |

### Oga env
| Var | Needed | Value |
|-----|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ | your Anthropic key |
| `GIG_SECRET` | ✅ | any long random string — signs stateless gig links |
| `PUBLIC_ORIGIN` | ✅ | the deployed URL, e.g. `https://oga.vercel.app` |
| `OGA_MODEL` | optional | default `claude-sonnet-5` |
| `PAYTO_ADDRESS` | for real x402 | registered treasury (unset = free demo) |
| `NEXT_PUBLIC_ATTRIBUTION_TAG` | for leaderboard credit | your `celo_…` tag |
| `NEXT_PUBLIC_TELEGRAM_BOT` | optional | bot username for the homepage link |
| `TELEGRAM_BOT_TOKEN` | for Telegram intake | from @BotFather; then set webhook (below) |
| `GIGRECEIPTS_ADDRESS` + `ATTESTOR_PRIVATE_KEY` | for onchain receipts | after contract deploy |

After Oga deploys, register the Telegram webhook:
```
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<oga-url>/api/telegram"
```

> Oga must run as **one** deployment (the recent-work cache + Oga level are in-memory). Gig links
> themselves are stateless (HMAC-signed) so they survive across serverless instances.

## What I need from you to go fully live (real onchain)

1. **`ANTHROPIC_API_KEY`** — set it in both Vercel projects (I can't add it for you; it's your key).
2. **Register with celobuilders** → the `celo_…` attribution tag → set `NEXT_PUBLIC_ATTRIBUTION_TAG`.
3. **Treasury wallet** `0x…` → `PAYTO_ADDRESS`, and register it on the x402 dashboard.
4. **Deploy contracts** (funded `PRIVATE_KEY`) → set `SCHOLARBOARD_ADDRESS` / `GIGRECEIPTS_ADDRESS`
   + `ATTESTOR_PRIVATE_KEY`.
5. **`GIG_SECRET`** for Oga (any random string) and **`PUBLIC_ORIGIN`** = the deployed URL.
6. (Optional) `TELEGRAM_BOT_TOKEN` from @BotFather for the Telegram surface.

Steps 2–4 are the same items in [REGISTRATION.md](REGISTRATION.md). For the very first "click around
and try it" demo, only step 1 (+ `GIG_SECRET`) is required.
