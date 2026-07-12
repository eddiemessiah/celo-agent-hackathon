# Celopedia ecosystem-fit & grant-readiness review

**Reviewer:** Celopedia skill v2.5.0 (cross-checked against live sources July 2026)
**Scope:** Padi, Oga, Ajoye + `packages/celo-pay`, `contracts/`
**Verdict headline:** One architecture-level blocker (MiniPay cannot produce the signature x402 needs),
one verified-correct payment detail (token EIP-712 domains), and one killed assumption (cNGN is not on Celo).
Everything else is finish-work.

Where a finding depends on something that changes, it was fetched live and dated. Two facts I verified
against ground truth rather than docs: the **USDT EIP-712 version** (read from the contract's
`DOMAIN_SEPARATOR`) and **cNGN's chain list** (read from its repo).

---

## A. MiniPay compliance audit

Audited `apps/padi` + `packages/celo-pay` against `minipay-requirements.md` (Stage 1 bounce list +
Stage 2 readiness) and `minipay-guide.md` Constraints. Pass/fail with the exact fix.

| # | Checklist item (source) | Status | Fix |
|---|--------------------------|--------|-----|
| 1 | Zero-click connect, no Connect button in MiniPay (Req §1) | ✅ Pass | `useMiniPay()` auto-connects via `requestAddresses()`; no button. |
| 2 | **No `personal_sign` / `eth_signTypedData` anywhere** (Req Stage 1; Guide Constraint #4) | ❌ **FAIL — blocker** | `packages/celo-pay/src/x402-client.ts:91` calls `walletClient.signTypedData(...)` for the EIP-3009 authorization. MiniPay does not support typed-data signing. See §B1 for the architecture fix. |
| 3 | No raw `0x…` as primary identifier (Req §1) | ✅ Pass | Apps show streaks / subjects / gigs, never an address as identity. Receipt links use a tx hash (allowed). |
| 4 | Only USDT/USDC/USDm, never CELO in UI (Req §2) | ✅ Pass | `STABLES` is the three stables; no CELO surfaced. |
| 5 | Adapt to preferred stablecoin **or** explain single-token UX (Req §2 "Graceful Degradation") | ⚠️ Partial | Picks highest-balance token, but an x402 payment only considers USDC/USDT. A user holding **only USDm** (the most common MiniPay balance) silently gets `low_balance` with no explainer. Fix: detect USDm-only and either show "Swap to USDC/USDT in MiniPay first" or use the direct-transfer fallback (§B3). |
| 6 | Copy: **Network fee / Deposit / Withdraw / Stablecoin**, not gas/crypto (Req §3) | ✅ Pass | "Deposit" on the add_cash button, "network fee" (Oga), "stablecoin" copy. No "gas"/"crypto" in UI strings. |
| 7 | Works at 360×640 (Req §4) | ⚠️ Pass-pending | Mobile-first, `max-width` shells, no fixed wide elements — but **not yet verified on a device**. Run Chrome DevTools 360×640 + a real MiniPay Developer Mode pass. |
| 8 | Images SVG/WebP, ≤2 MB bundle (Req §4) | ✅ Pass | No raster images (pure CSS + emoji); fonts self-hosted by `next/font` (not fetched from Google at runtime). First-load JS ~205 kB. |
| 9 | PageSpeed score captured for prod URL (Req §4) | ❌ Fail | Not run. Do it against the deployed URL before any MiniPay intake. |
| 10 | Origin/subdomain manifest (Req §4) | ⚠️ TODO | Client origins: own domain + `forno.celo.org` (RPC) + `x402.celo.org` (facilitator). Anthropic API is server-side only. Write this list into the intake. |
| 11 | All contracts verified on Celoscan (Req §5) | ❌ Fail | Not deployed yet. Blocks hackathon credibility *and* Proof of Ship. |
| 12 | Sample tx hash per user-facing method (Req §5) | ❌ Fail | Pending deploy. |
| 13 | Deposit deeplink on low balance (Req §6) | ✅ Pass | `ADD_CASH_LINK` → `link.minipay.xyz/add_cash`. |
| 14 | In-app support link (Req §6) | ❌ Fail | Neither app has one. Add a Telegram support link in the footer. |
| 15 | App name + logo, distinct from MiniPay (Req §7) | ⚠️ Partial | Names shown; no logo asset. Add a small SVG logo. |
| 16 | ToS + Privacy links in-app (Req §7) | ❌ Fail | Missing. Port the `/terms` + `/privacy` pages from minibuild. |
| 17 | `/stats` analytics page (Req §8) | ❌ Fail | None. A read-only `/stats` (or Dune) also satisfies the grant traction asks (§D). |

**MiniPay bottom line:** item 2 is the only one that breaks the product; 11–17 are listing/grant
hygiene, not hackathon blockers. Note also Guide Constraint #2 (legacy transactions, no EIP-1559
fields) — the MiniPay-injected path is fine, but don't hand-set `maxFeePerGas` anywhere.

---

## B. Payment architecture check

### B1. The core issue: x402's signature vs MiniPay's signing support

The x402 **exact** scheme settles by having the payer sign an **EIP-3009 `TransferWithAuthorization`**
as EIP-712 typed data; the facilitator then submits `transferWithAuthorization(...signature)` on-chain.
This is confirmed in the coinbase/x402 exact-scheme spec: settlement uses `payload.signature` obtained
via `eth_signTypedData_v4`.

MiniPay does not support that signing method. Two skill sources, both cross-checked against
`docs.minipay.xyz`:

> "**No Message Signing** — do not prompt users to `personal_sign` or `eth_signTypedData` … MiniPay
> does not support these methods." — `minipay-guide.md`, Constraint #4

The public best-practices page frames it as UX ("users should not need to sign an arbitrary message to
use your Mini App"), but combined with the constraint above, the conclusion is the same: **a MiniPay
user cannot be the x402 payer from inside the MiniPay browser.** `x402-client.ts` will fail on-device.

> ⚠️ Verify on a physical device before relying on either outcome — but plan for it not working.

**Recommended fix — the agent/session-wallet pattern (this is the real pivot):**
Don't make the MiniPay wallet the x402 signer. Instead:

1. The user funds a **session/agent wallet** once via a normal MiniPay stablecoin `transfer`
   (fully supported; tag it with attribution). Para (smart-wallet infra, already in the hackathon
   resources) or a simple in-app viem EOA both work.
2. That session wallet — holding a raw key — signs the EIP-3009 authorization per request
   (`privateKeyToAccount(...).signTypedData`), no MiniPay signing involved.
3. Each request = one genuine x402 settlement to your registered `payTo`. **Track 2 counts are
   preserved**, and it works around the signing limitation cleanly.

This also happens to be the sanctioned "onchain agent" shape Celo is pushing (`ai-agents.md`), so it
strengthens the ERC-8004 / Agent Visa narrative rather than weakening it.

### B2. Token set & EIP-712 domains — verified

| Token | x402-capable? | EIP-712 `name` / `version` | Verified how |
|-------|---------------|-----------------------------|--------------|
| USDC `0xcEBA…118C` | ✅ yes | `"USDC"` / `"2"` | On-chain `name()` + `version()` |
| USDT `0x4806…3D5e` | ✅ yes | `"Tether USD"` / `"1"` | **`version()` reverts** (no getter) — resolved by reproducing the on-chain `DOMAIN_SEPARATOR`: `Tether USD` + `1` matches exactly. `transferWithAuthorization` confirmed present. |
| USDm `0x765D…282a` | ❌ **no** | — | Mento StableTokenV2 implements EIP-2612 (`permit`) only, not EIP-3009. Cannot be an x402 asset. |

Your `stables.ts` config is **correct on all three** — including the USDT version "1" you flagged as a
guess (now verified), and correctly marking USDm `x402: false`.

> Doc inconsistency to ignore: `ai-agents.md` lists USDm in an "x402 supported tokens" table. The
> docs.celo.org x402 page is right — USDm is **not** settleable via the exact scheme. Your code follows
> the correct one.

### B3. The USDm fallback — works, but doesn't count for Track 2

Your plan (fall back to a direct CIP-64 `transfer` tagged with attribution when the user lacks
USDC/USDT) is the right *product* call — it keeps the app usable and earns Track 1 volume + attribution
credit. But be clear-eyed: **those payments are invisible to the x402 dashboard.** Since USDm/cUSD is
the default balance for most Nigerian MiniPay users, without the session-wallet pattern (which lets you
fund the agent wallet in USDC once and settle x402 from it), the *majority* of real payments would not
count for the track you're targeting. B1 and B3 are the same decision viewed twice.

---

## C. Ecosystem-fit per idea

### Padi
- **More Celo-native:** register Padi as an **ERC-8004** agent (identity registry
  `0x8004A169…a432`) and add **Self Agent ID** — together they unlock the Proof of Ship *AI Agents*
  prize and Agent Visa Work tier, and give judges sybil-resistance signal. Cheap, high-leverage.
- **Public-goods data angle is weak** as-is. To make the campus leaderboard qualify: have
  `ScholarBoard` emit standardized events and publish an **open Dune dashboard** of anonymized
  campus usage — that doubles as the MiniPay `/stats` requirement (§A17) and a public-good artifact.
- **Currency:** students hold USDm; keep displaying ₦ but derive it from `minipay_getExchangeRate`
  (USDT→NGN) rather than a hardcoded "₦20", and settle x402 from a USDC-funded session wallet (§B1).

### Oga
- **Best agent-native fit of the three.** `GigReceipts` already models an on-chain work history —
  wire it to the **ERC-8004 Reputation registry** (`0x8004BAa1…9b63` `giveFeedback`) so Oga becomes
  visible and rankable on **8004scan**, and expose a `/.well-known/agent.json` (A2A service entry).
  That directly targets "highest 8004scan rank"–style bounties and the Agent Visa.
- Register identity with spec-compliant metadata (pin to IPFS, `type` = the `#registration-v1` URI,
  `services` not `endpoints`) to avoid 8004scan validation warnings (`ai-agents.md` compliance table).

### Ajoye
- **cNGN is NOT on Celo** (verified against the cNGN repo: Bantu, AssetChain, Base, BNB, Ethereum,
  Polygon, Lisk, Solana — no Celo). Drop the cNGN premise.
- Celo-native naira option is **NGNm** (Mento Naira). Verify its liquidity on Mento before relying on
  it — Mento local stables are often thin; if so, **hold escrow in USDm** and *display* naira via
  `minipay_getExchangeRate`. `CircleEscrow` is token-agnostic, so this is a config choice, not a rewrite.
- Category fit is excellent: group savings (chama/stokvel) is a Proof of Ship **Tier 1** category.

---

## D. Grant qualification map

Live status fetched from `celopg.eco/programs`, July 2026. (Anything dated Jun 30 that still shows
"Live" — Prezenti pools — confirm the extension before you invest time.)

| Program | Live? | Fit | Gaps today → steps to qualify | Range |
|---------|-------|-----|-------------------------------|-------|
| **Proof of Ship S2** | ✅ (Apr 1–Jul 31, 20K USDT/mo, ≤2K/project) | **Highest** for both apps | Needs: contract on mainnet + **verified**, public GitHub, live URL, register on **talent.app**. AI Agents prize (+$1K, $250×4) needs **ERC-8004 + Self Agent ID + on-chain txns**. | $250–$2,000 |
| **Prezenti Frontier Pool** (AI/agent economy infra) | ✅ (verify Jun 30 end) | `celo-pay` (x402 + attribution + CIP-64 as reusable agent-payment infra) framed as **infrastructure** | Book the "discuss fit before applying" call; frame as infra, not consumer app; Karma GAP profile + milestones. | up to $25K |
| **Prezenti Anchor Round** | ✅ (verify Jun 30 end) | Ajoye / Padi as consumer Celo/MiniPay apps | Milestone plan + Karma GAP; mainnet deploy. | up to $25K |
| **Celo Builder Fund** | ✅ (year-round, $25K SAFE) | Post-traction, not now | Needs **2 of 4**: 1K MAU / 500 daily tx / $50K TVL / $5K/mo revenue. Revisit after the hackathon drives usage. Contact lena.hierzi@celo.org. | $25K SAFE |
| **MiniPay listing** (not a grant) | pipeline | All three | Full Stage 2 checklist (§A) → intake at `minipay.to/mini-apps`. Don't submit half-built. | listing/reach |
| **Celo Africa DAO / Divvi** | ⚠️ unverified | — | Not on `celopg.eco/programs`. **Divvi** is an on-chain referral/builder-rewards protocol (integrate its SDK to earn per-tx rewards — complements attribution tags), not a grant round. Verify both separately before planning around them. | n/a |

**Ranked by grant-fundability:**
1. **Oga** — cleanest ERC-8004/agent-identity story → Proof of Ship AI prize + Frontier + Agent Visa.
2. **Ajoye** (once built) — Tier-1 group-savings category for Proof of Ship / Anchor.
3. **Padi** — strongest raw PMF and MiniPay strategic fit (education, emerging market), but "AI tutor"
   is a crowded, less agent-native category for the *agent*-focused pools. Still a strong Proof of Ship
   consumer-AI entry.

(PMF ≠ grant-fit: Padi likely wins users fastest even though Oga scores higher on agent-grant fit.)

---

## E. Priority fix list

### Blocks the July 20 submission (Track 2 actually working + credible)
1. **Fix the x402 signing architecture (§B1).** Adopt the session/agent-wallet pattern (Para or in-app
   viem EOA) funded by one normal MiniPay transfer; sign EIP-3009 per request off the session key.
   Without this, the counted x402 mechanic does not work for real MiniPay users. **Verify on-device.**
2. **Register with celobuilders → get the `celo_...` tag**, set `NEXT_PUBLIC_ATTRIBUTION_TAG`, register
   both `payTo` wallets + endpoints on the x402 dashboard. Before any transaction.
3. **Deploy + verify contracts on Celoscan**; wire addresses; collect one sample tx hash per method.
4. **Push the public GitHub repo** (also a Proof of Ship gate).
5. **Handle USDm-only users (§B3)** — graceful explainer or direct-transfer fallback, with honest
   expectation that fallback payments count for Track 1, not Track 2.
6. **ERC-8004 identity registration** for both agents → registry link required in the submission tweet.

### Improves grant odds / MiniPay listing (not hackathon blockers)
- **Self Agent ID** for both agents (Proof of Ship AI prize + Agent Visa Work gate).
- **Wire Oga to the ERC-8004 Reputation registry + `/.well-known/agent.json`** so it ranks on 8004scan.
- **`/stats` + a Dune dashboard** (MiniPay §8 analytics + Builder Fund traction evidence).
- **ToS + Privacy pages, in-app Telegram support link, app logos** (MiniPay §6/§7).
- **PageSpeed run + origin manifest** (MiniPay §4).
- **Register on talent.app** for Proof of Ship; **book the Prezenti Frontier fit call**.
- **Ajoye:** build on USDm escrow, display naira via `minipay_getExchangeRate` (cNGN unavailable; NGNm
  liquidity unverified).

---

### Sources
- MiniPay signing/constraints: `minipay-guide.md` Constraint #4, `minipay-requirements.md` Stage 1;
  `https://docs.minipay.xyz/getting-started/best-practices.html`
- x402 exact scheme (EIP-3009 + `eth_signTypedData_v4`): `github.com/coinbase/x402` exact-scheme spec;
  `ai-agents.md`; `docs.celo.org/build-on-celo/build-with-ai/x402`
- Token EIP-712 domains: read on-chain from `forno.celo.org` (USDC `name/version`, USDT
  `DOMAIN_SEPARATOR` reproduction, `transferWithAuthorization` presence)
- cNGN networks: `github.com/wrappedcbdc/stablecoin-cngn` (no Celo)
- Grants (live): `celopg.eco/programs` (July 2026); `grants-funding.md`; `proof-of-ship.md`
- ERC-8004 registries + Agent Visa + Self Agent ID: `ai-agents.md`, `self-agent-id.md`
