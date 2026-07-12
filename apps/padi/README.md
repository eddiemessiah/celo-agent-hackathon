# Padi — your sharpest coursemate, ₦20 a question

Pay-per-question AI study buddy for JAMB/WAEC/POST-UTME/campus courses.
**One question = one x402 payment** settled on Celo via the facilitator.

## Flow
1. Student opens a shared link in the MiniPay browser — zero-click connect.
2. First question answers **free** (feel the agent before paying).
3. Next questions: `/api/ask` answers 402 → MiniPay signs an EIP-3009
   authorization (typed data, gasless) → facilitator settles USDC/USDT to the
   registered `payTo` → answer + receipt deeplink.
4. Paid asks queue into a batched, attribution-tagged `ScholarBoard.recordAsks`
   write — the verifiable usage trail + campus leaderboard.

## Run
```bash
npm run dev:padi     # from repo root, port 3001
npx ngrok http 3001  # then open in MiniPay Developer Mode
```

## Env
`ANTHROPIC_API_KEY` (required) · `PAYTO_ADDRESS` (unset = free demo mode) ·
`PADI_PRICE_USD` (default 0.013 ≈ ₦20) · `PADI_MODEL` (default Haiku 4.5) ·
`SCHOLARBOARD_ADDRESS` + `ATTESTOR_PRIVATE_KEY` (enables onchain attestation) ·
`NEXT_PUBLIC_ATTRIBUTION_TAG` (assigned `celo_...` tag).

## TODO (pre-submission)
- OG answer-card image route for the share loop
- Move free-question/streak store from memory to KV
- Past-questions vault (pay-per-unlock)
