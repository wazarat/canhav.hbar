export type Network = "testnet" | "mainnet";

/** Confirmed mainnet lending reserves (token / aToken) from Bonzo contract-addresses.json */
export const BONZO_RESERVES = {
  SAUCE: {
    token: "0x0000000000000000000000000000000000120f46",
    aToken: "0x1e879F10B6f29D3278B966F9707242E31874df10",
  },
  CLXY: {
    token: "0x00000000000000000000000000000000000014f5",
    aToken: "0x5C4f839f4E4B88A0E9083Fe2023354767785a3B1",
  },
  HBARX: {
    token: "0x0000000000000000000000000000000000220ced",
    aToken: "0x1EFd63655E7aee39c51c6F678151C4C58d59B1F4",
  },
  DAI: {
    token: "0x0000000000000000000000000000000000001599",
    aToken: "0xC3dde7e438992F8aec736667F3cf0629b4434ad6",
  },
  USDC: {
    token: "0x0000000000000000000000000000000000001549",
    aToken: "0xBbeaE0C59A92B7098eD7362C2aD046482667556b",
  },
} as const;

/** Fill from bonzo-testnet-contracts.json before testnet smoke test. */
export const BONZO_INFRA: Record<
  Network,
  {
    vaultFactory: string;
    supraOracle: string;
    approvedVaults: { address: string; symbol: string; type: string }[];
  }
> = {
  testnet: {
    vaultFactory: "0x0000000000000000000000000000000000000000",
    supraOracle: "0x0000000000000000000000000000000000000000",
    approvedVaults: [],
  },
  mainnet: {
    vaultFactory: "0x0000000000000000000000000000000000000000",
    supraOracle: "0x0000000000000000000000000000000000000000",
    approvedVaults: [],
  },
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function getBonzoNetwork(): Network {
  return process.env.HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

/** Resolved infra with optional env overrides (for smoke test before bonzo-addresses.ts is filled). */
export function resolveBonzoInfra(network: Network = getBonzoNetwork()) {
  const base = BONZO_INFRA[network];
  return {
    vaultFactory:
      process.env.BONZO_VAULT_FACTORY?.trim() || base.vaultFactory,
    supraOracle:
      process.env.BONZO_SUPRA_ORACLE?.trim() || base.supraOracle,
    approvedVaults: base.approvedVaults,
  };
}

export function isBonzoInfraConfigured(network: Network = getBonzoNetwork()): boolean {
  const { vaultFactory } = resolveBonzoInfra(network);
  return Boolean(vaultFactory && vaultFactory !== ZERO_ADDRESS);
}

export function assertBonzoInfraConfigured(network: Network = getBonzoNetwork()): void {
  if (!isBonzoInfraConfigured(network)) {
    throw new Error(
      `BONZO_INFRA.${network}.vaultFactory not configured. Set BONZO_VAULT_FACTORY env or fill src/lib/bonzo/bonzo-addresses.ts`
    );
  }
}

export const VAULT_FACTORY_ABI = [
  "event ProxyCreated(address proxy)",
  "function cloneVault() external returns (address)",
  "function cloneVaultCLM() external returns (address)",
] as const;

export const VAULT_ABI = [
  "function initialize(address _strategy, string _name, string _symbol, uint256 _approvalDelay, bool _isHederaToken)",
  "function want() view returns (address)",
  "function balance() view returns (uint256)",
  "function available() view returns (uint256)",
  "function getPricePerFullShare() view returns (uint256)",
  "function deposit(uint256 _amount)",
  "function withdraw(uint256 _shares)",
  "function earn()",
  "function balanceOf(address) view returns (uint256)",
] as const;

export const STRATEGY_ABI = [
  "function harvest()",
  "function harvest(address callFeeRecipient)",
  "function balanceOf() view returns (uint256)",
  "function balanceOfWant() view returns (uint256)",
  "function balanceOfPool() view returns (uint256)",
  "function rewardsAvailable() view returns (uint256)",
  "function callReward() view returns (uint256)",
  "function panic()",
  "function pause()",
  "function unpause()",
  "function retireStrat()",
] as const;
