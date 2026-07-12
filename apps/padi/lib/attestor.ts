// Batched ScholarBoard writes. After paid questions settle, campus/wallet
// counts accumulate here and flush in one tagged sub-cent transaction —
// verifiable usage without a tx per question.

import {
  createWalletClient,
  createPublicClient,
  http,
  keccak256,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { toDataSuffix } from "@celo/attribution-tags";

const BOARD = process.env.SCHOLARBOARD_ADDRESS as `0x${string}` | undefined;
const KEY = process.env.ATTESTOR_PRIVATE_KEY as `0x${string}` | undefined;
const TAG = process.env.NEXT_PUBLIC_ATTRIBUTION_TAG;

const ABI = [
  {
    type: "function",
    name: "recordAsks",
    inputs: [
      { name: "campusId", type: "bytes32" },
      { name: "scholar", type: "address" },
      { name: "count", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const pending = new Map<string, { campus: string; wallet: string; count: number }>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function queueAsk(wallet: string, campus = "general"): void {
  if (!BOARD || !KEY) return; // attestation disabled until deploy
  const key = `${campus}:${wallet.toLowerCase()}`;
  const entry = pending.get(key) ?? { campus, wallet, count: 0 };
  entry.count += 1;
  pending.set(key, entry);
  if (!flushTimer) flushTimer = setTimeout(flush, 60_000);
}

async function flush(): Promise<void> {
  flushTimer = null;
  if (!BOARD || !KEY || pending.size === 0) return;
  const batch = [...pending.values()];
  pending.clear();
  try {
    const account = privateKeyToAccount(KEY);
    const wallet = createWalletClient({ account, chain: celo, transport: http() });
    const client = createPublicClient({ chain: celo, transport: http() });
    for (const { campus, wallet: scholar, count } of batch) {
      const hash = await wallet.writeContract({
        address: BOARD,
        abi: ABI,
        functionName: "recordAsks",
        args: [keccak256(toHex(campus)), scholar as `0x${string}`, BigInt(count)],
        dataSuffix: TAG ? toDataSuffix([TAG]) : undefined,
      });
      await client.waitForTransactionReceipt({ hash });
    }
  } catch (err) {
    console.error("scholarboard flush failed", err);
  }
}
