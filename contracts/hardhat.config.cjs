/** Hardhat config — compile target + Celo networks.
 * Deployment uses viem (scripts/deploy.mjs); tests via mocha + viem.
 */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 500 },
    },
  },
  networks: {
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
    },
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      chainId: 11142220,
    },
  },
};
