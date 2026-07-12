// GigReceipts attestation — Oga's onchain work history. One tagged sub-cent
// write per delivered gig: attest(taskHash, deliverableHash, payer).

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

const RECEIPTS = process.env.GIGRECEIPTS_ADDRESS as `0x${string}` | undefined;
const KEY = process.env.ATTESTOR_PRIVATE_KEY as `0x${string}` | undefined;
const TAG = process.env.NEXT_PUBLIC_ATTRIBUTION_TAG;

const ABI = [
  {
    type: "function",
    name: "attest",
    inputs: [
      { name: "taskHash", type: "bytes32" },
      { name: "deliverableHash", type: "bytes32" },
      { name: "payer", type: "address" },
    ],
    outputs: [{ name: "gigId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

export async function attestGig(
  task: string,
  deliverable: string,
  payer: string,
): Promise<string | undefined> {
  if (!RECEIPTS || !KEY) return undefined; // enabled after deploy
  try {
    const account = privateKeyToAccount(KEY);
    const wallet = createWalletClient({ account, chain: celo, transport: http() });
    const client = createPublicClient({ chain: celo, transport: http() });
    const hash = await wallet.writeContract({
      address: RECEIPTS,
      abi: ABI,
      functionName: "attest",
      args: [
        keccak256(toHex(task)),
        keccak256(toHex(deliverable)),
        payer as `0x${string}`,
      ],
      dataSuffix: TAG ? toDataSuffix([TAG]) : undefined,
    });
    await client.waitForTransactionReceipt({ hash });
    return hash;
  } catch (err) {
    console.error("gig attestation failed", err);
    return undefined;
  }
}
