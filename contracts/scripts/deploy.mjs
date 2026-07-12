// Deploy ScholarBoard + GigReceipts (+ CircleEscrow with --with-escrow).
//
// Usage:
//   npx hardhat compile
//   set PRIVATE_KEY=0x...                (deployer key, funded)
//   set NEXT_PUBLIC_ATTRIBUTION_TAG=celo_...  (assigned at registration)
//   npm run deploy:celo                  (or deploy:sepolia)
//
// Deploy txs are NOT tagged (suffix would sit after constructor args); every
// subsequent write goes through viem's dataSuffix so it lands on the
// leaderboard. After deploy: verify all on Celoscan.

import { readFileSync } from "node:fs";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoSepolia } from "viem/chains";
import { toDataSuffix } from "@celo/attribution-tags";

const CHAINS = { celo, celoSepolia };

function artifact(name) {
  return JSON.parse(
    readFileSync(new URL(`../artifacts/contracts/${name}.sol/${name}.json`, import.meta.url), "utf8"),
  );
}

const chainName = process.argv[2] ?? "celoSepolia";
const withEscrow = process.argv.includes("--with-escrow");
const chain = CHAINS[chainName];
if (!chain) throw new Error(`Unknown chain ${chainName}`);
const pk = process.env.PRIVATE_KEY;
if (!pk) throw new Error("Set PRIVATE_KEY");
const tag = process.env.NEXT_PUBLIC_ATTRIBUTION_TAG;
if (!tag) console.warn("WARN: NEXT_PUBLIC_ATTRIBUTION_TAG unset — writes will be untagged");

const account = privateKeyToAccount(pk);
const wallet = createWalletClient({ account, chain, transport: http() });
const client = createPublicClient({ chain, transport: http() });

async function deploy(name, args) {
  const { abi, bytecode } = artifact(name);
  const hash = await wallet.deployContract({ abi, bytecode, args });
  const receipt = await client.waitForTransactionReceipt({ hash });
  console.log(`${name}: ${receipt.contractAddress} (tx ${hash})`);
  return { abi, address: receipt.contractAddress };
}

const board = await deploy("ScholarBoard", [account.address]);
const receipts = await deploy("GigReceipts", [account.address]);
let escrow = null;
if (withEscrow) escrow = await deploy("CircleEscrow", [account.address]);

// Smoke write: one tagged attestation so the tag shows up onchain immediately.
if (tag) {
  const hash = await wallet.writeContract({
    ...board,
    functionName: "recordAsks",
    args: [
      "0x" + Buffer.from("genesis".padEnd(32, "\0")).toString("hex"),
      account.address,
      1n,
    ],
    dataSuffix: toDataSuffix([tag]),
  });
  await client.waitForTransactionReceipt({ hash });
  console.log(`tagged smoke write ok (tx ${hash})`);
}

console.log("\nNEXT STEPS:");
console.log(`  SCHOLARBOARD_ADDRESS=${board.address}`);
console.log(`  GIGRECEIPTS_ADDRESS=${receipts.address}`);
if (escrow) console.log(`  CIRCLEESCROW_ADDRESS=${escrow.address}`);
console.log("  Verify on Celoscan; register payTo wallets on the x402 dashboard.");
