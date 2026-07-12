# Registration & submission checklist

Deadline: **July 20, 09:00 GMT.** Items marked 👤 need you (accounts, keys,
funds, or posting); everything else is already in the repo.

## 1. Register FIRST — before any transaction 👤
The leaderboard only counts activity after your tag/wallets are registered.

- [ ] 👤 Push this repo to a **public GitHub repo** (`gh repo create` or GitHub UI)
- [ ] 👤 `npx skills add https://celobuilders.xyz` then ask your agent:
      *"Register me for the Celo Agentic Payments & DeFAI Hackathon"*
      — needs: project name (**Padi + Oga**), the public repo URL, your Telegram handle
- [ ] 👤 Put the returned tag in every deploy env: `NEXT_PUBLIC_ATTRIBUTION_TAG=celo_...`

## 2. Wallets & funding 👤
- [ ] 👤 Create/choose a **treasury wallet** (receives x402 settlements) → `PAYTO_ADDRESS`
- [ ] 👤 Create an **attestor wallet**, fund with ~2–5 CELO worth of gas → `ATTESTOR_PRIVATE_KEY`
- [ ] 👤 Register the `payTo` wallet + endpoint URLs on the x402 dashboard (x402.celo.org)
      for both apps so settlements count for Track 2
- [ ] 👤 Fund two test phones' MiniPay with small USDC + USDT

## 3. Deploy
- [ ] 👤 `cd contracts && set PRIVATE_KEY=... && set NEXT_PUBLIC_ATTRIBUTION_TAG=... && npm run deploy:celo`
      (prints `SCHOLARBOARD_ADDRESS`, `GIGRECEIPTS_ADDRESS`, sends one tagged smoke write)
- [ ] 👤 Verify contracts on Celoscan; keep the links for the README/submission
- [ ] 👤 Deploy `apps/padi` + `apps/oga` (Vercel for Padi; Oga needs a single
      long-lived instance — Railway/VM — for the in-memory gig store)
- [ ] 👤 Set envs per each app's README; set the Telegram webhook for Oga
- [ ] End-to-end check: curl `/api/ask` → 402 → pay from MiniPay → 200 + Celoscan tx
      → visible on the Dune leaderboard

## 4. ERC-8004 agent identity 👤
- [ ] 👤 Register both agents per docs.celo.org/build-on-celo/build-with-ai/8004;
      keep the registry links (required in the tweet); check them on 8004scan.io

## 5. Bonus tracks 👤
- [ ] 👤 Track 3: register a judge agent on askbots.ai
- [ ] 👤 Track 4: register on aigora.org; submit feedback (draft it after actually
      using the platform during the build — judges reward specific, actionable notes)

## 6. Submit (before Jul 20 09:00 GMT) 👤
- [ ] 👤 Ask your agent: *"Help me submit my project to the Celo Agentic Payments
      & DeFAI Hackathon"* (Builder Skill flow: choose hackathon → connect →
      answer questions → review → publish)
- [ ] 👤 Publish the qualifying tweet (draft in [livestream/promo-copy.md](../livestream/promo-copy.md))
      tagging @CeloDevs + @Celo with the ERC-8004 link
- [ ] Submission includes: repo link, live URLs, demo video, wallet addresses /
      tagged-tx links, Celoscan contract links
